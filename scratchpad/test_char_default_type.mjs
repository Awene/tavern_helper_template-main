import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/面板美化/正文美化.html', import.meta.url), 'utf8');
const start = source.indexOf('      function normalizeStringArray(input)');
const end = source.indexOf('      // —— 5 个 beautifyRow', start);
assert(start >= 0 && end > start);
const parse = vm.runInNewContext(`${source.slice(start, end)}\nparseCharIndentedPanel;`);
const normalized = input => JSON.parse(JSON.stringify(parse(input)));
const body = '姓名: 测试人物\n体质:\n  元阳: false\n  元阴: null\n装备:\n  青锋剑:\n    类型: 法宝\n    描述: 测试装备';
const explicit = normalized(`类型: 人物\n${body}`);
assert.deepEqual(normalized(body), explicit);
assert.deepEqual(
  normalized(
    body
      .split('\n')
      .map(line => `  ${line}`)
      .join('\n'),
  ),
  explicit,
);
assert.equal(explicit.tree.find(node => node.key === '装备').children[0].children[0].value, '法宝');
assert.equal(normalized(`类型: 灵兽\n${body}`).tree[0].value, '灵兽');
assert.equal(normalized(`类型: 人物\n${body}`).tree.filter(node => node.key === '类型').length, 1);
assert.equal(normalized('').items.length, 0);
assert.equal(normalized('  \n\n').items.length, 0);
console.log('PASS: 7 char_info default-type checks; omitted and explicit types produce identical render input.');
