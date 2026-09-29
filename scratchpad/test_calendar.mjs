import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as calendar from '../util/cultivation-calendar.js';
import { normalizeStringArray } from '../util/string-array.ts';
const require = createRequire(import.meta.url);
const { z } = require('zod'), _ = require('lodash'), ts = require('typescript');
const read = p => fs.readFileSync(new URL(p, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const cardRoot = '../../Cultivation-Card-Game/';
const cardSource = read(cardRoot + '脚本/变量结构.js');
const ctx = vm.createContext({ z, _, YAML: require('yaml'), $: () => {}, console: { warn() {} } });
vm.runInContext(cardSource.replace(/^import .*;\n/, '').replace('export const Schema', 'const Schema'), ctx);
const cardSchema = vm.runInContext('Schema', ctx);
const schemaModule = { exports: {} };
new Function('module', 'exports', 'require', '_', ts.transpileModule(read('../src/修仙状态栏/schema.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(schemaModule, schemaModule.exports, name => name.includes('cultivation-calendar') ? calendar : name.includes('string-array') ? { normalizeStringArray } : require(name), _);
let checks = 0;
const equal = (actual, expected, message) => { assert.deepEqual(JSON.parse(JSON.stringify(actual)), expected, message); checks++; };
for (const [input, world, expected] of [
  [2026, '地球', 7026], ['2026', '地球', 7026], ['公元2026年', '凡界', 7026],
  ['公历二〇二六年', '地球', 7026], ['AD 2026', '地球', 7026],
  ['修仙历7026年', '地球', 7026], ['修仙历2000年', '地球', 2000],
  [2000, '凡界', 2000], [7026, '地球', 7026], [7030, '灵界', 7030],
]) equal(calendar.cultivationYear(input, world), expected, '年份兼容');
for (const input of [undefined, null, {}, { 年: '乱码', 月: 99, 日: -1 }]) {
  const value = calendar.cultivationDate(input, '地球');
  equal([value.年, value.月, value.日], [7026, 1, 1], '无效日期安全回退');
}
for (const schema of [cardSchema, schemaModule.exports.Schema]) {
  for (const time of ['公元2026年1月2日 辰时', '2026-01-02', { 年: '公元2026年', 月: 1, 日: 2 }, { 年: 2026, 月: 1, 日: 2 }]) {
    const result = schema.parse({ 地点: { 世界: '地球' }, 时间: time, 寿元: { 生日: 2008 },
      传闻: { 上次世界推进时间点: '公历2026年1月1日' },
      任务: { 测试: { 截止时间: '公元2026年2月3日' } },
      固定资产: { 测试: { 设施: { 工坊: { 上次收取日期: '2026-01-01' } } } },
    });
    equal([result.时间.年, result.时间.月, result.时间.日], [7026, 1, 2], '两份Schema统一');
    if (schema === cardSchema) equal(result.寿元.生日, 7008, '出生年份同步');
    equal(result.传闻.上次世界推进时间点.年, 7026, '推进起点同步');
    equal(result.任务.测试.截止时间.年, 7026, '任务日期同步');
    equal(result.固定资产.测试.设施.工坊.上次收取日期.年, 7026, '资产日期同步');
    equal(schema.parse(result), JSON.parse(JSON.stringify(result)), '重复解析不再次加5000');
  }
  equal(schema.parse({ 地点: { 世界: '凡界' }, 时间: { 年: 2026, 月: 1, 日: 1 } }).时间.年, 2026, '非地球古代年份保留');
}
const normalizeCommand = vm.runInContext('normalizeTimeCommand', ctx);
equal(cardSchema.parse({ 地点: { 世界: '地球' }, 时间: { 年: 7026, 月: 1, 日: 1 }, 寿元: { 生日: 2000 } }).寿元.生日, 2000, '跨界长寿人物生日不误判为旧历');
for (const [path, input, expected] of [['/时间/年', '公元2026年', 7026], ['/时间', '2026-02-03', 7026]]) {
  const cmd = { type: 'set', args: [path, JSON.stringify(input)] };
  assert(normalizeCommand(cmd, { stat_data: { 地点: { 世界: '地球' }, 时间: { 年: 7030, 月: 1, 日: 1, 时辰: '午时' } } }));
  equal(path.endsWith('/年') ? cmd.args[1] : cmd.args[1].年, expected, '命令纠错');
}
const bad = { type: 'set', args: ['/时间/年', '"无法确定"'] };
equal(normalizeCommand(bad, { stat_data: { 地点: { 世界: '地球' } } }), false, '无效命令保留原值');
const ejsModule = { exports: {} };
const plugin = 'D:/application/Tavern/SillyTavern-1.16.0/data/default-user/extensions/ST-Prompt-Template/src/3rdparty/ejs.js';
vm.runInNewContext(fs.readFileSync(plugin, 'utf8'), { module: ejsModule, exports: ejsModule.exports });
const cultivation = read(cardRoot + '世界书/[修为获取规则].txt');
const files = ['世界书/[修为获取规则].txt', '世界书/地球/[mvu_plot]地球总览.txt', ...['中国', '欧盟', '英美'].map(r => `世界书/地球/地区/[mvu_plot]地区-地球-${r}.txt`)];
const render = (source, time, throws = false) => ejsModule.exports.render(source, {
  getMessageVar: key => {
    if (key === 'stat_data.时间') { if (throws) throw Error('读取失败'); return time; }
    if (key === 'stat_data.地点.世界') return '地球';
    if (key === 'stat_data.地点.地域') return '中国';
    if (key === 'stat_data.修炼进度.境界') return '炼气初期';
    return undefined;
  }, getChatMessages: () => [],
});
for (const time of [undefined, null, {}, { 年: 7026 }, '公元2026年1月1日', { 年: '修仙历7026年', 月: 1, 日: 1 }, { 年: 2026, 月: 1, 日: 1 }, { 年: '乱码', 月: 13, 日: -1 }]) {
  const out = render(cultivation, time);
  assert(out.includes('[E_realm] = 1 / L^2') && out.includes('E_realm=1 / L^2=[X]'));
  checks++;
  for (const path of files) {
    const output = render(read(cardRoot + path), time);
    assert(!/NaN|undefined|公元|公历/.test(output), path);
    checks++;
  }
}
for (const path of files) { assert(!/NaN|undefined/.test(render(read(cardRoot + path), null, true))); checks++; }
for (const [year, expected] of [[7030, 4], [7050, 43.2], [7100, 43.2]]) {
  assert(render(cultivation, { 年: year, 月: 1, 日: 1 }).includes(`[E_realm] = ${expected} / L^2`)); checks++;
}
const html = read('../src/面板美化/正文美化.html');
const headerCode = html.slice(html.indexOf('// BEGIN CULTIVATION_CALENDAR_YEAR'), html.indexOf('// —— 小总结'));
const header = vm.runInNewContext(headerCode + '\nrenderTimeSpaceHeader;', { _ });
for (const text of ['公元2026年1月1日 @ 地球-中国', '2026-01-01 @ 地球-中国', '修仙历7026年1月1日 @ 凡界-中原']) {
  const result = header(text);
  assert(result.includes('修仙历7026') && !result.includes('公元')); checks++;
}
assert(header('修仙历2026年1月1日 @ 凡界-中原').includes('修仙历2026')); checks++;
console.log(`PASS: ${checks} calendar compatibility, schemas, patch commands and EJS checks.`);
