import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),_=require('lodash');
const source=fs.readFileSync('src/面板美化/正文美化.html','utf8');
const render=source.slice(source.indexOf('      function renderTaskHtml('),source.indexOf('      function renderBattleHtml('));
const split=source.slice(source.indexOf('      function splitPanelColumns('),source.indexOf('      // 把 效果 字段值解析成'));
const context=vm.createContext({_});vm.runInContext(split+'\n'+render,context);
let count=0;
for(const type of ['委托','剧情'])for(const status of ['进行中','待结算','待平息','已完成','失败']){
 context.panel={sections:[{title:'测试标题<script>',rows:[`| 类别: ${type} | 状态: ${status} | 难度: 炼气 |`,'| 目标: 普通目标 | 焦点: 剧情焦点 | 进展: 真实进展 |','| 幕次: 第一幕 | 局势: 当前局势 | 契机: 当前契机 | 牵涉: 已知人物 |','| 委托方: 百草堂 | 奖励: 灵石三十 | 交付: 交予执事 |','| 截止时间: 明日 | 紧迫: 今夜以前 |']}]};
 const out=vm.runInContext('renderTaskHtml(panel)',context);
 assert.equal(out.includes('is-plot'),type==='剧情');
 assert.ok(!out.includes('<script>')&&out.includes('&lt;script&gt;'));
 assert.ok(out.indexOf(type==='剧情'?'剧情焦点':'普通目标')<out.indexOf('真实进展'));
 const fields=type==='剧情'?['真实进展','第一幕','当前局势','当前契机','已知人物']:['真实进展','百草堂','灵石三十','交予执事'];
 for(let i=1;i<fields.length;i++)assert.ok(out.indexOf(fields[i])>out.indexOf(fields[i-1]));
 assert.ok(out.indexOf('class="task-deadline"')>out.lastIndexOf('class="task-detail-row'));
 count++;
}
console.log(`PASS ${count} body-panel renderer cases: explicit category, shared field order, footer, status and escaping.`);

// Exercise the actual raw-table parser in both maintained source and delivered build.
function functionCode(text,name){
 const start=text.indexOf('function '+name+'(');
 assert.ok(start>=0,'missing '+name);
 const next=text.indexOf('function ',start+10);
 return text.slice(start,next<0?undefined:next);
}
for(const [label,text] of [['source',source],['build',fs.readFileSync('dist/正文美化/index.html','utf8')]]){
 const ctx=vm.createContext({_});
 const names=['parseTablePanel','splitPanelColumns','_splitRowKv','renderTaskHtml'];
 vm.runInContext(names.map(n=>functionCode(text,n)).join('\n'),ctx);
 for(const type of ['剧情','委托',''])for(const ending of ['\n','\r\n']){
  const rows=['普通任务也可能提及剧情',`| ${type?'类别: '+type+' | ':''}状态: 进行中 | 难度: 筑基 |`,'| 幕次: 第三幕 | 紧迫: 暂无紧迫 |','| 焦点: 面对残魂侵袭 | 目标: 采集灵草 |','| 进展: 尚未决定 | 局势: 残魂侵袭 | 契机: 蛊脉变化 | 牵涉: 识海 |','| 委托方: 百草堂 | 奖励: 灵石三十 | 交付: 交予执事 |'];
  ctx.raw=rows.join(ending);
  const out=vm.runInContext('renderTaskHtml(parseTablePanel(raw))',ctx);
  assert.equal(out.includes('is-plot'),type==='剧情',label+' raw category '+type);
  for(const value of type==='剧情'?['第三幕','面对残魂侵袭','残魂侵袭','蛊脉变化','识海']:['采集灵草','百草堂','灵石三十','交予执事'])assert.ok(out.includes(value),label+' missing field '+value);
 }
}
console.log('PASS 12 raw-table-to-renderer cases across source/build: plot, quest, legacy quest, LF and CRLF.');
