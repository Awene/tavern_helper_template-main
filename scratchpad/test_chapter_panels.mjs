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
