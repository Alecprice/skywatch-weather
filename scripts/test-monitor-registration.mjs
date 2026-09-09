import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source=await fs.readFile(new URL('../lib/monitorRegistration.ts',import.meta.url),'utf8');
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleUrl=`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const {validateMonitorRegistration}=await import(moduleUrl);

const uuid='8c7d8b21-6c2a-4cde-8ac2-24f8d46ce118';
const legacyHash='0123456789abcdef0123456789abcdef';

assert.deepEqual(validateMonitorRegistration({location:{name:'Nashville'}}),{ok:true,body:{location:{name:'Nashville'}}});
assert.deepEqual(validateMonitorRegistration({monitorId:uuid,plans:[]}),{ok:true,body:{monitorId:uuid,plans:[]},monitorId:uuid});
assert.equal(validateMonitorRegistration({monitorId:legacyHash}).ok,true,'existing 32-hex monitor capabilities remain compatible');

for(const input of [null,[],['monitor'],true,42,'monitor']){
  assert.deepEqual(validateMonitorRegistration(input),{ok:false,error:'body_must_be_object'});
}
for(const monitorId of ['', 'short', '../monitor', 'not a monitor id', 42, {}, uuid+'-extra']){
  assert.deepEqual(validateMonitorRegistration({monitorId}),{ok:false,error:'invalid_monitor_id'});
}

const route=await fs.readFile(new URL('../app/api/monitor/register/route.ts',import.meta.url),'utf8');
assert.match(route,/try\{input=await req\.json\(\);\}catch\{return NextResponse\.json\(\{error:'invalid_json'\},\{status:400\}\);\}/);
assert.match(route,/validateMonitorRegistration\(input\)/);

console.log('monitor registration validation: ok');
