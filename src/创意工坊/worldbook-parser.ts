type JsonRecord = Record<string, unknown>;

export type ParsedWorldbookEntry = TypeFest.PartialDeep<WorldbookEntry> & {
  group?: string;
  groupOverride?: boolean;
  groupWeight?: number;
  useGroupScoring?: boolean | null;
};

function record(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

function numberOr(value: unknown, fallback: number): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : fallback;
}

function nullablePositiveNumber(value: unknown): number | null {
  const result = Number(value);
  return Number.isFinite(result) && result > 0 ? result : null;
}

function strategyType(entry: JsonRecord, strategy?: JsonRecord): WorldbookEntry['strategy']['type'] {
  const type = strategy?.type;
  if (type === 'constant' || type === 'selective' || type === 'vectorized') return type;
  if (entry.constant === true) return 'constant';
  if (entry.vectorized === true) return 'vectorized';
  return 'selective';
}

function secondaryLogic(value: unknown): WorldbookEntry['strategy']['keys_secondary']['logic'] {
  if (value === 'and_any' || value === 'and_all' || value === 'not_all' || value === 'not_any') return value;
  return ({ 0: 'and_any', 1: 'not_all', 2: 'not_any', 3: 'and_all' } as const)[numberOr(value, 0)] ?? 'and_any';
}

function positionType(value: unknown): WorldbookEntry['position']['type'] {
  if (
    value === 'before_character_definition' ||
    value === 'after_character_definition' ||
    value === 'before_example_messages' ||
    value === 'after_example_messages' ||
    value === 'before_author_note' ||
    value === 'after_author_note' ||
    value === 'at_depth' ||
    value === 'outlet'
  ) {
    return value;
  }
  return (
    (
      {
        0: 'before_character_definition',
        1: 'after_character_definition',
        2: 'before_author_note',
        3: 'after_author_note',
        4: 'at_depth',
        5: 'before_example_messages',
        6: 'after_example_messages',
      } as const
    )[numberOr(value, 0)] ?? 'before_character_definition'
  );
}

function positionRole(value: unknown): WorldbookEntry['position']['role'] {
  if (value === 'system' || value === 'assistant' || value === 'user') return value;
  return ({ 0: 'system', 1: 'user', 2: 'assistant' } as const)[numberOr(value, 0)] ?? 'system';
}

function groupLabels(value: unknown): string {
  if (typeof value === 'string') return value;
  const labels = strings(record(value)?.labels);
  return labels.join(',');
}

function parseEntry(value: unknown, index: number): ParsedWorldbookEntry {
  const entry = record(value);
  if (!entry) throw new Error(`第 ${index + 1} 个世界书条目结构无效`);

  const nameValue = entry.comment ?? entry.name;
  if (typeof nameValue !== 'string' || !nameValue.trim()) throw new Error(`第 ${index + 1} 个世界书条目缺少名称`);

  const strategy = record(entry.strategy);
  const keysSecondary = record(strategy?.keys_secondary);
  const position = record(entry.position);
  const recursion = record(entry.recursion);
  const effect = record(entry.effect);
  const probability = entry.useProbability === false ? 100 : numberOr(entry.probability, 100);
  const delayUntil = recursion?.delay_until ?? entry.delayUntilRecursion;
  const group = groupLabels(entry.group);

  return {
    name: nameValue.trim(),
    enabled: typeof entry.enabled === 'boolean' ? entry.enabled : entry.disable !== true,
    strategy: {
      type: strategyType(entry, strategy),
      keys: strings(strategy?.keys ?? entry.key),
      keys_secondary: {
        logic: secondaryLogic(keysSecondary?.logic ?? entry.selectiveLogic),
        keys: strings(keysSecondary?.keys ?? entry.keysecondary),
      },
      scan_depth:
        strategy?.scan_depth === 'same_as_global'
          ? 'same_as_global'
          : strategy?.scan_depth === undefined && (entry.scanDepth === null || entry.scanDepth === undefined)
            ? 'same_as_global'
            : Math.max(1, numberOr(strategy?.scan_depth ?? entry.scanDepth, 1)),
    },
    position: {
      type: positionType(position?.type ?? entry.position),
      role: positionRole(position?.role ?? entry.role),
      depth: Math.max(0, numberOr(position?.depth ?? entry.depth, 4)),
      order: numberOr(position?.order ?? entry.order, index),
    },
    content: typeof entry.content === 'string' ? entry.content : String(entry.content ?? ''),
    probability: Math.min(100, Math.max(0, probability)),
    recursion: {
      prevent_incoming: Boolean(recursion?.prevent_incoming ?? entry.excludeRecursion),
      prevent_outgoing: Boolean(recursion?.prevent_outgoing ?? entry.preventRecursion),
      delay_until: delayUntil === true ? 1 : nullablePositiveNumber(delayUntil),
    },
    effect: {
      sticky: nullablePositiveNumber(effect?.sticky ?? entry.sticky),
      cooldown: nullablePositiveNumber(effect?.cooldown ?? entry.cooldown),
      delay: nullablePositiveNumber(effect?.delay ?? entry.delay),
    },
    ...(group
      ? {
          group,
          groupOverride: Boolean(entry.groupOverride),
          groupWeight: numberOr(entry.groupWeight, 100),
          useGroupScoring: typeof entry.useGroupScoring === 'boolean' ? entry.useGroupScoring : null,
        }
      : {}),
    ...(record(entry.extra) ? { extra: record(entry.extra) } : {}),
  };
}

export function parseRawWorldbook(raw: string): ParsedWorldbookEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('下载的世界书不是有效的 JSON 文件');
  }

  const root = record(parsed);
  if (!root) throw new Error('下载的世界书根结构无效');
  const entriesValue = root.entries;
  const entries = Array.isArray(entriesValue)
    ? entriesValue
    : record(entriesValue)
      ? Object.values(entriesValue as JsonRecord)
      : [];
  if (!entries.length) throw new Error('下载的世界书不包含任何条目');
  if (entries.length > 500) throw new Error('下载的世界书超过 500 个条目的客户端上限');
  return entries.map(parseEntry);
}
