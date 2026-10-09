import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { load, config, store, exporter } from './test_start_selection.mjs';

const source = fs.readFileSync(new URL('../src/自定义开局/config/items.ts', import.meta.url), 'utf8');
const exports = {};
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports });
assert(exports.ITEM_KINDS_BY_CATEGORY.物品.includes('阵物'));
assert(!exports.ITEM_KINDS_BY_CATEGORY.功法.includes('阵物'));
assert(exports.ITEM_KINDS_BY_CATEGORY.功法.includes('阵法'));
assert(exports.EFFECT_SUPPORTED_KINDS.has('阵物'));
assert(!exports.ALL_ITEM_KINDS.includes('阵盘'));
assert(!exports.ALL_ITEM_KINDS.includes('阵旗'));

store.resetAll();
store.setRace('人族');
store.selectLocation(config.locations.find(l => l.世界 === '凡界').id);
store.toggleRootElement('水');
store.selectStory('story-zayou');
const selection = JSON.parse(JSON.stringify(store.selection));
selection.customItems = ['聚灵阵盘', '聚灵阵旗'].map((name, i) => ({
  id: `formation-test-${i}`, name, desc: '聚灵阵的结阵器物', category: '物品', 类型: '阵物',
  品质: '玄', 境界: '筑基', 五行: '水', 数量: 2,
  效果: { 回灵: '聚灵阵运转期间，每回合结束恢复75灵气' },
}));
const data = exporter.buildInitialStatData(selection);
for (const item of selection.customItems) {
  assert.equal(data.物品[item.name].类型, '阵物');
  assert.equal(data.物品[item.name].数量, 2);
  assert.equal(data.物品[item.name].效果.回灵, item.效果.回灵);
  assert(!data.装备[item.name]);
  assert(!data.功法[item.name]);
  assert(!data.物品[item.name].标签.some(tag => /^(攻击力|灵气容量):/.test(tag)));
}
assert(exporter.generateAIPrompt(selection).includes('阵物'));
console.log('19 formation category and custom-start export checks passed.');
const { normalizeItemForMvu } = load('src/自定义开局/itemNormalizer.ts');
let count = 0;
for (const it of config.items) {
  assert(!['阵盘', '阵旗'].includes(it.类型), it.name);
  if (it.类型 === '阵法') assert.equal(it.category, '功法', it.name);
  if (it.类型 === '阵物') assert.equal(it.category, '物品', it.name);
  if (/阵盘|阵旗/.test(it.name)) assert.equal(it.category, '物品', it.name);
  if (it.category !== '灵石') assert.equal(normalizeItemForMvu(it).类型, it.类型, it.name);
  count++;
}
for (const story of config.stories) {
  for (const it of config.plotItemsForStory(story.id)) {
    assert(!['阵盘', '阵旗'].includes(it.类型), story.id);
    if (/阵盘|阵旗/.test(it.name)) assert.equal(it.category, '物品', story.id);
    if (it.类型 === '阵法') assert.equal(it.category, '功法', story.id);
    count++;
  }
}
console.log(count + ' initial/catalog/story item entries audited.');
