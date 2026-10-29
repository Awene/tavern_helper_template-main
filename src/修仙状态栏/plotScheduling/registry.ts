import { dreamPlot } from './regions/nanjiang/dream';
import { saintPlot } from './regions/nanjiang/saint';
import { ancestorPlot } from './regions/nanjiang/ancestor';
import type { DailyDefinition } from './types';
export const registeredPlots = [dreamPlot, saintPlot, ancestorPlot];
export const registeredDaily: DailyDefinition[] = [{ name: '五毒教日常', entry: '[事件]五毒教-日常', pending: ({ data }) => Boolean(data.事件?.进度?.五毒教日常?.名称) }];
