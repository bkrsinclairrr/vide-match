import assert from 'node:assert/strict'
import {pathToFileURL} from 'node:url'
import {randomUUID} from 'node:crypto'
const origin=process.env.SITE_TEST_ORIGIN
if(!origin||!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('SITE_TEST_ORIGIN must be explicitly local')
if(!process.env.PLAYWRIGHT_MODULE)throw Error('PLAYWRIGHT_MODULE is required; no product dependency is added')
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser=await chromium.launch({headless:true})
const base={name:'Synthetic João',age:'16',height:'170',weight:'60',preferredFoot:'Direito',email:'qa-browser@example.invalid',phone:'(11) 99999-0000',nationality:'Brasil',position:'Goleiro',state:'São Paulo',city:'Original',photo:'',category:'Sub 16',hasDualCitizenship:'Não',dualCitizenshipCountry:''}
async function pending(page){return page.evaluate(()=>new Promise((resolve,reject)=>{const r=indexedDB.open('zyron-funnel-captures',1);r.onsuccess=()=>{const db=r.result;const q=db.transaction('captures').objectStore('captures').getAll();q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=reject};r.onerror=reject}))}
try{
 for(const prefix of ['/avaliacao','/jogador']){
  const context=await browser.newContext();const page=await context.newPage();const calls=[];let offline=false;const leadId=randomUUID();let rev=0;let previous=''
  await context.addInitScript(player=>{sessionStorage.setItem('playerData',JSON.stringify(player));sessionStorage.setItem('jogador_access_granted','true');sessionStorage.setItem('zyron_client_ip','192.0.2.1');sessionStorage.setItem('zyron:utmify-attribution',JSON.stringify({utm_source:'test',utm_medium:'form',utm_campaign:'campaign',utm_content:'content',utm_term:'term',fbclid:'fb',gclid:'g',ttclid:'tt'}))},base)
  await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin===origin)return route.continue();if(u.hostname==='mehmqibxzxfqdxqjnjad.supabase.co'){
   if(u.pathname.endsWith('/rpc/capture_funnel_lead_v2')){if(offline)return route.abort('internetdisconnected');const body=route.request().postDataJSON();calls.push(body);const serialized=JSON.stringify(body);if(previous!==serialized){rev++;previous=serialized}return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({lead_id:leadId,source_revision:rev})})}
   return route.fulfill({status:200,contentType:'application/json',body:u.pathname.includes('client-ip')?'{"ip":"192.0.2.1"}':'[]'})
  }return route.fulfill({status:200,contentType:'application/json',body:'[]'})})
  await page.goto(origin+prefix+'/perfil');await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.getByRole('button',{name:'Continuar',exact:true}).click()
  await page.getByText('Sua nacionalidade',{exact:true}).waitFor();assert.equal(calls.length,1,(await page.locator('body').innerText()).slice(-1500));assert.equal(calls[0].p_profile.city,'Original')
  for(let n=0;n<3;n++)await page.getByRole('button',{name:'Continuar',exact:true}).click()
  await page.getByPlaceholder('Sua cidade').fill('São Paulo Final')
  await page.getByRole('button',{name:'Enviar meu vídeo',exact:true}).click();await page.waitForURL('**'+prefix+'/upload')
  assert.equal(calls.length,2,'final profile was skipped after the initial contact succeeded');assert.equal(calls[1].p_profile.city,'São Paulo Final');assert.equal(Object.keys(calls[1].p_profile).length,15);assert.equal(Object.keys(calls[1].p_attribution).length,8)
  // Call the real capture module and actual IndexedDB while its network boundary fails.
  offline=true
  const failed=await page.evaluate(async()=>{const f=await import('/src/lib/funnel.ts');try{await f.syncFunnelLead({...f.loadPlayerData(),city:'Offline updated'});return false}catch{return true}})
  assert.equal(failed,true);assert.equal((await pending(page)).length,1)
  offline=false;await page.evaluate(()=>window.dispatchEvent(new Event('online')))
  await page.waitForFunction(()=>document.querySelector('[role="status"]')===null);assert.equal((await pending(page)).length,0);assert.equal(calls.at(-1).p_profile.city,'Offline updated')
  const before=calls.length
  await page.goto(origin+prefix+'/resultado');await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.endsWith('/rpc/capture_funnel_lead_v2')))
  // Wait for the response, not the animated report reveal.
  await page.waitForFunction(()=>new Promise(resolve=>{const r=indexedDB.open('zyron-funnel-captures');r.onsuccess=()=>{const db=r.result;const q=db.transaction('captures').objectStore('captures').count();q.onsuccess=()=>{db.close();resolve(q.result===0)}}}))
  assert.ok(calls.length>before);assert.equal(calls.at(-1).p_report.method,'deterministic-profile-v1');assert.equal(calls.at(-1).p_report.stats.length,10)
  const report=JSON.stringify(calls.at(-1).p_report);await page.reload();await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.endsWith('/rpc/capture_funnel_lead_v2')));assert.equal(JSON.stringify(calls.at(-1).p_report),report)
  await context.close();console.log('PASS:',prefix,'initial + final capture, IndexedDB offline recovery and existing report')
 }
}finally{await browser.close()}
