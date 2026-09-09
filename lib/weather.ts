export type Location = { name: string; admin1?: string; country?: string; latitude: number; longitude: number };
export type Plan = {
  id: string;
  name: string;
  date: string;
  startTime?: string;
  endTime?: string;
  activity: string;
  minTemp: number;
  maxTemp: number;
  maxWind: number;
  rainThreshold: number;
  location: Location;
  notes?: string;
  weatherSensitive?: boolean;
};

export type NwsAlert = { id: string; properties: { event?: string; headline?: string; description?: string; instruction?: string; severity?: string; urgency?: string; certainty?: string; effective?: string; expires?: string; areaDesc?: string } };

export const ACTIVITY_PRESETS: Record<string, { label: string; minTemp: number; maxTemp: number; maxWind: number; rainThreshold: number; minHours: number }> = {
  general: { label: 'General outdoor', minTemp: 45, maxTemp: 92, maxWind: 25, rainThreshold: 50, minHours: 2 },
  baseball: { label: 'Baseball / softball', minTemp: 45, maxTemp: 92, maxWind: 25, rainThreshold: 35, minHours: 3 },
  soccer: { label: 'Soccer', minTemp: 40, maxTemp: 94, maxWind: 30, rainThreshold: 45, minHours: 2 },
  wedding: { label: 'Outdoor wedding', minTemp: 55, maxTemp: 88, maxWind: 18, rainThreshold: 25, minHours: 4 },
  grilling: { label: 'Cookout / grilling', minTemp: 45, maxTemp: 95, maxWind: 22, rainThreshold: 35, minHours: 3 },
  fishing: { label: 'Fishing', minTemp: 38, maxTemp: 92, maxWind: 20, rainThreshold: 55, minHours: 4 },
  hiking: { label: 'Hiking', minTemp: 35, maxTemp: 90, maxWind: 28, rainThreshold: 45, minHours: 3 },
  mowing: { label: 'Mowing / yard work', minTemp: 45, maxTemp: 94, maxWind: 24, rainThreshold: 25, minHours: 3 },
  farming: { label: 'Farm work', minTemp: 32, maxTemp: 96, maxWind: 28, rainThreshold: 35, minHours: 4 },
  construction: { label: 'Roofing / construction', minTemp: 35, maxTemp: 95, maxWind: 20, rainThreshold: 20, minHours: 4 },
  pool: { label: 'Pool / water day', minTemp: 72, maxTemp: 100, maxWind: 22, rainThreshold: 35, minHours: 3 },
};

export function weatherLabel(code = 0) {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if (code >= 95) return 'Thunderstorms';
  if ([80, 81, 82].includes(code)) return 'Showers';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if (code >= 51 && code <= 67) return 'Rain';
  return 'Mixed weather';
}

export function formatDay(value: string, long = false) {
  const d = new Date(`${value}T12:00:00`);
  return d.toLocaleDateString([], long ? { weekday: 'long', month: 'short', day: 'numeric' } : { weekday: 'short', month: 'numeric', day: 'numeric' });
}

export function fmtTemp(v: number | null | undefined) { return typeof v === 'number' ? `${Math.round(v)}°` : '—'; }
export function fmtNum(v: number | null | undefined, suffix = '') { return typeof v === 'number' ? `${Math.round(v)}${suffix}` : '—'; }

export function riskForPlan(plan: Plan, weather: any, extended: any) {
  const idx = weather?.daily?.time?.indexOf(plan.date) ?? -1;
  const extIdx = extended?.daily?.time?.indexOf(plan.date) ?? -1;
  const source = idx >= 0 ? weather.daily : extIdx >= 0 ? extended.daily : null;
  const i = idx >= 0 ? idx : extIdx;
  if (!source || i < 0) return { level: 'unknown', label: 'Too far out', reasons: ['No model guidance yet'], metrics: null };
  const high = source.temperature_2m_max?.[i];
  const low = source.temperature_2m_min?.[i];
  const rain = source.precipitation_probability_max?.[i] ?? (typeof source.precipitation_sum?.[i] === 'number' ? Math.min(90, source.precipitation_sum[i] * 35) : 0);
  const wind = source.wind_speed_10m_max?.[i] ?? 0;
  const snowfall = source.snowfall_sum?.[i] ?? 0;
  const reasons: string[] = [];
  let points = 0;
  if (rain >= plan.rainThreshold) { points += 2; reasons.push(`${Math.round(rain)}% rain risk`); }
  if (wind >= plan.maxWind) { points += 2; reasons.push(`${Math.round(wind)} mph wind`); }
  if (typeof high === 'number' && high > plan.maxTemp) { points += 1; reasons.push(`High near ${Math.round(high)}°`); }
  if (typeof low === 'number' && low < plan.minTemp) { points += 1; reasons.push(`Low near ${Math.round(low)}°`); }
  if (snowfall > 0.1) { points += 2; reasons.push(`${snowfall.toFixed(1)} in snow possible`); }
  if (!reasons.length) reasons.push('Conditions are within your limits');
  return { ...(points >= 3 ? { level: 'bad', label: 'Weather risk' } : points > 0 ? { level: 'watch', label: 'Keep watching' } : { level: 'good', label: 'Looks good' }), reasons, metrics: { high, low, rain, wind, snowfall } };
}

