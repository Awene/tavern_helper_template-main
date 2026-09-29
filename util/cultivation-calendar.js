// 修仙历兼容层：仅代码识别旧历输入；提示词和界面始终使用修仙历。
/** @param {unknown} value */
export function calendarNumber(value) {
  if (typeof value === 'number') return Number.isInteger(value) ? value : NaN;
  let text = String(value ?? '').normalize('NFKC').trim().replace(/[年月日号]$/, '').replace(/^初/, '');
  text = ({ 正: '一', 冬: '十一', 腊: '十二', 臘: '十二' })[text] ?? text;
  if (/^\d+$/.test(text)) return Number(text);
  text = text.replace(/〇/g, '零').replace(/两/g, '二').replace(/廿/g, '二十').replace(/卅/g, '三十');
  const digits = '零一二三四五六七八九';
  if (!/^[零一二三四五六七八九十百千万]+$/.test(text)) return NaN;
  if (!/[十百千万]/.test(text)) return Number([...text].map(c => digits.indexOf(c)).join(''));
  let total = 0, section = 0, n = 0;
  for (const c of text) {
    const digit = digits.indexOf(c);
    if (digit >= 0) n = digit;
    else if (c === '万') { total += (section + n) * 10000; section = 0; n = 0; }
    else { section += (n || 1) * ({ 十: 10, 百: 100, 千: 1000 })[c]; n = 0; }
  }
  return total + section + n;
}

/** @param {unknown} value @param {string} world */
export function cultivationYear(value, world = '') {
  const text = String(value ?? '').normalize('NFKC').trim();
  const explicitCultivation = /^修仙[历曆]/.test(text);
  const explicitOld = /^(?:公元|公[历曆]|西[历曆]|阳历|AD\b|CE\b)/i.test(text);
  let year = calendarNumber(text.replace(/^(?:修仙[历曆]|公元|公[历曆]|西[历曆]|阳历|AD\b|CE\b)\s*/i, ''));
  // 无前缀的现代年份仅在地球纠正，避免改动其他世界的古代年份。
  if (explicitOld || (!explicitCultivation && world === '地球' && year >= 1900 && year <= 2999)) year += 5000;
  return Number.isSafeInteger(year) && year >= 1 && year <= 275000 ? year : NaN;
}

/** @param {unknown} input @returns {any} */
export function calendarParts(input) {
  if (input && typeof input === 'object' && !Array.isArray(input)) return { ...input };
  if (typeof input !== 'string') return {};
  const text = input.normalize('NFKC').trim();
  const match = text.match(/^((?:(?:修仙[历曆]|公元|公[历曆]|西[历曆]|阳历|AD\b|CE\b)\s*)?[\d零〇一二两三四五六七八九十百千万]+)(?:年|[-/.])([\d正冬腊臘一二三四五六七八九十]+)(?:月|[-/.])([\d初廿卅一二三四五六七八九十]+)(?:日|号)?(?:\s*(.*))?$/i);
  return match ? { 年: match[1], 月: match[2], 日: match[3], ...(match[4] ? { 时辰: match[4] } : {}) } : {};
}

/** @param {unknown} input @param {string} world @param {any} fallback */
export function cultivationDate(input, world = '', fallback = { 年: 7026, 月: 1, 日: 1 }) {
  const value = calendarParts(input);
  const year = cultivationYear(value.年 ?? value.year, world);
  const month = calendarNumber(value.月 ?? value.month);
  const day = calendarNumber(value.日 ?? value.day);
  return {
    ...value,
    年: Number.isFinite(year) ? year : fallback.年,
    月: month >= 1 && month <= 12 ? month : fallback.月,
    日: day >= 1 && day <= 30 ? day : fallback.日,
  };
}

/** 只处理时间字段，不把年龄、耗时或现实元数据误当年份。 @param {any} input @returns {any} */
export function normalizeCalendarState(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const world = input.地点?.世界 ?? '';
  const fallback = { 年: world === '地球' ? 7026 : 1, 月: 1, 日: 1 };
  const rawYear = calendarParts(input.时间).年 ?? calendarParts(input.时间).year;
  const legacyTime = /^(?:公元|公[历曆]|西[历曆]|阳历|AD\b|CE\b)/i.test(String(rawYear ?? '').trim())
    || (world === '地球' && cultivationYear(rawYear, world) !== cultivationYear(rawYear) && Number.isFinite(cultivationYear(rawYear, world)));
  const normalize = value => cultivationDate(value, world, fallback);
  const mapRecords = (records, fn) => Array.isArray(records) ? records.map(fn) : Object.fromEntries(Object.entries(records).map(([key, value]) => [key, fn(value)]));
  const result = { ...input, 时间: normalize(input.时间) };
  const characterYears = character => {
    const copy = { ...character };
    for (const [section, field] of [['寿元', '生日'], ['修炼进度', '上次突破时间点']]) {
      const value = character?.[section]?.[field];
      if (value == null) continue;
      const year = cultivationYear(value, legacyTime ? '地球' : '');
      if (Number.isFinite(year)) copy[section] = { ...character[section], [field]: year };
    }
    return copy;
  };
  Object.assign(result, characterYears(result));
  if (input.关系列表) result.关系列表 = Object.fromEntries(Object.entries(input.关系列表).map(([name, c]) => [name, characterYears(c)]));
  if (input.传闻 && !Array.isArray(input.传闻)) {
    result.传闻 = { ...input.传闻 };
    if (input.传闻.上次世界推进时间点 != null) result.传闻.上次世界推进时间点 = normalize(input.传闻.上次世界推进时间点);
  }
  if (input.任务) result.任务 = mapRecords(input.任务, raw => {
    const task = { ...raw };
    if (task.截止时间 != null) task.截止时间 = normalize(task.截止时间);
    return task;
  });
  if (input.固定资产) result.固定资产 = mapRecords(input.固定资产, raw => {
    const asset = { ...raw };
    if (asset.设施) asset.设施 = mapRecords(asset.设施, rawFacility => {
      const facility = { ...rawFacility };
      if (facility.上次收取日期 != null) facility.上次收取日期 = normalize(facility.上次收取日期);
      return facility;
    });
    return asset;
  });
  return result;
}
