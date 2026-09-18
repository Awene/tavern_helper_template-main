import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { normalizeStringArray } from '../util/string-array.ts';
const require = createRequire(import.meta.url);
const _ = require('lodash');
const { z } = require('zod');
const ts = require('typescript');
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../src/面板美化/正文美化.html');
const card = read('../../Cultivation-Card-Game/脚本/变量结构.js');
const ctx = vm.createContext({ _, z, $: () => {} });
vm.runInContext(card.replace(/^import .*;\r?\n/, '').replace('export const Schema', 'const Schema'), ctx);
const mvuNormalize = vm.runInContext('normalizeStringArray', ctx);
const mvuSchema = vm.runInContext('Schema', ctx);
const parserStart = html.indexOf('      function normalizeStringArray(input)');
const parserEnd = html.indexOf('      // —— 5 个 beautifyRow', parserStart);
const parser = vm.runInNewContext(
  html.slice(parserStart, parserEnd) + '\n({ normalizeStringArray, parseCharIndentedPanel });',
);
const tableStart = html.indexOf('      function parseTablePanel(content)');
const itemStart = html.indexOf('      const ITEM_TYPE_ICON');
const itemEnd = html.indexOf('      function renderItemCard', itemStart);
const item = vm.runInNewContext(
  html.slice(tableStart, parserStart) +
    html.slice(itemStart, itemEnd) +
    '\n({ parseTablePanel, _flattenItemSections });',
  { _, normalizeStringArray },
);
const plain = value => JSON.parse(JSON.stringify(value));
const renderStart = html.indexOf('      const CHAR_HEADER_FIELDS');
const renderEnd = html.indexOf('      function _isPersonHeader', renderStart);
const renderer = vm.runInNewContext(
  html.slice(renderStart, renderEnd) + '\n({ renderCharHtml, renderItemHtml });',
  { _, normalizeStringArray },
);
const cases = [
  [undefined, []],
  [null, []],
  ['', []],
  ['[]', []],
  ['[ ]', []],
  ['{}', []],
  [
    ['命中:4', '攻击力:450000'],
    ['命中:4', '攻击力:450000'],
  ],
  ['["命中:4", "攻击力:450000"]', ['命中:4', '攻击力:450000']],
  ["['命中:4', '攻击力:450000']", ['命中:4', '攻击力:450000']],
  ['[命中:4][攻击力:450000]', ['命中:4', '攻击力:450000']],
  ['[[命中:4],[攻击力:450000]]', ['命中:4', '攻击力:450000']],
  ['［“命中：4”，“攻击力：450000”］', ['命中:4', '攻击力:450000']],
  ['命中:4，攻击力:450000', ['命中:4', '攻击力:450000']],
  ['- "命中:4"\n- "攻击力:450000"', ['命中:4', '攻击力:450000']],
  ['- 命中:4 / - 攻击力:450000', ['命中:4', '攻击力:450000']],
  [
    [null, ['命中:4', '命中:4'], { 攻击力: 450000 }],
    ['命中:4', '攻击力:450000'],
  ],
  [{ 命中: 4, 攻击力: 450000 }, ['命中:4', '攻击力:450000']],
  ['["阅读进度:0/10", "描述:遇火,遇水", "选择:甲|乙"]', ['阅读进度:0/10', '描述:遇火,遇水', '选择:甲|乙']],
  ['["命中:4", null, "攻击力:450000",]', ['命中:4', '攻击力:450000']],
  ['["命中:4", "攻击力:450000"', ['命中:4', '攻击力:450000']],
];
let checks = 0;
for (const [input, expected] of cases) {
  for (const normalize of [normalizeStringArray, mvuNormalize, parser.normalizeStringArray]) {
    assert.deepEqual(plain(normalize(input)), expected, JSON.stringify(input));
    assert.deepEqual(plain(normalize(normalize(input))), expected, 'idempotence');
    checks += 2;
  }
}
for (const tags of ['["命中:4", "攻击力:450000"]', '[命中:4][攻击力:450000]', "['命中:4','攻击力:450000']"]) {
  const body = `姓名: 测试\n身份: ["执事", "散修"]\n装备:\n  剑:\n    类型: 法宝\n    标签: ${tags}`;
  const data = parser.parseCharIndentedPanel(body);
  assert.equal(data.tree.find(n => n.key === '身份').value, '["执事","散修"]');
  assert.equal(
    data.tree.find(n => n.key === '装备').children[0].children.find(n => n.key === '标签').value,
    '["命中:4","攻击力:450000"]',
  );
  const cards = item._flattenItemSections(item.parseTablePanel(`{剑}\n| 类型: 法宝 |\n| 标签: ${tags} |`));
  assert.deepEqual(plain(cards[0].标签), ['命中:4', '攻击力:450000']);
  const renderedChar = renderer.renderCharHtml(data);
  const renderedItem = renderer.renderItemHtml(item.parseTablePanel(`{剑}\n| 类型: 法宝 |\n| 标签: ${tags} |`));
  assert(renderedChar.includes('450000') && renderedChar.includes('命中'));
  assert(renderedItem.includes('450000') && renderedItem.includes('命中'));
  assert(!renderedChar.includes('&quot;执事&quot;'));
  checks += 3;
  checks += 3;
}
const block = parser.parseCharIndentedPanel('姓名: 测试\n标签：\n  - "命中:4"\n  - "攻击力:450000"');
assert.equal(block.tree.find(n => n.key === '标签').value, '["命中:4","攻击力:450000"]');
const escaped = item._flattenItemSections(
  item.parseTablePanel('{剑}\n| 标签: ["描述:甲,乙", "选择:甲|乙"] | 数量: 1 |'),
);
assert.deepEqual(plain(escaped[0].标签), ['描述:甲,乙', '选择:甲|乙']);
checks += 2;
const exports = {};
const schemaJs = ts.transpileModule(read('../src/修仙状态栏/schema.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
vm.runInNewContext(schemaJs, {
  exports,
  require: name => (name.includes('string-array') ? { normalizeStringArray } : require(name)),
  _,
});
for (const schema of [mvuSchema, exports.Schema]) {
  const data = schema.parse({
    身份: '[散修][执事]',
    灵根: { 五行: '[金,水]' },
    物品: { 剑: { 标签: '[命中:4][攻击力:450000]' } },
  });
  assert.deepEqual(plain(data.身份), ['散修', '执事']);
  assert.deepEqual(plain(data.灵根.五行), ['金', '水']);
  assert.deepEqual(plain(data.物品.剑.标签), ['命中:4', '攻击力:450000']);
  checks += 3;
}
console.log(`PASS: ${checks} array normalization, panel, and schema checks.`);
