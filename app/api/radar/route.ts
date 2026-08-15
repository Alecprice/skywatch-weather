import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('Radar metadata unavailable');
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } });
  } catch {
    return NextResponse.json({ host: '', radar: { past: [] } });
  }
}
