import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../app/api/alerts/route.ts',import.meta.url),'utf8');

assert.match(source,/parseForecastCoordinates/,'alerts route must reuse bounded coordinate parsing');
assert.match(source,/createWeatherProviderSignal\(\)/,'alerts route must use the bounded provider signal');
assert.match(source,/status:\s*400/,'invalid coordinates must be rejected at the HTTP boundary');
assert.match(source,/status:\s*502/,'provider transport failures must not masquerade as a successful empty alert set');
assert.doesNotMatch(source,/Number\(req\.nextUrl\.searchParams\.get\('lat'\)\)/,'alerts route must not bypass shared coordinate policy');

console.log('NWS alert route policy contract passed');
