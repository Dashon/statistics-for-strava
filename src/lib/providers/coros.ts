// COROS API Client
// Note: COROS API requires developer program approval
// This is a placeholder implementation based on known endpoints

const COROS_API_BASE = 'https://open.coros.com';

export interface CorosTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  openId: string;
}

export interface CorosActivity {
  labelId: string;
  sportType: number;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  calories: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  avgPace?: number;
  elevGain?: number;
  avgCadence?: number;
  avgPower?: number;
}

export interface CorosSleep {
  date: string;
  sleepScore: number;
  totalSleep: number;
  deepSleep: number;
  lightSleep: number;
  remSleep: number;
  awake: number;
  sleepStart: number;
  sleepEnd: number;
}

export async function exchangeCorosCode(code: string, redirectUri: string): Promise<CorosTokens> {
  const response = await fetch(`${COROS_API_BASE}/oauth2/accesstoken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.COROS_CLIENT_ID,
      client_secret: process.env.COROS_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) throw new Error(`COROS token exchange failed: ${response.statusText}`);
  const data = await response.json();
  if (data.result !== '0000') throw new Error(`COROS error: ${data.message}`);
  return data.data;
}

export async function refreshCorosToken(refreshToken: string): Promise<CorosTokens> {
  const response = await fetch(`${COROS_API_BASE}/oauth2/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.COROS_CLIENT_ID,
      client_secret: process.env.COROS_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) throw new Error(`COROS token refresh failed: ${response.statusText}`);
  const data = await response.json();
  if (data.result !== '0000') throw new Error(`COROS error: ${data.message}`);
  return data.data;
}

export async function fetchCorosActivities(
  accessToken: string,
  openId: string,
  startDate: string,
  endDate: string
): Promise<CorosActivity[]> {
  const response = await fetch(`${COROS_API_BASE}/v2/coros/sport/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      openId,
      startDate: startDate.replace(/-/g, ''),
      endDate: endDate.replace(/-/g, ''),
    }),
  });

  if (!response.ok) throw new Error(`COROS API error: ${response.statusText}`);
  const data = await response.json();
  if (data.result !== '0000') throw new Error(`COROS error: ${data.message}`);
  return data.data || [];
}

export async function fetchCorosSleep(
  accessToken: string,
  openId: string,
  date: string
): Promise<CorosSleep | null> {
  const response = await fetch(`${COROS_API_BASE}/v2/coros/sleep/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      openId,
      date: date.replace(/-/g, ''),
    }),
  });

  if (!response.ok) throw new Error(`COROS API error: ${response.statusText}`);
  const data = await response.json();
  if (data.result !== '0000') return null;
  return data.data;
}

export function getCorosAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.COROS_CLIENT_ID!,
    redirect_uri: redirectUri,
    state,
  });
  return `${COROS_API_BASE}/oauth2/authorize?${params}`;
}

// Map COROS sport types to standard names
export function mapCorosSportType(sportType: number): string {
  const types: Record<number, string> = {
    1: 'Run',
    2: 'TrailRun',
    3: 'VirtualRun',
    4: 'Walk',
    5: 'Hike',
    6: 'Ride',
    7: 'VirtualRide',
    8: 'Swim',
    9: 'Swim', // Open water
    10: 'Triathlon',
    11: 'Rowing',
    12: 'Workout',
    13: 'Ski',
    14: 'Snowboard',
    15: 'CrossCountrySkiing',
    100: 'Workout',
  };
  return types[sportType] || 'Workout';
}
