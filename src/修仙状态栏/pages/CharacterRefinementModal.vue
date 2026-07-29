<template>
  <div class="xy-refine-overlay" @click="close" @contextmenu.prevent>
    <section class="xy-refine-dialog" role="dialog" aria-modal="true" aria-labelledby="xy-refine-title" @click.stop>
      <header class="xy-refine-head">
        <div>
          <p class="xy-refine-kicker">人物细化</p>
          <h3 id="xy-refine-title">{{ characterName }}</h3>
        </div>
        <button type="button" class="xy-refine-close" title="关闭" @click="close">×</button>
      </header>

      <div v-if="refinementPreview" class="xy-refine-preview">
        <div class="xy-refine-preview-head">
          <span class="xy-refine-kicker">AI 细化预览</span>
          <span class="xy-refine-preview-realm">{{ refinementPreview.修炼进度?.境界 || '凡人' }}</span>
        </div>
        <section class="xy-refine-character-card">
          <header class="xy-refine-character-head">
            <span class="xy-refine-character-avatar">{{ previewName.slice(0, 1) }}</span>
            <div>
              <strong>{{ previewName }}</strong>
              <small>勾选需要写入的人物变量；各项可展开查看完整内容。</small>
            </div>
          </header>
          <label class="xy-refine-select-all">
            <input type="checkbox" :checked="allPreviewFieldsSelected" @change="toggleAllPreviewFields" />
            <span>全选本次细化结果</span>
          </label>
          <div class="xy-refine-card-grid">
            <button
              v-for="field in scalarPreviewCards"
              :key="field.key"
              type="button"
              class="xy-refine-select-card"
              :class="{ 'is-selected': selectedPreviewFields.includes(field.key) }"
              @click="togglePreviewField(field.key)"
            >
              <span class="xy-refine-card-check">{{ selectedPreviewFields.includes(field.key) ? '✓' : '' }}</span>
              <b>{{ field.label }}</b>
              <small>{{ field.summary }}</small>
            </button>
          </div>
          <section v-for="group in inventoryPreviewGroups" :key="group.key" class="xy-refine-inventory-group">
            <header>
              <b>{{ group.label }}</b>
              <span>{{ group.entries.length ? `新增 ${group.entries.length} 项` : '未生成新增条目' }}</span>
            </header>
            <div v-if="group.entries.length" class="xy-refine-item-grid">
              <button
                v-for="entry in group.entries"
                :key="entry.key"
                type="button"
                class="xy-refine-select-card xy-refine-item-card"
                :class="{ 'is-selected': selectedPreviewFields.includes(entry.key) }"
                @click="togglePreviewField(entry.key)"
              >
                <span class="xy-refine-card-check">{{ selectedPreviewFields.includes(entry.key) ? '✓' : '' }}</span>
                <b>{{ entry.name }}</b>
                <small>{{ entry.summary }}</small>
              </button>
            </div>
          </section>
        </section>
        <div class="xy-refine-preview-actions">
          <button type="button" class="xy-btn xy-btn-subtle" :disabled="busy" @click="acceptSelectedPreview">接受所选</button>
          <button type="button" class="xy-btn xy-btn-primary" :disabled="busy" @click="acceptAllPreview">全部接受</button>
          <button type="button" class="xy-btn xy-btn-cancel" :disabled="busy" @click="discardPreview">全部放弃</button>
        </div>
      </div>

      <div v-else class="xy-refine-actions">
        <button type="button" class="xy-refine-action" :disabled="busy" @click="refineCharacter">
          <span class="xy-refine-action-icon">◇</span>
          <span><strong>人物信息细化</strong><small>细化人物资料与库存；已有条目保留并补充。</small></span>
        </button>
        <button type="button" class="xy-refine-action" :disabled="busy" @click="generateWorldbook">
          <span class="xy-refine-action-icon">卷</span>
          <span>
            <strong>世界书生成</strong>
            <small :class="{ 'xy-refine-action-warning': duplicateWarning }">
              {{ duplicateWarning || '为已设定的人物生成独特的绿灯世界书。' }}
            </small>
          </span>
        </button>
      </div>

      <p v-if="busy" class="xy-refine-progress">{{ progress }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { computed, onMounted, ref } from 'vue';
// 编入构建产物，运行时无需访问本地文件。
import characterPromptExample from '../../../../Cultivation-Card-Game/Doc/人物提示词示例.txt?raw';
import mvuUpdateRules from '../../../../Cultivation-Card-Game/世界书/变量/[mvu_update]变量更新规则.yaml?raw';
import nonCombatRules from '../../../../Cultivation-Card-Game/世界书/[非战斗判定规则].txt?raw';
import coreCoefficientTable from '../../../../Cultivation-Card-Game/世界书/[核心系数总表].txt?raw';
import refinementCharacterRules from '../../../../Cultivation-Card-Game/世界书/[角色生成规则].txt?raw';
import comprehensionRules from '../../../../Cultivation-Card-Game/世界书/[领悟规则].txt?raw';
import productionRules from '../../../../Cultivation-Card-Game/世界书/[生产制作规则].txt?raw';
import timeAdvanceRules from '../../../../Cultivation-Card-Game/世界书/[时间推进规则].txt?raw';
import breakthroughRules from '../../../../Cultivation-Card-Game/世界书/[突破规则].txt?raw';
import itemCultivationRules from '../../../../Cultivation-Card-Game/世界书/[物品功法生成规则].txt?raw';
import cultivationGainRules from '../../../../Cultivation-Card-Game/世界书/[修为获取规则].txt?raw';
import battleRules from '../../../../Cultivation-Card-Game/世界书/[战斗规则].txt?raw';
import statusRules from '../../../../Cultivation-Card-Game/世界书/[状态规则].txt?raw';
import worldHierarchy from '../../../../Cultivation-Card-Game/世界书/世界层级.txt?raw';
import worldSkills from '../../../../Cultivation-Card-Game/世界书/世界设定-技艺.txt?raw';
import worldEconomy from '../../../../Cultivation-Card-Game/世界书/世界设定-经济系统.txt?raw';
import worldRoots from '../../../../Cultivation-Card-Game/世界书/世界设定-灵根与体质.txt?raw';
import worldEthics from '../../../../Cultivation-Card-Game/世界书/世界设定-伦理.txt?raw';
import worldSpecies from '../../../../Cultivation-Card-Game/世界书/世界设定-生命种族.txt?raw';
import worldOverview from '../../../../Cultivation-Card-Game/世界书/世界设定-世界观.txt?raw';
import worldElements from '../../../../Cultivation-Card-Game/世界书/世界设定-五行生克.txt?raw';
import worldItems from '../../../../Cultivation-Card-Game/世界书/世界设定-物品功法.txt?raw';
import worldRealms from '../../../../Cultivation-Card-Game/世界书/世界设定-修为境界.txt?raw';
import { CultivationStatusSchema } from '../schema';
import { useDataStore } from '../store';
import { closeCharacterRefinement, showToast, state } from '../composables';

// 与「【本格修仙】总结」脚本共用的聊天世界书绑定。
const SUMMARY_WORLDBOOK_PREFIX = '本格修仙总结世界书';
const SUMMARY_WORLDBOOK_VAR_KEY = 'summary_assistant_worldbook';
const store = useDataStore();
const busy = ref(false);
const progress = ref('');
const duplicateWarning = ref('');
const refinementPreview = ref<Record<string, any> | null>(null);
const refinementAdditions = ref<Record<string, Record<string, any>>>({});
const selectedPreviewFields = ref<string[]>([]);
const previewName = ref('');
const characterName = computed(() => state.characterRefinement || '未知人物');
const npc = computed(() => store.data.关系列表?.[characterName.value] as Record<string, any> | undefined);
const REFINEMENT_INPUT_FIELDS = [
  '寿元',
  '体质',
  '灵根',
  '修炼进度',
  '物品',
  '功法',
  '装备',
  '傀儡',
  '灵兽',
  '资源池',
  '技艺',
  '性格',
  '外貌',
  '着装',
] as const;
const REFINEMENT_CARD_FIELDS = ['寿元', '体质', '灵根', '境界', '修炼进度', '资源池', '技艺', '性格', '外貌', '着装'] as const;
const REFINEMENT_NPC_FIELDS = REFINEMENT_INPUT_FIELDS;
const PRESERVE_AND_EXTEND_FIELDS = ['物品', '功法', '装备', '傀儡', '灵兽'] as const;

function previewFieldSummary(key: string, value: unknown): string {
  if (key === '境界') return String(value || '未填写');
  if (key === '修炼进度') return String((value as Record<string, any>)?.境界 || '未填写');
  if (key === '寿元') {
    const lifespan = value as Record<string, any> | undefined;
    return `${lifespan?.年龄 ?? '?'} / ${lifespan?.寿命 ?? '?'}`;
  }
  if (typeof value === 'string') return value.length > 26 ? `${value.slice(0, 26)}…` : value || '未填写';
  if (key === '资源池') {
    const pool = value as Record<string, any> | undefined;
    return `气血 ${pool?.气血?.当前值 ?? '?'} / ${pool?.气血?.上限 ?? '?'} · 灵气 ${pool?.灵气?.当前值 ?? '?'} / ${pool?.灵气?.上限 ?? '?'}`;
  }
  if (key === '技艺') {
    const skills = value as Record<string, Record<string, unknown>> | undefined;
    return `${Object.keys(skills?.生产类 || {}).length + Object.keys(skills?.战斗类 || {}).length} 项技艺`;
  }
  if (key === '体质' || key === '灵根') return String((value as Record<string, any>)?.名称 || '未填写');
  return value && typeof value === 'object' ? '已生成细化结果' : '未填写';
}

const scalarPreviewCards = computed(() => {
  const value = refinementPreview.value;
  if (!value) return [];
  return REFINEMENT_CARD_FIELDS.map(key => {
    const fieldValue = key === '境界' ? value.修炼进度?.境界 : value[key];
    return {
      key,
      label: key,
      summary: previewFieldSummary(key, fieldValue),
    };
  });
});
const inventoryPreviewGroups = computed(() =>
  PRESERVE_AND_EXTEND_FIELDS.map(key => ({
    key,
    label: key,
    entries: Object.entries(refinementAdditions.value[key] || {}).map(([name, value]) => ({
      key: `${key}:${name}`,
      name,
      summary: `${(value as Record<string, any>)?.品质 || '未定品'} · ${(value as Record<string, any>)?.类型 || '新条目'}`,
    })),
  })),
);
const previewSelectionKeys = computed(() => [
  ...REFINEMENT_CARD_FIELDS,
  ...inventoryPreviewGroups.value.flatMap(group => group.entries.map(entry => entry.key)),
]);
const allPreviewFieldsSelected = computed(
  () => previewSelectionKeys.value.length > 0 && previewSelectionKeys.value.every(field => selectedPreviewFields.value.includes(field)),
);

function close() {
  if (!busy.value) closeCharacterRefinement();
}

function boundWorldbookNames(): string[] {
  if (typeof getCharWorldbookNames !== 'function') return [];
  const bound = getCharWorldbookNames('current');
  return [bound.primary, ...bound.additional].filter(
    (name): name is string => typeof name === 'string' && name.length > 0,
  );
}

async function readBoundWorldbooks(): Promise<Array<{ name: string; entries: WorldbookEntry[] }>> {
  if (typeof getWorldbook !== 'function') return [];
  const worldbooks = await Promise.all(
    boundWorldbookNames().map(async name => {
      try {
        return { name, entries: await getWorldbook(name) };
      } catch {
        return null;
      }
    }),
  );
  return worldbooks.filter((book): book is { name: string; entries: WorldbookEntry[] } => book !== null);
}

async function getCharacterRule(): Promise<string> {
  const rule = (await readBoundWorldbooks())
    .flatMap(book => book.entries)
    .find(entry => entry.enabled && entry.name.includes('角色生成规则'));
  if (!rule?.content?.trim()) {
    throw new Error('当前绑定世界书中没有启用的《角色生成规则》条目，无法进行人物细化。');
  }
  return rule.content;
}

function refinementFormatSample(): string {
  const start = mvuUpdateRules.indexOf('变量更新规则:');
  const end = mvuUpdateRules.indexOf('  关系列表:', start);
  return start >= 0 ? mvuUpdateRules.slice(start, end >= 0 ? end : undefined) : mvuUpdateRules;
}

function refinementReferences(): string {
  const entries = [
    ['非战斗判定规则', nonCombatRules],
    ['核心系数总表', coreCoefficientTable],
    ['角色生成规则', refinementCharacterRules],
    ['领悟规则', comprehensionRules],
    ['生产制作规则', productionRules],
    ['时间推进规则', timeAdvanceRules],
    ['突破规则', breakthroughRules],
    ['物品功法生成规则', itemCultivationRules],
    ['修为获取规则', cultivationGainRules],
    ['战斗规则', battleRules],
    ['状态规则', statusRules],
    ['世界层级', worldHierarchy],
    ['世界设定-技艺', worldSkills],
    ['世界设定-经济系统', worldEconomy],
    ['世界设定-灵根与体质', worldRoots],
    ['世界设定-伦理', worldEthics],
    ['世界设定-生命种族', worldSpecies],
    ['世界设定-世界观', worldOverview],
    ['世界设定-五行生克', worldElements],
    ['世界设定-物品功法', worldItems],
    ['世界设定-修为境界', worldRealms],
  ] as const;
  return `${entries.map(([name, content]) => `<${name}>\n${content}\n</${name}>`).join('\n\n')}\n\n<MVU变量格式样例>\n${refinementFormatSample()}\n</MVU变量格式样例>`;
}

function basePrompts(systemPrompt: string) {
  // 只列出世界书与专用提示词，未列出的酒馆原预设提示词不会发送。
  return [
    'world_info_before' as const,
    { role: 'system' as const, content: systemPrompt },
    'world_info_after' as const,
    'user_input' as const,
  ];
}

function refinementPrompts(systemPrompt: string) {
  // 人物细化是独立任务：不附带任何世界书背景条目、聊天上下文或酒馆预设。
  return [{ role: 'system' as const, content: systemPrompt }, 'user_input' as const];
}

function assertTextResult(result: string | GenerateToolCallResult): string {
  if (typeof result !== 'string') throw new Error('主 API 返回了工具调用而非所需的结构化结果。');
  return result;
}

function parseGeneratedJson(result: string): Record<string, any> {
  const trimmed = result.trim();
  // 参考 MVU 的脏数据容错：解开代码块、截取完整对象、清除尾随逗号，
  // 再兼容 JSON5 风格的引号/键名；最终仍由 Zod 校验并按白名单取值。
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const start = candidate.indexOf('{');
  if (start < 0) throw new Error('主 API 返回的结构化数据无法解析，请重试。');
  let depth = 0;
  let quote = '';
  let escaped = false;
  let objectText = '';
  for (let index = start; index < candidate.length; index++) {
    const char = candidate[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = '';
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === '{') depth++;
    if (char === '}') depth--;
    if (depth === 0) {
      objectText = candidate.slice(start, index + 1);
      break;
    }
  }
  if (!objectText) throw new Error('主 API 返回的结构化数据不完整，请重试。');
  const attempts = [
    objectText,
    objectText.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/,\s*([}\]])/g, '$1'),
  ];
  for (const text of attempts) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // 尝试下一种修复形式。
    }
  }
  // 与 MVU 的 tryParseValue 一致，最后兼容 JavaScript 对象字面量。
  try {
    const parsed = new Function(`"use strict"; return (${attempts[1]});`)();
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    // 由下方统一报错。
  }
  throw new Error('主 API 返回的结构化数据无法解析，请重试。');
}

