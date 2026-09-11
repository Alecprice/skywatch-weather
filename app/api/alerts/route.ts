import { NextRequest, NextResponse } from 'next/server';
import { parseForecastCoordinates } from '@/lib/coordinatePolicy';
import { createWeatherProviderSignal } from '@/lib/providerFetchPolicy';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const coordinates = parseForecastCoordinates(
    req.nextUrl.searchParams.get('lat'),
    req.nextUrl.searchParams.get('lon'),
  );
  if (!coordinates) return NextResponse.json({ features: [] });
  const { lat, lon } = coordinates;

  const url = new URL('https://api.weather.gov/alerts/active');
  url.searchParams.set('point', `${lat.toFixed(4)},${lon.toFixed(4)}`);

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/geo+json',
        'User-Agent': 'SkyWatch Weather App (weather-app-demo)'
      },
      signal: createWeatherProviderSignal(),
      next: { revalidate: 60 }
    });
    if (!res.ok) return NextResponse.json({ features: [], unsupported: true });
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' } });
  } catch {
    return NextResponse.json({ features: [] });
  }
}
