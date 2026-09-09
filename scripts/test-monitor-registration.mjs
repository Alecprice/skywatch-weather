import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const source=await fs.readFile(new URL('../lib/monitorRegistration.ts',import.meta.url),'utf8');
const transpiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const moduleUrl=`data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const {validateMonitorRegistration,validatePushSubscriptionRegistration}=await import(moduleUrl);

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

const subscription={
  endpoint:'https://push.example.test/subscriptions/abc123',
  expirationTime:null,
  keys:{p256dh:'public-key',auth:'auth-secret'},
};
const pushValidation=validatePushSubscriptionRegistration({monitorId:uuid,subscription});
assert.equal(pushValidation.ok,true);
assert.equal(pushValidation.monitorId,uuid);
assert.equal(pushValidation.subscription,subscription,'validated push payload remains unchanged for persistence');
assert.equal(validatePushSubscriptionRegistration({subscription}).ok,true,'server-generated monitor IDs remain supported');

for(const invalid of [
  {},
  {subscription:null},
  {subscription:[]},
  {subscription:{endpoint:'http://push.example.test/a',keys:{p256dh:'key',auth:'auth'}}},
  {subscription:{endpoint:'javascript:alert(1)',keys:{p256dh:'key',auth:'auth'}}},
  {subscription:{endpoint:'https://user:pass@push.example.test/a',keys:{p256dh:'key',auth:'auth'}}},
  {subscription:{endpoint:'https://push.example.test/a'}},
  {subscription:{endpoint:'https://push.example.test/a',keys:[]}},
  {subscription:{endpoint:'https://push.example.test/a',keys:{p256dh:'',auth:'auth'}}},
  {subscription:{endpoint:'https://push.example.test/a',keys:{p256dh:'key',auth:''}}},
]){
  assert.deepEqual(validatePushSubscriptionRegistration(invalid),{ok:false,error:'invalid_push_subscription'});
}
assert.deepEqual(validatePushSubscriptionRegistration({monitorId:'../other',subscription}),{ok:false,error:'invalid_monitor_id'});

const registerRoute=await fs.readFile(new URL('../app/api/monitor/register/route.ts',import.meta.url),'utf8');
assert.match(registerRoute,/try\{input=await req\.json\(\);\}catch\{return NextResponse\.json\(\{error:'invalid_json'\},\{status:400\}\);\}/);
assert.match(registerRoute,/validateMonitorRegistration\(input\)/);

const pushRoute=await fs.readFile(new URL('../app/api/push/subscribe/route.ts',import.meta.url),'utf8');
assert.match(pushRoute,/try\{input=await req\.json\(\);\}catch\{return NextResponse\.json\(\{error:'invalid_json'\},\{status:400\}\);\}/);
assert.match(pushRoute,/validatePushSubscriptionRegistration\(input\)/);
assert.match(pushRoute,/validation\.monitorId\|\|createHash/);
assert.doesNotMatch(pushRoute,/body\.monitorId\s*\|\|/,'unvalidated monitor IDs must not select persistence keys');

console.log('monitor and push registration validation: ok');
