/**
 * Street View / Static Map Thumbnail Generator
 * 
 * Returns URLs for static map images.
 * The browser loads these directly - no server-side fetch needed.
 */

/**
 * Get a static map image URL using Geoapify (free tier, no API key needed for basic use)
 * Alternative services: MapTiler, HERE, etc.
 */
// Helper to calculate bearing between two points
function calculateBearing(startLat: number, startLng: number, endLat: number, endLng: number): number {
  const startLatRad = (startLat * Math.PI) / 180;
  const startLngRad = (startLng * Math.PI) / 180;
  const endLatRad = (endLat * Math.PI) / 180;
  const endLngRad = (endLng * Math.PI) / 180;

  const y = Math.sin(endLngRad - startLngRad) * Math.cos(endLatRad);
  const x =
    Math.cos(startLatRad) * Math.sin(endLatRad) -
    Math.sin(startLatRad) * Math.cos(endLatRad) * Math.cos(endLngRad - startLngRad);

  const bearingRad = Math.atan2(y, x);
  const bearingDeg = (bearingRad * 180) / Math.PI;

  return (bearingDeg + 360) % 360;
}

/**
 * Helper to construct a Google Street View Image API URL
 */
export function getStreetViewImageUrl(lat: number, lng: number, heading: number, apiKey: string): string {
  // Use a slightly smaller size for evaluation to save bandwidth/latency if desired, 
  // but 640x400 is standard for the thumbnail.
  return `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${lat},${lng}&fov=90&heading=${heading.toFixed(2)}&pitch=0&key=${apiKey}`;
}

/**
 * Get a static map image URL using Geoapify (free tier, no API key needed for basic use)
 * Alternative services: MapTiler, HERE, etc.
 */

/**
 * Returns a static map URL for the given coordinates.
 * Uses free map tile services that don't require API keys or server-side fetching.
 */
export async function getStreetViewThumbnail({
  latitude,
  longitude,
  additionalPoints = []
}: {
  latitude: number;
  longitude: number;
  additionalPoints?: [number, number][];
}): Promise<{ imageUrl: string; source: 'streetview' | 'staticmap' }> {
  
  // Try Google Street View first if we have a valid API key
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  console.log(`Checking Street View for ${latitude},${longitude}. API Key present: ${!!apiKey}`);
  
  if (apiKey) {
    try {
      // Helper to check a single point
      const checkPoint = async (lat: number, lng: number): Promise<boolean> => {
           const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;
           const res = await fetch(metadataUrl);
           const data = await res.json();
           return data.status === 'OK';
      };

      // Points to check: Start, then sample along the route if provided
      let validPoint: { lat: number, lng: number, heading?: number } | null = null;
      
      // Helper to find heading for a point index
      const getHeadingForIndex = (idx: number, points: [number, number][]) => {
          if (points.length < 2) return 0;
          // Look ahead if possible, otherwise look back
          if (idx < points.length - 1) {
              const p1 = points[idx];
              const p2 = points[idx + 1];
              return calculateBearing(p1[0], p1[1], p2[0], p2[1]);
          } else {
              const p1 = points[idx - 1];
              const p2 = points[idx];
              return calculateBearing(p1[0], p1[1], p2[0], p2[1]);
          }
      }

      // 1. Check Start
      if (await checkPoint(latitude, longitude)) {
          // If we have route data, calculate heading from start to first point
          let heading = 0;
          if (additionalPoints.length > 0) {
              heading = calculateBearing(latitude, longitude, additionalPoints[0][0], additionalPoints[0][1]);
          }
          validPoint = { lat: latitude, lng: longitude, heading };
      } 
      // 2. If start failed and we have a path, check other points
      else if (additionalPoints && additionalPoints.length > 0) {
          console.log(`Start point failed. Checking ${additionalPoints.length} additional points...`);
          // Check up to 5 points spread evenly across the route
          const steps = 5;
          const stepSize = Math.floor(additionalPoints.length / steps);
          
          for (let i = 1; i <= steps; i++) {
              const idx = i * stepSize;
              if (idx < additionalPoints.length) {
                  const pt = additionalPoints[idx];
                  if (await checkPoint(pt[0], pt[1])) {
                      const heading = getHeadingForIndex(idx, additionalPoints);
                      console.log(`Found valid Street View at index ${idx}: ${pt} with heading ${heading}`);
                      validPoint = { lat: pt[0], lng: pt[1], heading };
                      break;
                  }
              }
          }
      }

      if (validPoint) {
        // Return the Street View URL directly - browser will load it
        const headingParam = validPoint.heading !== undefined ? `&heading=${validPoint.heading.toFixed(2)}` : '';
        return {
          imageUrl: `https://maps.googleapis.com/maps/api/streetview?size=640x400&location=${validPoint.lat},${validPoint.lng}&fov=90${headingParam}&pitch=0&key=${apiKey}`,
          source: 'streetview',
        };
      } else {
        console.warn(`Street View not available for ${latitude},${longitude} or surrounding points.`);
      }
    } catch (e) {
      console.warn("Street View metadata check failed, falling back:", e);
    }
  }

  // Fallback: Return a generated SVG placeholder
  const width = 640;
  const height = 400;
  
  // Decide the message based on whether the key was present
  const mainMessage = apiKey ? "No Imagery Found" : "No Map Available";
  const subMessage = apiKey 
    ? "Street View is not available on this route" 
    : "Add GOOGLE_MAPS_API_KEY to enable Street View";

  // Simple SVG placeholder with a map-like pattern
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#18181b"/>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#27272a" stroke-width="1"/>
    </pattern>
    <rect width="100%" height="100%" fill="url(#grid)" />
    <text x="50%" y="45%" font-family="sans-serif" font-size="20" fill="#71717a" text-anchor="middle">${mainMessage}</text>
    <text x="50%" y="55%" font-family="sans-serif" font-size="14" fill="#52525b" text-anchor="middle">${subMessage}</text>
  </svg>
  `.trim();

  const base64Svg = Buffer.from(svg).toString('base64');
  return {
    imageUrl: `data:image/svg+xml;base64,${base64Svg}`,
    source: 'staticmap',
  };
}



/**
 * Get location name from coordinates using reverse geocoding
 * (Kept for future Remotion video overlays)
 */
export async function getLocationName(lat: number, lon: number): Promise<string> {
  try {
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
