import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import {bundleScheduling} from './plot_bundle.mjs';
import {render,books,base} from './test_plot_modes.mjs';
const {dispatchPlots,validatePlotRegistry,registeredPlots,registeredDaily}=vm.runInNewContext(bundleScheduling()+'plotRuntime');
const entries=registeredPlots.map(p=>p.entry);
let checks=0;
function check(test,msg){assert.ok(test,msg);checks++;}
const clone=()=>structuredClone(base),ancestor='万毒祖窟·噬心蛊鸣',saint='五毒圣女·幽月情缘';
const run=(d,a='',p=registeredPlots,dy=registeredDaily,e)=>dispatchPlots(d,a,p,dy,e);
function freeze(obj){if(obj&&typeof obj==='object'){Object.freeze(obj);Object.values(obj).forEach(freeze);}return obj;}
let d=clone();d.地点.具体地点='五毒教百草瘴药圃';d.修炼进度.境界='筑基初期';d.历练[saint]={类别:'剧情',阶段:'同行_确认朋友'};d.事件={聚焦模式:'自动',标题:saint,进度:{[saint]:{待回应:true}},已完成事件:[]};
const saved=JSON.stringify(d);check(run(freeze(d),'我接过她的灵糖，回答她的问题').kind==='respond','筑基可回应初识，不要求金丹');check(JSON.stringify(d)===saved,'调度不改变量');
const output=await render(books[1],d,'我接过她的灵糖，回答她的问题');check(output.includes('承接眼前回应')&&!output.includes('第二幕：青竹微风'),'回应不连演下一幕');
d=structuredClone(d);d.事件.进度[saint].待回应=false;d.关系列表={蓝幽月:{在场:true,好感度:80}};check(run(d,'圣女').title==='','筑基未达金丹不进第二幕');d.修炼进度.境界='金丹初期';check(run(d,'圣女').kind==='advance','金丹满足第二幕条件');
d=clone();d.修炼进度.境界='金丹初期';d.地点={世界:'凡界',地域:'中原',具体地点:'山路'};d.历练[saint]={类别:'剧情',阶段:'传音求救'};d.关系列表={蓝幽月:{在场:false,好感度:80}};check(run(d,'我留意蓝幽月的传音').title===saint,'已开启线跨地区传音不被排除');
d=clone();d.地点={世界:'灵界',地域:'南疆',具体地点:'五毒教药圃'};d.修炼进度.境界='金丹初期';check(run(d,'圣女').title==='','同名地点不同世界不新开');
d=clone();d.修炼进度.境界='筑基初期';d.地点.具体地点='五毒教药圃';d.__custom_start__={story:'story-wudu-init'};d.历练[ancestor]={类别:'剧情',阶段:'祖窟归位'};d.事件.聚焦模式='手动';d.事件.标题=ancestor;check(run(d,'来到药圃').title===saint,'手动线等待未来境界允许其他首幕');check(d.事件.标题===ancestor,'新开场不改手动聚焦');
d.历练.梦茧={类别:'剧情',阶段:'集毒'};check(run(d,'去寻找梦茧所需奇毒').title==='','手动等待不自动接续其他已开线');
d=clone();d.地点.具体地点='五毒教药圃';d.修炼进度.境界='筑基初期';check(run(d,'不去药圃，先修炼').title==='','负向提及不按当前地点自动开场');d.事件.聚焦模式='暂停';check(run(d,'圣女').title==='','无剧情模式阻断');
d=clone();d.__custom_start__={story:'story-wudu-init'};d.事件.标题=ancestor;d.事件.聚焦模式='手动';d.历练[ancestor]={类别:'剧情',阶段:'不存在'};check(run(d,'祖窟').diagnostics.some(s=>s.includes('未知剧情阶段')),'未知阶段阻断并诊断');
check(run(clone(),'梦茧',registeredPlots,[],['不存在']).diagnostics.length===3,'运行期无效入口阻断');
check(run(clone(),'梦茧',[registeredPlots[0],registeredPlots[0]],[]).diagnostics.length===2,'运行期重复注册全部阻断');
assert.throws(()=>validatePlotRegistry([registeredPlots[0],registeredPlots[0]],entries),/重复/);checks++;
assert.throws(()=>validatePlotRegistry(registeredPlots,['不存在']),/无效世界书入口/);checks++;
const coreText=fs.readFileSync('src/修仙状态栏/plotScheduling/core.ts','utf8');check(!/南疆|五毒|祖窟|梦茧|蓝幽月|金丹|筑基/.test(coreText),'核心没有剧情或门槛硬编码');
d=clone();d.地点.具体地点='五毒教药圃';d.修炼进度.境界='筑基初期';d.事件.进度={五毒教日常:{名称:'毒膳堂',状态:'待回应'}};
check(run(d,'').title==='','待回应日常优先于无明确行动的新开场');
check(run(d,'我去药圃找圣女').title===saint,'明确长线行动优先于日常');
d.事件.聚焦模式='手动';d.事件.标题=ancestor;d.__custom_start__={story:'story-wudu-init'};d.历练[ancestor]={类别:'剧情',阶段:'祖窟归位'};
check(run(d,'圣女').title===saint,'手动等待可明确开线且不受日常抢占');
d.历练[ancestor].阶段='炼蛊抉择中';check(run(d,'圣女').title===ancestor,'手动可处理节点优先');
check(run(d,'我离开祖窟，去药圃找圣女').title===saint,'明确离开不作为接续依据');
d=clone();d.事件.标题=ancestor;d.事件.聚焦模式='手动';d.历练[ancestor]={类别:'剧情',阶段:'炼蛊抉择中'};check(run(d,'祖窟').title==='','普通出身即使有祖窟历练也不能冒用资格');
d=clone();d.地点.具体地点='五毒教药圃';d.修炼进度.境界='筑基初期';d.事件.已完成事件=[saint];check(run(d,'圣女').title==='','完成不重开');
d=clone();d.__custom_start__={story:'story-wudu-init'};d.历练[ancestor]={类别:'剧情',阶段:'蛊鸣辨毒'};d.事件.标题=ancestor;d.修炼进度.境界='筑基圆满';check(run(d,'整理衣物').title==='','旧标题不自动续演');
const sharedSource=fs.readFileSync('../Cultivation-Card-Game/世界书/事件/[公共]统一剧情调度.txt','utf8');check((sharedSource.match(/getMessageVar\(/g)||[]).length===1,'每次入口只读一份状态快照');
assert.throws(()=>validatePlotRegistry([{...registeredPlots[0]}, {...registeredPlots[1],entry:registeredPlots[0].entry}],entries),/重复世界书入口/);checks++;
// Offline-only fixtures; never registered into test card.
const fixture=i=>({name:'样例'+String(i).padStart(4,'0'),entry:'离线入口'+i,order:i,region:c=>c.data.地点.地域==='样例地区',opening:()=>true,openingScene:()=>true,matches:a=>a==='样例'+String(i).padStart(4,'0'),response:()=>true,stages:{等待:{advance:()=>true,respond:()=>true}}});
const timings=[];
for(const size of [100,1000]){
 const plots=Array.from({length:size},(_,i)=>fixture(i));const state=clone();state.地点.地域='样例地区';
 validatePlotRegistry(plots,plots.map(p=>p.entry));
 const start=performance.now();
 for(let i=0;i<size;i++)assert.equal(run(state,plots[i].name,plots,[]).title,plots[i].name);
 check(run(state,'',plots,[]).title===plots[0].name,'稳定排序 '+size);
 check(run(state,'',[...plots].reverse(),[]).title===plots[0].name,'反转注册顺序一致 '+size);
 timings.push({size,calls:size+2,ms:Number((performance.now()-start).toFixed(2))});
 state.地点.地域='其他地区';check(run(state,'',plots,[]).title==='','异地不新开 '+size);
 state.事件.聚焦模式='手动';state.事件.标题=plots[size-1].name;state.历练[state.事件.标题]={类别:'剧情',阶段:'等待'};check(run(state,'',plots,[]).title===state.事件.标题,'异地已开线仍可推进 '+size);
}
const equal=[fixture(0),fixture(1)].map(p=>({...p,order:0}));check(run({...clone(),地点:{地域:'样例地区'}},'',equal.reverse(),[]).title==='样例0000','同排序值按名称决定');
// Every real configured phase is rendered by the South regressions; manifest generation validates source coverage.
check(entries.length===3,'只注册三条南疆长线');
console.log(`PASS ${checks} unified scheduling checks plus 1100 explicit-target bulk assertions. Timings: ${JSON.stringify(timings)}`);
fs.writeFileSync('scratchpad/plot-scheduler-benchmark.json',JSON.stringify({checks,timings},null,2));
