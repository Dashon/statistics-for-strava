// Polar AccessLink API Client
// Docs: https://www.polar.com/accesslink-api/

const POLAR_API_BASE = 'https://www.polaraccesslink.com/v3';

export interface PolarTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  x_user_id: number;
}

export interface PolarExercise {
  id: string;
  upload_time: string;
  polar_user: string;
  device: string;
  start_time: string;
  duration: string;
  calories: number;
  distance: number;
  heart_rate: {
    average: number;
    maximum: number;
  };
  training_load: number;
  sport: string;
  has_route: boolean;
  detailed_sport_info: string;
}

export interface PolarSleep {
  polar_user: string;
  date: string;
  sleep_start_time: string;
  sleep_end_time: string;
  device_id: string;
  continuity: number;
  continuity_class: number;
  light_sleep: number;
  deep_sleep: number;
  rem_sleep: number;
  unrecognized_sleep_stage: number;
  sleep_score: number;
  total_interruption_duration: number;
  sleep_charge: number;
  sleep_rating: number;
  sleep_cycles: number;
  ans_charge: number;
}

export interface PolarNightlyRecharge {
  polar_user: string;
  date: string;
  heart_rate_avg: number;
  beat_to_beat_avg: number;
  heart_rate_variability_avg: number;
  breathing_rate_avg: number;
  nightly_recharge_status: number;
  ans_charge: number;
  ans_charge_status: number;
}

export async function exchangePolarCode(code: string, redirectUri: string): Promise<PolarTokens> {
  const credentials = Buffer.from(`${process.env.POLAR_CLIENT_ID}:${process.env.POLAR_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch('https://polarremote.com/v2/oauth2/token', {
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

  if (!response.ok) throw new Error(`Polar token exchange failed: ${response.statusText}`);
  return response.json();
}

export async function registerPolarUser(accessToken: string): Promise<{ polar_user_id: string }> {
  const response = await fetch(`${POLAR_API_BASE}/users`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 'member-id': `qt_${Date.now()}` }),
  });

  if (!response.ok && response.status !== 409) { // 409 = already registered
    throw new Error(`Polar user registration failed: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchPolarExercises(accessToken: string): Promise<PolarExercise[]> {
  // First, check for new transactions
  const txResponse = await fetch(`${POLAR_API_BASE}/users/this/exercise-transactions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (txResponse.status === 204) return []; // No new data
  if (!txResponse.ok) throw new Error(`Polar API error: ${txResponse.statusText}`);
  
  const tx = await txResponse.json();
  if (!tx['transaction-id']) return [];

  // Fetch exercises from transaction
  const exResponse = await fetch(tx['resource-uri'], {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!exResponse.ok) throw new Error(`Polar API error: ${exResponse.statusText}`);
  const exData = await exResponse.json();
  
  // Commit transaction
  await fetch(`${tx['resource-uri']}/commit`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return exData.exercises || [];
}

export async function fetchPolarSleep(accessToken: string, date: string): Promise<PolarSleep | null> {
  const response = await fetch(
    `${POLAR_API_BASE}/users/this/sleep/${date}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Polar API error: ${response.statusText}`);
  return response.json();
}

export async function fetchPolarNightlyRecharge(accessToken: string, date: string): Promise<PolarNightlyRecharge | null> {
  const response = await fetch(
    `${POLAR_API_BASE}/users/this/nightly-recharge/${date}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (response.status === 204) return null;
  if (!response.ok) throw new Error(`Polar API error: ${response.statusText}`);
  return response.json();
}

export function getPolarAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.POLAR_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'accesslink.read_all',
    state,
  });
  return `https://flow.polar.com/oauth2/authorization?${params}`;
}
