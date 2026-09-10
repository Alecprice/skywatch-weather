import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = path.join(root, 'lib', 'coordinatePolicy.ts');
const tempModule = path.join('/tmp', `skywatch-coordinate-policy-${process.pid}-${Date.now()}.mjs`);
const source = await fs.readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  fileName: sourcePath,
}).outputText;

try {
  await fs.writeFile(tempModule, compiled, 'utf8');
  const { parseForecastCoordinates } = await import(`file://${tempModule}?v=${Date.now()}`);

  assert.deepEqual(parseForecastCoordinates('36.1632', '-82.831'), { lat: 36.1632, lon: -82.831 });
  assert.deepEqual(parseForecastCoordinates('-90', '180'), { lat: -90, lon: 180 });
  assert.deepEqual(parseForecastCoordinates('90', '-180'), { lat: 90, lon: -180 });

  for (const [lat, lon] of [
    [null, '0'], ['0', null], ['', '0'], ['0', '   '],
    ['91', '0'], ['-91', '0'], ['0', '181'], ['0', '-181'],
    ['NaN', '0'], ['0', 'Infinity'],
  ]) {
    assert.equal(parseForecastCoordinates(lat, lon), null);
  }

  console.log('PASS: SkyWatch forecast coordinates reject missing and out-of-range values.');
} finally {
  await fs.rm(tempModule, { force: true });
}
