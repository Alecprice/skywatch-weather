import { NextRequest, NextResponse } from 'next/server';
import { getMonitor } from '@/lib/serverStore';
import { dispatchMonitorNotification } from '@/lib/notifier';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){const {monitorId}=await req.json();const m=monitorId?await getMonitor(monitorId):null;if(!m)return NextResponse.json({error:'Monitor not found'},{status:404});return NextResponse.json(await dispatchMonitorNotification(m,'SkyWatch test','Your weather alerts are connected.','/'));}
