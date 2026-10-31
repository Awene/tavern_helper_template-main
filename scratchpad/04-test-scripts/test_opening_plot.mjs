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

store.resetAll();store.toggleRootElement('水');store.setRace('人族');store.selectLocation('eco-nj-yuzhang');store.selectMenpai('五毒教');store.selectStory('story-wudu-init');store.selection.道号='初始化检查';
check(store.selection.storyId === 'story-wudu-init','special start selected');
const {buildInitialStatData,generateAIPrompt}=load(path.join(base,'export'));
const result=buildInitialStatData(store.selection), name='万毒祖窟·噬心蛊鸣';
const {CultivationStatusSchema}=load(path.resolve(base,'../修仙状态栏/schema'));
check(CultivationStatusSchema.parse(result).历练[name].阶段==='第一幕','full frontend schema accepts initial record');
check(result.事件.聚焦模式==='自动' && result.事件.标题===name && result.历练[name].本幕进行中===true,'free mode initialized');
check(result.历练[name].阶段==='第一幕','first stage initialized');
check(result.功法.噬心蛊经 && result.物品['《百毒经》'] && result.物品.司南之石,'established inventory initialized');
check(!result.物品['《噬心蛊经·筑基篇》'],'future reward absent');
check(result.__custom_start__.story==='story-wudu-init','opening authority saved');
check(generateAIPrompt(store.selection).includes('不重复发放或重复输出首幕 task_info'),'opening handoff sent');
check(generateAIPrompt(store.selection).includes('吞下五彩怪果、昏迷后苏醒'),'opening narrative must include ingestion and awakening');
check(generateAIPrompt(store.selection).includes('入门试炼仍未完成'),'opening must not complete trial');
check(generateAIPrompt(store.selection).includes('司南只能辨南北'),'compass does not locate ancestor cave');
check(JSON.stringify(buildInitialStatData(store.selection).历练)===JSON.stringify(result.历练),'repeat construction stable');
store.selectStory('story-yinyu');const ordinary=buildInitialStatData(store.selection);
check(Object.keys(ordinary.历练).length===0,'other starts unchanged');
console.log(`PASS ${checks} actual opening initializer checks.`);
