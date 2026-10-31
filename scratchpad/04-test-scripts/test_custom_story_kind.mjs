/**
 * 实证测试：自创剧本的分类修复
 *  1. deriveCustomStoryKind：按宗门推导，永不产生「特殊」
 *  2. customStoryToOption：历史遗留的「特殊」会被清洗
 *  3. 剧情物品按 storyId 匹配，自创剧本 id（cstory-*）永不命中
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// 用 ts-node 加载真实源码
const tsnode = require('ts-node');
tsnode.register({
  transpileOnly: true,
  skipProject: true, // 不读项目 tsconfig（其 moduleResolution 为 bundler，与 CJS 冲突）
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
    esModuleInterop: true,
    target: 'es2020',
    skipLibCheck: true,
  },
});

const {
  deriveCustomStoryKind,
  customStoryToOption,
  emptyCustomStory,
  findStory,
} = require('../src/自定义开局/config/stories.ts');
const { plotItemsForStory } = require('../src/自定义开局/config/plotItems.ts');

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

// —— 1. deriveCustomStoryKind ——
console.log('【deriveCustomStoryKind】');
check('宗门 → 宗门', deriveCustomStoryKind('琉璃丹宗') === '宗门');
check('散修 → 散修', deriveCustomStoryKind('散修') === '散修');
check('空 → 散修', deriveCustomStoryKind('') === '散修');
check('带后缀宗门 → 宗门', deriveCustomStoryKind('天玄剑宗（外门杂役）') === '宗门');
check('永不等于 特殊', ['宗门', '散修', '宗门', '散修'].map(x => deriveCustomStoryKind(x)).every(k => k !== '特殊'));

// —— 2. customStoryToOption 清洗历史「特殊」 ——
console.log('【customStoryToOption 归一化】');
const legacy = {
  id: 'cstory-abc',
  name: '旧档',
  desc: '',
  body: '正文',
  类型: '特殊', // 历史遗留
  settings: {
    时间: { 年: 7200, 月: 1, 日: 1, 时辰: '辰时' },
    宗门: '琉璃丹宗',
    初始境界: { 大境界: '炼气', 小境界: '初期' },
  },
};
const option = customStoryToOption(legacy);
check('遗留 特殊 + 宗门 → 宗门', option.类型 === '宗门');

const legacySansect = { ...legacy, 类型: '特殊', settings: { ...legacy.settings, 宗门: '散修' } };
check('遗留 特殊 + 散修 → 散修', customStoryToOption(legacySansect).类型 === '散修');

// —— 3. 剧情物品按 storyId 匹配，自创永不命中 ——
console.log('【剧情物品匹配】');
// 复刻 store.setCustomStory 的 id 生成
const customId = 'cstory-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
check('自创 id 以 cstory- 开头', customId.startsWith('cstory-'));
check('plotItemsForStory(自创) 为空', plotItemsForStory(customId).length === 0);
check('plotItemsForStory(null) 为空', plotItemsForStory(null).length === 0);
// 预设剧情剧本仍能正确命中（回归：未破坏正常剧情剧本）
const wudu = plotItemsForStory('story-wudu-init');
check('预设 story-wudu-init 命中 3 件', wudu.length === 3);
const twin = plotItemsForStory('story-guanghan-twin-fish');
check('预设 story-guanghan-twin-fish 命中 1 件', twin.length === 1 && twin[0].name === '双鱼同心佩');

// —— 4. 新增：琉璃丹宗特殊开局 story-liuli-shennong ——
console.log('【story-liuli-shennong】');
const sn = findStory('story-liuli-shennong');
check('剧本存在', !!sn);
if (sn) {
  check('类型=特殊', sn.类型 === '特殊');
  check('剧情=true', sn.剧情 === true);
  check('初始境界=炼气初期', sn.settings.初始境界.大境界 === '炼气' && sn.settings.初始境界.小境界 === '初期');
  check('宗门=琉璃丹宗（林蘅芷引荐入谷）', sn.settings.宗门 === '琉璃丹宗（林蘅芷引荐入谷）');
  check('flags 含神农遗脉·无字玉简', (sn.flags || []).includes('神农遗脉·无字玉简'));
  check('约束 locationIds=[eco-dt-liufang]', (sn.constraints?.locationIds || []).includes('eco-dt-liufang'));
  check('约束 门派归属 允许 琉璃丹宗', (sn.constraints?.门派归属 || []).includes('琉璃丹宗'));
  check('约束 灵根禁无', (sn.constraints?.灵根禁止 || []).includes('无'));
  check('正文提及 林蘅芷/神农氏/识海/上古大能', sn.body.includes('林蘅芷') && sn.body.includes('神农氏') && sn.body.includes('识海') && sn.body.includes('上古大能'));
}
const yujian = plotItemsForStory('story-liuli-shennong');
check('story-liuli-shennong 命中 1 件', yujian.length === 1);
if (yujian[0]) {
  check('物品名=无字玉简', yujian[0].name === '无字玉简');
  check('品类=装备/饰品', yujian[0].category === '装备' && yujian[0].类型 === '饰品');
  check('品质=天', yujian[0].品质 === '天');
  check('位置字段省略（非合法枚举值）', !('位置' in yujian[0].data));
  check('效果含 无字辨方 + 不高于当前境界', !!yujian[0].data.效果?.['无字辨方'] && yujian[0].data.效果['无字辨方'].includes('不高于自身当前境界'));
}

// 空分类自定义剧本通过 customStoryToOption 后，plot 依旧为空（导出链路）
const empty = customStoryToOption(emptyCustomStory());
check('emptyCustomStory → 散修', empty.类型 === '散修');

console.log(`\n结果：${pass} 通过，${fail} 失败`);
process.exit(fail ? 1 : 0);
