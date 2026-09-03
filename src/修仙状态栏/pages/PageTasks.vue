<template>
  <section class="xy-page xy-page-tasks">
    <div v-if="state.editMode" class="xy-asset-toolbar xy-task-toolbar">
      <span>任务名与各字段均可编辑；完成、失败或放弃的任务应直接删除。</span>
      <button type="button" class="xy-effect-add" @click="addTask">＋ 新增任务</button>
    </div>

    <div v-if="!_.isEmpty(tasks)" class="xy-rumor-filter">
      <button type="button" :class="['xy-chip', { active: taskFilter === 'all' }]" @click="taskFilter = 'all'">
        全部 <em>{{ Object.keys(tasks).length }}</em>
      </button>
      <button type="button" :class="['xy-chip', { active: taskFilter === '进行中' }]" @click="taskFilter = '进行中'">
        进行中 <em>{{ runningCount }}</em>
      </button>
      <button type="button" :class="['xy-chip', { active: taskFilter === '待结算' }]" @click="taskFilter = '待结算'">
        待结算 <em>{{ settlementCount }}</em>
      </button>
    </div>

    <div v-if="_.isEmpty(tasks) && !state.editMode" class="xy-empty">
      <div class="xy-empty-mark">闲</div>
      <p>当前没有已接取的任务</p>
    </div>

    <div v-else-if="_.isEmpty(filteredTasks)" class="xy-empty xy-empty-soft">
      <div class="xy-empty-mark">·</div>
      <p>该状态下暂无任务</p>
    </div>

    <div v-else class="xy-task-grid">
      <article
        v-for="(task, taskName) in filteredTasks"
        :key="taskName"
        class="xy-task-card"
        :class="{
          'xy-task-ready': task.状态 === '待结算',
          'xy-collapsible-open': state.editMode || isCardOpen('task', String(taskName)),
        }"
      >
        <button
          type="button"
          class="xy-trash"
          title="删除此任务"
          @click.stop="requestDelete('task', String(taskName), String(taskName))"
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
            <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
          </svg>
        </button>

        <div
          class="xy-task-head xy-collapsible-head"
          role="button"
          tabindex="0"
          :aria-expanded="state.editMode || isCardOpen('task', String(taskName))"
          :title="isCardOpen('task', String(taskName)) ? '点击收起任务详情' : '点击展开任务详情'"
          @click="toggleCard('task', String(taskName))"
          @keydown.enter.self.prevent="toggleCard('task', String(taskName))"
          @keydown.space.self.prevent="toggleCard('task', String(taskName))"
        >
          <span class="xy-task-seal" aria-hidden="true">{{ task.状态 === '待结算' ? '成' : '令' }}</span>
          <span class="xy-task-title">
            <EditableValue
              :model-value="String(taskName)"
              label="任务名"
              @update:model-value="renameTask(String(taskName), String($event))"
            />
            <CopyNameButton :text="String(taskName)" label="任务名" />
          </span>
          <select v-if="state.editMode" v-model="task.状态" class="xy-task-status-select" @click.stop>
            <option value="进行中">进行中</option>
            <option value="待结算">待结算</option>
          </select>
          <span v-else :class="['xy-task-status', { ready: task.状态 === '待结算' }]">{{ task.状态 }}</span>
          <span v-if="task.难度" class="xy-task-difficulty">
            <EditableValue v-model="task.难度" label="难度" />
          </span>
          <span v-if="task.截止时间" class="xy-task-deadline-brief" :class="{ overdue: isOverdue(task.截止时间) }">
            {{ isOverdue(task.截止时间) ? '已逾期 · ' : '' }}{{ formatTime(task.截止时间, true) }}
          </span>
        </div>

        <div v-show="state.editMode || isCardOpen('task', String(taskName))" class="xy-task-body xy-collapsible-body">
          <div class="xy-task-objective">
            <span class="xy-task-field-label">目标</span>
            <EditableValue v-model="task.目标" label="目标" multiline :rows="2" />
          </div>

          <div class="xy-task-progress">
            <span class="xy-task-field-label">进展</span>
            <EditableValue v-model="task.进展" label="进展" multiline :rows="2" />
          </div>

          <div class="xy-task-details">
            <div class="xy-task-detail">
              <span>委托方</span>
              <strong><EditableValue v-model="task.委托方" label="委托方" /></strong>
            </div>
            <div class="xy-task-detail">
              <span>奖励</span>
              <strong><EditableValue v-model="task.奖励" label="奖励" multiline :rows="2" /></strong>
            </div>
            <div class="xy-task-detail">
              <span>交付</span>
              <strong><EditableValue v-model="task.交付" label="交付" multiline :rows="2" /></strong>
            </div>
          </div>

          <div class="xy-task-deadline">
            <span class="xy-task-field-label">期限</span>
            <template v-if="task.截止时间">
              <span v-if="!state.editMode" :class="{ overdue: isOverdue(task.截止时间) }">
                {{ formatTime(task.截止时间) }}{{ isOverdue(task.截止时间) ? '（已逾期）' : '' }}
              </span>
              <span v-else class="xy-asset-date-fields" @click.stop>
                <EditableValue v-model.number="task.截止时间.年" type="number" label="年" :min="1" />年
                <EditableValue v-model.number="task.截止时间.月" type="number" label="月" :min="1" :max="12" />月
                <EditableValue v-model.number="task.截止时间.日" type="number" label="日" :min="1" :max="30" />日
                <select v-model="task.截止时间.时辰" class="xy-asset-select xy-asset-select-time">
                  <option v-for="hour in hours" :key="hour" :value="hour">{{ hour }}</option>
                </select>
                <button type="button" class="xy-asset-date-clear" @click="task.截止时间 = null">设为无期限</button>
              </span>
            </template>
            <template v-else>
              <span>无期限</span>
              <button
                v-if="state.editMode"
                type="button"
                class="xy-asset-date-clear"
                @click="task.截止时间 = newTime()"
              >
                填写期限
              </button>
            </template>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, ref } from 'vue';
