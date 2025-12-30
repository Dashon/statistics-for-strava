import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { providerConnection } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { 
  getOuraAuthUrl, exchangeOuraCode,
  getWhoopAuthUrl, exchangeWhoopCode,
  getFitbitAuthUrl, exchangeFitbitCode,
  getPolarAuthUrl, exchangePolarCode, registerPolarUser,
  getCorosAuthUrl, exchangeCorosCode,
  getGarminRequestToken, getGarminAuthUrl,
} from '@/lib/providers';

const PROVIDERS_WITH_OAUTH2 = ['oura', 'whoop', 'fitbit', 'polar', 'coros'] as const;

// GET: Initiate OAuth flow for a provider
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!(session as any)?.userId) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const provider = req.nextUrl.searchParams.get('provider');
  if (!provider) {
    return NextResponse.json({ error: 'Missing provider' }, { status: 400 });
  }

  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/oauth/callback`;
  const state = `${provider}:${(session as any).userId}:${nanoid(8)}`;

  let authUrl: string;

  try {
    switch (provider) {
      case 'oura':
        authUrl = getOuraAuthUrl(redirectUri, state);
        break;
      case 'whoop':
        authUrl = getWhoopAuthUrl(redirectUri, state);
        break;
      case 'fitbit':
        authUrl = getFitbitAuthUrl(redirectUri, state);
        break;
      case 'polar':
        authUrl = getPolarAuthUrl(redirectUri, state);
        break;
      case 'coros':
        authUrl = getCorosAuthUrl(redirectUri, state);
        break;
      case 'garmin':
        // Garmin uses OAuth 1.0a - need request token first
        const requestToken = await getGarminRequestToken(redirectUri);
        // Store token secret in session/cookie for callback
        const response = NextResponse.redirect(getGarminAuthUrl(requestToken.oauth_token));
        response.cookies.set('garmin_token_secret', requestToken.oauth_token_secret, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 600, // 10 minutes
        });
        response.cookies.set('garmin_state', state, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 600,
        });
        return response;
      default:
        return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
    }

    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error(`OAuth init error for ${provider}:`, error);
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, req.url));
  }
}
