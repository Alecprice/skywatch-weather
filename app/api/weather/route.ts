import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lon = Number(req.nextUrl.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '16');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('current', [
    'temperature_2m','apparent_temperature','relative_humidity_2m','is_day','precipitation','weather_code','cloud_cover','wind_speed_10m','wind_direction_10m','wind_gusts_10m'
  ].join(','));
  url.searchParams.set('hourly', [
    'temperature_2m','apparent_temperature','relative_humidity_2m','dew_point_2m','precipitation_probability','precipitation','weather_code','visibility','wind_speed_10m','wind_gusts_10m','uv_index'
  ].join(','));
  url.searchParams.set('daily', [
    'weather_code','temperature_2m_max','temperature_2m_min','apparent_temperature_max','apparent_temperature_min','sunrise','sunset','precipitation_probability_max','precipitation_sum','rain_sum','showers_sum','snowfall_sum','wind_speed_10m_max','wind_gusts_10m_max','uv_index_max','daylight_duration'
  ].join(','));

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Forecast ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300' } });
  } catch (error) {
    return NextResponse.json({ error: 'Forecast provider unavailable' }, { status: 502 });
  }
}
