import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

// Helper to convert Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Generate an AI thumbnail of the user running at a specific location
 * Uses Gemini 3 Pro Image to create a photorealistic image based on:
 * - User's reference photo
 * - Google Street View of the location
 * - Activity details (sport type, time, weather, etc.)
 */
export async function generateRunningThumbnail({
  referenceImageUrl,
  latitude,
  longitude,
  activityName,
  sportType = "Run",
  distance,
  startTime,
}: {
  referenceImageUrl: string;
  latitude: number;
  longitude: number;
  activityName?: string;
  sportType?: string;
  distance?: number;
  startTime?: string;
}): Promise<{ imageUrl: string; prompt: string }> {

  // Fetch the reference image
  const referenceImageResponse = await fetch(referenceImageUrl);
  if (!referenceImageResponse.ok) {
    throw new Error(`Failed to fetch reference image: ${referenceImageResponse.statusText}`);
  }

  const referenceImageBuffer = await referenceImageResponse.arrayBuffer();
  const referenceImageBase64 = Buffer.from(referenceImageBuffer).toString('base64');

  // Get location context using reverse geocoding
  const locationName = await getLocationName(latitude, longitude);

  // Fetch Street View image for location context
  const streetViewUrl = getStreetViewUrl(latitude, longitude);
  let streetViewBase64 = referenceImageBase64; // Fallback to reference if Street View fails

  try {
    const streetViewResponse = await fetch(streetViewUrl);
    if (streetViewResponse.ok) {
      const streetViewBuffer = await streetViewResponse.arrayBuffer();
      streetViewBase64 = Buffer.from(streetViewBuffer).toString('base64');
    }
  } catch (error) {
    console.warn("Could not fetch Street View, using reference image only:", error);
  }

  // Build the activity context
  const distanceKm = distance ? (distance / 1000).toFixed(1) : null;
  const time = startTime ? new Date(startTime) : null;
  const timeOfDay = time ? getTimeOfDay(time) : "daytime";

  const activityContext = sportType?.toLowerCase().includes('run')
    ? "running dynamically with professional form, looking strong and fit"
    : "cycling powerfully with professional form, looking strong and athletic";

  // Create detailed prompt for Gemini image generation
  const prompt = `
Generate a photorealistic image of the person provided in the first reference image, placed in the environment shown in the second reference image.

CONTEXT:
- Activity Location: ${locationName} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})
- Activity Type: ${sportType || 'Run'}
${distanceKm ? `- Distance: ${distanceKm} km` : ''}
- Time of Day: ${timeOfDay}
- Action/Mood: ${activityContext}

CRITICAL IDENTITY INSTRUCTIONS:
- The face, facial structure, skin tone, and hair MUST MATCH the person in the first image exactly
- Maintain the complete identity and appearance of the user from the reference photo
- Keep recognizable facial features, body type, and proportions

POSE & COMPOSITION INSTRUCTIONS:
- **CHANGE THE POSE**: Do NOT copy the static pose from the reference. Create a new, dynamic action pose
- Generate a full-body or 3/4 body shot showing the person in motion
- Show the person ${activityContext}
- Use ${timeOfDay} lighting appropriate for the scene
- Blend the environment lighting naturally onto the person
- Include motion blur and dynamic composition to convey speed and energy

ENVIRONMENT & DETAILS:
- Place the person in the location shown in the second image
- Include relevant landmarks and environmental details from ${locationName}
- Use professional sports photography aesthetic - cinematic, inspiring, authentic
- Show appropriate ${sportType?.toLowerCase() || 'running'} gear and athletic attire
- Make it suitable as a social media thumbnail - dynamic and engaging

The result should look like a professional action shot taken at this specific location during a ${sportType?.toLowerCase() || 'run'}.
`;

  try {
    // Use Gemini 3 Pro Image for actual image generation
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: referenceImageBase64,
            },
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: streetViewBase64,
            },
          },
          { text: prompt }
        ]
      }],
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
      },
    });

    const response = result.response;

    // Extract generated image from response
    for (const candidate of response.candidates || []) {
      for (const part of candidate.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          const imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          return {
            imageUrl,
            prompt,
          };
        }
      }
    }

    throw new Error("No image generated in response");

  } catch (error: any) {
    console.error("Gemini image generation failed:", error);
    throw new Error(`Failed to generate thumbnail: ${error.message}`);
  }
}

