import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { normalizeTasks } from '../util/cultivation-tasks.js';
import * as calendar from '../util/cultivation-calendar.js';
import { normalizeStringArray } from '../util/string-array.ts';
import { describeMvuRequestError, installMvuRequestGuard } from '../util/mvu-request-errors.js';
const require = createRequire(import.meta.url), { z } = require('zod'), _ = require('lodash');
const read = path => fs.readFileSync(path, 'utf8').replaceAll('\r\n', '\n');
const plain = value => JSON.parse(JSON.stringify(value));
const card = read('../Cultivation-Card-Game/脚本/变量结构.js');
const context = vm.createContext({ z, _, YAML: require('yaml'), $() {}, console });
vm.runInContext(card.replace(/^import .*;\n/, '').replace('export const Schema', 'const Schema'), context);
const frontend = { exports: {} };
new Function('module', 'exports', 'require', '_', ts.transpileModule(read('src/修仙状态栏/schema.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(frontend, frontend.exports, name => name.includes('cultivation-tasks') ? { normalizeTasks }
  : name.includes('cultivation-calendar') ? calendar : name.includes('string-array') ? { normalizeStringArray } : require(name), _);

const legacy = { 聚焦任务: '寻人', 已完成任务: ['入门', '入门', ' 领牌 ', 42], 寻人: { 进展: '找到线索', 截止时间: '公元2026年2月3日' } };
const saved = structuredClone(legacy);
for (const schema of [vm.runInContext('Schema', context), frontend.exports.CultivationStatusSchema]) {
  const state = schema.parse({ 地点: { 世界: '地球' }, 任务: legacy });
  assert.equal(state.任务.聚焦任务, '寻人');
  assert.deepEqual(plain(state.任务.已完成任务), ['入门', '领牌']);
  assert.equal(state.任务.条目.寻人.进展, '找到线索');
  assert.equal(state.任务.条目.寻人.截止时间.年, 7026);
  assert.deepEqual(plain(schema.parse(state).任务), plain(state.任务));
  assert.deepEqual(plain(schema.parse({}).任务), { 聚焦任务: null, 已完成任务: [], 条目: {} });
}
assert.deepEqual(legacy, saved, 'migration does not mutate old snapshot');
assert.equal(normalizeTasks({ 聚焦任务: '不存在' }).聚焦任务, null);
assert.deepEqual(normalizeTasks({ 聚焦任务: { 状态: '进行中' }, 已完成任务: { 状态: '进行中' } }), { 聚焦任务: null, 已完成任务: [], 条目: {} });
assert.equal(normalizeTasks({ 寻人: { 进展: '旧' }, 条目: { 寻人: { 进展: '新' } } }).条目.寻人.进展, '新');
const patch = vm.runInContext('jsonPatchPreprocessor', context);
const variables = { stat_data: { 任务: legacy } };
const commands = [{ type: 'set', args: ['任务.寻人.进展', '新线索'] }, { type: 'set', args: ['任务.聚焦任务', '寻人'] },
  { type: 'insert', args: ['任务', '护送', { 目标: '抵达' }] }, { type: 'delete', args: ['任务', '寻人'] }];
patch(variables, commands);
assert.equal(commands[0].args[0], '任务.条目.寻人.进展');
assert.equal(commands[1].args[0], '任务.聚焦任务');
assert.equal(commands[2].args[0], '任务.条目');
assert.equal(commands[3].args[0], '任务.条目');
assert.equal(variables.stat_data.任务.聚焦任务, '寻人');

for (const value of ['正常剧情中提到 PROHIBITED_CONTENT', '<UpdateVariable><JSONPatch>[{"op":"replace","path":"/任务/条目/测试/进展","value":"Error: 401"}]</JSONPatch></UpdateVariable>',
  '{"analysis":"PROHIBITED_CONTENT", "json_patch":[]}', { text: '正常工具调用', tool_calls: [] }]) assert.equal(describeMvuRequestError(value), null);
for (const [value, expected] of [
  ['{"error":{"code":400,"message":"PROHIBITED_CONTENT"}}', '内容限制'],
  ['API request failed: PROHIBITED_CONTENT', '内容限制'],
  [{ promptFeedback: { blockReason: 'SAFETY' } }, '内容限制'],
  [{ error: { code: 401, message: 'secret-key-must-not-be-echoed' } }, '鉴权失败'],
  [new Error('429 quota exceeded'), '额度'], [new Error('503 overloaded'), '暂时不可用'],
  [new Error('Failed to fetch'), '网络'],
]) assert.ok(describeMvuRequestError(value).includes(expected));
const notices = [];
let response = '{"error":{"message":"PROHIBITED_CONTENT"}}', parsing = 0;
const scope = { generateRaw: async () => response, generate: async () => { throw new Error('401 invalid api key'); } };
const original = scope.generateRaw;
const restore = installMvuRequestGuard(scope, message => notices.push(message));
await assert.rejects(async () => { await scope.generateRaw(); parsing++; }, /内容限制/);
assert.equal(parsing, 0, 'API error is stopped before patch parsing');
await assert.rejects(scope.generate(), /401/);
assert.ok(notices.some(message => message.includes('鉴权失败')));
response = '<UpdateVariable><JSONPatch>[]</JSONPatch></UpdateVariable>';
assert.equal(await scope.generateRaw(), response);
restore(); assert.equal(scope.generateRaw, original);
const aborted = { generate: async () => { throw new DOMException('Stopped', 'AbortError'); } };
const before = notices.length;
installMvuRequestGuard(aborted, message => notices.push(message));
await assert.rejects(aborted.generate(), { name: 'AbortError' });
assert.equal(notices.length, before);
// 内嵌副本与源一致，避免发布卡和前端采用不同迁移规则。
for (const file of ['变量结构.js', '【本格修仙】MVU核验.js']) assert.ok(read('../Cultivation-Card-Game/脚本/' + file).includes(read('util/cultivation-tasks.js').replace('export function', 'function').trim()));
assert.ok(read('../Cultivation-Card-Game/脚本/MVU.js').includes(read('util/mvu-request-errors.js').replaceAll('export function', 'function').trim()));
// 提示词生成不能依赖后台迁移先完成：三个视图均应将旧结构输出为新结构。
const ejsModule = { exports: {} };
vm.runInNewContext(read('D:/application/Tavern/SillyTavern-1.16.0/data/default-user/extensions/ST-Prompt-Template/src/3rdparty/ejs.js'), { module: ejsModule, exports: ejsModule.exports });
const variablesRoot = '../Cultivation-Card-Game/世界书/变量/';
for (const file of fs.readdirSync(variablesRoot).filter(name => name.includes('输出列表') && name.endsWith('.ejs'))) {
  for (const tasks of [undefined, {}, legacy, normalizeTasks(legacy), { 聚焦任务: '失效任务', 已完成任务: ['完成', '完成'], 条目: {} }]) {
    const data = { 任务: tasks }, snapshot = structuredClone(data);
    const output = ejsModule.exports.render(read(variablesRoot + file), { _, YAML: require('yaml'), getMessageVar: () => data, getvar: () => '[]' }, { escape: value => String(value) });
    const actual = require('yaml').parse(output.match(/<status_current_variable>([\s\S]*?)<\/status_current_variable>/)[1]);
    assert.deepEqual(actual.任务, normalizeTasks(tasks), file);
    assert.deepEqual(data, snapshot, 'prompt fallback must not rewrite saved variables');
  }
}
console.log('PASS: task schemas, migration, legacy patch paths, calendar preservation, API failure interception, normal replies and cancellation.');
