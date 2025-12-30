// Fitbit API Client  
// Docs: https://dev.fitbit.com/

const FITBIT_API_BASE = 'https://api.fitbit.com';

export interface FitbitTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user_id: string;
}

export interface FitbitActivity {
  logId: number;
  activityName: string;
  activityTypeId: number;
  averageHeartRate?: number;
  calories: number;
  distance?: number;
  distanceUnit?: string;
  duration: number;
  activeDuration: number;
  startTime: string;
  steps?: number;
  elevationGain?: number;
}

export interface FitbitSleep {
  logId: number;
  dateOfSleep: string;
  startTime: string;
  endTime: string;
  duration: number;
  minutesToFallAsleep: number;
  minutesAsleep: number;
  minutesAwake: number;
  minutesAfterWakeup: number;
  efficiency: number;
  levels?: {
    summary: {
      deep?: { count: number; minutes: number };
      light?: { count: number; minutes: number };
      rem?: { count: number; minutes: number };
      wake?: { count: number; minutes: number };
    };
  };
}

export interface FitbitHeartRate {
  dateTime: string;
  value: {
    restingHeartRate?: number;
    heartRateZones: Array<{
      name: string;
      min: number;
      max: number;
      minutes: number;
      caloriesOut: number;
    }>;
  };
}

export async function exchangeFitbitCode(code: string, redirectUri: string): Promise<FitbitTokens> {
  const credentials = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) throw new Error(`Fitbit token exchange failed: ${response.statusText}`);
  return response.json();
}

export async function refreshFitbitToken(refreshToken: string): Promise<FitbitTokens> {
  const credentials = Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) throw new Error(`Fitbit token refresh failed: ${response.statusText}`);
  return response.json();
}

export async function fetchFitbitActivities(accessToken: string, date: string): Promise<FitbitActivity[]> {
  const response = await fetch(
    `${FITBIT_API_BASE}/1/user/-/activities/list.json?afterDate=${date}&sort=asc&limit=100&offset=0`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) throw new Error(`Fitbit API error: ${response.statusText}`);
  const data = await response.json();
  return data.activities || [];
}

export async function fetchFitbitSleep(accessToken: string, date: string): Promise<FitbitSleep[]> {
  const response = await fetch(
    `${FITBIT_API_BASE}/1.2/user/-/sleep/date/${date}.json`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) throw new Error(`Fitbit API error: ${response.statusText}`);
  const data = await response.json();
  return data.sleep || [];
}

export async function fetchFitbitHeartRate(accessToken: string, date: string): Promise<FitbitHeartRate> {
  const response = await fetch(
    `${FITBIT_API_BASE}/1/user/-/activities/heart/date/${date}/1d.json`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) throw new Error(`Fitbit API error: ${response.statusText}`);
  const data = await response.json();
  return data['activities-heart']?.[0];
}

export function getFitbitAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.FITBIT_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'activity heartrate location nutrition profile settings sleep social weight',
    state,
  });
  return `https://www.fitbit.com/oauth2/authorize?${params}`;
}
