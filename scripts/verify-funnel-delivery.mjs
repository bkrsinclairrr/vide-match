import test from 'node:test'
import assert from 'node:assert/strict'
import {createHmac,randomUUID} from 'node:crypto'
import {loadFunnelModule} from './helpers/funnel-edge-harness.mjs'
const url='https://mbzwchnxtskysqplqiyy.supabase.co/functions/v1/site-lead-receiver',secret='synthetic-shared-secret'
const event=()=>({schema_version:1,event_id:randomUUID(),source_project:'mehmqibxzxfqdxqjnjad',source_lead_id:randomUUID(),source_revision:2,generated_at:'2026-10-13T12:30:45Z',source_updated_at:'2026-10-13T12:31:01Z',payload:{contact:{name:'João ⚽'}}})
const ack=e=>({event_id:e.event_id,source_lead_id:e.source_lead_id,source_revision:e.source_revision,receipt_id:randomUUID(),status:'pending_review'})
async function setup({network,events=[event()],rpcError,extraEnv,clock}={}){
 const acked=[],failed=[];let claims=0
 const rows=events.map(e=>({event_id:e.event_id,source_lead_id:e.source_lead_id,source_revision:e.source_revision,event:e,claim_token:randomUUID(),attempts:3}))
 const admin={async rpc(name,args){if(name==='funnel_outbox_claim'){claims++;return {data:rows}}if(name==='funnel_outbox_ack'){if(rpcError)return {error:{code:'40001'}};acked.push(args);return {data:null}}if(name==='funnel_outbox_fail'){failed.push(args);return {data:null}}if(name==='funnel_outbox_health')return {data:{schema_version:1,kind:'heartbeat',source_project:'mehmqibxzxfqdxqjnjad',observed_at:new Date().toISOString(),pending_count:rows.length,quarantined_count:0,oldest_pending_at:null}};throw Error(name)}}
 const requests=[];const fetch=async(input,init)=>{requests.push({input,init});const body=JSON.parse(init.body);if(body.kind==='heartbeat')return Response.json({ok:true});return network?network(body,init):Response.json(ack(body))}
 const {exports}=await loadFunnelModule('_shared/funnel-lead-delivery.ts',{admin,fetch,extraEnv,clock});return {deliver:options=>exports.deliverFunnelEvents(admin,{receiverUrl:url,sharedSecret:secret,deadlineMs:45000,...options}),acked,failed,requests,get claims(){return claims}}
}
test('delivers raw Unicode signatures and stores the complete matching receipt',async()=>{
 const s=await setup();const result=await s.deliver();assert.equal(result.delivered,1);assert.equal(s.acked.length,1)
 for(const {input,init} of s.requests){assert.equal(input,url);const ts=init.headers['x-site-timestamp'];assert.equal(init.headers['x-site-signature'],'sha256='+createHmac('sha256',secret).update(ts+'.'+init.body).digest('hex'))}
 assert.equal(s.acked[0].p_receipt.status,'pending_review')
})
for(const [label,network,code] of [
 ['503',async()=>new Response('',{status:503}),'http_503'],
 ['timeout',async()=>{throw new DOMException('timeout','TimeoutError')},'network_timeout'],
 ['lost response',async()=>{throw Error('response lost')},'network_error'],
 ['wrong ACK',async e=>Response.json({...ack(e),source_revision:99}),'invalid_receipt'],
 ['identity conflict',async()=>new Response('',{status:409}),'identity_conflict'],
])test(label+' leaves an immutable event retryable',async()=>{const s=await setup({network});const r=await s.deliver();assert.equal(s.acked.length,0);assert.equal(s.failed.length,1);assert.equal(s.failed[0].p_code,code);assert.equal(r.delivered,0);assert.ok(Date.parse(s.failed[0].p_retry_at)>Date.now());assert.ok(Date.parse(s.failed[0].p_retry_at)<=Date.now()+3600000)})
test('lost ACK replay preserves exact event identity and body',async()=>{
 const e=event();const a=await setup({events:[e],network:async()=>{throw Error('lost')}});await a.deliver();const b=await setup({events:[e]});await b.deliver();assert.equal(a.requests[0].init.body,b.requests[0].init.body);assert.equal(b.acked[0].p_event,e.event_id)
})
test('stale lease acknowledgement is never counted as delivery',async()=>{const s=await setup({rpcError:true});const r=await s.deliver();assert.equal(r.delivered,0);assert.equal(s.acked.length,0)})
test('oversized media and missing configuration retain a visible blocked event',async()=>{
 const e=event();e.payload.photo='⚽'.repeat(6*1024*1024);const large=await setup({events:[e]});assert.equal((await large.deliver()).blocked,1);assert.equal(large.failed[0].p_code,'body_limit');assert.equal(large.acked.length,0)
 const missing=await setup();assert.equal((await missing.deliver({sharedSecret:''})).blocked,1);assert.equal(missing.failed[0].p_code,'configuration');assert.equal(missing.requests.length,0)
 const ssrf=await setup();assert.equal((await ssrf.deliver({receiverUrl:'https://evil.invalid'})).blocked,1);assert.equal(ssrf.requests.length,0)
})
test('deadline stops work, so remaining claims can expire and resume',async()=>{
 class Clock extends Date{static tick=0;static now(){return Date.now()+(Clock.tick++===0?0:60000)}}
 const s=await setup({events:[event(),event()],clock:Clock});const r=await s.deliver();assert.equal(r.delivered,0);assert.equal(s.acked.length,0)
})
test('worker requires its own cron secret before accessing contacts',async()=>{
 let calls=0;const {handler}=await loadFunnelModule('funnel-lead-delivery/index.ts',{admin:{rpc(){calls++;throw Error('unexpected')}},fetch:async()=>Response.json({ok:true})})
 assert.equal((await handler(new Request('https://worker.invalid',{method:'POST'}))).status,403);assert.equal(calls,0)
 const missing=await loadFunnelModule('funnel-lead-delivery/index.ts',{extraEnv:{SITE_BRIDGE_CRON_SECRET:''}});assert.equal((await missing.handler(new Request('https://worker.invalid',{method:'POST'}))).status,503)
})
