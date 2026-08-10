export interface ReincarnationDeed {
  t: string;
  p: number;
}

export interface ReincarnationDefaults {
  name?: string;
  years?: number;
  realm?: string;
  cause?: string;
}

export interface ReincarnationInfo {
  亡魂: { name: string; years: number; realm: string; cause: string };
  善业: ReincarnationDeed[];
  恶业: ReincarnationDeed[];
  Z: number;
  W: number;
  warnings: string[];
}

type SectionName = '亡魂信息' | '善业' | '恶业' | '功过修正';

const SECTION_ALIASES: Record<SectionName, string[]> = {
  亡魂信息: ['亡魂信息', '亡魂资料', '亡魂档案', '死者信息', '逝者信息'],
  善业: ['善业', '善行', '善举', '功德'],
  恶业: ['恶业', '恶行', '罪业', '罪行'],
  功过修正: ['功过修正', '功德修正', '善恶修正', '业力修正'],
};

const FIELD_ALIASES: Record<string, string[]> = {
  name: ['亡魂', '姓名', '死者', '逝者'],
  years: ['生卒', '年龄', '享年', '寿数'],
  realm: ['生前境界', '境界', '修为'],
  cause: ['死因', '死亡原因', '致死原因'],
};

const SECTION_NAMES = Object.values(SECTION_ALIASES)
  .flat()
  .sort((a, b) => b.length - a.length);
const SECTION_PATTERN = SECTION_NAMES.map(escapeRegExp).join('|');
const FIELD_NAMES = Object.values(FIELD_ALIASES)
  .flat()
  .sort((a, b) => b.length - a.length);
const FIELD_PATTERN = FIELD_NAMES.map(escapeRegExp).join('|');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeBasicEntities(value: string): string {
  const named: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
    nbsp: ' ',
  };
  return value.replace(/&(#x?[\da-f]+|amp|lt|gt|quot|apos|nbsp);/gi, (_all, entity: string) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? _all;
    const hex = entity[1]?.toLowerCase() === 'x';
    const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
    return Number.isFinite(code) ? String.fromCodePoint(code) : _all;
  });
}

function normalizeWideCharacters(value: string): string {
  const wideDigits = '０１２３４５６７８９';
  return value
    .replace(/[０-９]/g, char => String(wideDigits.indexOf(char)))
    .replace(/[＋﹢]/g, '+')
    .replace(/[－−﹣]/g, '-')
    .replace(/％/g, '%')
    .replace(/｜/g, '|')
    .replace(/：/g, ':')
    .replace(/＝/g, '=');
}

/** 把酒馆已经渲染过的 HTML、Markdown 和全角符号还原成稳定的逐行文本。 */
export function normalizeReincarnationText(raw: string): string {
  let text = decodeBasicEntities(String(raw ?? ''));
  text = text
    .replace(/<!--([\s\S]*?)-->/g, '\n')
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\s*\/?\s*(?:p|div|section|article|li|ul|ol|tr|table|thead|tbody|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<\s*\/?\s*(?:td|th)\b[^>]*>/gi, '|')
    .replace(/<\s*\/?\s*reincarnation[\s_-]*info\b[^>]*>/gi, '\n')
    .replace(/<\s*user\s*>/gi, '玩家')
    .replace(/<[^>]+>/g, ' ')
    .replace(/```(?:\w+)?/g, '\n')
    .replace(/\r\n?/g, '\n');
  text = normalizeWideCharacters(text)
    .replace(/\u00a0/g, ' ')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n[\t ]+/g, '\n')
    .replace(/[\t ]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

function cleanInline(value: string): string {
  return value
    .replace(/^\s*(?:>|[-*+]\s+|\d+[.、)\]]\s*)/, '')
    .replace(/[*_`]/g, '')
    .replace(/^\s*[|,，;；]+|[|,，;；]+\s*$/g, '')
    .trim();
}

