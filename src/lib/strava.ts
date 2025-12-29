
export async function fetchStravaActivities(accessToken: string) {
  const response = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=100", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch activities from Strava");
  }

  return response.json();
}
