import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getMonitor, setMonitor } from '@/lib/serverStore';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body?.subscription?.endpoint) return NextResponse.json({ error: 'Missing push subscription' }, { status: 400 });
  const id = body.monitorId || createHash('sha256').update(body.subscription.endpoint).digest('hex').slice(0,32);
  const existing = await getMonitor(id) || {};
  await setMonitor(id, { ...existing, monitorId:id, subscription: body.subscription, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, monitorId: id, pushConfigured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) });
}
