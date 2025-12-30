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
  referenceImageUrl?: string | null;
  latitude: number;
  longitude: number;
  activityName?: string;
  sportType?: string;
  distance?: number;
  startTime?: string;
}): Promise<{ imageUrl: string; prompt: string }> {

  let referenceImageBase64: string | null = null;
  
  if (referenceImageUrl) {
    try {
      // Fetch the reference image
      const referenceImageResponse = await fetch(referenceImageUrl);
      if (referenceImageResponse.ok) {
        const referenceImageBuffer = await referenceImageResponse.arrayBuffer();
        referenceImageBase64 = Buffer.from(referenceImageBuffer).toString('base64');
      }
    } catch (e) {
      console.warn("Could not fetch reference image", e);
    }
  }

  // Get location context using reverse geocoding
  const locationName = await getLocationName(latitude, longitude);

  // Fetch Street View image for location context
  const streetViewUrl = getStreetViewUrl(latitude, longitude);
  let streetViewBase64: string | null = null;

  try {
    const streetViewResponse = await fetch(streetViewUrl);
    if (streetViewResponse.ok) {
      const streetViewBuffer = await streetViewResponse.arrayBuffer();
      streetViewBase64 = Buffer.from(streetViewBuffer).toString('base64');
    }
  } catch (error) {
    console.warn("Could not fetch Street View:", error);
  }

  // Fallback if Street View fails but reference exists
  if (!streetViewBase64 && referenceImageBase64) {
    streetViewBase64 = referenceImageBase64;
  }
  
  // NOTE: If both are null, we proceed with text-only generation

  // Build the activity context
  const distanceKm = distance ? (distance / 1000).toFixed(1) : null;
  const time = startTime ? new Date(startTime) : null;
  const timeOfDay = time ? getTimeOfDay(time) : "daytime";

  const activityContext = sportType?.toLowerCase().includes('run')
    ? "running dynamically with professional form, looking strong and fit"
    : "cycling powerfully with professional form, looking strong and athletic";

  // Create detailed prompt for Gemini image generation
  const prompt = `
Generate a photorealistic image of ${referenceImageBase64 ? "the person provided in the first reference image" : "a fit, athletic runner"}, ${
    streetViewBase64 
    ? `placed in the environment shown in the ${referenceImageBase64 ? "second" : "first"} reference image.` 
    : `running in a scenic location at "${locationName}".`
}

CONTEXT:
- Activity Location: ${locationName} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})
- Activity Type: ${sportType || 'Run'}
${distanceKm ? `- Distance: ${distanceKm} km` : ''}
- Time of Day: ${timeOfDay}
- Action/Mood: ${activityContext}

${referenceImageBase64 ? `
CRITICAL IDENTITY INSTRUCTIONS:
- The face, facial structure, skin tone, and hair MUST MATCH the person in the first image exactly
- Maintain the complete identity and appearance of the user from the reference photo
- Keep recognizable facial features, body type, and proportions
` : `
CRITICAL IDENTITY INSTRUCTIONS:
- Generate a generic, strong, and fit athlete
- Focus on professional athletic appearance and form
`}

POSE & COMPOSITION INSTRUCTIONS:
${referenceImageBase64 ? "- **CHANGE THE POSE**: Do NOT copy the static pose from the reference. Create a new, dynamic action pose" : ""}
- Generate a full-body or 3/4 body shot showing the person in motion
- Show the person ${activityContext}
- Use ${timeOfDay} lighting appropriate for the scene
- Blend the environment lighting naturally onto the person
- Include motion blur and dynamic composition to convey speed and energy

ENVIRONMENT & DETAILS:
${streetViewBase64 
    ? `- Place the person in the location shown in the ${referenceImageBase64 ? "second" : "first"} image`
    : `- Create a realistic environment based on the location "${locationName}" (look up typical scenery for this area)`
}
- Include relevant landmarks and environmental details from ${locationName}
- Use professional sports photography aesthetic - cinematic, inspiring, authentic
- Show appropriate ${sportType?.toLowerCase() || 'running'} gear and athletic attire
- Make it suitable as a social media thumbnail - dynamic and engaging

The result should look like a professional action shot taken at this specific location during a ${sportType?.toLowerCase() || 'run'}.
`;

  try {
    // Use Gemini 3 Pro Image for actual image generation
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

    const parts: any[] = [];
    
    if (referenceImageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: referenceImageBase64,
        },
      });
    }
    
    if (streetViewBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: streetViewBase64,
        },
      });
    }
    
    parts.push({ text: prompt });

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: parts
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
 * Evaluate multiple scenery images and choose the best one
 * Uses Gemini Vision to act as a "Director of Photography"
 */
export async function evaluateScenery(
  images: { label: string; url: string }[]
): Promise<{ bestLabel: string; reasoning: string }> {
  try {
    // Attempt to use the specific Flash 001 model version
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    const prompt = `
    You are a Director of Photography for a high-end sports documentary.
    You are scouting locations for a running/cycling video.
    
    Evaluate these ${images.length} street view camera angles.
    Choose the ONE angle that looks the most cinematic, scenic, and appropriate for a background running video.
    
    Criteria for selection:
    1. AESTHETICS: Good lighting, nice scenery (trees, open road, mountains, city skyline).
    2. DEPTH: Avoid flat walls, staring directly at bushes/fences, or blocked views.
    3. SUITABILITY: A clear path/road where a runner/cyclist would naturally be.
    
    Images provided:
    ${images.map(img => `- ${img.label}`).join('\n')}
    
    Return a JSON object with:
    - bestLabel: The label of the winning image.
    - reasoning: A short, professional explanation of why this angle wins.
    `;

    const parts: any[] = [{ text: prompt }];

    // Fetch and attach images
    for (const img of images) {
      try {
        const response = await fetch(img.url);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          
          parts.push({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64,
            },
          });
          parts.push({ text: `Image Label: ${img.label}` });
        }
      } catch (e) {
        console.warn(`Failed to fetch image for evaluation: ${img.url}`);
      }
    }

    const result = await model.generateContent({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
    });

    const responseText = result.response.text();
    const responseJson = JSON.parse(responseText);
    
    return {
      bestLabel: responseJson.bestLabel || images[0].label,
      reasoning: responseJson.reasoning || "Default selection",
    };

  } catch (error) {
    console.warn("AI Scenery Evaluation failed, defaulting to first option:", error);
    return { bestLabel: images[0].label, reasoning: "Evaluation failed" };
  }
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
