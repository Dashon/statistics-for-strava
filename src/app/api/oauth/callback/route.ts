import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { providerConnection } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { 
  exchangeOuraCode,
  exchangeWhoopCode,
  exchangeFitbitCode,
  exchangePolarCode, registerPolarUser,
  exchangeCorosCode,
  exchangeGarminToken,
} from '@/lib/providers';

// OAuth callback handler for all providers
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const oauthToken = req.nextUrl.searchParams.get('oauth_token'); // For Garmin
  const oauthVerifier = req.nextUrl.searchParams.get('oauth_verifier'); // For Garmin
  const error = req.nextUrl.searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, req.url));
  }

  const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/oauth/callback`;

  try {
    let provider: string;
    let userId: string;
    let tokens: any;
    let externalUserId: string | null = null;

    // Handle Garmin OAuth 1.0a
    if (oauthToken && oauthVerifier) {
      const garminState = req.cookies.get('garmin_state')?.value;
      const tokenSecret = req.cookies.get('garmin_token_secret')?.value;
      
      if (!garminState || !tokenSecret) {
        throw new Error('Missing Garmin OAuth state');
      }

      [provider, userId] = garminState.split(':');
      tokens = await exchangeGarminToken(oauthToken, oauthVerifier, tokenSecret);
      
      // Clear cookies
      const response = await saveConnection(provider, userId, tokens, null, req);
      response.cookies.delete('garmin_state');
      response.cookies.delete('garmin_token_secret');
      return response;
    }

    // Handle OAuth 2.0 providers
    if (!code || !state) {
      throw new Error('Missing code or state');
    }

    [provider, userId] = state.split(':');

    switch (provider) {
      case 'oura':
        tokens = await exchangeOuraCode(code, redirectUri);
        break;
      case 'whoop':
        tokens = await exchangeWhoopCode(code, redirectUri);
        break;
      case 'fitbit':
        tokens = await exchangeFitbitCode(code, redirectUri);
        externalUserId = tokens.user_id;
        break;
      case 'polar':
        tokens = await exchangePolarCode(code, redirectUri);
        externalUserId = tokens.x_user_id?.toString();
        // Register user in Polar AccessLink
        try {
          await registerPolarUser(tokens.access_token);
        } catch (e) {
          // User might already be registered
        }
        break;
      case 'coros':
        tokens = await exchangeCorosCode(code, redirectUri);
        externalUserId = tokens.openId;
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    return await saveConnection(provider, userId, tokens, externalUserId, req);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }
}

async function saveConnection(
  provider: string,
  userId: string,
  tokens: any,
  externalUserId: string | null,
  req: NextRequest
): Promise<NextResponse> {
  const now = new Date().toISOString();
  const expiresAt = tokens.expires_in 
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null;

  // Check for existing connection
  const existing = await db.query.providerConnection.findFirst({
    where: and(
      eq(providerConnection.userId, userId),
      eq(providerConnection.provider, provider)
    ),
  });

  const connectionData = {
    userId,
    provider,
    accessToken: tokens.access_token || tokens.oauth_token,
    refreshToken: tokens.refresh_token || tokens.oauth_token_secret,
    tokenExpiresAt: expiresAt,
    externalUserId,
    syncStatus: 'pending',
    updatedAt: now,
  };

  if (existing) {
    await db.update(providerConnection)
      .set(connectionData)
      .where(eq(providerConnection.id, existing.id));
  } else {
    await db.insert(providerConnection).values({
      id: nanoid(),
      ...connectionData,
      isPrimary: false,
      createdAt: now,
    });
  }

  return NextResponse.redirect(
    new URL(`/dashboard/settings?connected=${provider}`, req.url)
  );
}
