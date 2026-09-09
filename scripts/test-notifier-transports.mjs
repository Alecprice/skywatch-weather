import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

let source = await fs.readFile(new URL('../lib/notifier.ts', import.meta.url), 'utf8');
source = source.replace(
  "import webpush from 'web-push';",
  "const webpush = { setVapidDetails() {}, async sendNotification() {} };",
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { dispatchMonitorNotification, sendEmail, sendSms } = await import(moduleUrl);

const originalFetch = globalThis.fetch;
const envKeys = [
  'RESEND_API_KEY', 'ALERT_EMAIL_FROM', 'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER',
];
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

try {
  process.env.RESEND_API_KEY = 'test-resend';
  process.env.ALERT_EMAIL_FROM = 'alerts@example.test';
  process.env.TWILIO_ACCOUNT_SID = 'ACtest';
  process.env.TWILIO_AUTH_TOKEN = 'test-token';
  process.env.TWILIO_FROM_NUMBER = '+15555550100';

  globalThis.fetch = async () => { throw new Error('network unavailable'); };

  assert.deepEqual(
    await sendEmail('fan@example.test', 'Storm update', 'Rain approaching'),
    { ok: false, reason: 'email-transport-failed' },
  );
  assert.deepEqual(
    await sendSms('+15555550101', 'Storm update'),
    { ok: false, reason: 'sms-transport-failed' },
  );

  const result = await dispatchMonitorNotification({
    channels: { push: false, email: true, sms: true },
    email: 'fan@example.test',
    phone: '+15555550101',
    quietHours: { enabled: false },
  }, 'Storm update', 'Rain approaching');
  assert.deepEqual(result.email, { ok: false, reason: 'email-transport-failed' });
  assert.deepEqual(result.sms, { ok: false, reason: 'sms-transport-failed' });

  console.log('notifier transport isolation: ok');
} finally {
  globalThis.fetch = originalFetch;
  for (const key of envKeys) {
    const value = originalEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}
