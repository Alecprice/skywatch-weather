import { NextRequest, NextResponse } from 'next/server';
import { getMonitor } from '@/lib/serverStore';
import { dispatchMonitorNotification } from '@/lib/notifier';
import { validateMonitorRegistration } from '@/lib/monitorRegistration';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  let input:unknown;
  try{input=await req.json();}catch{return NextResponse.json({error:'invalid_json'},{status:400});}
  const validation=validateMonitorRegistration(input);
  if(!validation.ok)return NextResponse.json({error:validation.error},{status:400});
  if(!validation.monitorId)return NextResponse.json({error:'invalid_monitor_id'},{status:400});
  const monitor=await getMonitor(validation.monitorId);
  if(!monitor)return NextResponse.json({error:'Monitor not found'},{status:404});
  return NextResponse.json(await dispatchMonitorNotification(monitor,'SkyWatch test','Your weather alerts are connected.','/'));
}