function unwrapValue(value: string): string {
  let result = cleanInline(value);
  const pairs: Array<[string, string]> = [
    ['[', ']'],
    ['【', '】'],
    ['(', ')'],
    ['（', '）'],
    ['"', '"'],
    ["'", "'"],
  ];
  let changed = true;
  while (changed) {
    changed = false;
    for (const [left, right] of pairs) {
      if (result.startsWith(left) && result.endsWith(right)) {
        result = result.slice(left.length, -right.length).trim();
        changed = true;
      }
    }
  }
  return result;
}

function canonicalSection(value: string): SectionName | null {
  const compact = cleanInline(value).replace(/[{}[\]【】#:\s]/g, '');
  for (const [section, aliases] of Object.entries(SECTION_ALIASES) as Array<[SectionName, string[]]>) {
    if (aliases.includes(compact)) return section;
  }
  return null;
}

function splitSectionHeader(line: string): { section: SectionName; rest: string } | null {
  const cleaned = cleanInline(line)
    .replace(/^#+\s*/, '')
    .trim();
  const wrapped = cleaned.match(/^[{[【]\s*([^}\]】]+?)\s*[}\]】]\s*(?:[:：-]\s*)?(.*)$/);
  if (wrapped) {
    const section = canonicalSection(wrapped[1]);
    if (section) return { section, rest: wrapped[2].trim() };
  }
  const plain = cleaned.match(new RegExp(`^(${SECTION_PATTERN})(?:\\s*(?:[:：—-]|\\|)\\s*(.*))?$`, 'i'));
  if (!plain) return null;
  const section = canonicalSection(plain[1]);
  const rest = (plain[2] || '').trim();
  if (!section || /^(?:合计|总计|小计)/.test(rest)) return null;
  return { section, rest };
}

function isNoiseRow(value: string): boolean {
  const compact = cleanInline(value).replace(/[|:\s-]/g, '');
  return (
    !compact ||
    /^(?:描述|事项|事迹|点数|分值|数值|善业|善行|恶业|恶行|功过修正)$/.test(compact) ||
    /(?:列出全部|此处填写|简述|示例|省略|\.\.\.|…{2,})/.test(compact)
  );
}

function parseNumber(value: string): number | null {
  const match = normalizeWideCharacters(value).match(/[+-]?\s*\d[\d,]*(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0].replace(/[\s,]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDeed(row: string): ReincarnationDeed | null {
  const cleaned = cleanInline(row);
  if (isNoiseRow(cleaned)) return null;

  const cells = cleaned
    .replace(/^\||\|$/g, '')
    .split('|')
    .map(cell => cleanInline(cell))
    .filter(Boolean);
  const scoreCell = [...cells].reverse().find(cell => parseNumber(cell) !== null);
  const score = parseNumber(scoreCell ?? cleaned);

  let title = cells.find(cell => cell !== scoreCell && parseNumber(cell) === null) || cleaned;
  title = title
    .replace(/[[(（【]?\s*[+-]?\s*\d[\d,]*(?:\.\d+)?\s*(?:点|分)?\s*[\])）】]?/g, ' ')
    .replace(/^(?:善业|善行|善举|功德|恶业|恶行|罪业|罪行)\s*[:：-]?\s*/, '')
    .replace(/[：:()（）[\]【】|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (!title || isNoiseRow(title)) return null;
  return { t: title, p: Math.abs(score ?? 0) };
}

function fieldKey(label: string): keyof ReincarnationInfo['亡魂'] | null {
  for (const [key, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(label.trim())) return key as keyof ReincarnationInfo['亡魂'];
  }
  return null;
}

function assignSoulFields(out: ReincarnationInfo, rows: string[]): void {
  const fieldRegex = new RegExp(`(${FIELD_PATTERN})\\s*(?:[:：=]|为)\\s*`, 'g');
  for (const source of rows) {
    const matches = [...source.matchAll(fieldRegex)];
    for (let index = 0; index < matches.length; index += 1) {
      const match = matches[index];
      const key = fieldKey(match[1]);
      if (!key || match.index === undefined) continue;
      const start = match.index + match[0].length;
      const end = matches[index + 1]?.index ?? source.length;
      const rawValue = source.slice(start, end).replace(/^[|\s]+|[|\s]+$/g, '');
      const value = unwrapValue(rawValue);
      if (!value) continue;
      if (key === 'years') {
        const years = parseNumber(value);
        if (years !== null && years >= 0) out.亡魂.years = Math.trunc(years);
      } else {
        out.亡魂[key] = value;
      }
    }
  }
}

function dedupeDeeds(deeds: ReincarnationDeed[]): ReincarnationDeed[] {
  const seen = new Set<string>();
  return deeds.filter(deed => {
    const key = `${deed.t}|${deed.p}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseAdjustments(text: string, out: ReincarnationInfo): void {
  const read = (key: 'Z' | 'W') => {
    const match = text.match(
      new RegExp(`(?:^|[^A-Za-z0-9_])${key}\\s*(?:[:=]\\s*)?(?:[\\[（(【]\\s*)?([+-]?\\d+(?:\\.\\d+)?)\\s*(%?)`, 'i'),
    );
    if (!match) return null;
    const value = Number(match[1]);
    if (!Number.isFinite(value)) return null;
    if (key === 'Z') return match[2] === '%' || Math.abs(value) > 1 ? value / 100 : value;
    return value;
  };
  const z = read('Z');
  const w = read('W');
  if (z !== null) out.Z = z;
  if (w !== null) out.W = w;
}

export function parseReincarnation(raw: string, defaults: ReincarnationDefaults = {}): ReincarnationInfo {
  const out: ReincarnationInfo = {
    亡魂: {
      name: defaults.name?.trim() || '无名亡魂',
      years: Number.isFinite(defaults.years) ? Math.max(0, Math.trunc(defaults.years!)) : 0,
      realm: defaults.realm?.trim() || '未知',
      cause: defaults.cause?.trim() || '未知',
    },
    善业: [],
    恶业: [],
    Z: 0,
    W: 0,
    warnings: [],
  };
  const text = normalizeReincarnationText(raw);
  if (!text) {
    out.warnings.push('轮回信息为空，已使用当前角色数据兜底');
    return out;
  }

  const sections: Record<SectionName, string[]> = {
    亡魂信息: [],
    善业: [],
    恶业: [],
    功过修正: [],
  };
  let current: SectionName | null = null;
  for (const originalLine of text.split('\n')) {
    const line = cleanInline(originalLine);
    if (!line) continue;
    const header = splitSectionHeader(line);
    if (header) {
      current = header.section;
      if (header.rest) sections[current].push(header.rest);
      continue;
    }
    if (current) sections[current].push(line);
  }

  const allRows = text.split('\n').map(cleanInline).filter(Boolean);
  // 部分模型会把亡魂字段写在标题同行或完全漏掉标题，再做一次全局补漏。
  assignSoulFields(out, allRows);
  // 正式亡魂信息段优先级最高，覆盖全文中可能出现的叙述性同名字段。
  assignSoulFields(out, sections.亡魂信息);

  out.善业 = dedupeDeeds(sections.善业.map(parseDeed).filter((item): item is ReincarnationDeed => !!item));
  out.恶业 = dedupeDeeds(sections.恶业.map(parseDeed).filter((item): item is ReincarnationDeed => !!item));
  parseAdjustments([...sections.功过修正, text].join('\n'), out);

  if (!sections.亡魂信息.length) out.warnings.push('未识别到亡魂信息标题，已从全文提取字段');
  if (!sections.善业.length) out.warnings.push('未识别到善业段落');
  if (!sections.恶业.length) out.warnings.push('未识别到恶业段落');
  if (out.善业.length + out.恶业.length === 0) out.warnings.push('未提取到有效善恶事迹');
  return out;
}
