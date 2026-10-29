import { dispatchPlots } from './plotScheduling/core';
import { registeredPlots, registeredDaily } from './plotScheduling/registry';
export function resolvePlotFocus(data: any, action = ''): string {
  return dispatchPlots(data, action, registeredPlots, registeredDaily).title;
}
