import { findLocation } from './config/locations';
import { earthBirthCountries, normalizeNationality } from './config/earthLocations';
import type { Selection, StorySettings } from './types';

export function earthNationality(sel: Selection): string {
  if (findLocation(sel.locationId)?.世界 !== '地球') return '';
  return normalizeNationality(sel.国籍) || earthBirthCountries[sel.locationId || ''] || '中国';
}

/** 国籍与剧情身份并列；宗门归属只用于非地球开局。 */
export function initialIdentities(sel: Selection, settings?: StorySettings): string[] {
  const country = earthNationality(sel);
  if (country) return [...new Set([`${country}人`, ...(settings?.身份 || [])])];
  if (settings?.身份) return [...settings.身份];
  const sect = sel.门派归属.trim();
  return sect ? [sect === '散修' ? sect : `${sect}弟子`] : [];
}
