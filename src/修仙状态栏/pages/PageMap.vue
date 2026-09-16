<template>
  <section class="xy-page xy-page-map">
    <!-- 左上角：地图选择器（树形）-->
    <div class="xy-map-selector" :class="{ open: pickerOpen }">
      <button
        type="button"
        class="xy-map-current"
        :title="pickerOpen ? '关闭地图选择' : '切换查看的地图'"
        @click="pickerOpen = !pickerOpen"
      >
        <span class="xy-map-current-world">{{ selected.世界 }}</span>
        <span class="xy-map-current-sep">/</span>
        <span class="xy-map-current-region">{{ selected.地域 }}</span>
        <span v-if="isHere(selected.世界, selected.地域)" class="xy-map-here-flag">所在</span>
        <span class="xy-map-caret">{{ pickerOpen ? '▴' : '▾' }}</span>
      </button>
      <transition name="xy-fade">
        <div v-if="pickerOpen" class="xy-map-tree" @click.stop>
          <div v-for="world in tree" :key="world.name" class="xy-map-tree-world">
            <button
              type="button"
              class="xy-map-tree-world-head"
              :class="{ open: worldOpen[world.name] }"
              @click="worldOpen[world.name] = !worldOpen[world.name]"
            >
              <span class="xy-collapse-caret">▾</span>
              <span class="xy-map-tree-world-name">{{ world.name }}</span>
              <span class="xy-map-tree-count">{{ world.regions.length }}</span>
            </button>
            <div v-show="worldOpen[world.name]" class="xy-map-tree-region-list">
              <button
                v-for="region in world.regions"
                :key="region"
                type="button"
                class="xy-map-tree-region"
                :class="{
                  active: selected.世界 === world.name && selected.地域 === region,
                  here: isHere(world.name, region),
                  empty: !getMap(world.name, region),
                }"
                :title="
                  getMap(world.name, region)
                    ? `查看 ${world.name} · ${region} 地图`
                    : `${world.name} · ${region}（暂无地图）`
                "
                @click="selectRegion(world.name, region)"
              >
                <span class="xy-map-tree-dot" />
                <span class="xy-map-tree-region-name">{{ region }}</span>
                <span v-if="isHere(world.name, region)" class="xy-map-here-mini">所在</span>
                <span v-if="!getMap(world.name, region)" class="xy-map-empty-mini">无</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 主显示区 -->
    <div class="xy-map-stage">
      <div class="xy-map-stage-head">
        <span class="xy-map-stage-title">{{ mapTitle }}</span>
      </div>

      <div class="xy-map-stage-body">
        <img
          v-if="currentMap"
          :src="currentMap"
          :alt="mapTitle"
          class="xy-map-img"
          @click="openLightbox(currentMap, 'map')"
        />
        <div v-else class="xy-map-empty">
          <div class="xy-map-empty-mark">舆</div>
          <p>「{{ selected.世界 }} · {{ selected.地域 }}」暂无地图</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useDataStore } from '../store';
import { openLightbox } from '../composables';
import underworldMap from '../maps/冥界/冥界地图.png?url';

// ============ 世界地图 ============
// 既有地图保持远程加载，不要全部用 `import ...png?url` 内联（webpack 会转 base64 塞进 index.html，
// 5 张约 3.5MB 的地图会把 index.html 撑到 ~24MB，超过 jsDelivr 20MB 单文件上限导致整页加载失败）。
// 改为以仓库自身为图床，经 jsDelivr 逐张加载（每张 <20MB 可正常服务）。
// 正式地图固定到已发布版本；发版时与新 tag 一起核验，禁止跟随 latest。
// 冥界新图约 3MB，单独内联，避免依赖尚未发布的 CDN 文件；构建后仍需保持 HTML 小于 20MB。
const MAP_CDN_BASE =
  (window as Window & { __CULTIVATION_MAP_BASE__?: string }).__CULTIVATION_MAP_BASE__ ||
  'https://testingcf.jsdelivr.net/gh/Awene/tavern_helper_template-main@v1.0.57/src/修仙状态栏/maps';

