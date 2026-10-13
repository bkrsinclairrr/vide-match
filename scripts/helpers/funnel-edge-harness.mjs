import {readFileSync} from 'node:fs'
import {dirname,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import vm from 'node:vm'
import ts from 'typescript'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../supabase/functions')
export async function loadFunnelModule(path,{admin,fetch,extraEnv={},clock=Date}={}){
 let handler
 const env={SUPABASE_URL:'https://mehmqibxzxfqdxqjnjad.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'synthetic-key',SITE_BRIDGE_SHARED_SECRET:'synthetic-shared-secret',SITE_BRIDGE_CRON_SECRET:'synthetic-cron-secret',...extraEnv}
 const context=vm.createContext({URL,Request,Response,TextEncoder,TextDecoder,crypto,fetch,AbortController,AbortSignal,setTimeout,clearTimeout,Date:clock,console:{log(){},error(){}},Deno:{env:{get:k=>env[k]},serve:f=>{handler=f}},__admin:admin})
 const cache=new Map()
 function moduleFor(filename){if(cache.has(filename))return cache.get(filename);const code=filename.startsWith('https:')?'export function createClient(){return globalThis.__admin}':ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;const mod=new vm.SourceTextModule(code,{context,identifier:filename});cache.set(filename,mod);return mod}
 const mod=moduleFor(resolve(root,path));await mod.link((spec,parent)=>moduleFor(spec.startsWith('https:')?spec:resolve(dirname(parent.identifier),spec)));await mod.evaluate();return {exports:mod.namespace,handler}
}
