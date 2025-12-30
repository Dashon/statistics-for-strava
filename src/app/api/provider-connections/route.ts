import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { providerConnection } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const connections = await db.query.providerConnection.findMany({
    where: eq(providerConnection.userId, (session as any).userId as string),
  });

  // Always include Strava as connected (since they logged in with it)
  const stravaConnection = connections.find(c => c.provider === 'strava');
  if (!stravaConnection) {
    // Strava is implicitly connected via login
    connections.push({
      id: 'strava-implicit',
      userId: (session as any).userId as string,
      provider: 'strava',
      isPrimary: true,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
      externalUserId: null,
      scopes: null,
      metadata: null,
      lastSyncAt: new Date().toISOString(),
      syncStatus: 'synced',
      syncError: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json({ connections });
}
