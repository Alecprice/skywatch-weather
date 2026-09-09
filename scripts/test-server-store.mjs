import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = path.join(root, 'lib', 'serverStore.ts');
const tempModule = path.join('/tmp', `skywatch-server-store-${process.pid}-${Date.now()}.mjs`);
const devFile = path.join('/tmp', 'skywatch-monitor-store.json');
const source = await fs.readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  fileName: sourcePath,
}).outputText;

const originalFetch = globalThis.fetch;
const originalEnv = {
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
};
let originalDevFile = null;
try { originalDevFile = await fs.readFile(devFile, 'utf8'); } catch {}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

try {
  await fs.writeFile(tempModule, compiled, 'utf8');
  const store = await import(`file://${tempModule}?v=${Date.now()}`);

  process.env.KV_REST_API_URL = 'https://redis.example.test';
  process.env.KV_REST_API_TOKEN = 'test-token';
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  await fs.writeFile(devFile, JSON.stringify({ monitors: { ghost: { source: 'stale-dev' } } }), 'utf8');
  globalThis.fetch = async (_url, options) => {
    const command = JSON.parse(String(options?.body || '[]'));
    const result = command[0] === 'GET' ? null : command[0] === 'SMEMBERS' ? [] : 'OK';
    return new Response(JSON.stringify({ result }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  assert.equal(await store.getMonitor('ghost'), null, 'a configured Redis miss must not fall through to stale /tmp development data');

  globalThis.fetch = async (_url, options) => {
    const command = JSON.parse(String(options?.body || '[]'));
    const result = command[0] === 'GET' ? JSON.stringify({ source: 'redis' }) : 'OK';
    return new Response(JSON.stringify({ result }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  assert.deepEqual(await store.getMonitor('live'), { source: 'redis' }, 'configured Redis values must remain authoritative');

  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  await fs.writeFile(devFile, JSON.stringify({ monitors: { local: { source: 'dev' } } }), 'utf8');
  assert.deepEqual(await store.getMonitor('local'), { source: 'dev' }, 'the /tmp development fallback must still work when Redis is genuinely unconfigured');

  console.log('PASS: SkyWatch server store distinguishes Redis misses from unconfigured development storage.');
} finally {
  globalThis.fetch = originalFetch;
  for (const [name, value] of Object.entries(originalEnv)) restoreEnv(name, value);
  await fs.rm(tempModule, { force: true });
  if (originalDevFile === null) await fs.rm(devFile, { force: true });
  else await fs.writeFile(devFile, originalDevFile, 'utf8');
}
