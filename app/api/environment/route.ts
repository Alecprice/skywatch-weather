import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lon = Number(req.nextUrl.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  const url = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  url.searchParams.set('latitude', String(lat)); url.searchParams.set('longitude', String(lon)); url.searchParams.set('timezone', 'auto'); url.searchParams.set('forecast_days', '5');
  url.searchParams.set('current', 'us_aqi,pm2_5,pm10,ozone,dust,aerosol_optical_depth,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen');
  url.searchParams.set('hourly', 'us_aqi,pm2_5,pm10,ozone,dust,aerosol_optical_depth,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,ragweed_pollen');
  try {
    const res = await fetch(url, { next: { revalidate: 900 } }); if (!res.ok) throw new Error(`AQ ${res.status}`); const data = await res.json();
    const pollenMissing = ['alder_pollen','birch_pollen','grass_pollen','mugwort_pollen','ragweed_pollen'].every(k => typeof data.current?.[k] !== 'number');
    if (pollenMissing && process.env.POLLEN_FEED_URL) {
      try { const purl = new URL(process.env.POLLEN_FEED_URL); purl.searchParams.set('lat',String(lat));purl.searchParams.set('lon',String(lon));const pr=await fetch(purl,{next:{revalidate:1800}});if(pr.ok){const p=await pr.json();data.current={...(data.current||{}),alder_pollen:p.alder_pollen??p.alder,birch_pollen:p.birch_pollen??p.birch,grass_pollen:p.grass_pollen??p.grass,mugwort_pollen:p.mugwort_pollen??p.mugwort,ragweed_pollen:p.ragweed_pollen??p.ragweed};data.pollenSource=p.source||'Configured pollen provider';}} catch {}
    }
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=900' } });
  } catch { return NextResponse.json({ current: null, hourly: null, error: 'Air-quality data unavailable' }); }
}
