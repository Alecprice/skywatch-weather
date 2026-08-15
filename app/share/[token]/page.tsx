'use client';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ACTIVITY_PRESETS, Plan, decodeShare, fmtNum, fmtTemp, formatDay, riskForPlan } from '@/lib/weather';

export default function SharedPlanPage(){
  const params=useParams<{token:string}>(); const [plan,setPlan]=useState<Plan|null>(null); const [weather,setWeather]=useState<any>(null); const [error,setError]=useState('');
  useEffect(()=>{const p=decodeShare(String(params.token||''));setPlan(p);if(!p){setError('This shared event link is invalid.');return;}fetch(`/api/weather?lat=${p.location.latitude}&lon=${p.location.longitude}`).then(r=>r.json()).then(setWeather).catch(()=>setError('Weather data is unavailable.'));},[params.token]);
  if(error)return <main className="share-shell"><div className="share-card"><span className="brand-mark">S</span><h1>SkyWatch shared plan</h1><p>{error}</p></div></main>;
  if(!plan||!weather)return <main className="share-shell"><div className="share-card"><div className="spinner"/><p>Loading shared weather plan…</p></div></main>;
  const risk:any=riskForPlan(plan,weather,null);const idx=weather.daily?.time?.indexOf(plan.date)??-1;
  return <main className="share-shell"><article className="share-card"><div className="share-brand"><span className="brand-mark">S</span><div><b>SkyWatch</b><small>Shared outdoor plan</small></div></div><span className="eyebrow">{ACTIVITY_PRESETS[plan.activity]?.label||plan.activity}</span><h1>{plan.name}</h1><p>{formatDay(plan.date,true)}{plan.startTime?` · ${plan.startTime}${plan.endTime?`–${plan.endTime}`:''}`:''} · {plan.location.name}{plan.location.admin1?`, ${plan.location.admin1}`:''}</p><div className={`shared-risk ${risk.level}`}><span>{risk.label}</span><div>{risk.reasons.join(' · ')}</div></div>{idx>=0&&<div className="share-weather-grid"><div><span>High / low</span><b>{fmtTemp(weather.daily.temperature_2m_max[idx])} / {fmtTemp(weather.daily.temperature_2m_min[idx])}</b></div><div><span>Rain chance</span><b>{fmtNum(weather.daily.precipitation_probability_max[idx],'%')}</b></div><div><span>Max wind</span><b>{fmtNum(weather.daily.wind_speed_10m_max[idx],' mph')}</b></div></div>}<small className="share-disclaimer">This status uses the latest available forecast and can change. Follow official emergency alerts and instructions.</small></article></main>;
}
