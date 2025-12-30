// Garmin Connect API Client
// Note: Garmin uses OAuth 1.0a, requiring different handling
// Docs: https://developer.garmin.com/gc-developer-program/

import crypto from 'crypto';

const GARMIN_API_BASE = 'https://apis.garmin.com';

export interface GarminActivity {
  activityId: number;
  activityName: string;
  startTimeInSeconds: number;
  startTimeOffsetInSeconds: number;
  activityType: string;
  durationInSeconds: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  distanceInMeters?: number;
  activeKilocalories?: number;
  averageSpeedInMetersPerSecond?: number;
  maxSpeedInMetersPerSecond?: number;
  steps?: number;
  elevationGainInMeters?: number;
  elevationLossInMeters?: number;
}

export interface GarminDailySummary {
  summaryId: string;
  calendarDate: string;
  startTimeInSeconds: number;
  durationInSeconds: number;
  steps: number;
  distanceInMeters: number;
  activeKilocalories: number;
  restingHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
  averageHeartRateInBeatsPerMinute?: number;
}

export interface GarminSleep {
  summaryId: string;
  calendarDate: string;
  startTimeInSeconds: number;
  durationInSeconds: number;
  deepSleepDurationInSeconds: number;
  lightSleepDurationInSeconds: number;
  remSleepDurationInSeconds: number;
  awakeDurationInSeconds: number;
  validation: string;
}

// OAuth 1.0a signature generation
function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string = ''
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;
  
  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');
}

function generateOAuthHeader(
  method: string,
  url: string,
  consumerKey: string,
  consumerSecret: string,
  token?: string,
  tokenSecret?: string,
  extraParams?: Record<string, string>
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    ...(token && { oauth_token: token }),
    ...extraParams,
  };

  const signature = generateOAuthSignature(
    method,
    url,
    oauthParams,
    consumerSecret,
    tokenSecret
  );

  oauthParams['oauth_signature'] = signature;

  const headerParts = Object.keys(oauthParams)
    .filter(key => key.startsWith('oauth_'))
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(oauthParams[key])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

export async function getGarminRequestToken(callbackUrl: string): Promise<{ oauth_token: string; oauth_token_secret: string }> {
  const url = 'https://connectapi.garmin.com/oauth-service/oauth/request_token';
  
  const authHeader = generateOAuthHeader(
    'POST',
    url,
    process.env.GARMIN_CONSUMER_KEY!,
    process.env.GARMIN_CONSUMER_SECRET!,
    undefined,
    undefined,
    { oauth_callback: callbackUrl }
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authHeader },
  });

  if (!response.ok) throw new Error(`Garmin request token failed: ${response.statusText}`);
  
  const text = await response.text();
  const params = new URLSearchParams(text);
  return {
    oauth_token: params.get('oauth_token')!,
    oauth_token_secret: params.get('oauth_token_secret')!,
  };
}

export async function exchangeGarminToken(
  oauthToken: string,
  oauthVerifier: string,
  tokenSecret: string
): Promise<{ oauth_token: string; oauth_token_secret: string }> {
  const url = 'https://connectapi.garmin.com/oauth-service/oauth/access_token';
  
  const authHeader = generateOAuthHeader(
    'POST',
    url,
    process.env.GARMIN_CONSUMER_KEY!,
    process.env.GARMIN_CONSUMER_SECRET!,
    oauthToken,
    tokenSecret,
    { oauth_verifier: oauthVerifier }
  );

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: authHeader },
  });

  if (!response.ok) throw new Error(`Garmin token exchange failed: ${response.statusText}`);
  
  const text = await response.text();
  const params = new URLSearchParams(text);
  return {
    oauth_token: params.get('oauth_token')!,
    oauth_token_secret: params.get('oauth_token_secret')!,
  };
}

export async function fetchGarminActivities(
  token: string,
  tokenSecret: string,
  startTime: number,
  endTime: number
): Promise<GarminActivity[]> {
  const url = `${GARMIN_API_BASE}/wellness-api/rest/activities?uploadStartTimeInSeconds=${startTime}&uploadEndTimeInSeconds=${endTime}`;
  
  const authHeader = generateOAuthHeader(
    'GET',
    url.split('?')[0],
    process.env.GARMIN_CONSUMER_KEY!,
    process.env.GARMIN_CONSUMER_SECRET!,
    token,
    tokenSecret
  );

  const response = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!response.ok) throw new Error(`Garmin API error: ${response.statusText}`);
  return response.json();
}

export async function fetchGarminDailySummaries(
  token: string,
  tokenSecret: string,
  startTime: number,
  endTime: number
): Promise<GarminDailySummary[]> {
  const url = `${GARMIN_API_BASE}/wellness-api/rest/dailies?uploadStartTimeInSeconds=${startTime}&uploadEndTimeInSeconds=${endTime}`;
  
  const authHeader = generateOAuthHeader(
    'GET',
    url.split('?')[0],
    process.env.GARMIN_CONSUMER_KEY!,
    process.env.GARMIN_CONSUMER_SECRET!,
    token,
    tokenSecret
  );

  const response = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!response.ok) throw new Error(`Garmin API error: ${response.statusText}`);
  return response.json();
}

export async function fetchGarminSleep(
  token: string,
  tokenSecret: string,
  startTime: number,
  endTime: number
): Promise<GarminSleep[]> {
  const url = `${GARMIN_API_BASE}/wellness-api/rest/sleeps?uploadStartTimeInSeconds=${startTime}&uploadEndTimeInSeconds=${endTime}`;
  
  const authHeader = generateOAuthHeader(
    'GET',
    url.split('?')[0],
    process.env.GARMIN_CONSUMER_KEY!,
    process.env.GARMIN_CONSUMER_SECRET!,
    token,
    tokenSecret
  );

  const response = await fetch(url, {
    headers: { Authorization: authHeader },
  });

  if (!response.ok) throw new Error(`Garmin API error: ${response.statusText}`);
  return response.json();
}

export function getGarminAuthUrl(requestToken: string): string {
  return `https://connect.garmin.com/oauthConfirm?oauth_token=${requestToken}`;
}
