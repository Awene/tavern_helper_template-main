import { dispatchPlots } from './core';
import { nanjiangPlots, nanjiangDaily } from './regions/nanjiang';

// 新增地区只在这里汇总，不修改调度核心。
export const registeredPlots = [...nanjiangPlots];
export const registeredDaily = [...nanjiangDaily];
export function resolvePlotFocus(data: any, action = ''): string {
  return dispatchPlots(data, action, registeredPlots, registeredDaily).title;
}
