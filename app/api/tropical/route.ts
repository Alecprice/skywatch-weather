import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await fetch('https://www.nhc.noaa.gov/CurrentStorms.json', { headers: { 'User-Agent': 'SkyWatch Weather App' }, next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`NHC ${res.status}`);
    const data = await res.json();
    const storms = Array.isArray(data?.activeStorms) ? data.activeStorms : Array.isArray(data?.storms) ? data.storms : Array.isArray(data) ? data : [];
    return NextResponse.json({ source: 'NOAA National Hurricane Center', storms, raw: storms.length ? undefined : data }, { headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=600' } });
  } catch { return NextResponse.json({ source: 'NOAA National Hurricane Center', storms: [], unavailable: true }); }
}
