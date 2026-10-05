<template>
  <article
    class="xy-task-card"
    :class="{
      'xy-task-ready': task.状态 === '待结算',
      'xy-collapsible-open': state.editMode || isCardOpen('task', taskName),
    }"
  >
    <!-- 删除按钮 -->
    <button
      type="button"
      class="xy-trash"
      title="删除此任务"
      @click.stop="$emit('delete')"
    >
      <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" aria-hidden="true">
        <path d="M9 3v1H4v2h16V4h-5V3H9zM6 8l1 13h10l1-13H6zm3 2h2v9H9v-9zm4 0h2v9h-2v-9z" />
      </svg>
    </button>

    <!-- 模式一头部：令 / 成 -->
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
      <!-- 印章：成 / 令 -->
      <span class="xy-task-seal" aria-hidden="true">{{ task.状态 === '待结算' ? '成' : '令' }}</span>

      <!-- 任务名 -->
      <span class="xy-task-title">
        <EditableValue
          :model-value="taskName"
          label="任务名"
          @update:model-value="$emit('rename', String($event))"
        />
        <CopyNameButton :text="taskName" label="任务名" />
      </span>

      <!-- 状态 -->
      <select v-if="state.editMode" v-model="task.状态" class="xy-task-status-select" @click.stop>
        <option value="进行中">进行中</option>
        <option value="待结算">待结算</option>
      </select>
      <span v-else :class="['xy-task-status', { ready: task.状态 === '待结算' }]">
        {{ task.状态 }}
      </span>

      <!-- 难度 -->
      <span v-if="task.难度 || state.editMode" class="xy-task-difficulty">
        <EditableValue v-model="task.难度" label="难度" />
      </span>

      <!-- 期限简要信息 -->
      <span
        v-if="task.截止时间"
        class="xy-task-deadline-brief"
        :class="{ overdue: isOverdue(task.截止时间, currentTime) }"
      >
        {{ isOverdue(task.截止时间, currentTime) ? '已逾期 · ' : '' }}{{ formatTime(task.截止时间, true) }}
      </span>
      <span v-else class="xy-task-deadline-brief">无期限</span>
    </div>

    <!-- 模式一主体：委托任务结构 -->
    <div v-show="state.editMode || isCardOpen('task', taskName)" class="xy-task-body xy-collapsible-body">
      <!-- 目标 -->
      <div class="xy-task-objective">
        <span class="xy-task-field-label">目标</span>
        <EditableValue v-model="task.目标" label="目标" multiline :rows="2" />
      </div>

      <!-- 进展 -->
      <div class="xy-task-progress">
        <span class="xy-task-field-label">进展</span>
        <EditableValue v-model="task.进展" label="进展" multiline :rows="2" />
      </div>

      <!-- 委托方 / 奖励 / 交付 -->
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

      <!-- 期限 -->
      <div class="xy-task-deadline">
        <span class="xy-task-field-label">期限</span>
        <template v-if="task.截止时间">
          <span v-if="!state.editMode" :class="{ overdue: isOverdue(task.截止时间, currentTime) }">
            {{ formatTime(task.截止时间) }}{{ isOverdue(task.截止时间, currentTime) ? '（已逾期）' : '' }}
          </span>
          <span v-else class="xy-asset-date-fields" @click.stop>
            <EditableValue v-model.number="task.截止时间.年" type="number" label="年" :min="1" />年
            <EditableValue v-model.number="task.截止时间.月" type="number" label="月" :min="1" :max="12" />月
            <EditableValue v-model.number="task.截止时间.日" type="number" label="日" :min="1" :max="30" />日
            <select v-model="task.截止时间.时辰" class="xy-asset-select xy-asset-select-time">
              <option v-for="hour in HOURS" :key="hour" :value="hour">{{ hour }}</option>
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
            @click="initDeadline"
          >
            填写期限
          </button>
        </template>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { isCardOpen, state, toggleCard } from '../composables';
import CopyNameButton from './CopyNameButton.vue';
import EditableValue from './EditableValue.vue';
import { formatTime, HOURS, isOverdue, type TaskTime } from './taskShared';

const props = defineProps<{
  task: any;
  taskName: string;
  currentTime: TaskTime;
}>();

defineEmits<{
  (e: 'rename', newName: string): void;
  (e: 'delete'): void;
}>();

function initDeadline() {
  const c = props.currentTime;
  props.task.截止时间 = { 年: c.年, 月: c.月, 日: c.日, 时辰: c.时辰 };
}
</script>
