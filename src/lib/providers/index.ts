// Provider index - exports all provider utilities
export * from './oura';
export * from './whoop';
export * from './fitbit';
export * from './polar';
export * from './garmin';
export * from './coros';

export type ProviderType = 'strava' | 'garmin' | 'oura' | 'whoop' | 'fitbit' | 'polar' | 'coros' | 'apple_health' | 'google_fit';

export const PROVIDER_CONFIGS: Record<ProviderType, {
  name: string;
  color: string;
  type: 'oauth' | 'oauth1' | 'webhook';
  available: boolean;
  scopes?: string;
}> = {
  strava: { name: 'Strava', color: 'bg-cyan-500', type: 'oauth', available: true },
  garmin: { name: 'Garmin Connect', color: 'bg-blue-600', type: 'oauth1', available: true },
  oura: { name: 'Oura Ring', color: 'bg-purple-600', type: 'oauth', available: true },
  whoop: { name: 'WHOOP', color: 'bg-teal-600', type: 'oauth', available: true },
  fitbit: { name: 'Fitbit', color: 'bg-cyan-500', type: 'oauth', available: true },
  polar: { name: 'Polar', color: 'bg-red-600', type: 'oauth', available: true },
  coros: { name: 'COROS', color: 'bg-green-600', type: 'oauth', available: true },
  apple_health: { name: 'Apple Health', color: 'bg-red-500', type: 'webhook', available: true },
  google_fit: { name: 'Google Fit', color: 'bg-green-500', type: 'webhook', available: true },
};
