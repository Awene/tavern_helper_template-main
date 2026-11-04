import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import * as calendar from '../util/cultivation-calendar.js';
import { normalizeTasks } from '../util/cultivation-tasks.js';
import { normalizeStringArray } from '../util/string-array.ts';

const require = createRequire(import.meta.url);
const { z } = require('zod'), _ = require('lodash'), ts = require('typescript');
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8').replaceAll('\r\n', '\n');
const plain = value => JSON.parse(JSON.stringify(value));
const context = vm.createContext({ z, _, YAML: require('yaml'), $() {}, console: { warn() {} } });
vm.runInContext(read('../../Cultivation-Card-Game/脚本/变量结构.js')
  .replace(/^import .*;\n/, '').replace('export const Schema', 'const Schema'), context);
const backend = vm.runInContext('Schema', context);
const frontendModule = { exports: {} };
new Function('module', 'exports', 'require', '_', ts.transpileModule(read('../src/修仙状态栏/schema.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(frontendModule, frontendModule.exports, name => name.includes('cultivation-tasks') ? { normalizeTasks }
  : name.includes('cultivation-calendar') ? calendar : name.includes('string-array') ? { normalizeStringArray } : require(name), _);
const frontend = frontendModule.exports.Schema;
const schemas = [backend, frontend];
let checks = 0;
const equal = (actual, expected, message) => {
  assert.deepEqual(plain(actual), plain(expected), message);
  checks++;
};

// 迁移只补齐新字段；旧收益、作用与领取起点都必须保留。
const claimDate = { 年: 31, 月: 7, 日: 13, 时辰: '酉时' };
const facility = {
  境界: '元婴后期', 品质: '地',
  效果: { 概况: '筑基中期，玄品；三亩', 培育: '培育判定加150', 用料: '青玉砖20块' },
  每月产出: '每月青灵草2株；改造前另有1株待领取', 上次收取日期: claimDate,
};
const asset = {
  类型: '宗门', 名气: 123, 人员规模: 12,
  所在地: { 世界: '凡界', 地域: '中原', 具体地点: '青山' },
  现状: '正常', 设施: { 灵田: facility }, 分配人物: ['张三'],
};
const input = { 固定资产: { 青云宗: asset } }, snapshot = structuredClone(input);
for (const schema of schemas) {
  const parsed = schema.parse(input);
  equal(parsed.固定资产.青云宗, asset, '新字段完整读取');
  equal(schema.parse(plain(parsed)).固定资产, parsed.固定资产, '保存后再次读取幂等');
}
equal(input, snapshot, '迁移不能修改输入存档');

const legacyCases = [
  [{ 效果: { 概况: '境界：筑基中期，品质：玄；三亩' } }, '筑基中期', '玄'],
  [{ 效果: { 概况: '金丹后期 / 黄品 / 投产于五月' } }, '金丹后期', '黄'],
  [{ 效果: { 概况: '境界=返虚中期；地阶' }, 境界: ' ', 品质: '?' }, '返虚中期', '地'],
  [{ 效果: { 概况: '练气初期，黄阶' } }, '练气初期', '黄'],
  [{ 效果: { 概况: '结丹后期，地品' } }, '结丹后期', '地'],
  [{ 效果: { 概况: '筑基期，玄品' } }, '筑基期', '玄'],
  [{ 效果: { 说明: '普通设施' } }, '未定', '凡'],
  [{ 境界: null, 品质: '' }, '未定', '凡'],
  [{ 境界: '凡人', 品质: '凡' }, '凡人', '凡'],
  [{ 境界: ' 化神后期 ', 品质: ' 天品 ' }, '化神后期', '天'],
];
for (const [legacy, realm, quality] of legacyCases) {
  const original = { ...legacy, 每月产出: '每月1株', 上次收取日期: claimDate };
  const oldState = { 固定资产: { 青云宗: { 类型: '宗门', 声望: '125点', 设施: { 灵田: original } } } };
  const oldSnapshot = structuredClone(oldState), outputs = [];
  for (const schema of schemas) {
    const state = schema.parse(oldState), actual = state.固定资产.青云宗;
    equal(actual.名气, 125, '兼容旧声望字段');
    equal(actual.设施.灵田, { ...original, 境界: realm, 品质: quality, 效果: legacy.效果 ?? {} }, '旧元数据迁移且原内容保留');
    equal(schema.parse(state).固定资产, state.固定资产, '旧设施迁移幂等');
    outputs.push(actual);
  }
  equal(outputs[0], outputs[1], '前后端迁移结果一致');
  equal(oldState, oldSnapshot, '旧设施输入未被原地更改');
}

// calendar 预处理不能把字符串设施展开为字符键，或把数组设施转成普通对象。
for (const facilities of [
  { 灵田: '化神初期，天品' },
  [{ 名称: '灵田', 效果: '化神初期，天品' }],
]) {
  for (const schema of schemas) {
    const state = schema.parse({ 固定资产: { 青云宗: { 设施: facilities } } });
    equal(state.固定资产.青云宗.设施.灵田, {
      境界: '化神初期', 品质: '天', 效果: { 说明: '化神初期，天品' }, 每月产出: '无', 上次收取日期: null,
    }, '旧字符串/数组设施兼容');
    equal(schema.parse(state).固定资产, state.固定资产, '字符串迁移后再次解析稳定');
  }
}
for (const rawFacility of [undefined, null, {}, '']) {
  for (const schema of schemas) {
    const state = schema.parse({ 固定资产: { 青云宗: { 设施: { 灵田: rawFacility } } } });
    equal(state.固定资产.青云宗.名气, 0, '旧资产名气默认值');
    equal(state.固定资产.青云宗.设施.灵田, {
      境界: '未定', 品质: '凡', 效果: {},
      每月产出: '无', 上次收取日期: null,
    }, '无元数据设施不凭空指定境界');
  }
}
for (const [reputation, expected] of [[undefined, 0], [null, 0], ['', 0], [-7, 0], ['-12点', 0], [12.9, 12], ['21.8点', 21]]) {
  for (const schema of schemas) {
    equal(schema.parse({ 固定资产: { 青云宗: { 名气: reputation } } }).固定资产.青云宗.名气,
      expected, '名气非负整数归一化');
  }
}

// 使用真实 JSONPatch 预处理器，随后模拟 MVU 对 set/insert 命令的赋值并交给两份真实 Schema。
const preprocess = vm.runInContext('jsonPatchPreprocessor', context);
const splitPath = vm.runInContext('splitPath', context);
const parseValue = vm.runInContext('tryParseValue', context);
function command(op, path, value) {
  return {
    type: op === 'add' ? 'insert' : 'set', reason: 'json_patch', full_match: JSON.stringify({ op, path, value }),
    args: op === 'add' ? ['', '', JSON.stringify(value)] : ['', JSON.stringify(value)],
  };
}
function runCommands(initial, commands) {
  const variables = { stat_data: backend.parse(initial) }, count = commands.length;
  preprocess(variables, commands);
  equal(commands.length, count, '新字段更新不能被丢弃');
  for (const cmd of commands) {
    const path = [...splitPath(cmd.args[0])];
    if (cmd.type === 'insert') path.push(String(parseValue(cmd.args[1])));
    _.set(variables.stat_data, path, parseValue(cmd.args.at(-1)));
  }
  const actual = backend.parse(variables.stat_data);
  equal(frontend.parse(variables.stat_data).固定资产, actual.固定资产, '更新后前后端一致');
  equal(backend.parse(actual).固定资产, actual.固定资产, '更新后再次解析稳定');
  return actual;
}
const inserted = runCommands({ 固定资产: { 青云宗: { 类型: '宗门' } } }, [
  command('add', '/固定资产/青云宗/设施/灵田', { ...facility, 多余字段: true }),
  command('replace', '/固定资产/青云宗/名气', 123),
]);
equal(inserted.固定资产.青云宗.设施.灵田, facility, '插入设施不裁掉境界品质，仍裁掉未知字段');
equal(inserted.固定资产.青云宗.名气, 123, '单字段名气写入');
const replacement = { ...facility, 境界: '化神初期', 品质: '天' };
const replaced = runCommands(input, [command('replace', '/固定资产/青云宗/设施/灵田', replacement)]);
equal(replaced.固定资产.青云宗.设施.灵田, replacement, '完整设施替换保留新字段');
const modified = runCommands(input, [
  command('replace', '/固定资产/青云宗/设施/灵田/境界', '化神中期'),
  command('replace', '/固定资产/青云宗/设施/灵田/品质', '天'),
  command('replace', '/固定资产/青云宗/名气', '150.7点'),
]);
equal(modified.固定资产.青云宗.设施.灵田, { ...facility, 境界: '化神中期', 品质: '天' }, '独立写入不影响其余设施字段');
equal(modified.固定资产.青云宗.名气, 150, '单字段写入仍进行数值归一化');
const addedAsset = runCommands({}, [command('add', '/固定资产/青云宗', asset)]);
equal(addedAsset.固定资产.青云宗, asset, '完整宗门插入的两级白名单均保留新字段');

console.log(`PASS: ${checks} asset schema, migration, nonmutation, legacy calendar and JSONPatch checks.`);
