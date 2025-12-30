import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function GET() {
  const session = await auth();
  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.userId, (session as any).userId as string),
  });

  return NextResponse.json({ apiKey: userData?.apiKey || null });
}

export async function POST() {
  const session = await auth();
  if (!(session as any)?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Generate a new API key
  const apiKey = `qt_${nanoid(32)}`;

  await db.update(user)
    .set({ 
      apiKey,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(user.userId, (session as any).userId as string));

  return NextResponse.json({ apiKey });
}
