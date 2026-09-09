import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = path.join(root, 'lib', 'geocodePolicy.ts');
const tempModule = path.join('/tmp', `skywatch-geocode-policy-${process.pid}-${Date.now()}.mjs`);
const source = await fs.readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  fileName: sourcePath,
}).outputText;

try {
  await fs.writeFile(tempModule, compiled, 'utf8');
  const { normalizeGeocodeQuery, normalizeGeocodeResults, GEOCODE_POLICY } = await import(`file://${tempModule}?v=${Date.now()}`);

  assert.equal(normalizeGeocodeQuery('  Greeneville, TN  '), 'Greeneville, TN');
  for (const invalid of [null, undefined, 42, '', 'a', ' '.repeat(5), 'x'.repeat(GEOCODE_POLICY.maxQueryLength + 1)]) {
    assert.equal(normalizeGeocodeQuery(invalid), null);
  }

  const rows = Array.from({ length: 12 }, (_, index) => ({ id: index }));
  assert.equal(normalizeGeocodeResults(rows).length, GEOCODE_POLICY.maxResults);
  assert.deepEqual(normalizeGeocodeResults([null, 'bad', [], { id: 1 }, { id: 2 }]), [{ id: 1 }, { id: 2 }]);
  for (const invalid of [null, undefined, {}, 'results']) assert.deepEqual(normalizeGeocodeResults(invalid), []);

  console.log('PASS: SkyWatch geocode policy bounds query and result shapes.');
} finally {
  await fs.rm(tempModule, { force: true });
}
