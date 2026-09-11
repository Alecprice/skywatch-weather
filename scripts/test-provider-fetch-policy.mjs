import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = path.join(root, 'lib', 'providerFetchPolicy.ts');
const weatherRoutePath = path.join(root, 'app', 'api', 'weather', 'route.ts');
const alertsRoutePath = path.join(root, 'app', 'api', 'alerts', 'route.ts');
const tempModule = path.join('/tmp', `skywatch-provider-fetch-${process.pid}-${Date.now()}.mjs`);
const source = await fs.readFile(sourcePath, 'utf8');
const weatherRouteSource = await fs.readFile(weatherRoutePath, 'utf8');
const alertsRouteSource = await fs.readFile(alertsRoutePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  fileName: sourcePath,
}).outputText;

try {
  await fs.writeFile(tempModule, compiled, 'utf8');
  const { WEATHER_PROVIDER_TIMEOUT_MS, createWeatherProviderSignal } = await import(`file://${tempModule}?v=${Date.now()}`);

  assert.equal(WEATHER_PROVIDER_TIMEOUT_MS, 8_000);
  assert.throws(() => createWeatherProviderSignal(0), /positive and finite/);
  assert.throws(() => createWeatherProviderSignal(Number.POSITIVE_INFINITY), /positive and finite/);

  const signal = createWeatherProviderSignal(5);
  assert.equal(signal instanceof AbortSignal, true);
  assert.equal(signal.aborted, false);

  assert.match(weatherRouteSource, /signal:\s*createWeatherProviderSignal\(\)/);
  assert.match(weatherRouteSource, /next:\s*\{\s*revalidate:\s*300\s*\}/);
  assert.match(alertsRouteSource, /signal:\s*createWeatherProviderSignal\(\)/);
  assert.match(alertsRouteSource, /next:\s*\{\s*revalidate:\s*60\s*\}/);

  console.log('PASS: SkyWatch forecast and alert providers use the shared bounded timeout signal.');
} finally {
  await fs.rm(tempModule, { force: true });
}