function refinementCharacterInput() {
  if (!npc.value) throw new Error(`未找到「${characterName.value}」的人物变量。`);
  const selected = _.pick(_.cloneDeep(npc.value), REFINEMENT_NPC_FIELDS);
  return JSON.stringify({ 名称: characterName.value, 境界: selected.修炼进度?.境界, ...selected }, null, 2);
}

const WORLDBOOK_VARIABLE_FIELDS = ['种族', '身份', '修炼进度', '寿元', '灵根', '体质', '技艺', '功法', '性格', '外貌', '着装'] as const;

function worldbookCharacterInput() {
  if (!npc.value) throw new Error(`未找到「${characterName.value}」的人物变量。`);
  // 世界书生成只需要人物的稳定设定，避免把关系、装备、物品等动态变量交给模型。
  const selected = _.pick(_.cloneDeep(npc.value), WORLDBOOK_VARIABLE_FIELDS);
  return JSON.stringify({ 名称: characterName.value, ...selected }, null, 2);
}

function recordEntries(value: unknown): Array<[string, any]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, any>);
}

const characterVariableSchema = {
  name: 'cultivation_refined_npc',
  description: '一个完整的修仙 NPC 变量对象。',
  strict: false,
  value: {
    type: 'object',
    properties: { npc: { type: 'object' } },
    required: ['npc'],
    additionalProperties: false,
  },
};

