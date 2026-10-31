import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
/** Local CommonJS bundle: module scopes stay isolated when future plots reuse helper names. */
export function bundleScheduling(){
 const root=path.resolve('src/修仙状态栏/plotScheduling'),modules=[],ids=new Map();
 function visit(file){
  file=path.resolve(file);if(!file.endsWith('.ts'))file+='.ts';
  if(ids.has(file))return ids.get(file);
  const id=modules.length;ids.set(file,id);modules.push('');
  let js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,removeComments:true}}).outputText;
  js=js.replace(/require\("([^"]+)"\)/g,(_,ref)=>{if(!ref.startsWith('.'))throw Error('Nonlocal scheduler dependency '+ref);return `load(${visit(path.resolve(path.dirname(file),ref))})`;});
  modules[id]=`function(module,exports){${js}\n}`;return id;
 }
 const core=visit(root+'/core.ts'),registry=visit(root+'/registry.ts');
 return `const plotRuntime = (()=>{const modules=[${modules.join(',\n')}],cache={};function load(id){if(cache[id])return cache[id].exports;const module={exports:{}};cache[id]=module;modules[id](module,module.exports);return module.exports;}return {...load(${core}),...load(${registry})};})();\n`;
}
