import { promises as fs } from 'fs';
import path from 'path';

const DEV_FILE = path.join('/tmp', 'skywatch-monitor-store.json');

type StoreData = { monitors: Record<string, any> };

async function redis(command: any[]) {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(command), cache: 'no-store' });
  if (!res.ok) throw new Error(`Redis ${res.status}`);
  const data = await res.json();
  return data.result;
}

async function readDev(): Promise<StoreData> {
  try { return JSON.parse(await fs.readFile(DEV_FILE, 'utf8')); } catch { return { monitors: {} }; }
}
async function writeDev(data: StoreData) { await fs.writeFile(DEV_FILE, JSON.stringify(data), 'utf8'); }

export async function setMonitor(id: string, value: any) {
  const r = await redis(['SET', `skywatch:monitor:${id}`, JSON.stringify(value)]);
  if (r !== null) { await redis(['SADD', 'skywatch:monitors', id]); return; }
  const db = await readDev(); db.monitors[id] = value; await writeDev(db);
}
export async function getMonitor(id: string) {
  const r = await redis(['GET', `skywatch:monitor:${id}`]);
  if (r !== null) return typeof r === 'string' ? JSON.parse(r) : null;
  return (await readDev()).monitors[id] || null;
}
export async function listMonitors() {
  const ids = await redis(['SMEMBERS', 'skywatch:monitors']);
  if (ids !== null) return (await Promise.all((ids as string[]).map(async id => ({ id, data: await getMonitor(id) })))).filter(x => x.data);
  const db = await readDev(); return Object.entries(db.monitors).map(([id, data]) => ({ id, data }));
}
