export type TaskMode = 'plot' | 'event' | 'quest';

export type TaskTime = { 年: number; 月: number; 日: number; 时辰: string };

export const HOURS = ['子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时'] as const;

export function formatTime(time: TaskTime | null | undefined, compact = false): string {
  if (!time || typeof time !== 'object') return '';
  return compact ? `${time.年}年${time.月}月${time.日}日` : `修仙历${time.年}年${time.月}月${time.日}日 · ${time.时辰}`;
}

export function timeValue(time: TaskTime): number {
  const hour = Math.max(0, HOURS.indexOf(time.时辰 as (typeof HOURS)[number]));
  return ((time.年 * 12 + time.月 - 1) * 30 + time.日 - 1) * 12 + hour;
}

export function isOverdue(deadline: TaskTime | null | undefined, currentTime: TaskTime): boolean {
  if (!deadline || typeof deadline !== 'object') return false;
  if (!currentTime || typeof currentTime !== 'object') return false;
  return timeValue(currentTime) > timeValue(deadline);
}

export function getEventTimeString(task: any, currentTime: TaskTime): string {
  if (task.触发时间 && typeof task.触发时间 === 'object') {
    return formatTime(task.触发时间, true);
  }
  if (task.触发时间 && typeof task.触发时间 === 'string') {
    return task.触发时间;
  }
  if (task.截止时间 && typeof task.截止时间 === 'object') {
    return formatTime(task.截止时间, true);
  }
  if (currentTime && typeof currentTime === 'object') {
    return formatTime(currentTime, true);
  }
  return '';
}

/** 模式三：长线剧情判断 */
export function isPlot(task: any, taskName?: string, activeStoryTitle?: string): boolean {
  if (!task) return false;
  if (
    task.类别 === '剧情' ||
    task.类型 === '剧情' ||
    task.幕次 ||
    task.契机 ||
    task.局势
  ) {
    return true;
  }
  const name = String(taskName || task.名称 || '');
  if (name.includes('剧情') || name === '残简之秘') {
    return true;
  }
  if (activeStoryTitle && (name === activeStoryTitle || name.includes(activeStoryTitle))) {
    return true;
  }
  return false;
}

/** 模式二：奇遇/突发事件/危机判断 */
export function isEvent(task: any, taskName?: string, activeStoryTitle?: string): boolean {
  if (!task) return false;
  if (isPlot(task, taskName, activeStoryTitle)) return false;
  return Boolean(
    task.态势 ||
    task.牵涉 ||
    task.焦点 ||
    task.祸福 ||
    task.紧迫 ||
    task.状态 === '待平息' ||
    task.状态 === '待抉择',
  );
}

/** 确定所属模式：模式一 (quest) | 模式二 (event) | 模式三 (plot) */
export function getTaskMode(task: any, taskName?: string, activeStoryTitle?: string): TaskMode {
  if (isPlot(task, taskName, activeStoryTitle)) return 'plot';
  if (isEvent(task, taskName, activeStoryTitle)) return 'event';
  return 'quest';
}
