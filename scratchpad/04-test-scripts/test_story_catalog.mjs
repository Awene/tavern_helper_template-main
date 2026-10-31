import assert from 'node:assert/strict';
import fs from 'node:fs';
import { config, store, exporter } from './test_start_selection.mjs';
let checks = 0;
const check = (v, msg) => {
  assert.ok(v, msg);
  checks++;
};
const general = ['story-zayou', 'story-yinyu', 'story-fuchou', 'story-dadao', 'story-fan-zhigen', 'story-fan-renjian', 'story-wanderer-auction'];
const removed = ['story-tianxuan-zayou', 'story-lingfeng-yueye', 'story-liuli-baicao', 'story-nanjiang-fox'];
check(config.stories.length === 22, '22 remaining stories');
for (const id of general.filter(id => id !== 'story-wanderer-auction')) {
  const story = config.findStory(id);
  check(story.body.length >= 300 && story.constraints.必须人形, id + ' concrete scene and matching shape constraint');
}
for (const id of removed) check(!config.findStory(id), 'deleted story absent');
for (const story of config.stories) {
  check(story.类型 === (general.includes(story.id) ? '通用' : '特殊'), story.id + ' category');
  const c = story.constraints || {};
  store.resetAll();
  store.setRace(c.种族?.[0] || '人族');
  const loc =
    c.locationIds?.[0] ||
    config.locations.find(l => !c.regionIds || c.regionIds.includes(config.findLocationPath(l.id).region.id)).id;
  store.selectLocation(loc);
  store.setGender(c.性别 || (c.性别禁止?.includes('男') ? '女' : '男'));
  store.setVirgin(c.元阳元阴状态 ?? true);
  store.toggleRootElement(c.灵根五行任意?.[0] || '水');
  store.selectMenpai(c.门派归属?.[0] || '');
  const sel = JSON.parse(JSON.stringify(store.selection));
  check(config.isStoryAvailable(story, sel), story.id + ' reachable');
  check(config.whyStoryUnavailable(story, sel).length === 0, story.id + ' reasons consistent');
  store.selectStory(story.id);
  const data = exporter.buildInitialStatData(store.selection);
  const prompt = exporter.generateAIPrompt(store.selection);
  check(!/凡人(?:初期|中期|后期)/.test(prompt), story.id + ' no mortal subrealm in prompt');
  check(data.修炼进度.境界 === config.realmLabel(story.settings.初始境界), story.id + ' exported realm');
  if (story.settings.初始境界.大境界 !== '凡人') {
    check(
      !config.isStoryAvailable(story, { ...sel, root: { ...sel.root, elements: ['无'] } }),
      story.id + ' cultivator needs root',
    );
  } else {
    check(story.settings.初始境界.小境界 === '' && data.寿元.寿命 === 100, story.id + ' mortal data');
  }
  if (c.种族)
    for (const race of config.races) {
      if (!c.种族.includes(race.name))
        check(!config.isStoryAvailable(story, { ...sel, 种族: race.name }), story.id + ' race restriction');
    }
  if (c.必须人形) {
    for (const race of config.races.filter(r => r.canChooseTransformation && (!c.种族 || c.种族.includes(r.name)))) {
      check(
        !config.isStoryAvailable(story, { ...sel, 种族: race.name, 种族可化形: false }),
        story.id + ' shape restriction',
      );
    }
  }
}
// 通用开局覆盖三界、九族；两个凡人开局不把凡人等同于人族或凡体。
for (const id of general)
  for (const race of config.races) {
    const story = config.findStory(id);
    store.resetAll();
    store.setRace(race.name);
    store.toggleRootElement(id === 'story-fan-zhigen' ? '无' : '水');
    store.setRaceTransformation(!!story.constraints?.必须人形);
    for (const world of config.LOCATION_WORLDS) {
      if (!config.isWorldAvailable(world.name, race.name)) continue;
      store.selectLocation(world.regions[0].children[0].id);
      check(config.isStoryAvailable(story, store.selection), id + race.name + world.name);
    }
  }
