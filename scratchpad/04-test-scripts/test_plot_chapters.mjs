import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { bundleScheduling } from './plot_bundle.mjs';
const require=createRequire(import.meta.url),_=require('lodash'),{z}=require('zod'),YAML=require('yaml');
const root='../Cultivation-Card-Game/';
const runtime=vm.runInNewContext(bundleScheduling()+'plotRuntime');
const plots=runtime.registeredPlots;
const paths=['南疆/五毒教/梦茧.txt','南疆/五毒教/五毒教圣女.txt','开局剧情/[开局]五毒教-万毒祖窟.txt'];
const books=paths.map(p=>fs.readFileSync(root+'世界书/事件/凡界/'+p,'utf8'));
const common=fs.readFileSync(root+'世界书/事件/[公共]统一剧情调度.txt','utf8');
export async function render(source,data){let code='let out="";\n',end=0;for(const m of source.matchAll(/<%([_=-]?)([\s\S]*?)_?%>/g)){code+=`out+=${JSON.stringify(source.slice(end,m.index))};\n`;code+=['-','='].includes(m[1])?`out+=(${m[2]});\n`:m[2]+'\n';end=m.index+m[0].length;}code+=`out+=${JSON.stringify(source.slice(end))};return out;`;return new (Object.getPrototypeOf(async function(){}).constructor)('getMessageVar','getwi',code)((p,o={})=>_.get({stat_data:data},p,o.defaults),async name=>{assert.equal(name,'[公共]统一剧情调度');return render(common,data);});}
const base=()=>({身份:['五毒教长老'],地点:{世界:'凡界',地域:'南疆',具体地点:'五毒教神木殿'},修炼进度:{境界:'炼气后期',当前进度:85,进度上限:100},历练:{},事件:{聚焦模式:'自动',标题:'',阶段:'',开启:false,已完成事件:[]},__custom_start__:{story:'story-wudu-init'},关系列表:{蓝幽月:{好感度:100}}});
let checks=0;function check(value,label){assert.ok(value,label);checks++;}
const decide=d=>runtime.dispatchPlots(d,'故意不匹配关键词',plots,runtime.registeredDaily);
let d=base();const copy=JSON.stringify(d);decide(d);check(JSON.stringify(d)===copy,'dispatch pure');
d.事件.聚焦模式='暂停';check(decide(d).candidates.length===0,'pause yields no candidates');for(const b of books)check(!(await render(b,d)).includes('<event>'),'paused book empty');
d=base();delete d.__custom_start__;d.物品={'噬心蛊经':{数量:1}};check(!decide(d).candidates.some(c=>c.title.startsWith('万毒')),'item cannot authorize special start');
for(const p of plots){
 for(const c of p.chapters){
  d=base();d.历练[p.name]={类别:'剧情',阶段:c.name,幕次:c.name,本幕进行中:true,分支:'归元'};Object.assign(d.事件,{标题:p.name,阶段:c.name,开启:true});
  check(decide(d).candidates.length===1 && decide(d).candidates[0].phase===c.name,'active chapter exclusive '+p.name+c.name);
  const out=await render(books[plots.indexOf(p)],d);
  check((out.match(/<event>/g)||[]).length===1,'one story reading scope');
  const panels=[...out.matchAll(/<task_info>\s*\n([\s\S]*?)<\/task_info>/g)].filter(m=>m[1].trimStart().split(/\r?\n/)[0]===p.name);
  check(panels.length===0,'one opening panel example per chapter '+p.name+c.name+' count='+panels.length);
 }
}
for(const p of plots)for(let i=0;i<p.chapters.length;i++){
 d=base();d.修炼进度.境界=p.name==='梦茧'&&i<2?'炼气后期':'化神初期';
 if(i)d.历练[p.name]={类别:'剧情',阶段:p.chapters[i-1].name,本幕进行中:false,分支:p.name==='梦茧'?'归元':'压制魔性'};
 const out=await render(books[plots.indexOf(p)],d);
 const panels=[...out.matchAll(/<task_info>\s*\n([\s\S]*?)<\/task_info>/g)].filter(m=>m[1].trimStart().split(/\r?\n/)[0]===p.name);
 check(panels.length===(p.name.startsWith('万毒')&&i===0?0:1),'eligible opening supplies one full panel example '+p.name+p.chapters[i].name);
}
d=base();d.修炼进度.境界='炼气初期';d.历练['万毒祖窟·噬心蛊鸣']={类别:'剧情',阶段:'第一幕',本幕进行中:false};let ancestor=decide(d).candidates.find(c=>c.title.startsWith('万毒'));
check(ancestor.phase==='第二幕'&&!ancestor.eligible,'wait for foundation');check(!(await render(books[2],d)).includes('群蛊'),'unqualified next chapter body hidden');
d.修炼进度.境界='筑基初期';check(decide(d).candidates.find(c=>c.title.startsWith('万毒')).eligible,'next chapter hard gate');
d.事件.已完成事件=['万毒祖窟·噬心蛊鸣'];check(!decide(d).candidates.some(c=>c.title.startsWith('万毒')),'completed cannot reopen');
d=base();d.历练.梦茧={类别:'剧情',阶段:'未知',本幕进行中:true};check(decide(d).diagnostics.some(s=>s.includes('未知幕次')),'unknown chapter diagnostic');
check(JSON.stringify(runtime.dispatchPlots(base(),'',plots).candidates)===JSON.stringify(runtime.dispatchPlots(base(),'',plots.slice().reverse()).candidates),'deterministic order');
assert.throws(()=>runtime.validatePlotRegistry([...plots,plots[0]]));checks++;
// Cross-region existing saint chapter remains visible; scene and response are decided by AI.
d=base();d.地点={地域:'中原',具体地点:'山路'};d.修炼进度.境界='金丹初期';d.历练[plots[1].name]={类别:'剧情',阶段:'第二幕',本幕进行中:false};check(decide(d).candidates.some(c=>c.title===plots[1].name&&c.phase==='第三幕'),'cross-region call candidate');
const rules=fs.readFileSync(root+'世界书/变量/[mvu_update]变量更新规则.yaml','utf8');check(Boolean(YAML.parse(await render(rules,base()),{maxAliasCount:-1})),'variable rules render valid YAML');await render(rules+'\n'+rules,base());checks++;
const script=fs.readFileSync(root+'脚本/变量结构.js','utf8').replace(/^import .*;\r?\n/,'').replace('export const Schema','const Schema');
const context=vm.createContext({_,z,$:()=>{},console});vm.runInContext(script,context);
const sync=(value,old)=>{context.value=value;context.old=old;vm.runInContext('syncFocusedPlotIndex(value,old)',context);return value.stat_data;};
d=base();let old=structuredClone(d);d.历练.梦茧={类别:'剧情',阶段:'第一幕',本幕进行中:true};let got=sync({stat_data:d},{stat_data:old});check(got.事件.标题==='梦茧'&&got.事件.聚焦模式==='自动','autofocus without manual mode');
old=structuredClone(d);d.历练.梦茧.本幕进行中=false;got=sync({stat_data:d},{stat_data:old});check(got.事件.标题===''&&!got.事件.开启&&got.历练.梦茧.阶段==='第一幕','chapter end releases focus without progressing');
d=base();d.事件.聚焦模式='暂停';old=structuredClone(d);d.事件.聚焦模式='自动';d.历练.梦茧={类别:'剧情',阶段:'第一幕',本幕进行中:true};got=sync({stat_data:d},{stat_data:old});check(got.事件.聚焦模式==='暂停'&&!got.历练.梦茧,'model cannot override pause');
d=base();d.事件.聚焦模式='手动';d.事件.标题='梦茧';d.历练.梦茧={类别:'剧情',阶段:'第一幕',本幕进行中:false};old=structuredClone(d);d.历练[plots[1].name]={类别:'剧情',阶段:'第一幕',本幕进行中:true};got=sync({stat_data:d},{stat_data:old});check(got.事件.标题==='梦茧'&&got.事件.聚焦模式==='手动','other first appearance does not override manual waiting selection');
// Reject skipping a chapter or starting the next one in the same update that ends the current one.
d=base();old=structuredClone(d);d.历练.梦茧={类别:'剧情',阶段:'第三幕',本幕进行中:true};got=sync({stat_data:d},{stat_data:old});check(!got.历练.梦茧,'cannot create a later chapter');
d=base();d.历练.梦茧={类别:'剧情',阶段:'第一幕',本幕进行中:true};old=structuredClone(d);d.历练.梦茧.阶段='第二幕';got=sync({stat_data:d},{stat_data:old});check(got.历练.梦茧.阶段==='第一幕','cannot close and advance in one update');
d.历练.梦茧.本幕进行中=false;old=structuredClone(d);d.历练.梦茧={类别:'剧情',阶段:'第二幕',本幕进行中:true};got=sync({stat_data:d},{stat_data:old});check(got.历练.梦茧.阶段==='第二幕','next chapter may begin after intermission');
d=base();d.事件.聚焦模式='暂停';d.历练.梦茧={类别:'剧情',阶段:'第一幕',本幕进行中:true,进展:'原进展'};old=structuredClone(d);delete d.历练.梦茧;d.事件.已完成事件=['梦茧'];got=sync({stat_data:d},{stat_data:old});check(got.历练.梦茧.进展==='原进展'&&!got.事件.已完成事件.includes('梦茧'),'pause restores deleted plot and completion record');
d=base();d.事件.聚焦模式='手动';d.事件.标题='梦茧';d.历练.梦茧={类别:'剧情',阶段:'第一幕',本幕进行中:true};old=structuredClone(d);d.历练.梦茧.本幕进行中=false;got=sync({stat_data:d},{stat_data:old});check(got.事件.聚焦模式==='自动'&&!got.事件.标题,'manual active chapter end returns to freedom');
context.input={历练:{梦茧:{类别:'剧情',阶段:'第一幕',本幕进行中:true,分支:'归元'}}};const parsed=vm.runInContext('Schema.parse(input)',context);check(parsed.历练.梦茧.本幕进行中===true&&parsed.历练.梦茧.分支==='归元','script schema retains chapter fields');
console.log('PASS '+checks+' chapter eligibility, EJS, schema, focus and pause checks. These do not validate AI narrative decisions.');
