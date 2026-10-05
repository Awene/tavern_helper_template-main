<template>
  <section class="xy-page xy-page-tasks">
    <!-- 编辑模式工具栏：清晰提供 3 种模式的新增操作 -->
    <div v-if="state.editMode" class="xy-asset-toolbar xy-task-toolbar">
      <span>历练事项与各字段均可编辑；完成或平息后直接删除。</span>
      <div class="xy-task-add-btns">
        <button type="button" class="xy-effect-add" @click="addTask">＋ 新增委托</button>
        <button type="button" class="xy-effect-add" @click="addEvent">＋ 新增奇遇/事件</button>
        <button type="button" class="xy-effect-add" @click="addPlot">＋ 新增剧情</button>
      </div>
    </div>

    <!-- 筛选状态 Chip 组 -->
    <div v-if="!_.isEmpty(tasks)" class="xy-rumor-filter">
      <button type="button" :class="['xy-chip', { active: taskFilter === 'all' }]" @click="taskFilter = 'all'">
        全部 <em>{{ Object.keys(tasks).length }}</em>
      </button>
      <button type="button" :class="['xy-chip', { active: taskFilter === '进行中' }]" @click="taskFilter = '进行中'">
        进行中 <em>{{ runningCount }}</em>
      </button>
      <button type="button" :class="['xy-chip', { active: taskFilter === '待结算' }]" @click="taskFilter = '待结算'">
        待结算/待平息 <em>{{ settlementCount }}</em>
      </button>
    </div>

    <!-- 空状态 -->
    <div v-if="_.isEmpty(tasks) && !state.editMode" class="xy-empty">
      <div class="xy-empty-mark">闲</div>
      <p>当前没有进行中的历练事项（任务或事件）</p>
    </div>

    <div v-else-if="_.isEmpty(filteredTasks)" class="xy-empty xy-empty-soft">
      <div class="xy-empty-mark">·</div>
      <p>该状态下暂无历练事项</p>
    </div>

    <!-- 历练事项网格：3 种模式组件分离呈现，结构直观解耦 -->
    <div v-else class="xy-task-grid">
      <template v-for="(task, taskName) in filteredTasks" :key="taskName">
        <!-- 模式三：长线剧情/宿命事件（专属大纲驱动·统一紫色风格） -->
        <TaskCardPlot
          v-if="resolveMode(task, String(taskName)) === 'plot'"
          :task="task"
          :task-name="String(taskName)"
          :current-time="store.data.时间"
          @rename="renameTask(String(taskName), $event)"
          @delete="requestDelete('task', String(taskName), String(taskName))"
        />

        <!-- 模式二：奇遇/突发事件/危机（快进快出结构） -->
        <TaskCardEvent
          v-else-if="resolveMode(task, String(taskName)) === 'event'"
          :task="task"
          :task-name="String(taskName)"
          :current-time="store.data.时间"
          @rename="renameTask(String(taskName), $event)"
          @delete="requestDelete('task', String(taskName), String(taskName))"
        />

        <!-- 模式一：委托任务（契约委托结构） -->
        <TaskCardQuest
          v-else
          :task="task"
          :task-name="String(taskName)"
          :current-time="store.data.时间"
          @rename="renameTask(String(taskName), $event)"
          @delete="requestDelete('task', String(taskName), String(taskName))"
        />
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, ref } from 'vue';
import { isCardOpen, requestDelete, showToast, state, toggleCard } from '../composables';
import { useDataStore } from '../store';
import TaskCardEvent from './TaskCardEvent.vue';
import TaskCardPlot from './TaskCardPlot.vue';
import TaskCardQuest from './TaskCardQuest.vue';
import { getTaskMode, type TaskMode, type TaskTime } from './taskShared';

const store = useDataStore();
const tasks = computed(() => store.data.任务);
const taskFilter = ref<'all' | '进行中' | '待结算'>('all');

const runningCount = computed(() => Object.values(tasks.value).filter(task => task.状态 === '进行中').length);
const settlementCount = computed(
  () => Object.values(tasks.value).filter(task => task.状态 === '待结算' || task.状态 === '待平息').length,
);

const filteredTasks = computed(() => {
  if (taskFilter.value === 'all') return tasks.value;
  if (taskFilter.value === '待结算') {
    return _.pickBy(tasks.value, task => task.状态 === '待结算' || task.状态 === '待平息');
  }
  return _.pickBy(tasks.value, task => task.状态 === taskFilter.value);
});

type TaskEntry = (typeof store.data.任务)[string];
type TaskRecord = Record<string, TaskEntry>;

function resolveMode(task: any, taskName: string): TaskMode {
  const activeStoryTitle = store.data.事件 && store.data.事件.标题;
  return getTaskMode(task, taskName, activeStoryTitle);
}

function uniqueName(record: TaskRecord, base: string): string {
  if (!(base in record)) return base;
  let index = 2;
  while (`${base}${index}` in record) index += 1;
  return `${base}${index}`;
}

/** 新增模式一：委托任务 */
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
    触发时间: null,
    态势: '',
    紧迫: '',
    牵涉: '',
    焦点: '',
    祸福: '',
  };
  if (!isCardOpen('task', name)) toggleCard('task', name);
}

/** 新增模式二：奇遇/事件/危机 */
function addEvent() {
  const name = uniqueName(tasks.value, '新奇遇');
  tasks.value[name] = {
    状态: '进行中',
    态势: '机缘',
    难度: '未定',
    紧迫: '局势平缓',
    触发时间: newTime(),
    牵涉: '',
    焦点: '',
    进展: '',
    祸福: '',
    委托方: '',
    目标: '',
    奖励: '',
    交付: '',
    截止时间: null,
  };
  if (!isCardOpen('task', name)) toggleCard('task', name);
}

/** 新增模式三：长线剧情/宿命事件 */
function addPlot() {
  const name = uniqueName(tasks.value, '新剧情');
  tasks.value[name] = {
    类别: '剧情',
    状态: '进行中',
    幕次: '第一幕',
    难度: '未定',
    局势: '',
    契机: '',
    焦点: '',
    进展: '',
    牵涉: '',
    祸福: '',
    紧迫: '局势平缓',
    委托方: '',
    目标: '',
    奖励: '',
    交付: '',
    截止时间: null,
    触发时间: null,
    态势: '',
  };
  if (!isCardOpen('task', name)) toggleCard('task', name);
}

function renameTask(oldName: string, rawName: string) {
  const newName = rawName.trim();
  if (!newName || newName === oldName) return;
  if (/[~/]/.test(newName)) {
    showToast('名称不能包含 / 或 ~');
    return;
  }
  if (newName in tasks.value) {
    showToast(`“${newName}”已存在，未覆盖原数据`);
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
</script>
