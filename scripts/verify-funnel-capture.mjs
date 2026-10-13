import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {createFunnelLoader} from './helpers/funnel-component-harness.mjs'
const stub={'@/integrations/supabase/client':{supabase:{}},'@/lib/utmify':{loadUtmifyAttribution:()=>Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','ttclid'].map(k=>[k,'original '+k]))}}
function memoryStore(){const rows=[];return {rows,async add(input){const row={id:randomUUID(),sequence:rows.length+1,input:structuredClone(input)};rows.push(row);return row},async list(){return [...rows]},async remove(id){const i=rows.findIndex(r=>r.id===id);if(i>=0)rows.splice(i,1)}}}
const ack=()=>({lead_id:'0b894206-a76b-4e58-a937-74da90711947',source_revision:2})
function factory(){return createFunnelLoader(stub)('src/lib/funnel-capture-queue.ts').createFunnelCaptureQueue}
test('queue persists before network and removes only a verified capture',async()=>{
 const store=memoryStore();const q=factory()({store,send:async()=>{assert.equal(store.rows.length,1);return ack()}})
 assert.equal(await q.queue({contact:{email:'a'},profile:{city:'São Paulo'},attribution:{}}),ack().lead_id);assert.equal(store.rows.length,0)
})
test('offline or malformed ACK retains every capture for resumed delivery',async()=>{
 for(const response of [()=>{throw Error('offline')},()=>({lead_id:null,source_revision:0})]){
  const store=memoryStore();let send=response;const q=factory()({store,send:async()=>send()});await assert.rejects(q.queue({contact:{email:'a'},profile:{photo:'original'},attribution:{}}));assert.equal(store.rows.length,1)
  send=ack;await q.flush();assert.equal(store.rows.length,0)
 }
})
test('response for an old capture cannot remove the newer pending profile',async()=>{
 const store=memoryStore();const releases=[];const q=factory()({store,send:()=>new Promise(resolve=>releases.push(()=>resolve(ack())))})
 const old=q.queue({contact:{email:'a'},profile:{city:'old'},attribution:{}});await new Promise(setImmediate)
 const latest=q.queue({contact:{email:'a'},profile:{city:'new'},attribution:{}});await new Promise(setImmediate)
 assert.equal(store.rows.length,2);releases.shift()();await old;await new Promise(setImmediate)
 assert.equal(store.rows.length,1);assert.equal(store.rows[0].input.profile.city,'new');releases.shift()();await latest;assert.equal(store.rows.length,0)
})
test('storage failure requires direct server acknowledgement and exposes durability failure',async()=>{
 const statuses=[];const store={async add(){throw Error('quota')},async list(){return []},async remove(){}};const q=factory()({store,send:async()=>{throw Error('offline')},onStatus:s=>statuses.push(s)})
 await assert.rejects(q.queue({contact:{email:'a'},profile:{},attribution:{}}));assert.ok(statuses.some(s=>s.storageAvailable===false));
 const direct=factory()({store,send:async()=>ack(),onStatus:s=>statuses.push(s)});assert.equal(await direct.queue({contact:{email:'a'},profile:{},attribution:{}}),ack().lead_id)
})
test('initial contact, complete profile and the existing report carry all data without invention',async()=>{
 const sent=[];const load=createFunnelLoader({...stub,'@/lib/funnel-capture-queue':{queueFunnelCapture:async input=>{sent.push(input);return ack().lead_id}}});const f=load('src/lib/funnel.ts')
 const initial={...f.EMPTY_PLAYER,name:'João',email:'QA@example.invalid',phone:'(11) 99999-0000'};await f.syncFunnelLead(initial)
 const complete={...initial,nationality:'Brasil',position:'Meia',city:'São Paulo',state:'SP',photo:'data:image/png;base64,original',hasDualCitizenship:'Sim',dualCitizenshipCountry:'Portugal'}
 await f.syncFunnelLead(complete);const stats=f.buildStats('synthetic');const report={overall:f.overallFrom(stats),stats,method:'deterministic-profile-v1'};await f.syncFunnelLead(complete,report)
 assert.equal(sent.length,3);assert.deepEqual(sent[1].profile,complete);assert.equal(sent[0].profile.city,'');assert.equal(sent[1].contact.email,'qa@example.invalid');assert.equal(sent[1].contact.phone,'11999990000');assert.equal(Object.keys(sent[1].attribution).length,8);assert.deepEqual(sent[2].report,report)
})