const MAPS: Record<string, Record<string, string>> = {
  凡界: {
    东土: `${MAP_CDN_BASE}/凡界/东土地图.png`,
    中原: `${MAP_CDN_BASE}/凡界/中原地图.png`,
    北境: `${MAP_CDN_BASE}/凡界/北境地图.png`,
    南疆: `${MAP_CDN_BASE}/凡界/南疆地图.png`,
    西域: `${MAP_CDN_BASE}/凡界/西域地图.png`,
  },
  灵界: {
    沧溟大陆: `${MAP_CDN_BASE}/灵界/沧溟大陆地图.png`,
    圣银大陆: `${MAP_CDN_BASE}/灵界/圣银大陆地图.png`,
    星坠大陆: `${MAP_CDN_BASE}/灵界/星坠大陆地图.png`,
    灵境大陆: `${MAP_CDN_BASE}/灵界/灵境大陆地图.png`,
    太初大陆: `${MAP_CDN_BASE}/灵界/太初大陆地图.png`,
    万兽大陆: `${MAP_CDN_BASE}/灵界/万兽大陆地图.png`,
    殒落大陆: `${MAP_CDN_BASE}/灵界/殒落大陆地图.png`,
  },
  冥界: { 全图: underworldMap },
  仙界: {},
};

const store = useDataStore();

// ============ 树结构（来自打包地图 + 当前所在地）============
const DEFAULT_TREE_ORDER = ['凡界', '灵界', '冥界', '仙界'] as const;
const REGION_ORDER: Record<string, string[]> = {
  凡界: ['中原', '东土', '西域', '北境', '南疆'],
  灵界: ['沧溟大陆', '圣银大陆', '星坠大陆', '灵境大陆', '太初大陆', '万兽大陆', '殒落大陆'],
  冥界: ['全图'],
  仙界: [],
};

function mapRegion(world: string, region: string): string {
  if (world === '冥界') return '全图';
  return world === '灵界' && region === '陨落大陆' ? '殒落大陆' : region;
}

const tree = computed(() => {
  const here = store.data?.地点;
  return DEFAULT_TREE_ORDER.map(worldName => {
    const ordered = REGION_ORDER[worldName] ?? [];
    const fromMaps = Object.keys(MAPS[worldName] ?? {});
    const merged: string[] = [];
    for (const r of ordered) if (!merged.includes(r)) merged.push(r);
    for (const r of fromMaps) if (!merged.includes(r)) merged.push(r);
    const hereRegion = here ? mapRegion(here.世界, here.地域) : '';
    if (here && here.世界 === worldName && hereRegion && !merged.includes(hereRegion)) {
      merged.push(hereRegion);
    }
    return { name: worldName, regions: merged };
  });
});

function getMap(world: string, region: string): string {
  return MAPS[world]?.[mapRegion(world, region)] || '';
}
function isHere(world: string, region: string): boolean {
  const here = store.data?.地点;
  return !!here && here.世界 === world && mapRegion(world, here.地域) === region;
}

// ============ 选中状态 ============
const selected = reactive<{ 世界: string; 地域: string }>({
  世界: store.data?.地点?.世界 || '凡界',
  地域: mapRegion(store.data?.地点?.世界 || '凡界', store.data?.地点?.地域 || '中原'),
});

const currentMap = computed(() => getMap(selected.世界, selected.地域));
const mapTitle = computed(() => (selected.世界 === '冥界' ? '冥界全图' : `${selected.世界} · ${selected.地域}地图`));

// 玩家所在地变化 → 若用户没手动切换，跟随
watch(
  () => [store.data?.地点?.世界, store.data?.地点?.地域] as const,
  ([world, region], [prevWorld, prevRegion]) => {
    if (!world || (!region && world !== '冥界')) return;
    if (selected.世界 === prevWorld && selected.地域 === mapRegion(prevWorld || '', prevRegion || '')) {
      selected.世界 = world;
      selected.地域 = mapRegion(world, region || '');
    }
  },
);

// ============ 树面板开合 ============
const pickerOpen = ref(false);
const worldOpen = reactive<Record<string, boolean>>({
  凡界: true,
  灵界: false,
  冥界: false,
  仙界: false,
});

function selectRegion(world: string, region: string) {
  selected.世界 = world;
  selected.地域 = region;
  pickerOpen.value = false;
}
</script>
