<template>
  <section class="xy-page xy-page-rumors">
    <div class="xy-rumor-filter">
      <button
        :class="['xy-chip', { active: state.rumorFilter === 'all' }]"
        @click="state.rumorFilter = 'all'"
      >
        全部 <em>{{ store.data.传闻.length }}</em>
      </button>
      <button
        v-for="g in rumorGroups"
        :key="g.key"
        :class="['xy-chip', { active: state.rumorFilter === g.key }]"
        @click="state.rumorFilter = g.key"
      >
        {{ g.label }} <em>{{ countByGroup(g.types) }}</em>
      </button>
    </div>

    <div v-if="filteredRumors.length === 0" class="xy-empty">
      <div class="xy-empty-mark">寂</div>
      <p>风平浪静，未闻新事</p>
    </div>

    <div v-else class="xy-rumor-list">
      <article v-for="(r, i) in filteredRumors" :key="i" class="xy-rumor" :class="['xy-rumor-' + rumorGroup(r.类型)]">
        <button
          type="button"
          class="xy-trash"
          title="删除此传闻"
          @click.stop="requestDelete('rumor', String(store.data.传闻.indexOf(r)), r.类型)"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
          </svg>
        </button>
        <div class="xy-rumor-head">
          <div class="xy-rumor-seal">
            <span>{{ r.类型 }}</span>
          </div>
          <div class="xy-rumor-meta">
            <div class="xy-rumor-time">{{ r.时间 || '不知何时' }}</div>
            <div class="xy-rumor-source">— <EditableValue v-model="r.来源" label="来源" :format="(v) => v || '不知何处'" /></div>
          </div>
        </div>
        <div class="xy-rumor-body"><EditableValue v-model="r.内容" label="内容" multiline :rows="3" /></div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import EditableValue from './EditableValue.vue';
import {
  state,
  rumorGroups,
  filteredRumors,
  countByGroup,
  rumorGroup,
  requestDelete,
} from '../composables';

const store = useDataStore();
</script>
