export type TaskMode = 'plot' | 'quest';

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

/** 世界书剧情标识；委托不会因共享字段而被误判。 */
export function isPlot(task: any): boolean {
  return task?.类别 === '剧情';
}

export function getTaskMode(task: any): TaskMode {
  return isPlot(task) ? 'plot' : 'quest';
}
