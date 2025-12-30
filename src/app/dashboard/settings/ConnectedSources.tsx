'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';
import { Check, Link2, ExternalLink, Copy, RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface ProviderConnection {
  provider: string;
  isPrimary: boolean;
  syncStatus: string;
  lastSyncAt: string | null;
  externalUserId: string | null;
}

interface ConnectedSourcesProps {
  apiKey: string | null;
}

const PROVIDERS = [
  { 
    id: 'strava', 
    name: 'Strava', 
    color: 'bg-orange-500', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
      </svg>
    ),
    type: 'oauth',
    available: true,
    isPrimaryLogin: true, // Can't disconnect - it's the login provider
  },
  { 
    id: 'garmin', 
    name: 'Garmin Connect', 
    color: 'bg-blue-600', 
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.523 0-10-4.477-10-10S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-18c-4.411 0-8 3.589-8 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8z"/>
      </svg>
    ),
    type: 'oauth',
    available: true,
  },
  { 
    id: 'oura', 
    name: 'Oura Ring', 
    color: 'bg-purple-600', 
    icon: <span className="text-lg font-bold">◎</span>,
    type: 'oauth',
    available: true,
  },
  { 
    id: 'whoop', 
    name: 'WHOOP', 
    color: 'bg-teal-600', 
    icon: <span className="text-lg font-bold">W</span>,
    type: 'oauth',
    available: true,
  },
  { 
    id: 'fitbit', 
    name: 'Fitbit', 
    color: 'bg-cyan-500', 
    icon: <span className="text-lg font-bold">F</span>,
    type: 'oauth',
    available: true,
  },
  { 
    id: 'polar', 
    name: 'Polar', 
    color: 'bg-red-600', 
    icon: <span className="text-lg font-bold">P</span>,
    type: 'oauth',
    available: true,
  },
  { 
    id: 'coros', 
    name: 'COROS', 
    color: 'bg-emerald-600', 
    icon: <span className="text-lg font-bold">C</span>,
    type: 'oauth',
    available: true,
  },
  { 
    id: 'apple_health', 
    name: 'Apple Health', 
    color: 'bg-red-500', 
    icon: <span className="text-lg font-bold">♥</span>,
    type: 'webhook',
    available: true,
  },
  { 
    id: 'google_fit', 
    name: 'Google Fit', 
    color: 'bg-green-500', 
    icon: <span className="text-lg font-bold">G</span>,
    type: 'webhook',
    available: true,
  },
];