export function bestOutdoorWindow(weather: any, presetKey = 'general') {
  const p = ACTIVITY_PRESETS[presetKey] || ACTIVITY_PRESETS.general;
  const t: string[] = weather?.hourly?.time || [];
  if (!t.length) return null;
  const now = Date.now();
  const candidates = t.map((time, i) => ({
    time, i,
    temp: weather.hourly.temperature_2m?.[i],
    rain: weather.hourly.precipitation_probability?.[i] ?? 0,
    wind: weather.hourly.wind_speed_10m?.[i] ?? 0,
    code: weather.hourly.weather_code?.[i] ?? 0,
  })).filter(x => new Date(x.time).getTime() >= now - 30 * 60 * 1000 && new Date(x.time).getTime() <= now + 72 * 3600 * 1000);

  const good = (x: any) => x.temp >= p.minTemp && x.temp <= p.maxTemp && x.rain < p.rainThreshold && x.wind < p.maxWind && x.code < 95;
  let best: any[] = [], current: any[] = [];
  for (const x of candidates) {
    if (good(x)) { current.push(x); if (current.length > best.length) best = [...current]; }
    else current = [];
  }
  if (!best.length) return null;
  const slice = best.slice(0, Math.max(p.minHours, Math.min(6, best.length)));
  return { start: slice[0].time, end: slice[slice.length - 1].time, hours: slice.length, avgRain: slice.reduce((a,b)=>a+b.rain,0)/slice.length, avgWind: slice.reduce((a,b)=>a+b.wind,0)/slice.length, activity: p.label };
}

export function rainTiming(weather: any) {
  const t: string[] = weather?.hourly?.time || [];
  const p: number[] = weather?.hourly?.precipitation_probability || [];
  const a: number[] = weather?.hourly?.precipitation || [];
  const now = Date.now();
  const start = t.findIndex(x => new Date(x).getTime() >= now - 30 * 60 * 1000);
  if (start < 0) return null;
  const wet = (i: number) => (p[i] ?? 0) >= 45 || (a[i] ?? 0) >= 0.01;
  const currentlyWet = wet(start);
  let change = -1;
  for (let i = start + 1; i < Math.min(t.length, start + 18); i++) { if (wet(i) !== currentlyWet) { change = i; break; } }
  if (change < 0) return { kind: currentlyWet ? 'continuing' : 'dry', label: currentlyWet ? 'Rain may continue for several hours' : 'No meaningful rain signal in the next 18 hours' };
  const when = new Date(t[change]);
  const mins = Math.max(0, Math.round((when.getTime() - now) / 60000));
  return { kind: currentlyWet ? 'stopping' : 'starting', label: `${currentlyWet ? 'Rain may ease' : 'Rain may begin'} in about ${mins < 90 ? `${mins} min` : `${Math.round(mins/60)} hr`}`, time: t[change] };
}

export function hazardSummary(weather: any, air: any) {
  const snow = weather?.daily?.snowfall_sum?.[0] ?? 0;
  const low = weather?.daily?.temperature_2m_min?.[0];
  const precip = weather?.daily?.precipitation_sum?.[0] ?? 0;
  const freeze = typeof low === 'number' && low <= 32 && precip > 0.02;
  const smoke = air?.current?.pm2_5 >= 35 || air?.current?.us_aqi >= 101;
  return { snow, freeze, smoke };
}

export function encodeShare(plan: Plan) {
  if (typeof window === 'undefined') return '';
  const payload = JSON.stringify({ v: 1, plan });
  return btoa(unescape(encodeURIComponent(payload))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function decodeShare(token: string): Plan | null {
  try {
    const pad = token.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - token.length % 4) % 4);
    const json = decodeURIComponent(escape(atob(pad)));
    return JSON.parse(json).plan as Plan;
  } catch { return null; }
}
