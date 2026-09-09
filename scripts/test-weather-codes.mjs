import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source = await fs.readFile(new URL('../lib/weather.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { weatherLabel } = await import(moduleUrl);

assert.equal(weatherLabel(0), 'Clear');
assert.equal(weatherLabel(45), 'Fog');
for (const code of [80, 81, 82]) assert.equal(weatherLabel(code), 'Showers', `WMO ${code}`);
for (const code of [71, 73, 75, 77, 85, 86]) assert.equal(weatherLabel(code), 'Snow', `WMO ${code}`);
for (const code of [51, 53, 55, 56, 57, 61, 63, 65, 66, 67]) assert.equal(weatherLabel(code), 'Rain', `WMO ${code}`);
for (const code of [95, 96, 99]) assert.equal(weatherLabel(code), 'Thunderstorms', `WMO ${code}`);

console.log('weather-code labels: ok');