check(config.realmLabel({ 大境界: '凡人', 小境界: '初期' }) === '凡人', 'legacy mortal realm');
store.presets.push({ id: 'removed-story', name: '旧剧本', selection: { ...store.selection, storyId: removed[0] } });
store.loadPreset('removed-story');
check(store.selection.storyId === null, 'removed preset story cleared');
const legacyCustom = { ...config.emptyCustomStory(), id: 'legacy-mortal', name: '凡人', body: '日常', 类型: '散修' };
legacyCustom.settings.初始境界 = { 大境界: '凡人', 小境界: '初期' };
store.presets.push({ id: 'legacy-mortal', name: '旧凡人', selection: { ...store.selection, customStory: legacyCustom, storyId: legacyCustom.id } });
store.loadPreset('legacy-mortal');
check(store.selection.customStory.类型 === '通用' && store.selection.customStory.settings.初始境界.小境界 === '', 'custom preset migration');
check(!exporter.generateAIPrompt(store.selection).includes('凡人初期'), 'custom legacy prompt');
console.log(`${checks} story catalog checks passed.`);

if (process.argv.includes('--csv-patch')) {
  const filename = 'D:/application/Tavern/mod/世界书/Cultivation-Card-Game/Doc/开局清单.csv';
  const old = fs.readFileSync(filename, 'utf8');
  const header = old.replace(/^\uFEFF/, '').split(/\r?\n/)[0];
  const quote = v => '"' + String(v ?? '').replaceAll('"', '""') + '"';
  const rows = config.stories.map((s, i) => {
    const c = s.constraints || {};
    const t = s.settings.时间;
    const requirements = [...config.describeConstraints(c)];
    if (s.settings.初始境界.大境界 !== '凡人') requirements.unshift('须有灵根');
    requirements.push('出生地须对种族开放（冥界仅冥族）');
    const notes = [];
    if (s.类型 === '通用') notes.push('正文适配所选界域、种族与形态；宗门沿用玩家选择');
    if (s.id === 'story-fan-zhigen') notes.push('无灵根凡人，秘法尚未施行；植根及修炼在后续剧情结算');
    if (s.id === 'story-fan-renjian') notes.push('凡人不等于人族、凡体或无灵根；不设小境界');
    if (s.id === 'story-liuli-shennong') notes.push('神农血脉限定人族；剧情含引气过程，开局变量为炼气初期');
    if (s.id === 'story-wudu-init') notes.push('进食与血肉生理限定生物类人形');
    if (s.id === 'story-wanderer-spirit-plant') notes.push('自然灵物成灵，支持水灵、木灵等本体；种类自由填写');
    if (c.剧本指定种类) notes.push('本体由剧本指定，输入须留空；可化形不等于登场时必须保持人形');
    if (c.locationIds || c.regionIds) notes.push('固定地点与已知宗门所在世界均校验');
    notes.push('返回重选及预设读取时撤销失效选择');
    return [
      i + 1,
      s.id,
      s.name,
      s.subtitle,
      s.类型,
      s.剧情 ? '是' : '否',
      s.recommend,
      s.desc,
      `${t.年}-${String(t.月).padStart(2, '0')}-${String(t.日).padStart(2, '0')} ${t.时辰 || ''}`,
      s.类型 === '通用' ? '随所选门派；未选为散修' : s.settings.宗门,
      config.realmLabel(s.settings.初始境界),
      requirements.join('；'),
      c.种族?.join(' / ') || '不限主种族',
      c.种族?.length === 1 && c.种族[0] === '人族' ? '是' : '否',
      c.必须人形 ? '天然人形或开启可化形' : '不限制化形开关',
      c.种族细分必须为空 ? '是' : '否',
      c.剧本指定种类 || '无',
      notes.join('；'),
      (s.tags || []).join(' / '),
    ]
      .map(quote)
      .join(',');
  });
  const next = header + '\n' + rows.join('\n');
  console.log(
    '*** Begin Patch\n*** Update File: ' +
      filename +
      '\n@@\n' +
      old
        .trimEnd()
        .split(/\r?\n/)
        .map(l => '-' + l)
        .join('\n') +
      '\n' +
      next
        .split('\n')
        .map(l => '+' + l)
        .join('\n') +
      '\n*** End Patch',
  );
}
