import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const _ = require('lodash');
const { z } = require('zod');
const ts = require('typescript');
const YAML = require('yaml');
const card = new URL('../../Cultivation-Card-Game/', import.meta.url);
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const names = ['梦茧', '五毒教圣女', '五毒教日常'];
const sources = Object.fromEntries(names.map(n => [n, fs.readFileSync(new URL(`世界书/事件/凡界/南疆/五毒教/${n}.txt`, card), 'utf8')]));
sources.万毒祖窟 = fs.readFileSync(new URL('世界书/事件/凡界/开局剧情/[开局]五毒教-万毒祖窟.txt', card), 'utf8');
// Execute actual EJS control blocks with read-only fixtures. Narrative ${...} is literal template text.
const {render} = await import('./test_plot_modes.mjs');
const base = {身份:['五毒教天蜈部弟子'],地点:{世界:'凡界',地域:'南疆',具体地点:'五毒教神木殿'},修炼进度:{境界:'炼气后期',当前进度:85,进度上限:100},事件:{标题:'',阶段:'',已完成事件:[]},资源池:{气血:{现值:100,上限:100}}};
let count=0;
async function check(name, source, patch, expected) {
  const data=_.merge(_.cloneDeep(base),patch);
  // 聚焦改造后：阶段分支回归固定为手动；自动调度另由 test_plot_focus 覆盖。
  if(data.事件.标题){data.事件.聚焦模式='手动';data.历练={[data.事件.标题]:{类别:'剧情',阶段:data.事件.阶段}};}
  if(source==='五毒教日常'){data.事件.聚焦模式='自动';data.事件.已完成事件.push('梦茧','五毒圣女·幽月情缘');}
  if(source==='五毒教圣女'&&!data.事件.标题)data.事件.已完成事件.push('梦茧');
  const out=await render(sources[source],data);
  assert.equal((out.match(/<event>/g)||[]).length, expected ? 1 : 0, name);
  if (expected) assert.ok(out.includes(expected),name);
  assert.equal((out.match(/<!--/g)||[]).length,(out.match(/-->/g)||[]).length, name+' comment balance');
  count++;
  return out;
}
await check('梦茧初始','梦茧',{},'五毒蛊传说');
await check('梦茧完成防重开','梦茧',{事件:{已完成事件:['梦茧']}},null);
await check('手动等待允许其他首幕','梦茧',{事件:{标题:'其他'}},'五毒蛊传说');
for (const [stage,realm,title] of [
  ['追问传说','炼气后期','奇毒线索'],['集毒','炼气后期','集毒进度'],['筑基结蛊','炼气后期','识海哀鸣'],
  ['梦茧苏醒','筑基初期',null],['梦茧苏醒','筑基中期','神识传音'],['了结抉择','金丹初期','因果抉择'],
  ['收集归元材料','金丹初期','筹集'],['炼制归元化生丹','金丹初期',null],
  ['炼制归元化生丹','元婴初期','丹成待服'],['丹成待服','元婴初期','等待渡药'],
  ['结局·化蝶','金丹初期','红发血蝶'],['结局·完美','元婴初期','白首相守'],
  ['结局·茧中','金丹初期','银发幻影'],['结局·夺舍','金丹初期','银发重生'],['献祭·查证','金丹初期','空余长叹'],
]) await check('梦茧 '+stage+realm,'梦茧',{事件:{标题:'梦茧',阶段:stage},修炼进度:{境界:realm}},title);
await check('金丹门禁','梦茧',{事件:{标题:'梦茧',阶段:'了结抉择'},修炼进度:{境界:'筑基圆满'}},null);
await check('跨区域继续收集','梦茧',{地点:{具体地点:'翠玉丘万灵熄窟'},事件:{标题:'梦茧',阶段:'收集归元材料'},修炼进度:{境界:'金丹初期'}},'归元筹备');
await check('圣女初识','五毒教圣女',{修炼进度:{境界:'筑基初期'},地点:{具体地点:'五毒教药圃'}},'百草偶窥');
for(const [stage,favor,present,place,title] of [
  ['同行_确认朋友',50,true,'五毒教青竹亭','独属之友'],['传音求救',70,false,'翠玉丘','秘窟危局'],
  ['秘窟驰援',70,true,'五毒教寒髓秘窟','至交契阔'],['终幕_月下定情',100,true,'五毒教神木顶峰','白首同心'],
]) await check('圣女 '+stage,'五毒教圣女',{事件:{标题:'五毒圣女·幽月情缘',阶段:stage},修炼进度:{境界:'金丹初期'},关系列表:{蓝幽月:{好感度:favor,在场:present}},地点:{具体地点:place}},title);
await check('不能在普通同场直接救治','五毒教圣女',{事件:{标题:'五毒圣女·幽月情缘',阶段:'秘窟驰援'},修炼进度:{境界:'金丹初期'},关系列表:{蓝幽月:{好感度:70,在场:true}}},null);
await check('圣女不在场不能直接定情','五毒教圣女',{事件:{标题:'五毒圣女·幽月情缘',阶段:'终幕_月下定情'},修炼进度:{境界:'金丹初期'},关系列表:{蓝幽月:{好感度:100,在场:false}}},null);
const dailyNames=['五毒教·入宗介绍','五毒分部','毒膳堂','蟾佩刮金','五部演武·预告','断供'];
for(const name of dailyNames) {
  const out=await check('日常回应 '+name,'五毒教日常',{事件:{进度:{五毒教日常:{名称:name,状态:'待回应'}}}},'回应与结果');
  assert.ok(!out.includes('**情境氛围呈现**'),'不重演日常');
  assert.ok(!out.includes('<task_info>'),'日常不建卡');
}
await check('日常首轮不发奖','五毒教日常',{身份:['五毒教弟子'],修炼进度:{境界:'炼气初期'},地点:{具体地点:'五毒教山门'}},'待回应');
await check('气血不足不触发毒膳','五毒教日常',{地点:{具体地点:'五毒教膳堂'},资源池:{气血:{现值:10,上限:100}}},null);
await check('零气血不触发毒膳','五毒教日常',{地点:{具体地点:'五毒教膳堂'},资源池:{气血:{现值:0,上限:100}}},null);
const start={__custom_start__:{story:'story-wudu-init'}};
await check('祖窟开启','万毒祖窟',start,'吞果初醒');
for(const [stage,realm,title] of [
 ['吞果初醒','筑基初期','暗潮辨毒'],['蛊鸣辨毒','筑基后期','炼蛊抉择'],
 ['炼蛊抉择中','筑基后期','玩家回应'],['以身饲蛊','筑基后期','身死道消'],
 ['压制魔性','金丹初期','奠定道基'],['祖窟归位','化神初期','极尽升华'],
]) await check('祖窟 '+stage,'万毒祖窟',_.merge({},start,{身份:['五毒教长老'],事件:{标题:'万毒祖窟·噬心蛊鸣',阶段:stage},修炼进度:{境界:realm}}),title);
await check('祖窟筑基初期不提前抉择','万毒祖窟',_.merge({},start,{事件:{标题:'万毒祖窟·噬心蛊鸣',阶段:'蛊鸣辨毒'},修炼进度:{境界:'筑基初期'}}),null);
await check('祖窟完成防重开','万毒祖窟',_.merge({},start,{事件:{已完成事件:['万毒祖窟·噬心蛊鸣']}}),null);
for (const [name,source] of Object.entries(sources)) {
 assert.ok(!/"op"|【剧情|专属剧情选项|模式[二三]/.test(source),name+' removed instructions');
 assert.equal((source.match(/<!--/g)||[]).length,(source.match(/-->/g)||[]).length,name+' source comment balance');
}
const variableRules=fs.readFileSync(new URL('世界书/变量/[mvu_update]变量更新规则.yaml',card),'utf8');
assert.ok(YAML.parse(await render(variableRules,base),{maxAliasCount:-1}));
const html=read('../src/面板美化/正文美化.html');
for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
function fn(name) {
 for(const block of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  const source=ts.createSourceFile('panel.js',block[1],ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  let found;
  function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text===name)found=node;ts.forEachChild(node,visit);}
  visit(source);
  if(found)return found.getText(source);
 }
 throw new Error('Missing function '+name);
}
const sandbox={_,renderQuickReplyPanel:()=>({hasCategories:false,buttons:'',panel:''})};
const optionName='renderActionOptions';
vm.runInNewContext(fn(optionName)+`;this.renderOptions=${optionName};`,sandbox);
const optionHtml=sandbox.renderOptions('1. 普通行动\n2. 【剧情·分支】真实原文\n3. 【主线】另一条');
assert.ok(optionHtml.indexOf('普通行动')<optionHtml.indexOf('【剧情·分支】真实原文'));
assert.ok(optionHtml.includes('data-option-text="【剧情·分支】真实原文"'));
assert.ok(!/is-plot|plot-badge|参考剧情选项/.test(optionHtml));
vm.runInNewContext(fn('splitPanelColumns')+fn('parseTablePanel')+fn('_splitRowKv')+fn('renderTaskHtml')+';this.task=renderTaskHtml;this.parse=parseTablePanel;',sandbox);
const plot=sandbox.task(sandbox.parse('梦茧\n| 类别: 剧情 | 状态: 待抉择 |\n| 幕次: 第五幕 | 局势: 等待回应 |'));
assert.ok(plot.includes('task-panel is-plot'));
assert.ok(plot.includes('等待回应'));
const quest=sandbox.task(sandbox.parse('求药\n| 状态: 进行中 | 委托方: 长老 |\n| 目标: 采药 |'));
assert.ok(quest.includes('fa-clipboard-list'));
assert.ok(!quest.includes('is-plot'));
const sharedCtx={exports:{}};
vm.runInNewContext(ts.transpileModule(read('../src/修仙状态栏/pages/taskShared.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,sharedCtx);
assert.equal(sharedCtx.exports.getTaskMode({类别:'剧情'}),'plot');
assert.equal(sharedCtx.exports.getTaskMode({类别:'委托',焦点:'调查',紧迫:'一天'}),'quest');
assert.equal(sharedCtx.exports.getTaskMode({名称:'剧情资料委托',委托方:'执事'}),'quest');
assert.ok(!fs.existsSync(new URL('../src/修仙状态栏/pages/TaskCardEvent.vue',import.meta.url)));
assert.ok(!/rb-options[^\n{]*\.is-plot|rb-options-plot-badge|plotMatch|plotOptions/.test(html));
const ctx=vm.createContext({_,z,$:()=>{}});
const script=fs.readFileSync(new URL('脚本/变量结构.js',card),'utf8');
vm.runInContext(script.replace(/^import .*;\r?\n/,'').replace('export const Schema','const Schema'),ctx);
const runtimeTask=vm.runInContext('TaskSchema',ctx);
const frontSource=read('../src/修仙状态栏/schema.ts').replace(/^import[^\n]*\n/gm,'').replace('export const Schema','const Schema');
const frontCtx=vm.createContext({_,z,exports:{},normalizeStringArray:vm.runInContext('normalizeStringArray',ctx)});
vm.runInContext(ts.transpileModule(frontSource,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText,frontCtx);
const frontTask=vm.runInContext('TaskSchema',frontCtx);
const fixture={类别:'剧情',状态:'待抉择',幕次:'第三幕',局势:'蛊鸣',焦点:'待选',牵涉:'残魂',紧迫:'危急',进展:'未决'};
assert.deepEqual(JSON.parse(JSON.stringify(runtimeTask.parse(fixture))),JSON.parse(JSON.stringify(frontTask.parse(fixture))));
assert.ok(!('态势' in runtimeTask.parse(fixture)));
assert.ok(!('祸福' in frontTask.parse(fixture)));
console.log(`PASS: ${count} EJS scenarios; options, story/quest rendering, script syntax and shared task schema.`);
// 历史版本提示长度对比见已有报告；当前回归不再拿旧单线调度作为行为基准。
