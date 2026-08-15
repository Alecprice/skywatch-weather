import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { setMonitor, getMonitor } from '@/lib/serverStore';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = body?.monitorId || randomUUID();
  const current = await getMonitor(id) || {};
  await setMonitor(id, { ...current, ...body, monitorId: id, updatedAt: new Date().toISOString() });
  return NextResponse.json({ ok: true, monitorId: id });
}
