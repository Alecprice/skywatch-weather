import webpush from 'web-push';

export function withinQuietHours(quiet: any, now = new Date()) {
  if (!quiet?.enabled || !quiet.start || !quiet.end) return false;
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: quiet.timeZone || 'UTC', hour: '2-digit', minute: '2-digit', hour12: false }).format(now).split(':').map(Number);
    const mins = parts[0] * 60 + parts[1];
    const [sh, sm] = String(quiet.start).split(':').map(Number); const [eh, em] = String(quiet.end).split(':').map(Number);
    const s = sh*60+sm, e=eh*60+em;
    return s <= e ? mins >= s && mins < e : mins >= s || mins < e;
  } catch { return false; }
}

export async function sendPush(subscription: any, title: string, body: string, url = '/') {
  if (!subscription || !process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return { ok: false, reason: 'push-not-configured' };
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  try { await webpush.sendNotification(subscription, JSON.stringify({ title, body, url })); return { ok: true }; }
  catch (e:any) { return { ok: false, reason: e?.message || 'push-failed' }; }
}

export async function sendEmail(to: string | undefined, title: string, body: string) {
  if (!to || !process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL_FROM) return { ok:false, reason:'email-not-configured' };
  const res = await fetch('https://api.resend.com/emails', { method:'POST', headers:{ Authorization:`Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type':'application/json' }, body:JSON.stringify({ from:process.env.ALERT_EMAIL_FROM, to:[to], subject:title, text:body }) });
  return { ok: res.ok, reason: res.ok ? undefined : `resend-${res.status}` };
}

export async function sendSms(to: string | undefined, body: string) {
  const sid=process.env.TWILIO_ACCOUNT_SID, token=process.env.TWILIO_AUTH_TOKEN, from=process.env.TWILIO_FROM_NUMBER;
  if (!to || !sid || !token || !from) return { ok:false, reason:'sms-not-configured' };
  const params = new URLSearchParams({ To:to, From:from, Body:body });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, { method:'POST', headers:{ Authorization:`Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type':'application/x-www-form-urlencoded' }, body:params });
  return { ok: res.ok, reason: res.ok ? undefined : `twilio-${res.status}` };
}

export async function dispatchMonitorNotification(monitor:any, title:string, body:string, url='/', critical=false) {
  if (!critical && withinQuietHours(monitor.quietHours)) return { skipped:'quiet-hours' };
  const c = monitor.channels || { push:true };
  const results:any = {};
  if (c.push !== false) results.push = await sendPush(monitor.subscription, title, body, url);
  if (c.email) results.email = await sendEmail(monitor.email, title, body);
  if (c.sms) results.sms = await sendSms(monitor.phone, `${title}: ${body}`.slice(0,1550));
  return results;
}
