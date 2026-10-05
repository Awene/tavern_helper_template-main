<template>
  <article
    class="xy-task-card is-event"
    :class="{
      'xy-task-ready': task.状态 === '待平息' || task.状态 === '待结算',
      'xy-collapsible-open': state.editMode || isCardOpen('task', taskName),
    }"
  >
    <!-- 删除按钮 -->
    <button
      type="button"
      class="xy-trash"
      title="删除此事件"
      @click.stop="$emit('delete')"
    >
      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
      </svg>
    </button>

    <!-- 模式二头部：缘 / 劫 / 平 -->
    <div
      class="xy-task-head xy-collapsible-head"
      role="button"
      tabindex="0"
      :aria-expanded="state.editMode || isCardOpen('task', taskName)"
      :title="isCardOpen('task', taskName) ? '点击收起详情' : '点击展开详情'"
      @click="toggleCard('task', taskName)"
      @keydown.enter.self.prevent="toggleCard('task', taskName)"
      @keydown.space.self.prevent="toggleCard('task', taskName)"
    >
      <!-- 印章：平 / 劫 / 缘 -->
      <span class="xy-task-seal" aria-hidden="true">{{ eventSeal }}</span>

      <!-- 事件名 -->
      <span class="xy-task-title">
        <EditableValue
          :model-value="taskName"
          label="事件名"
          @update:model-value="$emit('rename', String($event))"
        />
        <CopyNameButton :text="taskName" label="事件名" />
      </span>

      <!-- 状态 -->
      <select v-if="state.editMode" v-model="task.状态" class="xy-task-status-select" @click.stop>
        <option value="进行中">进行中</option>
        <option value="待平息">待平息</option>
        <option value="待结算">待结算</option>
        <option value="待抉择">待抉择</option>
      </select>
      <span
        v-else
        :class="['xy-task-status', { ready: task.状态 === '待平息' || task.状态 === '待结算' }]"
      >
        {{ task.状态 }}
      </span>

      <!-- 难度胶囊 -->
      <span v-if="task.难度 || state.editMode" class="xy-task-difficulty">
        <EditableValue v-model="task.难度" label="难度" />
      </span>

      <!-- 触发时间简报 -->
      <span class="xy-task-deadline-brief">
        {{ eventTimeString }}
      </span>
    </div>

    <!-- 模式二主体：奇遇/突发事件/危机结构 -->
    <div v-show="state.editMode || isCardOpen('task', taskName)" class="xy-task-body xy-collapsible-body">
      <!-- 局势（可选） -->
      <div v-if="task.局势 || state.editMode" class="xy-task-objective">
        <span class="xy-task-field-label">局势</span>
        <EditableValue v-model="task.局势" label="局势" multiline :rows="2" />
      </div>

      <!-- 契机（可选） -->
      <div v-if="task.契机 || state.editMode" class="xy-task-objective">
        <span class="xy-task-field-label">契机</span>
        <EditableValue v-model="task.契机" label="契机" multiline :rows="2" />
      </div>

      <!-- 焦点 -->
      <div class="xy-task-objective">
        <span class="xy-task-field-label">焦点</span>
        <EditableValue v-model="task.焦点" label="焦点" multiline :rows="2" />
      </div>

      <!-- 进展 -->
      <div class="xy-task-progress">
        <span class="xy-task-field-label">进展</span>
        <EditableValue v-model="task.进展" label="进展" multiline :rows="2" />
      </div>

      <!-- 态势 / 牵涉 / 祸福 -->
      <div class="xy-task-details">
        <div v-if="task.态势 || state.editMode" class="xy-task-detail">
          <span>态势</span>
          <strong><EditableValue v-model="task.态势" label="态势" /></strong>
        </div>
        <div v-if="task.牵涉 || state.editMode" class="xy-task-detail">
          <span>牵涉</span>
          <strong><EditableValue v-model="task.牵涉" label="牵涉" multiline :rows="2" /></strong>
        </div>
        <div v-if="task.祸福 || state.editMode" class="xy-task-detail">
          <span>祸福</span>
          <strong><EditableValue v-model="task.祸福" label="祸福" multiline :rows="2" /></strong>
        </div>
      </div>

      <!-- 紧迫 -->
      <div class="xy-task-deadline">
        <span class="xy-task-field-label">紧迫</span>
        <span v-if="task.紧迫 || state.editMode">
          <EditableValue v-model="task.紧迫" label="紧迫" />
        </span>
        <span v-else>局势平缓</span>
        <template v-if="task.截止时间">
          <span :class="{ overdue: isOverdue(task.截止时间, currentTime) }">
            （{{ formatTime(task.截止时间) }}{{ isOverdue(task.截止时间, currentTime) ? ' · 已逾期' : '' }}）
          </span>
        </template>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { isCardOpen, state, toggleCard } from '../composables';
import CopyNameButton from './CopyNameButton.vue';
import EditableValue from './EditableValue.vue';
import { formatTime, getEventTimeString, isOverdue, type TaskTime } from './taskShared';

const props = defineProps<{
  task: any;
  taskName: string;
  currentTime: TaskTime;
}>();

defineEmits<{
  (e: 'rename', newName: string): void;
  (e: 'delete'): void;
}>();

const eventSeal = computed(() => {
  if (props.task.状态 === '待平息') return '平';
  if (/险|劫|凶|危/.test(props.task.态势 || '')) return '劫';
  return '缘';
});

const eventTimeString = computed(() => getEventTimeString(props.task, props.currentTime));
</script>
