import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { bundleScheduling } = await import('./plot_bundle.mjs');
const code = bundleScheduling();
const sharedPath = '../Cultivation-Card-Game/世界书/事件/[公共]统一剧情调度.txt';
const YAML = require('yaml');
const vm = await import('node:vm');
const manifest = YAML.parse(fs.readFileSync('../Cultivation-Card-Game/本格修仙.yaml','utf8'));
const entries = manifest.条目.map(e=>e.名称);
const runtime = vm.runInNewContext(code + 'plotRuntime');
runtime.validatePlotRegistry(runtime.registeredPlots, entries);
const runtimeEntries = [...runtime.registeredPlots, ...runtime.registeredDaily].map(p=>p.entry);
const plotFiles = new Map();
for (const def of [...runtime.registeredPlots, ...runtime.registeredDaily]) {
 const item=manifest.条目.find(e=>e.名称===def.entry);
 const file='../Cultivation-Card-Game/'+item.文件.replaceAll('\\','/')+'.txt';
 plotFiles.set(def.entry, file);
 if(!fs.existsSync(file))throw Error('Missing plot source '+file);
 if(def.stages){
  const phases=[...fs.readFileSync(file,'utf8').matchAll(/阶段 === '([^']+)'/g)].map(m=>m[1]);
  for(const phase of phases)if(!def.stages[phase])throw Error('Unregistered stage '+def.name+'/'+phase);
  for(const phase of Object.keys(def.stages))if(!phases.includes(phase))throw Error('Stage has no worldbook node '+def.name+'/'+phase);
 }
}
// The variable index uses the same registered phase names; it does not decide progression.
const schemaPath='../Cultivation-Card-Game/脚本/变量结构.js';
const schema=fs.readFileSync(schemaPath,'utf8');
const phases=Object.fromEntries(runtime.registeredPlots.map(p=>[p.name,Object.keys(p.stages).sort()]));
fs.writeFileSync(schemaPath,schema.replace(/const FOCUSED_PLOT_PHASES = \{[\s\S]*?\n\};/, 'const FOCUSED_PLOT_PHASES = '+JSON.stringify(phases,null,2)+';'));
fs.writeFileSync(sharedPath, '<%_\n' + code + `
const snapshot = getMessageVar('stat_data', { defaults: {} }) || {};
const action = typeof getChatMessage === 'function' && typeof lastUserMessageId === 'number' ? getChatMessage(lastUserMessageId, 'user') : '';
const decision = plotRuntime.dispatchPlots(snapshot, action, plotRuntime.registeredPlots, plotRuntime.registeredDaily, ${JSON.stringify(runtimeEntries)});
for (const issue of decision.diagnostics) console.warn('[统一剧情调度] ' + issue);
_%><%- JSON.stringify(decision) %>`);
console.log(`统一调度生成完成：${runtime.registeredPlots.length} 条长线、${runtime.registeredDaily.length} 个日常集合，阶段表与导出入口已校验。`);

// 同一份世界书控制条件，只保留状态记录，供记录模型核对正文后落实；不复制剧情正文。
function stateCollector(source, index) {
  const ranges = [...source.matchAll(/\[(?:状态记录[^\]]*|结局记录)\]([\s\S]*?)<\/event>/g)].map(m => [m.index, m.index + m[0].length - '</event>'.length]);
  let code = `async function collectPlotState${index}() { const result = [];\n`;
  let end = 0;
  function textPart(start, finish) {
    for (const [a, b] of ranges) {
      const text = source.slice(Math.max(start, a), Math.min(finish, b));
      if (Math.max(start, a) < Math.min(finish, b) && text.trim()) code += `result.push('剧情：' + 本事件 + '\\n' + ${JSON.stringify(text.trim())});\n`;
    }
  }
  for (const m of source.matchAll(/<%([_=-]?)([\s\S]*?)_?%>/g)) {
    textPart(end, m.index);
    if (!['-', '='].includes(m[1])) code += m[2] + '\n';
    else if (ranges.some(([a, b]) => m.index >= a && m.index < b)) code += `result.push(String(${m[2]}));\n`;
    end = m.index + m[0].length;
  }
  textPart(end, source.length);
  return code + 'return result.join("\\n"); }\n';
}
const plotSources = runtime.registeredPlots.map(def => fs.readFileSync(plotFiles.get(def.entry), 'utf8'));
const stateCode = plotSources.map(stateCollector).join('\n');
const handoff = `      <%_ /* <剧情状态衔接> 自动生成，维护源为已注册长线的状态记录。 */\n${stateCode}\nconst plotStateHandoff = (await Promise.all([${plotSources.map((_, i) => `collectPlotState${i}()`).join(', ')}])).filter(Boolean).join('\\n');\n_%>\n      - <%- JSON.stringify(plotStateHandoff ? '本轮剧情状态衔接：仅兑现已发生的正文，未选择不预写；节点阶段、进展与推进线索不得漏记。\\n' + plotStateHandoff : '本轮无南疆长线节点状态变更要求；保持各线精确阶段，只记录真实行动进展。') %>\n      <%_ /* </剧情状态衔接> */ _%>\n`;
const rulesPath = '../Cultivation-Card-Game/世界书/变量/[mvu_update]变量更新规则.yaml';
let rules = fs.readFileSync(rulesPath, 'utf8');
const marker = /      <%_ \/\* <剧情状态衔接>[\s\S]*?<%_ \/\* <\/剧情状态衔接> \*\/ _%>\r?\n/;
rules = marker.test(rules) ? rules.replace(marker, () => handoff) : rules.replace('  功法: &cultivation', handoff + '  功法: &cultivation');
fs.writeFileSync(rulesPath, rules.replace(/[ \t]+$/gm, ''));
console.log('记录模型只接收当前节点状态说明，已同步生成。');

