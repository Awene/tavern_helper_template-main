import type { CultivationStatusData } from './schema';

export function selectPlot(data: CultivationStatusData, name: string) {
  const task = data.历练[name];
  if (!task || task.类别 !== '剧情' || data.事件.已完成事件.includes(name)) return;
  Object.assign(data.事件, { 聚焦模式: '手动', 标题: name, 阶段: task.阶段 || '', 开启: task.本幕进行中 === true });
}

