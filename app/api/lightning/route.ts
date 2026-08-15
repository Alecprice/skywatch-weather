import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lon = Number(req.nextUrl.searchParams.get('lon'));
  const feed = process.env.LIGHTNING_FEED_URL;
  if (feed && Number.isFinite(lat) && Number.isFinite(lon)) {
    try {
      const url = new URL(feed); url.searchParams.set('lat', String(lat)); url.searchParams.set('lon', String(lon));
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) return NextResponse.json({ configured: true, ...(await res.json()) });
    } catch {}
  }
  return NextResponse.json({ configured: false, strikes: [], message: 'Configure LIGHTNING_FEED_URL for verified real-time lightning-strike proximity data.' });
}
