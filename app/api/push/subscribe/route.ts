import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getMonitor, setMonitor } from '@/lib/serverStore';
import { validatePushSubscriptionRegistration } from '@/lib/monitorRegistration';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  let input:unknown;
  try{input=await req.json();}catch{return NextResponse.json({error:'invalid_json'},{status:400});}
  const validation=validatePushSubscriptionRegistration(input);
  if(!validation.ok)return NextResponse.json({error:validation.error},{status:400});
  const id=validation.monitorId||createHash('sha256').update(validation.subscription.endpoint).digest('hex').slice(0,32);
  const existing=await getMonitor(id)||{};
  await setMonitor(id,{...existing,monitorId:id,subscription:validation.subscription,updatedAt:new Date().toISOString()});
  return NextResponse.json({ok:true,monitorId:id,pushConfigured:Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY)});
}
