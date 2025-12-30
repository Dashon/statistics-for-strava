// Oura Ring API Client
// Docs: https://cloud.ouraring.com/v2/docs

const OURA_API_BASE = 'https://api.ouraring.com/v2';

export interface OuraTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface OuraDailySleep {
  id: string;
  day: string;
  score: number;
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
}

export interface OuraDailyReadiness {
  id: string;
  day: string;
  score: number;
  temperature_deviation: number;
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
}

export interface OuraWorkout {
  id: string;
  activity: string;
  calories: number;
  day: string;
  distance: number;
  end_datetime: string;
  intensity: string;
  label: string;
  source: string;
  start_datetime: string;
}

export async function exchangeOuraCode(code: string, redirectUri: string): Promise<OuraTokens> {
  const response = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.OURA_CLIENT_ID!,
      client_secret: process.env.OURA_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Oura token exchange failed: ${response.statusText}`);
  }

  return response.json();
}

export async function refreshOuraToken(refreshToken: string): Promise<OuraTokens> {
  const response = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.OURA_CLIENT_ID!,
      client_secret: process.env.OURA_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) {
    throw new Error(`Oura token refresh failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchOuraDailySleep(accessToken: string, startDate: string, endDate: string): Promise<OuraDailySleep[]> {
  const response = await fetch(
    `${OURA_API_BASE}/usercollection/daily_sleep?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) throw new Error(`Oura API error: ${response.statusText}`);
  const data = await response.json();
  return data.data;
}

export async function fetchOuraDailyReadiness(accessToken: string, startDate: string, endDate: string): Promise<OuraDailyReadiness[]> {
  const response = await fetch(
    `${OURA_API_BASE}/usercollection/daily_readiness?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) throw new Error(`Oura API error: ${response.statusText}`);
  const data = await response.json();
  return data.data;
}

export async function fetchOuraWorkouts(accessToken: string, startDate: string, endDate: string): Promise<OuraWorkout[]> {
  const response = await fetch(
    `${OURA_API_BASE}/usercollection/workout?start_date=${startDate}&end_date=${endDate}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) throw new Error(`Oura API error: ${response.statusText}`);
  const data = await response.json();
  return data.data;
}

export function getOuraAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.OURA_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'daily workout heartrate personal session spo2',
    state,
  });
  return `https://cloud.ouraring.com/oauth/authorize?${params}`;
}
