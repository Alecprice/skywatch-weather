import { NextRequest, NextResponse } from 'next/server';
import { normalizeGeocodeQuery, normalizeGeocodeResults } from '../../../lib/geocodePolicy';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = normalizeGeocodeQuery(req.nextUrl.searchParams.get('q'));
  if (!q) return NextResponse.json({ results: [] });
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.searchParams.set('name', q);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  try {
    const res = await fetch(url, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(6_000) });
    if (!res.ok) throw new Error(`Geocoder ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ results: normalizeGeocodeResults(data?.results) });
  } catch {
    return NextResponse.json({ results: [] }, { status: 200 });
  }
}
