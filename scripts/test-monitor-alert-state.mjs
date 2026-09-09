import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const sourcePath = path.join(root, 'lib', 'monitorAlertState.ts');
const tempModule = path.join('/tmp', `skywatch-monitor-alert-state-${process.pid}-${Date.now()}.mjs`);
const source = await fs.readFile(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  fileName: sourcePath,
}).outputText;

try {
  await fs.writeFile(tempModule, compiled, 'utf8');
  const { severeAlertDelta } = await import(`file://${tempModule}?v=${Date.now()}`);
  const alert = (id, severity = 'Severe') => ({ id, properties: { severity, event: id } });

  let delta = severeAlertDelta([alert('A'), alert('B')], { alertId: 'A' });
  assert.deepEqual(delta.unseen.map((item) => item.id), ['B'], 'legacy single-alert state must not hide a newly active second severe alert');
  assert.deepEqual(delta.activeIds, ['A', 'B']);

  delta = severeAlertDelta([alert('B'), alert('A')], { alertIds: ['A', 'B'] });
  assert.deepEqual(delta.unseen, [], 'reordering the same active alerts must not resend notifications');

  delta = severeAlertDelta([alert('B'), alert('C'), alert('D', 'Moderate')], { alertIds: ['A', 'B'] });
  assert.deepEqual(delta.unseen.map((item) => item.id), ['C'], 'only newly active severe alerts should notify');
  assert.deepEqual(delta.activeIds, ['B', 'C']);

  delta = severeAlertDelta([], { alertIds: ['B', 'C'] });
  assert.deepEqual(delta.activeIds, [], 'cleared alerts must leave no stale active IDs');

  console.log('PASS: SkyWatch severe alert state tracks every active alert without order-dependent misses.');
} finally {
  await fs.rm(tempModule, { force: true });
}
