import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),_=require('lodash'),{z}=require('zod'),YAML=require('yaml');
const c='../Cultivation-Card-Game/';
const moduleCache = new Map();
function loadTs(filename) {
 filename = new URL(filename, import.meta.url).pathname;
 if (/^\/[A-Za-z]:/.test(filename)) filename = filename.slice(1);
 filename = decodeURIComponent(filename);
 if (!filename.endsWith('.ts')) filename += '.ts';
 if (moduleCache.has(filename)) return moduleCache.get(filename).exports;
 const module = { exports: {} }; moduleCache.set(filename,module);
 const js = ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext('(function(require,module,exports){'+js+'\n})', {console})(id=>loadTs(new URL(id, 'file:///'+filename.replaceAll('\\','/')).href),module,module.exports);
 return module.exports;
}
const resolve = loadTs('../src/修仙状态栏/plotFocus.ts').resolvePlotFocus;
async function render(source,data,action="",extra={}){let code='let out="";\n',end=0;for(const m of source.matchAll(/<%([_=-]?)([\s\S]*?)_?%>/g)){code+=`out+=${JSON.stringify(source.slice(end,m.index))};\n`;code+=['-','='].includes(m[1])?`out+=(${m[2]});\n`:m[2]+'\n';end=m.index+m[0].length;}code+=`out+=${JSON.stringify(source.slice(end))};return out;`;return new (Object.getPrototypeOf(async function(){}).constructor)('getMessageVar','getChatMessage','lastUserMessageId','getwi','plotName',code)((p,o={})=>_.get({stat_data:data},p,o.defaults),()=>action,1,async (name,extra={})=>{assert.equal(name,'[公共]统一剧情调度');return render(fs.readFileSync(c+'世界书/事件/[公共]统一剧情调度.txt','utf8'),data,action,extra);},extra.plotName);}
const paths=['南疆/五毒教/梦茧.txt','南疆/五毒教/五毒教圣女.txt','南疆/五毒教/五毒教日常.txt','开局剧情/[开局]五毒教-万毒祖窟.txt'];
const books=paths.map(p=>fs.readFileSync(c+'世界书/事件/凡界/'+p,'utf8'));
const base={身份:['五毒教弟子'],地点:{地域:'南疆',具体地点:'五毒教神木殿'},修炼进度:{境界:'炼气后期',当前进度:85,进度上限:100},历练:{},事件:{聚焦模式:'自动',标题:'',阶段:'',已完成事件:[]}};
let count=0;
async function check(d,expected,action=""){assert.equal(resolve(d,action),expected);const outputs=await Promise.all(books.map(b=>render(b,d,action)));assert.equal(outputs.reduce((n,o)=>n+(o.match(/<event>/g)||[]).length,0),expected ? 1 : (outputs[2].includes('<event>') ? 1 : 0),'单轮单节点且选中节点实际输出');count++;return outputs;}

