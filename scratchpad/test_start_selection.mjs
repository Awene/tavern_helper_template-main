import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const { createPinia, setActivePinia } = require('pinia');
const cache = new Map();
const storage = new Map();
const context = {
  console,
  _: require('lodash'),
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  setTimeout: () => 1,
  clearTimeout: () => {},
};
function load(filename) {
  filename = path.resolve(filename);
  if (!path.extname(filename)) {
    filename = fs.existsSync(filename + '.ts') ? filename + '.ts' : path.join(filename, 'index.ts');
  }
  if (cache.has(filename)) return cache.get(filename).exports;
  if (filename.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
  const module = { exports: {} };
  cache.set(filename, module);
  const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = id => (id.startsWith('.') ? load(path.resolve(path.dirname(filename), id)) : require(id));
  vm.runInNewContext('(function(require,module,exports){' + js + '\n})', context)(localRequire, module, module.exports);
  return module.exports;
}
const base = path.resolve('src/自定义开局');
const config = load(path.join(base, 'config'));
const rules = load(path.join(base, 'selectionRules'));
const { useStartStore } = load(path.join(base, 'store'));
setActivePinia(createPinia());
const store = useStartStore();
let checks = 0;
const check = (value, message) => {
  assert.ok(value, message);
  checks++;
};
const underworld = config.locations.filter(l => l.世界 === '冥界');
check(underworld.length === 5, 'five underworld biomes');
check(config.findRace('冥族').detailLabel && config.findRace('域外异类').detailLabel, 'race detail inputs');
for (const race of config.races) {
  for (const loc of underworld) {
    check(config.isLocationAvailable(loc.id, race.name) === (race.name === '冥族'), race.name + loc.name);
  }
}
const mortal = config.locations.find(l => l.世界 === '凡界');
store.setRace('冥族');
store.setRaceDetail('幽魂');
store.toggleRootElement('水');
store.selectLocation(underworld[1].id);
store.selectMenpai('玄津宫');
store.selectStory('story-yinyu');
check(store.selection.storyId === 'story-yinyu', 'valid underworld story');
store.selection.道号 = '测试';
store.setRace('人族');
check(
  store.selection.locationId === null && store.selection.storyId === null && store.selection.门派归属 === '',
  'race switch clears dependent choices',
);
check(store.selection.种族细分 === '' && store.selection.道号 === '测试', 'race detail reset, unrelated name retained');
store.selectLocation(underworld[0].id);
check(store.selection.locationId === null, 'direct invalid location rejected');
store.selectLocation(mortal.id);
store.selectStory('story-yinyu');
store.setRace('域外异类');
check(store.selection.locationId === mortal.id && store.selection.storyId === 'story-yinyu', 'valid choices retained');
store.setRaceDetail('虚空巨兽');
store.toggleRootElement('水');
store.toggleRootElement('无');
check(store.selection.storyId === null, 'root change invalidates story');

// 每类约束均通过同一个 store 联动；使用独立测试剧本避免依赖内容命名。
const scenarios = [
  [{ 种族: ['人族'] }, () => store.setRace('冥族')],
  [{ 性别: '男' }, () => store.setGender('女')],
  [{ 元阳元阴必须: true }, () => store.setVirgin(false)],
  [{ 种族细分必须为空: true }, () => store.setRaceDetail('幽魂')],
  [{ physiqueTier: ['凡体'] }, () => store.selectPhysiqueTier('灵体')],
  [{ 必须人形: true }, () => store.setRaceTransformation(false), '妖族'],
  [
    { locationIds: [mortal.id] },
    () => store.selectLocation(config.locations.find(l => l.id !== mortal.id && l.世界 === '凡界').id),
  ],
  [{ 门派归属: ['散修'] }, () => store.selectMenpai('')],
];
for (const [constraints, mutate, race = '人族'] of scenarios) {
  store.resetAll();
  store.toggleRootElement('水');
  store.setRace(race);
  store.selectLocation(mortal.id);
  store.selectMenpai('散修');
  const story = { ...config.stories.find(s => s.id === 'story-yinyu'), id: 'test-constraint', constraints };
  config.stories.push(story);
  store.selectStory(story.id);
  check(store.selection.storyId === story.id, 'initial constraint satisfied');
  mutate();
  check(store.selection.storyId === null, 'changed constraint clears story');
  config.stories.pop();
}
store.resetAll();
store.toggleRootElement('水');
store.setRace('冥族');
store.selectLocation(underworld[1].id);
store.selectMenpai('玄津宫');
const custom = store.setCustomStory({
  ...config.emptyCustomStory(),
  name: '冥界开局',
  body: '阴都街市',
  settings: { ...config.emptyCustomStory().settings, 宗门: '玄津宫' },
});
store.selectStory(custom.id);
check(rules.isSelectedStoryValid(store.selection), 'custom underworld story valid');
store.selectLocation(mortal.id);
check(
  store.selection.门派归属 === '' && store.selection.storyId === null,
  'world switch clears known sect and custom selection',
);
check(store.selection.customStory.body === '阴都街市', 'custom text preserved');
store.presets.push({
  id: 'bad',
  name: '旧预设',
  selection: { ...store.selection, 种族: '人族', locationId: underworld[1].id, storyId: custom.id, 门派归属: '玄津宫' },
});
store.loadPreset('bad');
check(
  store.selection.locationId === null && store.selection.storyId === null && store.selection.门派归属 === '',
  'invalid preset reconciled',
);
check(store.toast.includes('请重选'), 'preset correction explained');
store.setRace('冥族');
store.selectLocation(underworld[1].id);
store.selectStory(custom.id);
store.selection.customStory.body = '';
check(store.selection.storyId === null, 'edited invalid custom story deselected');
check(!!rules.selectionConflict(store.selection), 'submission detects missing story');
check(new Set(config.locations.map(l => l.id)).size === config.locations.length, 'location IDs unique');
check(!config.isSectAvailable('玄津宫（外门弟子）', mortal.id), 'sect suffix cannot bypass world restriction');
const exporter = load(path.join(base, 'export'));
store.setRaceDetail('幽魂');
store.selectStory('story-yinyu');
const data = exporter.buildInitialStatData(store.selection);
check(data.地点.世界 === '冥界' && data.地点.具体地点 === '阴都盆地', 'export underworld location');
check(data.__custom_start__.race_detail === '幽魂', 'export race detail');
check(exporter.generateAIPrompt(store.selection).includes('冥族（幽魂）'), 'prompt race detail');
const rejected = await exporter.commitJourney({ ...store.selection, 种族: '人族' });
check(!rejected.ok && rejected.reason.includes('冥界'), 'invalid commit rejected before external calls');
console.log(`${checks} custom-start selection checks passed.`);
export { load, config, store, exporter, check };