async function refreshDuplicateWarning() {
  const name = characterName.value;
  if (!name) return;
  const books = await readBoundWorldbooks();
  const hit = books.find(book =>
    book.entries.some(
      entry =>
        entry.name === name ||
        entry.strategy?.keys?.some(key => String(key) === name) ||
        entry.content?.includes(`### ${name}`),
    ),
  );
  duplicateWarning.value = hit
    ? `警告：当前世界书「${hit.name}」已存在与「${name}」相关的人物条目；不会阻止本次生成。`
    : '';
}

async function refineCharacter() {
  if (busy.value) return;
  busy.value = true;
  progress.value = '正在读取细化规则并请求主 API…';
  try {
    const current = _.cloneDeep(npc.value);
    if (!current) throw new Error(`未找到「${characterName.value}」的人物变量。`);
    const systemPrompt = `你是修仙人物变量细化器。此请求是独立任务：只能使用下方列出的规则条目与变量格式样例；不发送也不得假定任何背景设定、世界书上下文、角色卡、聊天历史或酒馆预设。\n\n${refinementReferences()}\n\n任务：细化用户给出的一个 NPC 变量。只返回 JSON 对象中的 npc；不得输出推理、Markdown、EJS、剧情正文或代码。\n\n允许读取和更新的字段仅限：名称、寿元、体质、灵根、修炼进度（其中包含境界）、物品、功法、装备、傀儡、灵兽、资源池、技艺、性格、外貌、着装。名称只用于识别人物；境界只能写入修炼进度.境界，不能另建境界字段。\n\n硬性要求：\n1. 不得返回或改动其他字段。\n2. 物品、功法、装备、傀儡、灵兽必须是以名称为键的对象，不能是数组；根据规则补足合理的新条目。\n3. 输入中已有的物品、功法、装备、傀儡、灵兽必须完整保留：不得删除、改名、改数量或改字段。仅可新增不重名的条目。\n4. 输出严格遵循上方 MVU 变量格式样例；资源池不得超过上限，物品数量为合理非负数。\n5. 输出前必须自行验算所有数值：境界与进度上限、资源池当前值与上限、寿元、技艺数值、物品数量及新增条目数量均须符合所给规则与系数表；发现不一致时修正后再输出。\n6. 只输出一个可被 JSON.parse 直接解析的对象，形如 {"npc":{"寿元":{...},"修炼进度":{"境界":"..."},...}}，禁止代码块。`;
    const result = assertTextResult(
      await generateRaw({
        user_input: `请细化以下人物变量：\n${refinementCharacterInput()}`,
        ordered_prompts: refinementPrompts(systemPrompt),
        should_silence: false,
        max_chat_history: 0,
        json_schema: characterVariableSchema,
      }),
    );
    const generated = parseGeneratedJson(result).npc;
    if (!generated || typeof generated !== 'object' || Array.isArray(generated))
      throw new Error('主 API 没有返回 npc 对象。');
    const generatedFields = _.pick(_.cloneDeep(generated), REFINEMENT_NPC_FIELDS);
    const candidate = { ...current, ...generatedFields };
    const additions: Record<string, Record<string, any>> = {};
    for (const field of PRESERVE_AND_EXTEND_FIELDS) {
      additions[field] = _.pickBy(generatedFields[field] || {}, (_entry, name) => !(name in (current[field] || {})));
      candidate[field] = { ...(generatedFields[field] || {}), ...(current[field] || {}) };
    }
    const next = _.cloneDeep(store.data) as Record<string, any>;
    next.关系列表 = { ...next.关系列表, [characterName.value]: candidate };
    const checked = CultivationStatusSchema.safeParse(next);
    if (!checked.success) throw new Error('细化结果不符合人物变量结构，已取消写入。');
    refinementPreview.value = checked.data.关系列表[characterName.value] as Record<string, any>;
    refinementAdditions.value = additions;
    previewName.value = characterName.value;
    selectedPreviewFields.value = [...previewSelectionKeys.value];
    showToast('细化结果已生成，请在预览面板中确认是否写入。');
  } catch (error) {
    console.error('[人物细化] 人物信息细化失败：', error);
    showToast(error instanceof Error ? error.message : '人物信息细化失败，请重试。');
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

function discardPreview() {
  refinementPreview.value = null;
  refinementAdditions.value = {};
  selectedPreviewFields.value = [];
  previewName.value = '';
  showToast('已全部放弃本次人物细化结果。');
}

function toggleAllPreviewFields(event: Event) {
  selectedPreviewFields.value = (event.target as HTMLInputElement).checked ? [...previewSelectionKeys.value] : [];
}

function togglePreviewField(key: string) {
  selectedPreviewFields.value = selectedPreviewFields.value.includes(key)
    ? selectedPreviewFields.value.filter(field => field !== key)
    : [...selectedPreviewFields.value, key];
}

function acceptSelectedPreview(fields = selectedPreviewFields.value) {
  if (!refinementPreview.value) return;
  if (fields.length === 0) {
    showToast('请至少勾选一个要接受的变量。');
    return;
  }
  const current = _.cloneDeep(store.data.关系列表[characterName.value]) as Record<string, any>;
  if (!current) return;
  const scalarFields = fields.filter(field => REFINEMENT_CARD_FIELDS.includes(field as any));
  const accepted = _.pick(refinementPreview.value, scalarFields.filter(field => field !== '境界'));
  if (fields.includes('境界') && !fields.includes('修炼进度')) {
    accepted.修炼进度 = { ...current.修炼进度, 境界: refinementPreview.value.修炼进度?.境界 };
  }
  const nextNpc = { ...current, ..._.cloneDeep(accepted) };
  for (const field of PRESERVE_AND_EXTEND_FIELDS) {
    const selectedNames = fields
      .filter(key => key.startsWith(`${field}:`))
      .map(key => key.slice(field.length + 1));
    if (selectedNames.length) {
      nextNpc[field] = { ...current[field], ..._.pick(refinementAdditions.value[field] || {}, selectedNames) };
    }
  }
  const next = _.cloneDeep(store.data) as Record<string, any>;
  next.关系列表 = { ...next.关系列表 };
  next.关系列表[characterName.value] = nextNpc;
  const checked = CultivationStatusSchema.safeParse(next);
  if (!checked.success) {
    showToast('所选细化结果不符合人物变量结构，未写入。');
    return;
  }
  store.data.关系列表 = checked.data.关系列表 as any;
  refinementPreview.value = null;
  refinementAdditions.value = {};
  selectedPreviewFields.value = [];
  previewName.value = '';
  showToast(`已写入 ${fields.length} 项人物细化结果。`);
}

function acceptAllPreview() {
  acceptSelectedPreview([...previewSelectionKeys.value]);
}

const worldbookSchema = {
  name: 'cultivation_greenlight_entry',
  description: '一段可直接写入酒馆世界书的绿灯人物设定。',
  strict: false,
  value: {
    type: 'object',
    properties: {
      keywords: { type: 'array', items: { type: 'string' } },
      content: { type: 'string' },
    },
    required: ['keywords', 'content'],
    additionalProperties: false,
  },
};

// === 可手动修改：世界书生成的范例、格式与输出协议 ===
function worldbookExampleInstructions(): string {
  return `

<人物提示词示例>
${characterPromptExample}
</人物提示词示例>

上面的范例仅用于学习人物信息的细致程度、字段组织和修仙文风；不得照搬其中的人名、势力或具体设定。

补充格式要求：content 除标题外应以“身份：”“外貌：”“女性魅力：”（适用时）“着装（外）：”“着装（内）：”“法宝/物品：”“底色：”“性格/关系钩子：”等字段组织。

严格输出协议：只输出一个可被 JSON.parse 直接解析的 JSON 对象，禁止 Markdown 代码块、解释、前后缀或推理文字。输出形状必须严格如下：
{"keywords":["人物名","所属势力"],"content":"### 人物名 (身份)\\n身份：……\\n外貌：……\\n性格/关系钩子：……"}`;
}

function uniqueKeywords(value: unknown): string[] {
  const fromModel = Array.isArray(value) ? value : [];
  return _.uniq(
    [characterName.value, ...fromModel]
      .filter((keyword): keyword is string => typeof keyword === 'string')
      .map(keyword => keyword.trim())
      .filter(Boolean),
  ).slice(0, 12);
}

function generateSummaryWorldbookName(): string {
  return `${SUMMARY_WORLDBOOK_PREFIX}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function readSummaryWorldbookBinding(): string | null {
  try {
    const value = getVariables({ type: 'chat' })?.[SUMMARY_WORLDBOOK_VAR_KEY];
    return typeof value === 'string' && value.trim() ? value : null;
  } catch {
    return null;
  }
}

function writeSummaryWorldbookBinding(name: string) {
  try {
    insertOrAssignVariables({ [SUMMARY_WORLDBOOK_VAR_KEY]: name }, { type: 'chat' });
  } catch (error) {
    console.warn('[人物细化] 无法写入总结世界书绑定：', error);
  }
}

async function ensureSummaryWorldbook(): Promise<string> {
  if (typeof createWorldbook !== 'function' || typeof createWorldbookEntries !== 'function') {
    throw new Error('当前酒馆助手缺少世界书写入接口。');
  }
  const names = getWorldbookNames();
  let name = readSummaryWorldbookBinding();
  if (!name || !names.includes(name)) {
    name = names.find(item => item.startsWith(SUMMARY_WORLDBOOK_PREFIX)) || generateSummaryWorldbookName();
    if (!names.includes(name)) await createWorldbook(name, []);
    writeSummaryWorldbookBinding(name);
  }
  if (typeof getGlobalWorldbookNames === 'function' && typeof rebindGlobalWorldbooks === 'function') {
    const globalNames = getGlobalWorldbookNames();
    if (!globalNames.includes(name)) await rebindGlobalWorldbooks([...new Set([...globalNames, name])]);
  }
  return name;
}

async function nextGeneratedEntryName(worldbookName: string): Promise<string> {
  const baseName = `人物-细化-${characterName.value}`;
  if (typeof getWorldbook !== 'function') return baseName;
  const entries = await getWorldbook(worldbookName);
  const hasBaseEntry = entries.some(entry => entry.name === baseName);
  if (!hasBaseEntry) return baseName;

  const prefix = `${baseName}(`;
  const suffixes = entries
    .map(entry => entry.name)
    .filter((name): name is string => typeof name === 'string' && name.startsWith(prefix) && name.endsWith(')'))
    .map(name => Number(name.slice(prefix.length, -1)))
    .filter(Number.isSafeInteger);
  return `${baseName}(${Math.max(0, ...suffixes) + 1})`;
}

function openSummaryWorldbook(worldbookName: string) {
  // 酒馆助手没有“打开某本世界书编辑器”的高层接口，兼容常见 ST 控件作最佳努力打开。
  const document = window.top?.document;
  document
    ?.querySelector<HTMLElement>('#world_button, #world_info_button, [data-target="#world_info"], [href="#world_info"]')
    ?.click();
  window.setTimeout(() => {
    const select = document?.querySelector<HTMLSelectElement>(
      '#world_editor_select, #world_info_select, select[name="worldbook"]',
    );
    const option = Array.from(select?.options || []).find(item => item.text === worldbookName);
    if (!select || !option) return;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  }, 80);
}

async function generateWorldbook() {
  if (busy.value) return;
  busy.value = true;
  progress.value = '正在依当前世界书生成绿灯人物设定…';
  try {
    const rule = await getCharacterRule();
    // === 可手动修改：世界书生成的主提示词 ===
    const systemPrompt = `你是修仙世界书条目生成器。当前激活的世界书会随本请求提供；仅以它、当前人物变量与下列《角色生成规则》为依据。\n\n<角色生成规则>\n${rule}\n</角色生成规则>\n\n任务：为用户给出的 NPC 生成一段“人物绿灯条目”的纯设定文字。\n\n硬性要求：\n1. content 必须以“### 人物名 (体型或身份)”开头，写人物身份、外貌、女性魅力（适用时）、着装(外/内)、法宝/物品、底色、性格或关系钩子等；内容要与变量及世界书一致。\n2. keywords 返回 2~10 个应触发该人物的名称、道号、组织、地点等纯关键词，必须包含人物名。\n3. content 绝不含 EJS、JavaScript、模板标签（如 <% %>、{{ }}）、YAML 字段、关键字标题或任何代码。不要编写动态分支；只写可直接作为绿灯内容插入的自然语言设定。\n4. 可保留修仙背景的成人表达，但不要写未成年人，也不要出现疤痕、脏污或大规模纹身。`;
    const result = assertTextResult(
      await generateRaw({
        user_input: `请生成世界书人物条目：\n${worldbookCharacterInput()}`,
        ordered_prompts: basePrompts(`${systemPrompt}${worldbookExampleInstructions()}`),
        should_silence: false,
        max_chat_history: 0,
        json_schema: worldbookSchema,
      }),
    );
    const generated = parseGeneratedJson(result);
    const content = typeof generated.content === 'string' ? generated.content.trim() : '';
    const keywords = uniqueKeywords(generated.keywords);
    if (!content || keywords.length === 0) throw new Error('主 API 返回的世界书条目不完整。');
    if (/<%|%>|{{|}}/.test(content)) throw new Error('生成内容包含 EJS 或模板语法，已拒绝写入。');

    progress.value = '正在写入总结世界书…';
    const worldbookName = await ensureSummaryWorldbook();
    const entryName = await nextGeneratedEntryName(worldbookName);
    const created = await createWorldbookEntries(
      worldbookName,
      [
        {
          name: entryName,
          enabled: true,
          strategy: {
            type: 'selective',
            keys: keywords,
            keys_secondary: { logic: 'and_any', keys: [] },
            scan_depth: 'same_as_global',
          },
          position: { type: 'before_character_definition', role: 'system', depth: 4, order: 200 },
          content,
          probability: 100,
          recursion: { prevent_incoming: false, prevent_outgoing: true, delay_until: null },
          effect: { sticky: null, cooldown: null, delay: null },
        },
      ],
      { render: 'immediate' },
    );
    if (!created.new_entries?.length) {
      throw new Error('世界书条目写入接口未返回新条目，已停止后续操作。');
    }
    openSummaryWorldbook(worldbookName);
    showToast(`已写入总结世界书「${worldbookName}」的条目「${created.new_entries[0].name}」，并已尝试打开世界书面板。`);
    await refreshDuplicateWarning();
  } catch (error) {
    console.error('[人物细化] 世界书生成失败：', error);
    showToast(error instanceof Error ? error.message : '世界书生成失败，请重试。');
  } finally {
    busy.value = false;
    progress.value = '';
  }
}

onMounted(() => {
  void refreshDuplicateWarning();
});
</script>

<style scoped>
.xy-refine-overlay {
  position: fixed;
  inset: 0;
  z-index: 10003;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: var(--xy-overlay-mask, rgba(25, 21, 17, 0.48));
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.xy-refine-dialog {
  width: min(660px, 100%);
  max-height: calc(100vh - 36px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 8px;
  background: var(--xy-paper, #f7f1e5);
  box-shadow: 0 18px 48px rgba(30, 24, 17, 0.28);
  color: var(--xy-ink, #332c25);
  overflow: hidden;
}
.xy-refine-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 11px;
}
.xy-refine-kicker {
  margin: 0 0 2px;
  color: var(--xy-gold-deep, #806027);
  font-size: 10px;
  letter-spacing: 2px;
}
.xy-refine-head h3 {
  margin: 0;
  font-family: var(--xy-font-title);
  font-size: 19px;
  font-weight: 600;
}
.xy-refine-close {
  border: 0;
  background: transparent;
  color: var(--xy-ink-mute);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}
.xy-refine-progress {
  margin: 0;
  padding: 0 16px 16px;
  font-size: 11px;
  color: var(--xy-jade-deep, #3d6b54);
}
.xy-refine-preview {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  margin: 0 16px 16px;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 6px;
  overflow: hidden;
  background: var(--xy-glass, rgba(255, 255, 255, 0.35));
}
.xy-refine-preview-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border-bottom: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
}
.xy-refine-preview-head .xy-refine-kicker {
  margin: 0;
}
.xy-refine-preview-realm {
  font-size: 10px;
  color: var(--xy-cinnabar-deep, #8f2c2c);
}
.xy-refine-character-card {
  flex: 1 1 auto;
  min-height: 0;
  padding: 10px;
  overflow-y: auto;
}
.xy-refine-character-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 9px;
  border-bottom: 1px dashed var(--xy-line, rgba(125, 103, 66, 0.24));
}
.xy-refine-character-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 31px;
  height: 31px;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 50%;
  color: var(--xy-gold-deep, #806027);
  font-family: var(--xy-font-title);
  font-size: 16px;
}
.xy-refine-character-head strong,
.xy-refine-character-head small {
  display: block;
}
.xy-refine-select-all {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 10px 0 6px;
  color: var(--xy-gold-deep, #806027);
  font-size: 11px;
  cursor: pointer;
}
.xy-refine-card-grid,
.xy-refine-item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
}
.xy-refine-select-card {
  position: relative;
  min-width: 0;
  min-height: 68px;
  padding: 10px 9px 9px 32px;
  border: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  border-radius: 6px;
  background: var(--xy-paper-soft, rgba(255, 255, 255, 0.35));
  color: var(--xy-ink, #332c25);
  text-align: left;
  cursor: pointer;
  transition: 0.16s ease;
}
.xy-refine-select-card:hover {
  border-color: var(--xy-gold, #b18a42);
  background: var(--xy-tint-gold-mid, rgba(177, 138, 66, 0.14));
  transform: translateY(-1px);
}
.xy-refine-select-card.is-selected {
  border-color: var(--xy-jade, #5b8a72);
  box-shadow: inset 0 0 0 1px var(--xy-jade, #5b8a72);
  background: var(--xy-tint-jade-faint, rgba(91, 138, 114, 0.1));
}
.xy-refine-card-check {
  position: absolute;
  top: 10px;
  left: 9px;
  display: inline-flex;
  width: 15px;
  height: 15px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 4px;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
}
.xy-refine-select-card.is-selected .xy-refine-card-check {
  border-color: var(--xy-jade, #5b8a72);
  background: var(--xy-jade, #5b8a72);
}
.xy-refine-select-card b,
.xy-refine-select-card small {
  display: block;
}
.xy-refine-select-card b {
  margin-bottom: 4px;
  font-size: 11px;
}
.xy-refine-select-card small {
  overflow: hidden;
  color: var(--xy-ink-mute);
  font-size: 10px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.xy-refine-inventory-group {
  margin-top: 12px;
  padding-top: 9px;
  border-top: 1px dashed var(--xy-line, rgba(125, 103, 66, 0.24));
}
.xy-refine-inventory-group > header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 7px;
}
.xy-refine-inventory-group > header b {
  color: var(--xy-gold-deep, #806027);
  font-size: 11px;
}
.xy-refine-inventory-group > header span {
  color: var(--xy-ink-mute);
  font-size: 10px;
}
.xy-refine-item-card {
  min-height: 60px;
}
.xy-refine-field {
  border-top: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
}
.xy-refine-field summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 2px;
  cursor: pointer;
  list-style: none;
}
.xy-refine-field summary::-webkit-details-marker {
  display: none;
}
.xy-refine-field summary::after {
  content: '⌄';
  order: 3;
  color: var(--xy-gold-deep, #806027);
  font-size: 14px;
  transition: transform 0.15s ease;
}
.xy-refine-field[open] summary::after {
  transform: rotate(180deg);
}
.xy-refine-field summary label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  color: var(--xy-ink, #332c25);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.xy-refine-field summary em {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--xy-ink-mute);
  font-size: 10px;
  font-style: normal;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.xy-refine-field pre {
  max-height: 180px;
  margin: 0 0 8px;
  padding: 8px;
  overflow: auto;
  border-radius: 4px;
  background: var(--xy-paper-soft, rgba(255, 255, 255, 0.35));
  color: var(--xy-ink-mute);
  font-family: var(--xy-font-body, inherit);
  font-size: 10px;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.xy-refine-character-head strong {
  font-size: 13px;
}
.xy-refine-character-head small {
  margin-top: 2px;
  color: var(--xy-ink-mute);
  font-size: 10px;
}
.xy-refine-preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 7px;
  margin-top: 9px;
}
.xy-refine-preview-section {
  min-width: 0;
  padding: 7px;
  background: var(--xy-paper-soft, rgba(255, 255, 255, 0.35));
  border-radius: 4px;
}
.xy-refine-preview-section b,
.xy-refine-preview-lists b {
  color: var(--xy-gold-deep, #806027);
  font-size: 10px;
  letter-spacing: 0.5px;
}
.xy-refine-preview-section p {
  margin: 4px 0 0;
  color: var(--xy-ink-mute);
  font-size: 10px;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.xy-refine-preview-section i {
  margin-right: 4px;
  color: var(--xy-ink);
  font-style: normal;
}
.xy-refine-preview-inventory {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 9px;
}
.xy-refine-preview-inventory span {
  padding: 2px 5px;
  border: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
  border-radius: 8px;
  color: var(--xy-jade-deep, #3d6b54);
  font-size: 9.5px;
}
.xy-refine-preview-lists {
  margin-top: 7px;
}
.xy-refine-preview-lists p {
  display: flex;
  gap: 7px;
  margin: 4px 0;
  font-size: 10px;
  line-height: 1.45;
}
.xy-refine-preview-lists b {
  flex: 0 0 58px;
}
.xy-refine-preview-lists span {
  color: var(--xy-ink-mute);
  overflow-wrap: anywhere;
}
.xy-refine-preview-actions {
  flex: 0 0 auto;
  flex-wrap: wrap;
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  padding: 9px 10px;
  border-top: 1px solid var(--xy-line, rgba(125, 103, 66, 0.24));
}
.xy-btn-subtle {
  border-color: var(--xy-line-gold, #b89c65);
  background: transparent;
  color: var(--xy-gold-deep, #806027);
}
.xy-btn-primary {
  border-color: var(--xy-jade, #5b8a72);
  background: var(--xy-jade, #5b8a72);
  color: #fff;
}
.xy-btn-primary:hover:not(:disabled) {
  filter: brightness(1.08);
}
.xy-refine-actions {
  display: grid;
  gap: 9px;
  padding: 0 16px 16px;
}
.xy-refine-action {
  display: flex;
  gap: 11px;
  align-items: center;
  width: 100%;
  padding: 11px;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 5px;
  background: var(--xy-glass, rgba(255, 255, 255, 0.35));
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: 0.16s ease;
}
.xy-refine-action:hover:not(:disabled) {
  border-color: var(--xy-gold, #b18a42);
  background: var(--xy-tint-gold-mid, rgba(177, 138, 66, 0.14));
  transform: translateY(-1px);
}
.xy-refine-action:disabled {
  opacity: 0.55;
  cursor: wait;
}
.xy-refine-action-icon {
  display: inline-flex;
  width: 25px;
  height: 25px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--xy-line-gold, #b89c65);
  border-radius: 50%;
  color: var(--xy-gold-deep, #806027);
  font-family: var(--xy-font-display);
}
.xy-refine-action strong,
.xy-refine-action small {
  display: block;
}
.xy-refine-action strong {
  margin-bottom: 2px;
  font-size: 12px;
}
.xy-refine-action small {
  color: var(--xy-ink-mute);
  font-size: 10px;
  line-height: 1.45;
}
.xy-refine-action small.xy-refine-action-warning {
  color: var(--xy-cinnabar-deep, #8f2c2c);
}
</style>
