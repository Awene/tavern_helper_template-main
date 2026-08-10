import { parseReincarnation } from './parser';

const assert = {
  equal(actual: unknown, expected: unknown) {
    if (actual !== expected) throw new Error(`断言失败：${String(actual)} !== ${String(expected)}`);
  },
  deepEqual(actual: unknown, expected: unknown) {
    const actualText = JSON.stringify(actual);
    const expectedText = JSON.stringify(expected);
    if (actualText !== expectedText) throw new Error(`断言失败：${actualText} !== ${expectedText}`);
  },
  ok(value: unknown) {
    if (!value) throw new Error('断言失败：值应为真');
  },
};

const canonical = parseReincarnation(`
{亡魂信息}
| 亡魂:[沈青] | 生卒: 年[37岁] | 生前境界:[筑基后期] | 死因:[渡劫失败] |
{善业}
| 救济青石村：+20 |
| 舍身护道：+80 |
{恶业}
| 误杀凡人：-5 |
{功过修正}
| 功过修正: Z[+20%] / W[-3] |
`);
assert.deepEqual(canonical.亡魂, { name: '沈青', years: 37, realm: '筑基后期', cause: '渡劫失败' });
assert.deepEqual(canonical.善业, [
  { t: '救济青石村', p: 20 },
  { t: '舍身护道', p: 80 },
]);
assert.deepEqual(canonical.恶业, [{ t: '误杀凡人', p: 5 }]);
assert.equal(canonical.Z, 0.2);
assert.equal(canonical.W, -3);

const renderedHtml = parseReincarnation(`
<p>【亡魂资料】</p>
<p>姓名：陆离｜享年：２８岁｜境界：金丹初期｜死亡原因：灵气逆流</p>
<p>【善行】</p>
<p>救下商队（＋２０）<br>护送灾民 +５</p>
<p>【罪业】</p>
<table><tr><th>事迹</th><th>分值</th></tr><tr><td>夺人机缘</td><td>－２０</td></tr></table>
<p>【业力修正】</p><p>Z＝－１０％ / W＝＋８</p>
`);
assert.deepEqual(renderedHtml.亡魂, { name: '陆离', years: 28, realm: '金丹初期', cause: '灵气逆流' });
assert.deepEqual(renderedHtml.善业, [
  { t: '救下商队', p: 20 },
  { t: '护送灾民', p: 5 },
]);
assert.deepEqual(renderedHtml.恶业, [{ t: '夺人机缘', p: 20 }]);
assert.equal(renderedHtml.Z, -0.1);
assert.equal(renderedHtml.W, 8);

const looseMarkdown = parseReincarnation(`
判官翻开生死簿，开始宣判。
### 死者信息
死者: 顾长风 | 年龄: 41 | 修为: 元婴中期 | 死因: 与魔修同归于尽
### 功德
| 事迹 | 点数 |
| --- | --- |
| 度化亡魂 | +80 |
### 恶行
- 欺瞒同门 -5
### 善恶修正
Z = 0.25，W = 4
后文即使多出一句，也不影响面板。
`);
assert.deepEqual(looseMarkdown.亡魂, {
  name: '顾长风',
  years: 41,
  realm: '元婴中期',
  cause: '与魔修同归于尽',
});
assert.deepEqual(looseMarkdown.善业, [{ t: '度化亡魂', p: 80 }]);
assert.deepEqual(looseMarkdown.恶业, [{ t: '欺瞒同门', p: 5 }]);
assert.equal(looseMarkdown.Z, 0.25);
assert.equal(looseMarkdown.W, 4);

const partial = parseReincarnation(`{善业}\n| ...列出全部善业 |\n{恶业}\n| 此处填写 |\n{功过修正}\nZ[0%] W[0]`, {
  name: '当前玩家',
  years: 19,
  realm: '炼气初期',
  cause: '未知',
});
assert.deepEqual(partial.亡魂, { name: '当前玩家', years: 19, realm: '炼气初期', cause: '未知' });
assert.deepEqual(partial.善业, []);
assert.deepEqual(partial.恶业, []);
assert.ok(partial.warnings.length > 0);

console.info('轮回转生解析测试通过：规范格式、HTML、Markdown、全角符号、别名、负修正与缺字段兜底。');
