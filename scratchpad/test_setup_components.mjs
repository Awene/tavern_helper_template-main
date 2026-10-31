import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc';

function load(file, globals) {
  const source = fs.readFileSync(new URL('../src/shared/' + file, import.meta.url), 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const context = { exports: {}, console, ...globals };
  vm.runInNewContext(output, context);
  return context.exports;
}
const names = ['Gemini','Claude','Glm','DeepSeek'];
let preset = { prompts: names.map((n,i) => ({name:`🔌 ${n}头部`,enabled:i===0})).concat([{name:'unrelated',enabled:true}]), settings:{model:'keep',temperature:0.8} };
const model = load('modelMode.ts', {
  getPreset: () => preset,
  updatePresetWith: async (_, fn) => { preset = fn(structuredClone(preset)); },
});
for(const name of names) {
  await model.applyModelMode(name);
  assert.equal(model.getModelMode(),name);
  assert.equal(preset.prompts.filter(p=>p.name.startsWith('🔌')&&p.enabled).length,1);
  assert.equal(preset.settings.model,'keep');
  assert.ok(preset.prompts.at(-1).enabled);
}
preset.prompts[0].enabled = true;
assert.equal(model.getModelMode(), null);
preset.prompts = preset.prompts.slice(1);
await assert.rejects(model.applyModelMode('Claude'),/缺少模型条目/);

let variablePreset = {prompts:[{name:'🧭变量主API(二选一)',enabled:false},{name:'🧭变量额外API(二选一)',enabled:true}]};
let worldbook = [{name:'[mvu_update]变量输出格式（额外API开）',enabled:true},{name:'[mvu_update]变量输出格式（随主AI输出开）',enabled:false}];
const apiMode = load('apiMode.ts', {
  getPreset:()=>variablePreset, updatePresetWith:async(_,fn)=>{variablePreset=fn(variablePreset);},
  getCharWorldbookNames:()=>({primary:'book',additional:[]}),getWorldbook:async()=>worldbook,
  updateWorldbookWith:async(_,fn)=>{worldbook=fn(worldbook);}, console:{error(){}},
});
assert.ok((await apiMode.applyApiMode('随主API')).ok);
assert.equal(await apiMode.getApiMode(),'随主API');
assert.equal(variablePreset.prompts[0].enabled,true);
assert.equal(worldbook[0].enabled,false);
variablePreset.prompts=[];
assert.equal((await apiMode.applyApiMode('额外API')).ok,false,'incompatible preset never reports success');
assert.equal(worldbook[0].enabled,false,'preflight failure does not change worldbook');

let missing = '', failFetch = false, disabled = false, configVersion = '2026.10.22', ruleCount = 5;
const host = {
  TavernHelper: {}, Mvu: {getMvuData(){},parseMessage(){}},
  EjsTemplate: {getFeatures:()=>({enabled:!disabled})},
  CultivationRuleRouter:{getDiagnostics:()=>({version:'0.19.6',ready:true,enabled:true,books:{book:{rules:ruleCount,metadata:configVersion?{id:'bengexiuxian',version:configVersion}:null},summary:{rules:0,metadata:{id:'bengexiuxian',version:'2026.10.22'}}}})},
  fetch: async url => { if(failFetch) throw Error('offline'); return {ok:true,json:async()=>({version:url.includes('JS-Slash')?'4.9.3':url.includes('ST-Prompt')?'1.17.8.1':'0.19.6'})}; },
};
const check = load('componentCheck.ts', {
  window:{parent:host},AbortSignal,
  isInstalledExtension:id=>id!==missing,
  getPreset:()=>({extensions:{cultivation_card:{id:'bengexiuxian',version:'2026.10.22'}}}),
  getCharWorldbookNames:()=>({primary:'book',additional:['summary']}),
});
assert.equal(check.compareComponentVersion('1.17.10','1.17.8.1'),1);
assert.equal(check.compareComponentVersion('unknown','1.0'),null);
assert.ok((await check.inspectComponents()).every(r=>r.state==='ok'));
ruleCount=0; assert.equal((await check.inspectComponents()).at(-1).state,'warning'); ruleCount=5;
const readyMvu = host.Mvu;
host.Mvu = {};
assert.equal((await check.inspectComponents()).find(r=>r.id==='mvu').state,'warning');
host.Mvu = undefined;
assert.equal((await check.inspectComponents()).find(r=>r.id==='mvu').state,'warning');
host.Mvu = readyMvu;
missing='ST-Prompt-Template'; assert.equal((await check.inspectComponents()).find(r=>r.id===missing).state,'missing'); missing='';
disabled=true; assert.equal((await check.inspectComponents())[1].state,'warning'); disabled=false;
failFetch=true; assert.equal((await check.inspectComponents())[0].state,'unknown'); failFetch=false;
configVersion='2026.10.01'; assert.equal((await check.inspectComponents()).at(-1).state,'warning');
configVersion=''; assert.equal((await check.inspectComponents()).at(-1).state,'warning');

for(const path of ['shared/ComponentCheckPanel.vue','shared/ModelModeControl.vue','自定义开局/steps/StepComponents.vue','自定义开局/steps/StepApiMode.vue','修仙状态栏/pages/SettingsPanel.vue']) {
  const source=fs.readFileSync(new URL('../src/'+path,import.meta.url),'utf8');
  const {descriptor,errors}=parse(source); assert.equal(errors.length,0,path);
  compileScript(descriptor,{id:path});
  const result=compileTemplate({source:descriptor.template.content,filename:path,id:path});
  assert.equal(result.errors.length,0,path);
}
console.log('PASS: four exclusive model profiles, unrelated settings preserved, missing/old/disabled/unknown components, and five Vue templates.');