/**
 * Get Google Street View image URL for the given coordinates
 */
function getStreetViewUrl(lat: number, lon: number): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
  const size = "640x640";
  const fov = 90; // Field of view
  const heading = 0; // Direction (north)
  const pitch = 0; // Camera angle

  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&fov=${fov}&heading=${heading}&pitch=${pitch}&key=${apiKey}`;
}

/**
 * Get location name from coordinates using reverse geocoding
 */
async function getLocationName(lat: number, lon: number): Promise<string> {
  try {
    // Using OpenStreetMap Nominatim (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`,
      {
        headers: {
          'User-Agent': 'Statistics-for-Strava/1.0',
        },
      }
    );

    if (!response.ok) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }

    const data = await response.json();

    // Build a nice location string
    const parts = [];
    if (data.address?.road) parts.push(data.address.road);
    if (data.address?.suburb || data.address?.neighbourhood) {
      parts.push(data.address.suburb || data.address.neighbourhood);
    }
    if (data.address?.city || data.address?.town || data.address?.village) {
      parts.push(data.address.city || data.address.town || data.address.village);
    }
    if (data.address?.state) parts.push(data.address.state);

    return parts.slice(0, 3).join(", ") || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  }
}

/**
 * Generate a video of the user running through their route
 * Uses Gemini Veo for video generation
 *
 * NOTE: This is experimental and requires specific API access.
 * The video generation API is not yet publicly available in the standard SDK.
 */
export async function generateRunningVideo({
  referenceImageUrl,
  latitude,
  longitude,
  activityName,
  sportType = "Run",
  userPrompt,
}: {
  referenceImageUrl: string;
  latitude: number;
  longitude: number;
  activityName?: string;
  sportType?: string;
  userPrompt?: string;
}): Promise<string> {

  // Fetch the reference image
  const referenceImageResponse = await fetch(referenceImageUrl);
  if (!referenceImageResponse.ok) {
    throw new Error(`Failed to fetch reference image: ${referenceImageResponse.statusText}`);
  }

  const referenceImageBuffer = await referenceImageResponse.arrayBuffer();
  const referenceImageBase64 = Buffer.from(referenceImageBuffer).toString('base64');

  // Get location context
  const locationName = await getLocationName(latitude, longitude);

  const actionContext = userPrompt || "running through the route with high energy";
  const activity = sportType?.toLowerCase().includes('run') ? 'runner' : 'cyclist';

  const prompt = `A cinematic tracking shot of a ${activity} (based on the reference image) ${actionContext}. Location: ${locationName}.
Dynamic angle, slow motion, professional sports videography, 4k, highly detailed.`;

  // Note: Veo video generation is not yet available in the public SDK
  // This is a placeholder for when the API becomes available
  throw new Error(
    "Video generation is not yet available. " +
    "Gemini Veo API access is required and not included in the standard SDK. " +
    "Check https://ai.google.dev for updates on Veo availability."
  );

  /*
  // Example implementation when API becomes available:
  try {
    const model = genAI.getGenerativeModel({ model: "veo-3.1-fast-generate-preview" });

    let operation = await model.generateVideo({
      prompt,
      image: {
        inlineData: {
          mimeType: "image/jpeg",
          data: referenceImageBase64,
        },
      },
      generationConfig: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: "16:9",
      },
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await genAI.operations.get(operation.name);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error("Video generation failed to return a URI");
    }

    return videoUri;

  } catch (error: any) {
    console.error("Gemini video generation failed:", error);
    throw new Error(`Failed to generate video: ${error.message}`);
  }
  */
}

/**
 * Determine time of day from timestamp
 */
function getTimeOfDay(date: Date): string {
  const hour = date.getHours();

  if (hour >= 5 && hour < 8) return "early morning sunrise";
  if (hour >= 8 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 19) return "golden hour evening";
  if (hour >= 19 && hour < 21) return "dusk";
  return "nighttime";
}
