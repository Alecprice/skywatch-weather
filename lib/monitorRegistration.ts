const MONITOR_ID_PATTERN=/^(?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/;
const MAX_PUSH_ENDPOINT_LENGTH=4096;
const MAX_PUSH_KEY_LENGTH=1024;

export type MonitorRegistrationValidation =
  | {ok:true;body:Record<string,unknown>;monitorId?:string}
  | {ok:false;error:'body_must_be_object'|'invalid_monitor_id'};

export type PushSubscriptionRegistrationValidation =
  | {ok:true;body:Record<string,unknown>;monitorId?:string;subscription:Record<string,unknown>&{endpoint:string;keys:Record<string,unknown>&{p256dh:string;auth:string}}}
  | {ok:false;error:'body_must_be_object'|'invalid_monitor_id'|'invalid_push_subscription'};

export function validateMonitorRegistration(input:unknown):MonitorRegistrationValidation{
  if(input===null||typeof input!=='object'||Array.isArray(input))return{ok:false,error:'body_must_be_object'};
  const body=input as Record<string,unknown>;
  if(Object.hasOwn(body,'monitorId')){
    if(typeof body.monitorId!=='string'||!MONITOR_ID_PATTERN.test(body.monitorId))return{ok:false,error:'invalid_monitor_id'};
    return{ok:true,body,monitorId:body.monitorId};
  }
  return{ok:true,body};
}

function validPushKey(value:unknown):value is string{
  return typeof value==='string'&&value.length>0&&value.length<=MAX_PUSH_KEY_LENGTH;
}

export function validatePushSubscriptionRegistration(input:unknown):PushSubscriptionRegistrationValidation{
  const registration=validateMonitorRegistration(input);
  if(!registration.ok)return registration;
  const subscription=registration.body.subscription;
  if(subscription===null||typeof subscription!=='object'||Array.isArray(subscription))return{ok:false,error:'invalid_push_subscription'};
  const candidate=subscription as Record<string,unknown>;
  if(typeof candidate.endpoint!=='string'||candidate.endpoint.length===0||candidate.endpoint.length>MAX_PUSH_ENDPOINT_LENGTH)return{ok:false,error:'invalid_push_subscription'};
  try{
    const endpoint=new URL(candidate.endpoint);
    if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password)return{ok:false,error:'invalid_push_subscription'};
  }catch{return{ok:false,error:'invalid_push_subscription'};}
  const keys=candidate.keys;
  if(keys===null||typeof keys!=='object'||Array.isArray(keys))return{ok:false,error:'invalid_push_subscription'};
  const keyRecord=keys as Record<string,unknown>;
  if(!validPushKey(keyRecord.p256dh)||!validPushKey(keyRecord.auth))return{ok:false,error:'invalid_push_subscription'};
  return{
    ok:true,
    body:registration.body,
    ...(registration.monitorId?{monitorId:registration.monitorId}:{}),
    subscription:candidate as Record<string,unknown>&{endpoint:string;keys:Record<string,unknown>&{p256dh:string;auth:string}},
  };
}
