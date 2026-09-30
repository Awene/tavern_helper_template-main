import assert from 'node:assert/strict';
import { config, store, exporter } from './test_start_selection.mjs';
const nether = ['story-zayou', 'story-yinyu', 'story-fuchou', 'story-dadao', 'story-wanderer-auction', 'story-fan-zhigen', 'story-fan-renjian'];
const dual = ['story-wanderer-artifact-spirit', 'story-wanderer-wild-beast', 'story-wanderer-cave-relic', 'story-wanderer-spirit-plant', 'story-bloodpool-demon-sword'];
let checks = 0;
for (const story of config.stories) {
  const expected = story.id.startsWith('story-earth-') ? ['地球'] : nether.includes(story.id) ? ['凡界', '灵界', '冥界'] : dual.includes(story.id) ? ['凡界', '灵界'] : ['凡界'];
  assert.deepEqual(Array.from(story.constraints.世界), expected); checks++;
  for (const world of config.LOCATION_WORLDS) {
    store.resetAll();
    store.setRace(world.name === '冥界' ? '冥族' : '人族');
    store.selectLocation(world.regions[0].children[0].id);
    store.toggleRootElement(story.id === 'story-fan-zhigen' ? '无' : '水');
    store.setRaceTransformation(true);
    if (!expected.includes(world.name)) {
      assert(!config.isStoryAvailable(story, store.selection));
      assert(config.whyStoryUnavailable(story, store.selection).some(reason => reason.includes('开局世界')));
      checks += 2;
    } else if (world.name === '冥界') {
      assert(config.isStoryAvailable(story, store.selection), story.id);
      store.selectStory(story.id);
      assert.equal(exporter.buildInitialStatData(store.selection).地点.世界, '冥界');
      checks += 2;
    }
  }
}
store.resetAll(); store.selectLocation('eco-dt-liufang');
const herb = config.findStory('story-liuli-shennong');
assert(!config.isStoryAvailable(herb, store.selection));
store.toggleRootElement('木'); store.selectStory(herb.id);
assert.equal(exporter.buildInitialStatData(store.selection).修炼进度.境界, '凡人'); checks += 2;
console.log(`${checks} story world audit checks passed.`);
if (process.argv.includes('--catalog')) console.log(JSON.stringify(config.stories.map(s => ({
  id:s.id, name:s.name, subtitle:s.subtitle, kind:s.类型, plot:!!s.剧情, recommend:s.recommend || '', desc:s.desc,
  time:s.settings.时间, sect:s.settings.宗门, realm:config.realmLabel(s.settings.初始境界),
  constraints:config.describeConstraints(s.constraints), worlds:s.constraints.世界,
  race:s.constraints.种族, shape:s.constraints.必须人形, tags:s.tags || [],
}))));
