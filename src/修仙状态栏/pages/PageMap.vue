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
                :title="getMap(world.name, region) ? `查看 ${world.name} · ${region} 地图` : `${world.name} · ${region}（暂无地图）`"
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
        <span class="xy-map-stage-title">{{ selected.世界 }} · {{ selected.地域 }}地图</span>
      </div>

      <div class="xy-map-stage-body">
        <img
          v-if="currentMap"
          :src="currentMap"
          :alt="`${selected.世界} ${selected.地域}地图`"
          class="xy-map-img"
          @click="openLightbox(currentMap)"
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

// ============ 打包进来的世界地图 ============
import 凡界_东土 from '../maps/凡界/东土地图.png?url';
import 凡界_中原 from '../maps/凡界/中原地图.png?url';
import 凡界_北境 from '../maps/凡界/北境地图.png?url';
import 凡界_南疆 from '../maps/凡界/南疆地图.png?url';
import 凡界_西域 from '../maps/凡界/西域地图.png?url';

const MAPS: Record<string, Record<string, string>> = {
  凡界: {
    东土: 凡界_东土,
    中原: 凡界_中原,
    北境: 凡界_北境,
    南疆: 凡界_南疆,
    西域: 凡界_西域,
  },
  灵界: {},
  仙界: {},
};

const store = useDataStore();

// ============ 树结构（来自打包地图 + 当前所在地）============
const DEFAULT_TREE_ORDER = ['凡界', '灵界', '仙界'] as const;
const REGION_ORDER: Record<string, string[]> = {
  凡界: ['中原', '东土', '西域', '北境', '南疆'],
  灵界: [],
  仙界: [],
};

const tree = computed(() => {
  const here = store.data?.地点;
  return DEFAULT_TREE_ORDER.map(worldName => {
    const ordered = REGION_ORDER[worldName] ?? [];
    const fromMaps = Object.keys(MAPS[worldName] ?? {});
    const merged: string[] = [];
    for (const r of ordered) if (!merged.includes(r)) merged.push(r);
    for (const r of fromMaps) if (!merged.includes(r)) merged.push(r);
    if (here && here.世界 === worldName && here.地域 && !merged.includes(here.地域)) {
      merged.push(here.地域);
    }
    return { name: worldName, regions: merged };
  });
});

function getMap(world: string, region: string): string {
  return MAPS[world]?.[region] || '';
}
function isHere(world: string, region: string): boolean {
  const here = store.data?.地点;
  return !!here && here.世界 === world && here.地域 === region;
}

// ============ 选中状态 ============
const selected = reactive<{ 世界: string; 地域: string }>({
  世界: store.data?.地点?.世界 || '凡界',
  地域: store.data?.地点?.地域 || '中原',
});

const currentMap = computed(() => getMap(selected.世界, selected.地域));

// 玩家所在地变化 → 若用户没手动切换，跟随
watch(
  () => [store.data?.地点?.世界, store.data?.地点?.地域] as const,
  ([world, region], [prevWorld, prevRegion]) => {
    if (!world || !region) return;
    if (selected.世界 === prevWorld && selected.地域 === prevRegion) {
      selected.世界 = world;
      selected.地域 = region;
    }
  },
);

// ============ 树面板开合 ============
const pickerOpen = ref(false);
const worldOpen = reactive<Record<string, boolean>>({
  凡界: true,
  灵界: false,
  仙界: false,
});

function selectRegion(world: string, region: string) {
  selected.世界 = world;
  selected.地域 = region;
  pickerOpen.value = false;
}
</script>
