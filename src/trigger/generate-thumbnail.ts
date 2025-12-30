import { task, logger } from "@trigger.dev/sdk";
import { db } from "@/db";
import { activity, generationStatus } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getStreetViewThumbnail } from "@/lib/streetview";
import { decodePolyline } from "@/lib/polyline";
import { renderRouteVideo } from "@/remotion/render-video";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { evaluateScenery } from "@/lib/gemini";
import { getStreetViewImageUrl } from "@/lib/streetview";

/**
 * Generate Thumbnail & Video Task
 * 1. Generates Static Map Thumbnail (Instant)
 * 2. Generates Remotion Video (Background)
 * 3. Uploads Video to Supabase Storage
 */
export const generateAIThumbnail = task({
  id: "generate-ai-thumbnail",
  queue: {
    concurrencyLimit: 2, 
  },
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: {
    activityId: string;
    userId: string;
    referenceImageUrl: string | null;
    latitude: number;
    longitude: number;
    activityName?: string;
    sportType?: string;
    distance?: number;
    startTime?: string;
  }) => {
    logger.info(`Generating media for activity ${payload.activityId}`);

    // 0. Fetch Activity Data (Needed for both Thumbnail path checking and Video)
    const activityData = await db.query.activity.findFirst({
        where: eq(activity.activityId, payload.activityId),
        columns: {
          polyline: true, 
          name: true,
          distance: true,
          movingTimeInSeconds: true,
          elevation: true,
        }
    });

    // Decode polyline if available
    let allCoordinates: [number, number][] = [];
    if (activityData?.polyline) {
        allCoordinates = decodePolyline(activityData.polyline);
    }

    if (!activityData) {
      throw new Error("Activity data not found");
    }

    let finalImageUrl: string | undefined;
    let finalPrompt: string | undefined;
    
    // 1. Generate Static Map Thumbnail (Enhanced with AI Director)
    try {
      // Find a valid point first (checks multiple spots along route)
      const validLocationResult = await getStreetViewThumbnail({
        latitude: payload.latitude,
        longitude: payload.longitude,
        additionalPoints: allCoordinates 
      });

      finalImageUrl = validLocationResult.imageUrl;
      finalPrompt = `Static Map at ${payload.latitude}, ${payload.longitude}`;
      
      // If we found a valid Street View (not a fallback SVG) and have an API key, run the AI Director
      if (validLocationResult.source === 'streetview' && process.env.GOOGLE_MAPS_API_KEY) {
          try {
             const apiKey = process.env.GOOGLE_MAPS_API_KEY;
             // Extract params from the successful URL to get the base location/heading
             const urlObj = new URL(validLocationResult.imageUrl);
             // We need to re-parse because validLocationResult doesn't strictly return the lat/lng/heading object
             // But we can just use the coords we passed or re-derive. 
             // Actually, getStreetViewThumbnail DOES find a potentially *different* point than start. 
             // To be precise, we should update getStreetViewThumbnail to return the used metadata.
             // For now, let's parse the URL params which contains the exact lat,lng used.
             const locParam = urlObj.searchParams.get("location");
             const headingParam = urlObj.searchParams.get("heading");
             
             if (locParam && headingParam) {
                 const [latStr, lngStr] = locParam.split(",");
                 const lat = parseFloat(latStr);
                 const lng = parseFloat(lngStr);
                 const baseHeading = parseFloat(headingParam);

                 logger.info(`AI Director: Scouting angles at ${lat},${lng} (Base: ${baseHeading}°)...`);

                 // Generate 3 Options
                 const options = [
                     { label: "Front", heading: baseHeading },
                     { label: "Left", heading: (baseHeading - 90 + 360) % 360 },
                     { label: "Right", heading: (baseHeading + 90 + 360) % 360 },
                 ];

                 const auditionImages = options.map(opt => ({
                     label: opt.label,
                     url: getStreetViewImageUrl(lat, lng, opt.heading, apiKey)
                 }));

                 // Ask Gemini to choose
                 const verdict = await evaluateScenery(auditionImages);
                 
                 logger.info(`AI Director Choice: ${verdict.bestLabel} - ${verdict.reasoning}`);

                 const winner = options.find(o => o.label === verdict.bestLabel) || options[0];
                 finalImageUrl = getStreetViewImageUrl(lat, lng, winner.heading, apiKey);
                 finalPrompt = `Street View at ${lat},${lng} facing ${winner.label} (${winner.heading.toFixed(0)}°). AI Reasoning: ${verdict.reasoning}`;
             }
          } catch (directorError) {
              logger.warn("AI Director failed, using default front view", { error: directorError });
          }
      }

      const now = new Date().toISOString();
      await db.update(activity)
        .set({
          aiThumbnailUrl: finalImageUrl,
          aiThumbnailPrompt: finalPrompt,
          aiThumbnailGeneratedAt: now,
        })
        .where(eq(activity.activityId, payload.activityId));

      await db.update(generationStatus)
        .set({
          thumbnailStatus: "completed",
          completedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(generationStatus.activityId, payload.activityId));
      
      logger.info(`Thumbnail generation complete.`);

    } catch (error: any) {
      logger.error(`Thumbnail generation failed: ${error.message}`);
      await db.update(generationStatus)
        .set({
          thumbnailStatus: "failed",
          thumbnailError: error.message,
        })
        .where(eq(generationStatus.activityId, payload.activityId));
      throw error;
    }

    // 2. Generate Remotion Video
    try {
      if (!allCoordinates || allCoordinates.length === 0) {
        logger.warn("No polyline found for video generation");
        return { success: true, activityId: payload.activityId, video: "skipped" };
      }

      const coordinates = allCoordinates; // Already decoded above
      const distanceKm = ((activityData.distance || payload.distance || 0) / 1000).toFixed(2) + " km";
      const elevationM = (activityData.elevation || 0).toFixed(0) + " m";
      const duration = activityData.movingTimeInSeconds 
        ? new Date(activityData.movingTimeInSeconds * 1000).toISOString().slice(11, 19)
        : "0:00:00";

      logger.info(`Rendering video for ${coordinates.length} points...`);

      const videoResult = await renderRouteVideo({
        activityId: payload.activityId,
        coordinates,
        activityName: activityData.name || payload.activityName || "My Activity",
        stats: {
           distance: distanceKm,
           time: duration,
           elevation: elevationM
        },
        backgroundImage: finalImageUrl // Use the AI Director's chosen image
      });
      
      logger.info(`Video rendered to ${videoResult.filePath}`);

      // 3. Upload to Supabase Storage
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      // Use Service Role Key if available (bypasses RLS), otherwise fall back to Anon Key
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
          throw new Error("Missing Supabase credentials");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const fileContent = fs.readFileSync(videoResult.filePath);
      const fileName = `activity-${payload.activityId}-${Date.now()}.mp4`;
      const bucketName = "activity-videos"; // Ensure this bucket exists!

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileContent, {
            contentType: 'video/mp4',
            upsert: true
        });

      if (uploadError) {
          logger.error("Supabase Upload Error:", { error: uploadError });
          throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
        
      logger.info(`Video uploaded to ${publicUrl}`);

      // Cleanup local file
      fs.unlinkSync(videoResult.filePath);

      // Save video URL to DB
      await db.update(activity)
        .set({
          aiVideoUrl: publicUrl,
        })
        .where(eq(activity.activityId, payload.activityId));

      return {
        success: true,
        activityId: payload.activityId,
        videoUrl: publicUrl
      };

    } catch (error: any) {
      logger.error(`Video generation failed: ${error.message}`);
      return { success: true, videoError: error.message }; 
    }
  },
});


