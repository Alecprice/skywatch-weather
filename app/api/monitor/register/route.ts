import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { setMonitor, getMonitor } from '@/lib/serverStore';
import { validateMonitorRegistration } from '@/lib/monitorRegistration';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  let input:unknown;
  try{input=await req.json();}catch{return NextResponse.json({error:'invalid_json'},{status:400});}
  const registration=validateMonitorRegistration(input);
  if(!registration.ok)return NextResponse.json({error:registration.error},{status:400});
  const id=registration.monitorId||randomUUID();
  const current=await getMonitor(id)||{};
  await setMonitor(id,{...current,...registration.body,monitorId:id,updatedAt:new Date().toISOString()});
  return NextResponse.json({ok:true,monitorId:id});
}
