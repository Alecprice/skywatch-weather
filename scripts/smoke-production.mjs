#!/usr/bin/env node
import process from 'node:process';

const rawBase = process.argv[2] || process.env.SKYWATCH_PRODUCTION_URL || 'https://skywatch-weather-blue.vercel.app';
const base = rawBase.replace(/\/+$/, '');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);
const failures = [];

function pass(message) { console.log(`PASS: ${message}`); }
function fail(message) { failures.push(message); console.error(`FAIL: ${message}`); }

async function get(path, { expectJson = false } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${base}${path}`, {
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'user-agent': 'SkyWatchProductionSmoke/1.0' },
    });
    const body = expectJson ? await response.json().catch(() => null) : await response.text();
    return { response, body };
  } finally {
    clearTimeout(timer);
  }
}

async function check() {
  console.log(`SkyWatch production smoke: ${base}`);

  try {
    const { response, body } = await get('/');
    if (response.ok && typeof body === 'string' && /SkyWatch/i.test(body)) pass('root app shell is reachable');
    else fail(`root app shell invalid (${response.status})`);
  } catch (error) { fail(`root app shell request failed: ${error.message}`); }

  try {
    const { response, body } = await get('/api/health', { expectJson: true });
    if (response.ok && body?.ok === true && body?.app === 'skywatch-weather' && typeof body?.version === 'string') {
      pass(`health identity is valid (version ${body.version}, commit ${body.commit || 'unavailable'})`);
    } else fail(`health identity invalid (${response.status})`);
  } catch (error) { fail(`health request failed: ${error.message}`); }

  for (const [path, label, marker] of [
    ['/manifest.webmanifest', 'PWA manifest', 'SkyWatch'],
    ['/sw.js', 'service worker', 'addEventListener'],
  ]) {
    try {
      const { response, body } = await get(path);
      if (response.ok && typeof body === 'string' && body.includes(marker)) pass(`${label} is reachable`);
      else fail(`${label} invalid (${response.status})`);
    } catch (error) { fail(`${label} request failed: ${error.message}`); }
  }

  try {
    const { response, body } = await get('/api/config', { expectJson: true });
    if (response.ok && body && typeof body === 'object') pass('public runtime config endpoint is reachable');
    else fail(`runtime config invalid (${response.status})`);
  } catch (error) { fail(`runtime config request failed: ${error.message}`); }

  if (failures.length) {
    console.error(`\nSkyWatch production smoke FAILED with ${failures.length} problem(s).`);
    process.exit(1);
  }
  console.log('\nSkyWatch production smoke PASSED.');
}

await check();
