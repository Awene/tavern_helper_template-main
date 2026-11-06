import assert from 'node:assert/strict';
import { config, store, exporter, load } from './test_start_selection.mjs';
import path from 'node:path';
const rules = load(path.resolve('src/自定义开局/selectionRules.ts'));
const story = config.findStory('story-sect-last-lamp');
store.resetAll();
store.setRace('人族');
store.toggleRootElement('水');
store.selectLocation(config.locations.find(l => l.世界 === '凡界').id);
store.selectStory(story.id);
assert.equal(store.selection.storyId, story.id, '未命名时仍可先选剧本');
assert.match(rules.selectionConflict(store.selection), /名称/);
assert.throws(() => exporter.buildInitialStatData(store.selection), /名称/);
store.selection.开局宗门名称 = '  青灯宗  ';
const selection = JSON.parse(JSON.stringify(store.selection));
assert.equal(rules.selectionConflict(selection), undefined);
const data = exporter.buildInitialStatData(selection);
assert.deepEqual(Array.from(data.身份), ['青灯宗宗主']);
assert.equal(data.宗门, '青灯宗');
assert(data.地点.具体地点.endsWith('青灯宗-祠堂'));
const schema = load(path.resolve('src/修仙状态栏/schema.ts')).Schema;
const migrated = schema.parse(data);
assert.equal(JSON.stringify(migrated.固定资产), JSON.stringify(data.固定资产), '真实 MVU Schema 保留全部开局资产');
const sect = data.固定资产.青灯宗;
assert.equal(sect.人员规模, 2);
assert.equal(sect.名气, 0);
assert.equal(Object.keys(sect.设施).length, 3);
for (const facility of Object.values(sect.设施)) {
  assert.equal(facility.每月产出, '无');
  assert.equal(JSON.stringify(facility.上次收取日期), JSON.stringify(data.时间));
}
const prompt = exporter.generateAIPrompt(selection);
assert(prompt.includes('青灯宗宗主') && prompt.includes('初始资产：') && prompt.includes('破旧祠堂'));
assert(!prompt.includes('玩家所属：散修'));
assert(!config.isStoryAvailable(story, { ...selection, 门派归属: '琉璃丹宗' }));
assert(!config.isStoryAvailable(story, { ...selection, root: { ...selection.root, elements: ['无'] } }));
assert(!config.isStoryAvailable(story, { ...selection, 种族: '妖族', 种族可化形: false }));
assert(!config.isStoryAvailable(story, { ...selection, locationId: config.locations.find(l => l.世界 === '地球').id }));
assert(config.isStoryAvailable(story, { ...selection, locationId: config.locations.find(l => l.世界 === '灵界').id }));
store.presets.push({ id: 'sect-test', name: '宗门开局', selection });
store.loadPreset('sect-test');
assert.equal(store.selection.开局宗门名称, '青灯宗');
store.selectStory('story-yinyu');
assert.equal(Object.keys(exporter.buildInitialStatData(store.selection).固定资产).length, 0, '切换开局不残留宗门');
for (const name of ['', '散修', '__proto__', 'a'.repeat(31), '山\n门', '<山门>']) {
  assert(config.startingSectNameError(story, { ...selection, 开局宗门名称: name }));
}
console.log('PASS: sect naming, persistence, constraints, identities, initial assets and prompt consistency.');
