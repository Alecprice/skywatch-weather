const MONITOR_ID_PATTERN=/^(?:[0-9a-fA-F]{32}|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$/;

export type MonitorRegistrationValidation =
  | {ok:true;body:Record<string,unknown>;monitorId?:string}
  | {ok:false;error:'body_must_be_object'|'invalid_monitor_id'};

export function validateMonitorRegistration(input:unknown):MonitorRegistrationValidation{
  if(input===null||typeof input!=='object'||Array.isArray(input))return{ok:false,error:'body_must_be_object'};
  const body=input as Record<string,unknown>;
  if(Object.hasOwn(body,'monitorId')){
    if(typeof body.monitorId!=='string'||!MONITOR_ID_PATTERN.test(body.monitorId))return{ok:false,error:'invalid_monitor_id'};
    return{ok:true,body,monitorId:body.monitorId};
  }
  return{ok:true,body};
}
