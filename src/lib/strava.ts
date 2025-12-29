/**
 * Fetch ALL activities from Strava with automatic pagination
 * Retrieves the complete activity history by making multiple API calls
 */
export async function fetchStravaActivities(accessToken: string) {
  const allActivities: any[] = [];
  let page = 1;
  const perPage = 200; // Maximum allowed by Strava API
  
  while (true) {
    const response = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activities from Strava: ${response.statusText}`);
    }

    const activities = await response.json();
    
    // If no activities returned, we've fetched everything
    if (!activities || activities.length === 0) {
      break;
    }
    
    allActivities.push(...activities);
    
    // If we got fewer activities than requested, we've reached the end
    if (activities.length < perPage) {
      break;
    }
    
    page++;
    
    // Add a small delay to respect Strava's rate limits (100 requests per 15 minutes)
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  return allActivities;
}

/**
 * Fetch detailed athlete info (includes gear/shoes/bikes)
 */
export async function fetchStravaAthlete(accessToken: string) {
  const response = await fetch("https://www.strava.com/api/v3/athlete", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch athlete from Strava");
  }

  return response.json();
}

/**
 * Fetch detailed activity info (includes description, calories, splits)
 */
export async function fetchStravaActivityDetail(accessToken: string, activityId: string) {
  const response = await fetch(`https://www.strava.com/api/v3/activities/${activityId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity detail for ${activityId}`);
  }

  return response.json();
}

/**
 * Fetch activity streams (time-series data)
 * This includes metrics like heart rate, speed, cadence, and GPS trace over time.
 */
export async function fetchStravaActivityStreams(accessToken: string, activityId: string) {
  const keys = [
    "time",
    "distance",
    "latlng",
    "altitude",
    "velocity_smooth",
    "heartrate",
    "cadence",
    "watts",
    "temp",
    "moving",
    "grade_smooth"
  ].join(",");

  const response = await fetch(
    `https://www.strava.com/api/v3/activities/${activityId}/streams?keys=${keys}&key_by_type=true`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null; // Some activities might not have streams
    throw new Error(`Failed to fetch activity streams for ${activityId}: ${response.statusText}`);
  }

  const streams = await response.json();
  return streams;
}
