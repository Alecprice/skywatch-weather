import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

function std(values: number[]) {
  if (values.length < 2) return 0;
  const m = values.reduce((a,b)=>a+b,0)/values.length;
  return Math.sqrt(values.reduce((a,b)=>a+(b-m)*(b-m),0)/values.length);
}

export async function GET(req: NextRequest) {
  const lat = Number(req.nextUrl.searchParams.get('lat'));
  const lon = Number(req.nextUrl.searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return NextResponse.json({ days: [] });
  const url = new URL('https://ensemble-api.open-meteo.com/v1/ensemble');
  url.searchParams.set('latitude', String(lat)); url.searchParams.set('longitude', String(lon)); url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7'); url.searchParams.set('temperature_unit', 'fahrenheit'); url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('hourly', 'temperature_2m,precipitation');
  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) throw new Error('ensemble');
    const raw = await res.json();
    const hourly = raw.hourly || {};
    const times: string[] = hourly.time || [];
    const tempKeys = Object.keys(hourly).filter(k => k.startsWith('temperature_2m_') && Array.isArray(hourly[k]));
    const precipKeys = Object.keys(hourly).filter(k => k.startsWith('precipitation_') && Array.isArray(hourly[k]));
    const byDay = new Map<string, { tempSpreads: number[]; precipSpreads: number[] }>();
    times.forEach((t, i) => {
      const day = t.slice(0,10); if (!byDay.has(day)) byDay.set(day, { tempSpreads: [], precipSpreads: [] });
      const tv = tempKeys.map(k => hourly[k][i]).filter((v:any)=>typeof v==='number');
      const pv = precipKeys.map(k => hourly[k][i]).filter((v:any)=>typeof v==='number');
      if (tv.length) byDay.get(day)!.tempSpreads.push(std(tv));
      if (pv.length) byDay.get(day)!.precipSpreads.push(std(pv));
    });
    const days = Array.from(byDay.entries()).map(([date, v], index) => {
      const t = v.tempSpreads.length ? v.tempSpreads.reduce((a,b)=>a+b,0)/v.tempSpreads.length : 2 + index * .8;
      const p = v.precipSpreads.length ? v.precipSpreads.reduce((a,b)=>a+b,0)/v.precipSpreads.length : .03 + index * .02;
      const score = Math.max(25, Math.min(98, Math.round(96 - t*6 - p*55 - index*3)));
      return { date, score, label: score >= 78 ? 'High' : score >= 55 ? 'Medium' : 'Low', temperatureSpread: t, precipitationSpread: p };
    });
    return NextResponse.json({ source: 'Open-Meteo ensemble model spread', days });
  } catch {
    const today = new Date();
    const days = Array.from({length:7},(_,i)=>{const d=new Date(today);d.setDate(d.getDate()+i);const score=Math.max(40,92-i*7);return {date:d.toISOString().slice(0,10),score,label:score>=78?'High':score>=55?'Medium':'Low',fallback:true};});
    return NextResponse.json({ source: 'Horizon-based fallback', days });
  }
}
