import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type DailyRecord = Record<string, Array<number | string | null> | string | number>;

function meanMemberSeries(daily: DailyRecord, base: string, length: number) {
  const exact = daily[base];
  if (Array.isArray(exact)) return exact.map(v => typeof v === 'number' ? v : null);
  const memberKeys = Object.keys(daily).filter(k => k.startsWith(`${base}_member`));
  if (!memberKeys.length) return Array(length).fill(null);
  return Array.from({ length }, (_, i) => {
    const vals = memberKeys
      .map(k => (daily[k] as Array<number | null>)[i])
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    return vals.length ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
  });
}

function modeMemberSeries(daily: DailyRecord, base: string, length: number) {
  const exact = daily[base];
  if (Array.isArray(exact)) return exact.map(v => typeof v === 'number' ? v : null);
  const memberKeys = Object.keys(daily).filter(k => k.startsWith(`${base}_member`));
  return Array.from({ length }, (_, i) => {
    const counts = new Map<number, number>();
    memberKeys.forEach(k => {
      const v = (daily[k] as Array<number | null>)[i];
      if (typeof v === 'number') counts.set(v, (counts.get(v) ?? 0) + 1);
    });
    let best: number | null = null, n = -1;
    counts.forEach((count, value) => { if (count > n) { n = count; best = value; } });
    return best;
  });
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lon = Number(req.nextUrl.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const url = new URL('https://seasonal-api.open-meteo.com/v1/seasonal');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '32');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,wind_speed_10m_max');

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Extended ${res.status}`);
    const raw = await res.json();
    const daily = raw.daily as DailyRecord;
    const time = Array.isArray(daily?.time) ? daily.time as string[] : [];
    const length = time.length;
    return NextResponse.json({
      source: 'ECMWF EC46 ensemble via Open-Meteo',
      disclaimer: 'Extended-range ensemble guidance is lower-resolution and should be interpreted probabilistically, not as a precise local daily forecast.',
      daily: {
        time,
        temperature_2m_max: meanMemberSeries(daily, 'temperature_2m_max', length),
        temperature_2m_min: meanMemberSeries(daily, 'temperature_2m_min', length),
        precipitation_sum: meanMemberSeries(daily, 'precipitation_sum', length),
        weather_code: modeMemberSeries(daily, 'weather_code', length),
        wind_speed_10m_max: meanMemberSeries(daily, 'wind_speed_10m_max', length),
      }
    }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600' } });
  } catch {
    return NextResponse.json({ source: 'unavailable', daily: { time: [] } }, { status: 200 });
  }
}