await check(base,'梦茧');
const clone=()=>_.cloneDeep(base);
const ancestor='万毒祖窟·噬心蛊鸣', saint='五毒圣女·幽月情缘';
const opened=(name,stage,realm='金丹初期')=>_.merge(clone(),{__custom_start__:{story:'story-wudu-init'},修炼进度:{境界:realm,当前进度:0},事件:{聚焦模式:'手动',标题:name},历练:{[name]:{类别:'剧情',阶段:stage,推进线索:'下一步'}}});
for(const mode of ['自动','手动','暂停']) {
 const d=opened(ancestor,'吞果初醒','炼气初期');d.事件.聚焦模式=mode;d.事件.已完成事件=['梦茧',saint];
 await check(d,'','我整理行囊');
 if(mode==='暂停') { const out=await check(d,'','走到药圃');assert.ok(out.every(s=>!s.includes('<event>'))); }
}
let d=clone();d.__custom_start__={story:'story-wudu-init'};await check(d,ancestor);
d=clone();d.修炼进度.境界='筑基初期';d.物品={'噬心蛊经':{数量:1}};await check(d,'','我来到万毒祖窟');
d=opened(ancestor,'吞果初醒','炼气初期');await check(d,'','我走进药圃');d.修炼进度.境界='筑基初期';d.事件.聚焦模式='自动';await check(d,saint,'我走进药圃');assert.equal(d.事件.标题,ancestor);
d=opened(ancestor,'炼蛊抉择中','筑基圆满');d.事件.进度={[ancestor]:{待回应:true}};await check(d,ancestor,'我走进药圃');
d=opened(ancestor,'炼蛊抉择中','筑基圆满');d.事件.聚焦模式='自动';await check(d,saint,'我暂离祖窟，来到药圃');await check(d,'','不去药圃，先整理衣物');
for(const [name,stage,realm] of [
 ['梦茧','追问传说','炼气后期'],['梦茧','集毒','炼气后期'],['梦茧','筑基结蛊','筑基初期'],['梦茧','梦茧苏醒','筑基中期'],['梦茧','了结抉择','金丹初期'],['梦茧','收集归元材料','金丹初期'],['梦茧','炼制归元化生丹','元婴初期'],['梦茧','丹成待服','元婴初期'],['梦茧','结局·化蝶','金丹初期'],['梦茧','结局·完美','元婴初期'],['梦茧','结局·茧中','金丹初期'],['梦茧','结局·夺舍','金丹初期'],['梦茧','献祭·查证','金丹初期'],
 [ancestor,'吞果初醒','筑基初期'],[ancestor,'蛊鸣辨毒','筑基圆满'],[ancestor,'炼蛊抉择中','筑基圆满'],[ancestor,'以身饲蛊','筑基圆满'],[ancestor,'压制魔性','金丹初期'],[ancestor,'祖窟归位','化神初期'],
 [saint,'同行_确认朋友','金丹初期'],[saint,'秘窟驰援','金丹初期'],[saint,'终幕_月下定情','金丹初期'],
]) { d=opened(name,stage,realm);d.身份=['五毒教长老'];d.关系列表={蓝幽月:{好感度:100,在场:true}};d.地点.具体地点='五毒教寒髓秘窟';await check(d,name); }
d=opened(saint,'传音求救');d.关系列表={蓝幽月:{好感度:80,在场:false}};d.地点={地域:'中原',具体地点:'山路'};await check(d,saint);
d=opened(ancestor,'祖窟归位','金丹初期');d.事件.已完成事件=['梦茧',saint];await check(d,'');
d=opened(ancestor,'蛊鸣辨毒','筑基圆满');d.事件.已完成事件=[ancestor,'梦茧',saint];await check(d,'');
const controls={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/修仙状态栏/plotControls.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,controls);
d=opened(ancestor,'吞果初醒');const saved=JSON.stringify(d.历练);controls.exports.selectPlot(d,ancestor);assert.equal(JSON.stringify(d.历练),saved);
const opening={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/自定义开局/openingPlot.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,opening);
const initial=opening.exports.openingPlot('story-wudu-init');assert.equal(initial.task.阶段,'吞果初醒');assert.equal(opening.exports.openingPlot('other'),undefined);
d=opened(ancestor,initial.task.阶段,'炼气初期');d.历练[ancestor]=initial.task;d.事件.聚焦模式='自动';assert.ok(!(await render(books[3],d)).includes('<task_info>'));assert.equal(initial.task.状态,'进行中');
const rulesText=fs.readFileSync(c+'世界书/变量/[mvu_update]变量更新规则.yaml','utf8');assert.ok(YAML.parse(await render(rulesText,d),{maxAliasCount:-1}));
d=opened(ancestor,'吞果初醒','筑基初期');assert.ok((await render(rulesText,d)).includes('阶段记为“蛊鸣辨毒”'));
const script=fs.readFileSync(c+'脚本/变量结构.js','utf8');const runtime=vm.createContext({_,z,$:()=>{}});vm.runInContext(script.replace(/^import .*;\r?\n/,'').replace('export const Schema','const Schema'),runtime);
const focused={stat_data:{事件:{标题:'梦茧',阶段:'试炼初过',已完成事件:[]},历练:{梦茧:{类别:'剧情',阶段:'集毒'}}}};runtime.focused=focused;vm.runInContext('syncFocusedPlotIndex(focused)',runtime);assert.equal(focused.stat_data.事件.阶段,'集毒');assert.equal(focused.stat_data.历练.梦茧.阶段,'集毒');
const previous=structuredClone(focused);focused.stat_data.事件.阶段='筑基结蛊';runtime.previous=previous;vm.runInContext('syncFocusedPlotIndex(focused, previous)',runtime);assert.equal(focused.stat_data.历练.梦茧.阶段,'筑基结蛊');const previous2=structuredClone(focused);focused.stat_data.历练.梦茧.阶段='梦茧苏醒';runtime.previous=previous2;vm.runInContext('syncFocusedPlotIndex(focused, previous)',runtime);assert.equal(focused.stat_data.事件.阶段,'梦茧苏醒');
const partialBase={stat_data:{历练:{梦茧:{类别:'剧情',阶段:'追问传说',进展:'旧进展',局势:'传说'}},事件:{聚焦模式:'手动',标题:'梦茧',已完成事件:['旧线'],进度:{其他线:{标记:true}}}}};runtime.partialBase=partialBase;runtime.partialTask={type:'insert',args:['/历练','梦茧',JSON.stringify({阶段:'集毒',幕次:'第二幕'})]};vm.runInContext('preservePlotRecords(partialTask, partialBase)',runtime);assert.equal(runtime.partialTask.args[2].类别,'剧情');assert.equal(runtime.partialTask.args[2].进展,'旧进展');runtime.partialEvent={type:'set',args:['/事件',JSON.stringify({聚焦模式:'自动',标题:'梦茧',已完成事件:[],进度:{梦茧:{待回应:true}}})]};vm.runInContext('preservePlotRecords(partialEvent, partialBase)',runtime);assert.equal(runtime.partialEvent.args[1].聚焦模式,'手动');assert.ok(runtime.partialEvent.args[1].进度.其他线.标记);assert.ok(runtime.partialEvent.args[1].已完成事件.includes('旧线'));
const front=vm.createContext({_,z,exports:{},normalizeStringArray:vm.runInContext("normalizeStringArray",runtime)});const schema=fs.readFileSync('src/修仙状态栏/schema.ts','utf8').replace(/^import[^\n]*\n/gm,'');vm.runInContext(ts.transpileModule(schema,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,front);
for(const type of ['TaskSchema','EventSchema']){const a=vm.runInContext(type,runtime),b=vm.runInContext(type,front);const fixture=type==='TaskSchema'?{类别:'剧情',阶段:'集毒',推进线索:'寻访长老'}:{聚焦模式:'手动',标题:'梦茧',阶段:'集毒'};assert.deepEqual(JSON.parse(JSON.stringify(a.parse(fixture))),JSON.parse(JSON.stringify(b.parse(fixture))));}
console.log(`PASS ${count} mode/EJS scenarios, independent stages, single-node, schema parity and YAML.`);


export {render,books,base,loadTs};
