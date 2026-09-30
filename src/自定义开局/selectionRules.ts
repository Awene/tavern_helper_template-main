import { cultivationDate } from '../../util/cultivation-calendar.js';
import { findLocation, isLocationAvailable, isSectAvailable } from './config/locations';
import { customStoryToOption, findStory, isCustomStoryValid, isStoryAvailable } from './config/stories';
import type { Selection } from './types';

export function isSelectedStoryValid(sel: Selection): boolean {
  const custom = sel.customStory;
  if (custom && custom.id === sel.storyId) {
    return isCustomStoryValid(custom) && isStoryAvailable(customStoryToOption(custom), sel);
  }
  const story = findStory(sel.storyId);
  return !!story && isStoryAvailable(story, sel);
}

/** 只撤销失效选择，保留自创内容及仍合法的选项。 */
export function reconcileSelection(sel: Selection): { selection: Selection; cleared: string[] } {
  const next = { ...sel };
  const cleared: string[] = [];
  if (next.customStory) {
    const story = next.customStory;
    const world = findLocation(next.locationId)?.世界 ?? story.settings.世界;
    next.customStory = { ...story, settings: { ...story.settings, 时间: cultivationDate(story.settings.时间, world) } };
  }
  if (next.locationId && !isLocationAvailable(next.locationId, next.种族)) {
    next.locationId = null;
    cleared.push('出生地');
  }
  if (!isSectAvailable(next.门派归属, next.locationId)) {
    next.门派归属 = '';
    cleared.push('门派归属');
  }
  if (next.国籍 && findLocation(next.locationId)?.世界 !== '地球') {
    next.国籍 = '';
    cleared.push('国籍');
  }
  if (next.storyId && !isSelectedStoryValid(next)) {
    next.storyId = null;
    cleared.push('开局剧本');
  }
  return { selection: next, cleared };
}

export function selectionConflict(sel: Selection): string | undefined {
  if (!isLocationAvailable(sel.locationId, sel.种族)) return '请重新选择出生地：冥界仅限冥族，地球仅限人族。';
  if (!isSectAvailable(sel.门派归属, sel.locationId)) return '门派或培养机构与开局世界不符，请重新选择。';
  if (!isSelectedStoryValid(sel)) return '开局剧本未选择或条件不符，请重新选择。';
  return undefined;
}
