import {createRequire} from 'node:module'
import {readFileSync,existsSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
const require=createRequire(import.meta.url)
export function createFunnelLoader(overrides={}){const cache=new Map();function load(file){let path=resolve(file);if(!existsSync(path))path=['.ts','.tsx'].map(ext=>path+ext).find(existsSync)??path;if(cache.has(path))return cache.get(path).exports;const mod={exports:{}};cache.set(path,mod);const code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const dep=s=>overrides[s]??(s.startsWith('@/')?load(resolve('src',s.slice(2))):s.startsWith('.')?load(resolve(dirname(path),s)):require(s));vm.runInThisContext(`(function(require,module,exports){${code}\n})`,{filename:path})(dep,mod,mod.exports);return mod.exports}return load}
