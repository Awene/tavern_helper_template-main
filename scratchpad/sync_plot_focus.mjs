import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import { bundleScheduling } from './plot_bundle.mjs';
const require = createRequire(import.meta.url), YAML = require('yaml');
const root = '../Cultivation-Card-Game/';
const manifest = YAML.parse(fs.readFileSync(root+'本格修仙.yaml','utf8'));
const entries = manifest.条目.map(e=>e.名称);
const code = bundleScheduling(), runtime = vm.runInNewContext(code+'plotRuntime');
runtime.validatePlotRegistry(runtime.registeredPlots, entries);
for (const def of runtime.registeredPlots) {
 const item=manifest.条目.find(e=>e.名称===def.entry);
 const source=fs.readFileSync(root+item.文件.replaceAll('\\','/')+'.txt','utf8');
 for(const c of def.chapters) if(!source.includes("本线.phase === '"+c.name+"'")) throw Error('Missing chapter '+def.name+'/'+c.name);
}
const phases=Object.fromEntries(runtime.registeredPlots.map(p=>[p.name,p.chapters.map(c=>c.name)]));
const schemaPath=root+'脚本/变量结构.js';
fs.writeFileSync(schemaPath,fs.readFileSync(schemaPath,'utf8').replace(/const FOCUSED_PLOT_PHASES = \{[\s\S]*?\n\};/,'const FOCUSED_PLOT_PHASES = '+JSON.stringify(phases,null,2)+';'));
fs.writeFileSync(root+'世界书/事件/[公共]统一剧情调度.txt','<%_\n'+code+`const snapshot = getMessageVar('stat_data', { defaults: {} }) || {};
const decision = plotRuntime.dispatchPlots(snapshot, '', plotRuntime.registeredPlots, plotRuntime.registeredDaily, ${JSON.stringify(entries)});
for (const issue of decision.diagnostics) console.warn('[统一剧情调度] '+issue);
_%><%- JSON.stringify(decision) %>`);
const rulesPath=root+'世界书/变量/[mvu_update]变量更新规则.yaml';
let rules=fs.readFileSync(rulesPath,'utf8');
// Remove the previous executable state collectors entirely. One compact chapter contract replaces them.
rules=rules.replace(/      <%_ \/\* <剧情状态衔接>[\s\S]*?<%_ \/\* <\/剧情状态衔接> \*\/\s*\}?\s*_%>\r?\n/, '');
fs.writeFileSync(rulesPath,rules);
let doc='# 南疆逐幕条件表\n\n此表由硬条件配置与世界书幕次说明联合生成；叙事时机、退出事实由 AI 判断，脚本不判定正文结果。\n';
for (const p of runtime.registeredPlots) {
 doc+='\n## '+p.name+'\n\n| 幕次 | 进入条件 | 完成或退出标志 | 下一幕线索 |\n|---|---|---|---|\n';
 const item=manifest.条目.find(e=>e.名称===p.entry);
 const source=fs.readFileSync(root+item.文件.replaceAll('\\','/')+'.txt','utf8');
 const notes=JSON.parse(source.match(/const 幕次说明 = ([\s\S]*?);\r?\nconst 本线/)[1]);
 for (const c of p.chapters) { const n=notes[c.name]; doc+='| '+[c.name,n.进入+'（硬条件：'+c.condition+'）',n.退出,n.下一幕].map(s=>s.replaceAll('|','／')).join(' | ')+' |\n'; }
}
fs.writeFileSync(root+'Doc/南疆逐幕条件表.md',doc);
console.log('Generated chapter eligibility, schema phase registry and chapter reference; removed legacy state collectors.');