import { isCardOpen, requestDelete, showToast, state, toggleCard } from '../composables';
import { useDataStore } from '../store';
import CopyNameButton from './CopyNameButton.vue';
import EditableValue from './EditableValue.vue';

const store = useDataStore();
const tasks = computed(() => store.data.任务);
const taskFilter = ref<'all' | '进行中' | '待结算'>('all');
const runningCount = computed(() => Object.values(tasks.value).filter(task => task.状态 === '进行中').length);
const settlementCount = computed(() => Object.values(tasks.value).filter(task => task.状态 === '待结算').length);
const filteredTasks = computed(() =>
  taskFilter.value === 'all' ? tasks.value : _.pickBy(tasks.value, task => task.状态 === taskFilter.value),
);
const hours = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'] as const;

type TaskEntry = (typeof store.data.任务)[string];
type TaskRecord = Record<string, TaskEntry>;
type TaskTime = { 年: number; 月: number; 日: number; 时辰: string };

function uniqueName(record: TaskRecord, base: string): string {
  if (!(base in record)) return base;
  let index = 2;
  while (`${base}${index}` in record) index += 1;
  return `${base}${index}`;
}

function addTask() {
  const name = uniqueName(tasks.value, '新任务');
  tasks.value[name] = {
    状态: '进行中',
    委托方: '未知',
    难度: '未定',
    目标: '',
    进展: '',
    奖励: '无',
    交付: '无',
    截止时间: null,
  };
  if (!isCardOpen('task', name)) toggleCard('task', name);
}

function renameTask(oldName: string, rawName: string) {
  const newName = rawName.trim();
  if (!newName || newName === oldName) return;
  if (/[~/]/.test(newName)) {
    showToast('任务名不能包含 / 或 ~');
    return;
  }
  if (newName in tasks.value) {
    showToast(`任务“${newName}”已存在，未覆盖原数据`);
    return;
  }
  const entries = Object.entries(tasks.value).map(
    ([name, value]) => [name === oldName ? newName : name, value] as const,
  );
  for (const name of Object.keys(tasks.value)) delete tasks.value[name];
  for (const [name, value] of entries) tasks.value[name] = value;
}

function newTime(): TaskTime {
  const current = store.data.时间;
  return { 年: current.年, 月: current.月, 日: current.日, 时辰: current.时辰 };
}

function formatTime(time: TaskTime, compact = false): string {
  return compact ? `${time.年}年${time.月}月${time.日}日` : `修仙历${time.年}年${time.月}月${time.日}日 · ${time.时辰}`;
}

function timeValue(time: TaskTime): number {
  const hour = Math.max(0, hours.indexOf(time.时辰 as (typeof hours)[number]));
  return ((time.年 * 12 + time.月 - 1) * 30 + time.日 - 1) * 12 + hour;
}

function isOverdue(deadline: TaskTime): boolean {
  return timeValue(store.data.时间) > timeValue(deadline);
}
</script>
