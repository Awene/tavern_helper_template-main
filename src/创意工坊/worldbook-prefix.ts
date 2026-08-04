import type { DlcRelations, WorldbookPackCategory } from './types';

export interface ParsedWorldbookUpload {
  category: WorldbookPackCategory;
  label: string;
  dlcKey: string;
  relations: DlcRelations;
  entryCount: number;
}

const BASE_PATTERN = /^\[DLC\]\[(角色|事件|扩展)\]\[([^\]]+)\]/u;
const RELATION_PATTERN = /^\[([!><])([^\]]+)\]/u;

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function parseWorldbookEntryName(name: string): Omit<ParsedWorldbookUpload, 'entryCount'> {
  const base = name.match(BASE_PATTERN);
  if (!base) throw new Error(`条目“${name.slice(0, 80)}”不符合 [DLC][类别][名称] 命名格式`);
  const category = base[1] as WorldbookPackCategory;
  const label = base[2]?.trim() ?? '';
  if (!label || label.length > 80) throw new Error('DLC 名称必须为 1～80 字');
  const relations: DlcRelations = { exclusions: [], replacements: [], prerequisites: [] };
  let rest = name.slice(base[0].length);
  while (rest.startsWith('[')) {
    const relation = rest.match(RELATION_PATTERN);
    if (!relation) throw new Error(`条目“${name.slice(0, 80)}”包含无效的关系标记`);
    const target = relation[2]?.trim() ?? '';
    if (!target || target.length > 80) throw new Error('关系目标必须为 1～80 字');
    if (relation[1] === '!') relations.exclusions.push(target);
    if (relation[1] === '>') relations.replacements.push(target);
    if (relation[1] === '<') relations.prerequisites.push(target);
    rest = rest.slice(relation[0].length);
  }
  relations.exclusions = unique(relations.exclusions);
  relations.replacements = unique(relations.replacements);
  relations.prerequisites = unique(relations.prerequisites);
  return { category, label, dlcKey: `[DLC][${category}][${label}]`, relations };
}

export async function validateWorldbookFile(file: File): Promise<ParsedWorldbookUpload> {
  if (file.size < 2 || file.size > 5 * 1024 * 1024) throw new Error('世界书 JSON 必须小于 5MB');
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new Error('所选文件不是有效的世界书 JSON');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('世界书 JSON 结构无效');
  const source = (parsed as { entries?: unknown }).entries;
  const entries = Array.isArray(source) ? source : source && typeof source === 'object' ? Object.values(source) : [];
  if (entries.length < 1 || entries.length > 500) throw new Error('世界书包必须包含 1～500 个条目');
  let identity: ReturnType<typeof parseWorldbookEntryName> | undefined;
  const relations: DlcRelations = { exclusions: [], replacements: [], prerequisites: [] };
  for (const [index, value] of entries.entries()) {
    if (!value || typeof value !== 'object') throw new Error(`第 ${index + 1} 个条目结构无效`);
    const name = (value as { comment?: unknown; name?: unknown }).comment ?? (value as { name?: unknown }).name;
    if (typeof name !== 'string' || !name.trim()) throw new Error(`第 ${index + 1} 个条目缺少名称`);
    const current = parseWorldbookEntryName(name.trim());
    if (!identity) identity = current;
    if (current.dlcKey !== identity.dlcKey) {
      throw new Error(`全部条目必须属于同一 DLC：期望 ${identity.dlcKey}，发现 ${current.dlcKey}`);
    }
    relations.exclusions.push(...current.relations.exclusions);
    relations.replacements.push(...current.relations.replacements);
    relations.prerequisites.push(...current.relations.prerequisites);
  }
  if (!identity) throw new Error('世界书包没有有效条目');
  return {
    ...identity,
    relations: {
      exclusions: unique(relations.exclusions),
      replacements: unique(relations.replacements),
      prerequisites: unique(relations.prerequisites),
    },
    entryCount: entries.length,
  };
}
