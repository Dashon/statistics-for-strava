// WHOOP API Client
// Docs: https://developer.whoop.com/api

const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer/v1';

export interface WhoopTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

export interface WhoopWorkout {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  sport_id: number;
  score_state: string;
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number;
    altitude_gain_meter: number;
    altitude_change_meter: number;
    zone_duration: Record<string, number>;
  };
}

export interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: { baseline_milli: number; need_from_sleep_debt_milli: number; };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export async function exchangeWhoopCode(code: string, redirectUri: string): Promise<WhoopTokens> {
  const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) throw new Error(`WHOOP token exchange failed: ${response.statusText}`);
  return response.json();
}

export async function refreshWhoopToken(refreshToken: string): Promise<WhoopTokens> {
  const response = await fetch('https://api.prod.whoop.com/oauth/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: process.env.WHOOP_CLIENT_ID!,
      client_secret: process.env.WHOOP_CLIENT_SECRET!,
    }),
  });

  if (!response.ok) throw new Error(`WHOOP token refresh failed: ${response.statusText}`);
  return response.json();
}

export async function fetchWhoopRecovery(accessToken: string, startDate?: string, endDate?: string): Promise<WhoopRecovery[]> {
  let url = `${WHOOP_API_BASE}/recovery`;
  if (startDate && endDate) url += `?start=${startDate}&end=${endDate}`;
  
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`WHOOP API error: ${response.statusText}`);
  const data = await response.json();
  return data.records;
}

export async function fetchWhoopWorkouts(accessToken: string, startDate?: string, endDate?: string): Promise<WhoopWorkout[]> {
  let url = `${WHOOP_API_BASE}/activity/workout`;
  if (startDate && endDate) url += `?start=${startDate}&end=${endDate}`;
  
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`WHOOP API error: ${response.statusText}`);
  const data = await response.json();
  return data.records;
}

export async function fetchWhoopSleep(accessToken: string, startDate?: string, endDate?: string): Promise<WhoopSleep[]> {
  let url = `${WHOOP_API_BASE}/activity/sleep`;
  if (startDate && endDate) url += `?start=${startDate}&end=${endDate}`;
  
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`WHOOP API error: ${response.statusText}`);
  const data = await response.json();
  return data.records;
}

export function getWhoopAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.WHOOP_CLIENT_ID!,
    redirect_uri: redirectUri,
    scope: 'read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement',
    state,
  });
  return `https://api.prod.whoop.com/oauth/oauth2/auth?${params}`;
}