export default function ConnectedSources({ apiKey: initialApiKey }: ConnectedSourcesProps) {
  const { showToast } = useToast();
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [generating, setGenerating] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [showWebhookGuide, setShowWebhookGuide] = useState<'apple_health' | 'google_fit' | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const res = await fetch('/api/provider-connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (error) {
      console.error('Failed to load connections:', error);
    }
  };

  const generateApiKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/user/api-key', { method: 'POST' });
      const data = await res.json();
      if (data.apiKey) {
        setApiKey(data.apiKey);
        showToast('API Key generated!', 'success');
      }
    } catch (error) {
      showToast('Failed to generate API key', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
  };

  const connectProvider = (providerId: string) => {
    if (providerId === 'strava') return; // Already connected via login
    setConnecting(providerId);
    // Redirect to OAuth flow
    window.location.href = `/api/oauth/connect?provider=${providerId}`;
  };

  const getConnectionStatus = (providerId: string) => {
    return connections.find(c => c.provider === providerId);
  };

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhooks/ingest`
    : '/api/webhooks/ingest';

  return (
    <div className="space-y-8">
      {/* OAuth Providers Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Connected Sources</h3>
        </div>
        <p className="text-sm text-zinc-500">
          Connect your fitness devices and apps to sync all your training data.
        </p>

        <div className="grid gap-3">
          {PROVIDERS.filter(p => p.type === 'oauth').map(provider => {
            const connection = getConnectionStatus(provider.id);
            const isConnected = !!connection;

            return (
              <div 
                key={provider.id}
                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                  isConnected 
                    ? 'bg-zinc-900/80 border-zinc-700' 
                    : 'bg-zinc-900/40 border-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl ${provider.color} flex items-center justify-center text-white`}>
                    {provider.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{provider.name}</span>
                      {connection?.isPrimary && (
                        <span className="text-[10px] bg-orange-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                          Primary
                        </span>
                      )}
                    </div>
                    {isConnected && (
                      <p className="text-xs text-zinc-500">
                        {connection.syncStatus === 'synced' ? 'Last sync: ' : 'Status: '}
                        {connection.lastSyncAt 
                          ? new Date(connection.lastSyncAt).toLocaleDateString() 
                          : connection.syncStatus}
                      </p>
                    )}
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">Connected</span>
                  </div>
                ) : provider.available ? (
                  <button 
                    onClick={() => connectProvider(provider.id)}
                    disabled={connecting === provider.id}
                    className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                  >
                    {connecting === provider.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    Connect
                  </button>
                ) : (
                  <span className="text-xs text-zinc-600 font-medium">Coming Soon</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Webhook / Bridge Apps Section */}
      <div className="space-y-4 pt-6 border-t border-zinc-800">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">Manual Data Import</h3>
        </div>
        <p className="text-sm text-zinc-500">
          For Apple Health and Google Fit, use a third-party exporter app to send data to QT.
        </p>

        {/* API Key Section */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Your API Key</span>
            {!apiKey && (
              <button
                onClick={generateApiKey}
                disabled={generating}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Generate Key
              </button>
            )}
          </div>
          
          {apiKey ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 overflow-hidden text-ellipsis">
                {apiKey}
              </code>
              <button
                onClick={() => copyToClipboard(apiKey)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                <Copy className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Generate an API key to enable manual data import.</p>
          )}
        </div>

        {/* Webhook URL */}
        {apiKey && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-3">
            <span className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Webhook URL</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-zinc-300 overflow-hidden text-ellipsis">
                {webhookUrl}
              </code>
              <button
                onClick={() => copyToClipboard(webhookUrl)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
              >
                <Copy className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </div>
        )}

        {/* Bridge Apps */}
        <div className="grid gap-3">
          {PROVIDERS.filter(p => p.type === 'webhook').map(provider => (
            <div 
              key={provider.id}
              className="flex items-center justify-between p-4 rounded-xl border bg-zinc-900/40 border-zinc-800/50"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${provider.color} flex items-center justify-center text-white`}>
                  {provider.icon}
                </div>
                <div>
                  <span className="font-bold text-white">{provider.name}</span>
                  <p className="text-xs text-zinc-500">Requires bridge app</p>
                </div>
              </div>

              <button 
                onClick={() => setShowWebhookGuide(provider.id as 'apple_health' | 'google_fit')}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-all"
              >
                Setup Guide
              </button>
            </div>
          ))}
        </div>

        {/* Setup Guide Modal */}
        {showWebhookGuide && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {showWebhookGuide === 'apple_health' ? 'Apple Health' : 'Google Fit'} Setup
                </h3>
                <button 
                  onClick={() => setShowWebhookGuide(null)}
                  className="text-zinc-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">
                  {showWebhookGuide === 'apple_health' 
                    ? 'Apple Health data lives on your phone. You need a bridge app to send it to QT.'
                    : 'Google Fit (Health Connect) data is on-device. Use a bridge app to export it.'}
                </p>
              </div>

              <ol className="space-y-3 text-sm text-zinc-300">
                <li className="flex gap-3">
                  <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                  <span>
                    {showWebhookGuide === 'apple_health' 
                      ? 'Download "Health Auto Export" from the App Store (~$5).'
                      : 'Download "Health Connect Exports" from GitHub or Play Store.'}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                  <span>Open the app and go to Settings → REST API / Webhook.</span>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                  <div className="space-y-2">
                    <span>Enter your Webhook URL:</span>
                    <code className="block bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono break-all">
                      {webhookUrl}
                    </code>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
                  <div className="space-y-2">
                    <span>Add header: <code className="bg-zinc-800 px-1 rounded">X-API-Key</code> with value:</span>
                    <code className="block bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-mono break-all">
                      {apiKey || '(Generate an API key first)'}
                    </code>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
                  <span>Enable automatic sync. Your workouts will now appear in QT!</span>
                </li>
              </ol>

              <button
                onClick={() => setShowWebhookGuide(null)}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
