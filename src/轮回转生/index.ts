/**
 * 轮回转生面板 —— 正文美化加载的独立前端模块。
 *
 * 宿主（正文美化）识别消息里的 <reincarnation_info> 后，把原始内容放进
 * window.__reincarnation_payload，再通过 jQuery .load 把本模块（dist/轮回转生/index.html）
 * 注入对应楼层。本模块据此解析亡魂/善恶/功过修正，读取 MVU stat_data 计算天谴罚与业力 E，
 * 玩家挑选福泽/偿报后，回写 MVU 变量并发送消息触发 AI 回复。
 */
import './styles.css';
import { parseReincarnation } from './parser';
import {
  PHYSIQUE_TIER_INTRO,
  PHYSIQUE_TIER_S,
  PHYSIQUE_TIERS,
  findPhysique,
  physiqueCategoriesByTier,
  physiques,
} from '../自定义开局/config/physiques';
import type { PhysiqueCategory, PhysiqueTier } from '../自定义开局/types';

// ======================================================================
// 前端配置（点数可调）
// ======================================================================
const GRADES = [
  { level: '七等', min: 150, title: '天眷之善', desc: '功德圆满', good: true },
  { level: '六等', min: 50, title: '大善', desc: '广积阴德', good: true },
  { level: '五等', min: 10, title: '微善', desc: '偶有善行', good: true },
  { level: '四等', min: -10, title: '功过相抵', desc: '平庸之魂', good: true },
  { level: '三等', min: -50, title: '微恶', desc: '偶有恶行', good: false },
  { level: '二等', min: -150, title: '大恶', desc: '罪业深重', good: false },
  { level: '一等', min: -Infinity, title: '极恶', desc: '罪不可恕', good: false },
];

// 种族：sel=false 灰置；妖/灵/物化/魔需输入所化物种
const RACES = [
  { id: 'human', name: '人族', cost: 0, sel: true },
  { id: 'wu', name: '巫族', cost: 0, sel: true },
  { id: 'yao', name: '妖族', cost: 0, sel: true, input: true, inputPh: '所化物种（留空随机）' },
  { id: 'ling', name: '灵族', cost: -20, sel: true, input: true, inputPh: '所化精怪（留空随机）' },
  { id: 'wuhua', name: '物化生灵', cost: -20, sel: true, input: true, inputPh: '所化器物（留空随机）' },
  { id: 'mo', name: '魔族', cost: 20, sel: true, input: true, inputPh: '魔族血脉（留空随机）' },
  { id: 'gui', name: '冥族', cost: 0, sel: false, note: '=不入轮回' },
  { id: 'shen', name: '神族', cost: 0, sel: false, note: '暂不可选' },
  { id: 'yuwai', name: '域外异类', cost: 0, sel: false, note: '暂不可选' },
];

// 六道轮回（仅人族出现）
const DEST = [
  { id: 'xianfam', name: '修仙家族子女', cost: 50, input: true, inputPh: '输入父母人名（留空随机）' },
  { id: 'wealthy', name: '富贵人家', cost: 20 },
  { id: 'poor', name: '贫穷之家', cost: -20 },
  { id: 'servant', name: '奴婢子女', cost: -40 },
  { id: 'custom', name: '自创', cost: 0, area: true },
];

const ELEMS_NORMAL = ['金', '木', '水', '火', '土'];
const ELEMS_POLAR = ['阴', '阳'];
const MUTATIONS = [
  { id: 'm-jian', name: '剑灵根', el: '金' },
  { id: 'm-xue', name: '血灵根', el: '金' },
  { id: 'm-feng', name: '风灵根', el: '木' },
  { id: 'm-du', name: '毒灵根', el: '木' },
  { id: 'm-bing', name: '冰灵根', el: '水' },
  { id: 'm-lei', name: '雷灵根', el: '火' },
  { id: 'm-ci', name: '磁灵根', el: '土' },
  { id: 'm-you', name: '幽灵根', el: '阴' },
  { id: 'm-long', name: '龙灵根', el: '阳' },
  { id: 'm-xukong', name: '虚空灵根', el: '混沌' },
  { id: 'm-hunyuan', name: '混元灵根', el: '混沌' },
];
const ROOT_COST: Record<string, number> = { 1: 60, 2: 30, 3: 0, 4: -30, 5: 0, 无: -100, 混沌: 60 };

/** 轮回面板沿用自身的业力成本，只共享自定义开局的体质清单与三维。 */
const REINCARNATION_PHY_COST: Record<PhysiqueTier, number> = { 凡体: 0, 灵体: 10, 道体: 30, 仙体: 60 };
const PHY_PICKER_PAGE_SIZE = 6;
const NEWBORN_LIFESPAN = 80;

type ReincarnationGender = '男' | '女' | '其他';

const LOCATIONS = [
  { id: 'fanjie', name: '凡界', cost: 0 },
  { id: 'lingjie', name: '灵界', cost: 40 },
];
const MEMORY = [
  { id: 'no', name: '饮孟婆汤（不保留）', cost: 0 },
  { id: 'yes', name: '保留记忆（含已学会功法）', cost: 30 },
];

const QUALITY_RANK: Record<string, number> = { 凡: 1, 黄: 2, 玄: 4, 地: 8, 天: 14 };

const STATUSES = [
  { id: 's1', name: '天人之姿', type: '增益', cost: 15, desc: '绝世容貌气度，众生倾慕' },
  { id: 's2', name: '天生神力', type: '增益', cost: 12, desc: '力能扛鼎，体魄超人' },
  { id: 's3', name: '通灵道种', type: '增益', cost: 20, desc: '灵觉敏锐，亲近大道' },
  { id: 's4', name: '祥瑞缠身', type: '增益', cost: 18, desc: '气运绵长，祥瑞相随' },
  { id: 's5', name: '体弱多病', type: '减益', cost: -15, desc: '自幼体弱，药不离口' },
  { id: 's6', name: '先天残疾', type: '减益', cost: -25, desc: '肢体残缺或五官有损' },
  { id: 's7', name: '无生育能力', type: '减益', cost: -10, desc: '天道夺其子嗣之缘' },
  { id: 's8', name: '痴愚之症', type: '减益', cost: -20, desc: '神智迟滞，蒙昧难开' },
  { id: 's9', name: '天煞孤星', type: '特殊', cost: -30, desc: '亲缘皆损，孤煞缠身' },
];
const CUS_STATUS_COST: Record<string, number> = { 增益: 20, 减益: -20, 特殊: -10 };

// ======================================================================
// 读取 MVU stat_data（tavern helper 全局；本地预览时可用 __reincarnation_stat 注入）
// ======================================================================
const PREVIEW_STAT = (window as any).__reincarnation_stat;
const IS_LOCAL_PREVIEW = !!PREVIEW_STAT && typeof PREVIEW_STAT === 'object';

async function readWholeStat(timeoutMs = 8000): Promise<Record<string, any>> {
  if (IS_LOCAL_PREVIEW) return PREVIEW_STAT;

  try {
    await waitGlobalInitialized('Mvu');
    const messageId = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : 'latest';
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const variables = Mvu.getMvuData({ type: 'message', message_id: messageId });
      const stat = _.get(variables, 'stat_data');
      if (stat && typeof stat === 'object') return stat as Record<string, any>;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.warn('[轮回转生] 等待当前楼层 MVU stat_data 超时，将以空数据渲染。');
  } catch (error) {
    console.warn('[轮回转生] 读取当前楼层 MVU stat_data 失败，将以空数据渲染：', error);
  }
  return {};
}

const STAT = await readWholeStat();
const 修炼 = STAT.修炼进度 || {};
const 寿元 = STAT.寿元 || {};
const 物品Raw = STAT.物品 || {};
const 功法Raw = STAT.功法 || {};
const 关系Raw = STAT.关系列表 || {};
const 种族Raw = STAT.种族 || '';
const 地点Raw = STAT.地点 || {};
const 状态Raw = STAT.状态效果 || {};

const SAMPLE_ITEMS = [
  { id: '玄铁重剑', name: '玄铁重剑', meta: '玄品 · 装备', 品质: '玄', 数量: 1, 类型: '装备' },
  { id: '聚灵丹', name: '聚灵丹', meta: '黄品 · 丹药', 品质: '黄', 数量: 5, 类型: '丹药' },
  { id: '风雷遁法', name: '风雷遁法', meta: '黄品 · 身法', 品质: '黄', 数量: 1, 类型: '身法' },
  { id: '五行诀·心法', name: '五行诀·心法', meta: '玄品 · 心法', 品质: '玄', 数量: 1, 类型: '心法' },
  { id: '上古秘境残卷', name: '上古秘境残卷', meta: '地品 · 秘籍', 品质: '地', 数量: 1, 类型: '秘籍', 秘籍: true },
];

// 保留物品清单：正式环境只使用 stat_data.物品；样例只供显式本地预览。
function buildItems(): any[] {
  const keys = Object.keys(物品Raw || {});
  if (!keys.length) return IS_LOCAL_PREVIEW ? SAMPLE_ITEMS : [];
  return keys.map(name => {
    const it = 物品Raw[name] || {};
    return {
      id: name,
      name,
      品质: it.品质 || '凡',
      数量: it.数量 || 1,
      类型: it.类型 || '物品',
      秘籍: it.类型 === '秘籍' || !!it.完整度,
    };
  });
}
const ITEMS = buildItems();
const itemCost = (it: any, qty: number) => (QUALITY_RANK[it.品质] || 1) * (qty || 0);

const 天谴 = Number(修炼.天谴) || 0;
const 寿命 = Number(寿元.寿命) || Number(寿元.年龄) || 1;

function findPendingHost(): HTMLElement | null {
  const hosts = Array.from(document.querySelectorAll<HTMLElement>('.rc-app'));
  for (let index = hosts.length - 1; index >= 0; index -= 1) {
    if (hosts[index].dataset.rcBooted !== 'true' && hosts[index].querySelector('#app')) return hosts[index];
  }
  return null;
}

function readPayload(host: HTMLElement | null): string {
  const encoded = host?.getAttribute('data-rc-raw');
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch (error) {
      console.warn('[轮回转生] 宿主数据解码失败，改用原始内容:', error);
      return encoded;
    }
  }
  return String((window as any).__reincarnation_payload || '');
}

const PENDING_HOST = findPendingHost();
const RAW = readPayload(PENDING_HOST);
const S = parseReincarnation(RAW, {
  years: Number(寿元.年龄) || 0,
  realm: String(修炼.境界 || '未知'),
});
if (S.warnings.length) console.warn('[轮回转生] AI 面板格式已容错处理:', S.warnings);

// ======================================================================
// 面板状态
// ======================================================================
let E = 0,
  penalty = 0,
  grade = GRADES[6],
  path = 'obey';
const currentPhysique = STAT.体质 || {};
const currentGender = (() => {
  const hasYinMarker = Object.prototype.hasOwnProperty.call(currentPhysique, '元阴');
  const hasYangMarker = Object.prototype.hasOwnProperty.call(currentPhysique, '元阳');
  const hasYin = currentPhysique.元阴 === true || currentPhysique.元阴 === false;
  const hasYang = currentPhysique.元阳 === true || currentPhysique.元阳 === false;
  if (hasYin && !hasYang) return '女';
  if (hasYang && !hasYin) return '男';
  if (hasYinMarker || hasYangMarker) return '其他';
  if (STAT.性别 === '男' || STAT.性别 === '女' || STAT.性别 === '其他') return STAT.性别;
  return '男';
})();
let gender: ReincarnationGender = currentGender;
let race = 'human',
  raceInput = '';
let dest: string | null = null,
  destInput = '',
  destArea = '';
let root = { elements: [] as string[], mutation: false, mutationId: null as string | null, customName: '' };
let phyTier: PhysiqueTier = '凡体',
  phyPreset: string | null = physiques.find(item => item.tier === '凡体')?.id ?? null;
let phyPickerOpen = false,
  phyPickerTier: PhysiqueTier = phyTier,
  phyPickerCategory: PhysiqueCategory | null = null,
  phyPickerQuery = '',
  phyPickerPage = 1;
const phyCustom = { name: '', 悟性: 10, 根骨: 10, 气感: 10, effects: [{ name: '', value: '' }] };
let loc = 'fanjie',
  mem = 'no';
const itemQty: Record<string, number> = {};
const selStatus: string[] = [];
const cusSt = { on: false, name: '', type: '增益', eff: '' };

// 默认选中当前种族（若有）
if (种族Raw && RACES.some(r => r.name === 种族Raw && r.sel)) {
  race = RACES.find(r => r.name === 种族Raw)!.id;
}

function compute() {
  const sumGood = S.善业.reduce((a: number, x: any) => a + x.p, 0);
  const sumEvil = -S.恶业.reduce((a: number, x: any) => a + x.p, 0);
  penalty = Math.floor((天谴 / 寿命) * 10);
  E = Math.floor((sumGood + sumEvil) * (1 + S.Z)) + S.W - penalty;
  grade = GRADES.find(g => E >= g.min) ?? GRADES[GRADES.length - 1];
  return { sumGood, sumEvil };
}

// ======================================================================
// 点数
// ======================================================================
function raceCost() {
  return RACES.find(r => r.id === race)?.cost ?? 0;
}
function destCost() {
  return DEST.find(d => d.id === dest)?.cost ?? 0;
}
function rootCost() {
  const els = root.elements;
  if (els.includes('无')) return -100;
  if (els.includes('混沌')) return 60 + (root.mutation ? 10 : 0);
  const c = els.length;
  return c === 0 ? 0 : (ROOT_COST[c] ?? 0);
}
function phyCost() {
  return REINCARNATION_PHY_COST[phyTier];
}
function locCost() {
  return LOCATIONS.find(l => l.id === loc)?.cost ?? 0;
}
function memCost() {
  return MEMORY.find(m => m.id === mem)?.cost ?? 0;
}
function itemsCost() {
  return Object.entries(itemQty).reduce(
    (a, [id, q]) =>
      a +
      (q > 0
        ? itemCost(
            ITEMS.find(i => i.id === id),
            q,
          )
        : 0),
    0,
  );
}
function statusCost() {
  let n = selStatus.reduce((a, id) => a + (STATUSES.find(x => x.id === id)?.cost ?? 0), 0);
  if (cusSt.on && cusSt.name.trim()) n += CUS_STATUS_COST[cusSt.type] || 0;
  return n;
}
function spent() {
  return raceCost() + destCost() + rootCost() + phyCost() + locCost() + memCost() + itemsCost() + statusCost();
}
const remaining = () => E - spent();
const valid = () => path === 'ghost' || remaining() >= 0;

// ======================================================================
// 渲染
// ======================================================================
let APP_ROOT: HTMLElement | null = null;
const $ = (id: string) => (APP_ROOT?.querySelector(`#${id}`) || document.getElementById(id)) as HTMLElement;
const signed = (value: number) => `${value >= 0 ? '+' : '−'}${Math.abs(value)}`;

const PANEL_HTML = `
<div class="rc-wrap">
  <div id="rcPanel" class="rc-panel">
    <div class="rc-head" id="rcHead"><span class="rc-icon">☯</span><span class="rc-title">冥府审判 · 善恶评判定级</span><span class="rc-fold">▾</span></div>
    <div class="rc-body">
      <div class="rc-dead" id="rcDead"></div>
      <div class="rc-deeds">
        <div class="rc-deed-col good"><div class="rc-deed-head">✦ 善业</div><div id="rcGoodRows"></div><div class="rc-deed-total good">善业合计 <span class="sum" id="rcSumGood"></span></div></div>
        <div class="rc-deed-col evil"><div class="rc-deed-head">☠ 恶业</div><div id="rcEvilRows"></div><div class="rc-deed-total evil">恶业合计 <span class="sum" id="rcSumEvil"></span></div></div>
      </div>
      <div class="rc-zw" id="rcZw"></div>
      <div class="rc-calc">
        <div class="rc-calc-box"><div class="label">天谴罚 · 天谴/年×10</div><div class="formula" id="rcPenaltyFormula"></div><div class="result penalty" id="rcPenalty"></div></div>
        <div class="rc-calc-box"><div class="label">业力 E（预算）</div><div class="formula" id="rcEFormula"></div><div class="result verdict" id="rcE"></div><span class="rc-grade-tag" id="rcGrade"></span></div>
        <div class="rc-calc-box"><div class="label">判官断语</div><div class="formula" id="rcGradeDesc"></div></div>
      </div>
      <div class="rc-path">
        <div class="rc-path-btn sel" id="rcPathObey"><div class="pn">服从判决 · 投胎轮回</div><div class="pd">饮孟婆汤入轮回井，依业力挑选福泽/偿报</div></div>
        <div class="rc-path-btn" id="rcPathGhostBtn"><div class="pn">不入轮回 · 转生冥族</div><div class="pd">折返忘川鬼域荒野，跳过福泽/偿报，保留记忆与修为</div></div>
      </div>
      <div class="rc-ghost" id="rcGhostNote"></div>
      <div id="rcFate">
        <div class="rc-budget" id="rcBudget"></div>
        <div id="rcGroups"></div>
      </div>
      <div class="rc-submit">
        <button class="rc-btn" id="rcSubmit">定 数</button>
        <span class="rc-btn-hint" id="rcHint"></span>
      </div>
      <div class="rc-result" id="rcResult">
        <div class="res-title">生成回复 + MVU 变量变更（预览）</div>
        <pre id="rcResultText"></pre>
        <div class="res-note" id="rcResultNote"></div>
      </div>
    </div>
  </div>
</div>`;

function canToggleEl(name: string) {
  const els = root.elements;
  if (els.includes(name)) return true;
  if (name === '混沌' || name === '无') return els.length === 0;
  if (els.some(e => e === '混沌' || e === '无')) return false;
  if (els.length >= 5) return false;
  if (els.length === 4) {
    const allNormal = els.every(e => ELEMS_NORMAL.includes(e));
    if (!allNormal) return false;
    if (!ELEMS_NORMAL.includes(name)) return false;
  }
  return true;
}

function render() {
  const { sumGood, sumEvil } = compute();
  const d = S.亡魂;
  $('rcDead').innerHTML = `
    <span><span class="k">亡魂</span> <span class="v dead-name">${esc(d.name)}</span></span>
    <span><span class="k">生卒</span> <span class="v">年 ${d.years} 岁</span></span>
    <span><span class="k">生前境界</span> <span class="v">${esc(d.realm)}</span></span>
    <span><span class="k">死因</span> <span class="v">${esc(d.cause)}</span></span>`;
  $('rcGoodRows').innerHTML = S.善业
    .map(
      (x: any) =>
        `<div class="rc-deed-row good"><span class="t">${esc(x.t)}</span><span class="p">+${x.p}</span></div>`,
    )
    .join('');
  $('rcEvilRows').innerHTML = S.恶业
    .map(
      (x: any) =>
        `<div class="rc-deed-row evil"><span class="t">${esc(x.t)}</span><span class="p">−${x.p}</span></div>`,
    )
    .join('');
  $('rcSumGood').textContent = `+${sumGood}`;
  $('rcSumEvil').textContent = `${sumEvil}`;
  $('rcZw').innerHTML =
    `<span>功过修正</span><span class="z">Z[${signed(Number((S.Z * 100).toFixed(0)))}%]</span><span class="w">W[${signed(S.W)}]</span>`;
  const avg = (天谴 / 寿命).toFixed(1);
  $('rcPenaltyFormula').textContent = `天谴 ${天谴} ÷ 寿命 ${寿命} = ${avg}/年 × 10`;
  $('rcPenalty').textContent = `−${penalty}`;
  $('rcEFormula').textContent =
    `floor((Σ善 ${sumGood} + Σ恶 ${sumEvil}) × (1+${(S.Z * 100).toFixed(0)}%)) + W ${S.W} − 罚 ${penalty}`;
  $('rcE').textContent = `${E}`;
  const tag = $('rcGrade');
  tag.textContent = `${grade.level} · ${grade.title}`;
  tag.className = 'rc-grade-tag' + (grade.good ? '' : ' evil');
  $('rcGradeDesc').textContent = grade.desc + (grade.good ? ' · 福泽预算充足' : ' · 须以偿报抵业');
  renderPath();
  renderGroups();
  updateBudget();
  updateSubmit();
}

function renderPath() {
  $('rcPathObey').classList.toggle('sel', path === 'obey');
  $('rcPathGhostBtn').classList.toggle('sel', path === 'ghost');
  const gn = $('rcGhostNote');
  gn.className = 'rc-ghost' + (path === 'ghost' ? ' show' : '');
  gn.innerHTML =
    path === 'ghost'
      ? `<b>不入轮回 · 冥族转生</b>：折返忘川南岸【鬼域荒野】，种族变为<b>冥族</b>，<b>保留记忆与修为</b>。无需挑选福泽/偿报。`
      : '';
  $('rcFate').style.display = path === 'ghost' ? 'none' : '';
}

function groupShell(title: string, note: string, body: string) {
  return `<div class="rc-group"><div class="rc-group-title">${title}<span class="g-note">${note || ''}</span></div>${body}</div>`;
}
function chipHtml(o: any, cls: string, dataAttr: string) {
  const costTxt = o.cost === 0 ? '' : o.cost > 0 ? `+${o.cost}` : `−${-o.cost}`;
  return `<span class="rc-chip ${cls}" ${dataAttr}><span class="c-name">${o.name}</span>${o.note ? `<span class="c-note">${o.note}</span>` : ''}${costTxt ? `<span class="c-cost ${o.cost >= 0 ? 'pos' : 'neg'}">${costTxt}</span>` : ''}</span>`;
}
const esc = (s: any) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function renderGroups() {
  const host = $('rcGroups');
  host.innerHTML = '';
  const g = document.createElement('div');
  g.innerHTML = renderFateGroups();
  host.appendChild(g);
}

function renderFateGroups() {
  return `${renderRace()}${renderGender()}${renderRoot()}${renderPhysique()}${race === 'human' ? renderDest() : ''}${renderLocation()}${renderMemory()}${renderItems()}${renderStatuses()}`;
}

function renderRace() {
  const rSel = RACES.find(r => r.id === race);
  const inputExtra =
    rSel && rSel.input
      ? `<input class="c-input" id="raceInput" placeholder="${rSel.inputPh}" value="${esc(raceInput)}" />`
      : '';
  const chips = RACES.map(r => {
    const cls = (r.id === race ? 'sel ' : '') + (r.sel ? '' : 'disabled');
    const costTxt = r.sel ? (r.cost === 0 ? '' : r.cost > 0 ? `+${r.cost}` : `−${-r.cost}`) : '—';
    const note = r.sel ? '' : r.note || '';
    return `<span class="rc-chip ${cls}" data-race="${r.id}"><span class="c-name">${r.name}</span>${note ? `<span class="c-note">${note}</span>` : ''}${costTxt ? `<span class="c-cost ${r.cost >= 0 ? 'pos' : 'neg'}">${costTxt}</span>` : ''}</span>`;
  }).join('');
  return groupShell(
    '改变种族',
    '冥族/神族/域外异类灰置不可选',
    `<div class="rc-chips" id="raceChips">${chips}${inputExtra}</div>`,
  );
}

function renderGender() {
  const options: Array<{ id: ReincarnationGender; glyph: string; title: string; detail: string }> = [
    { id: '男', glyph: '阳', title: '男', detail: '元阳尚存' },
    { id: '女', glyph: '阴', title: '女', detail: '元阴尚存' },
    { id: '其他', glyph: '和', title: '其他', detail: '无元阴、元阳' },
  ];
  const cards = options
    .map(
      option => `<button type="button" class="rc-gender-card ${gender === option.id ? 'sel' : ''}" data-gender="${option.id}" aria-pressed="${gender === option.id}">
        <span class="gc-glyph">${option.glyph}</span>
        <span class="gc-copy"><b>${option.title}</b><small>${option.detail}</small></span>
      </button>`,
    )
    .join('');
  return groupShell('转世性别', '新生身体仅有男、女、其他三种选择', `<div class="rc-gender-grid">${cards}</div>`);
}

function renderRoot() {
  const els = root.elements;
  const elemsHtml =
    [...ELEMS_NORMAL, ...ELEMS_POLAR]
      .map(
        el =>
          `<span class="rc-elem ${els.includes(el) ? 'sel' : ''} ${canToggleEl(el) ? '' : 'disabled'}" data-el="${el}">${el}</span>`,
      )
      .join('') +
    `<span class="rc-elem ${els.includes('混沌') ? 'sel' : ''}" data-el="混沌" title="混沌">混</span>` +
    `<span class="rc-elem ${els.includes('无') ? 'sel' : ''}" data-el="无" title="无灵根">无</span>`;
  let tier = '未择',
    cost = 0;
  if (els.includes('无')) {
    tier = '无灵根 · 凡骨';
    cost = -100;
  } else if (els.includes('混沌')) {
    tier = root.mutation ? '变异上品灵根' : '上品灵根';
    cost = rootCost();
  } else if (els.length === 1 && root.mutation) {
    tier = '变异天灵根';
    cost = rootCost();
  } else if (els.length >= 1) {
    const map: Record<number, string> = { 1: '单灵根', 2: '双灵根', 3: '三灵根', 4: '四灵根', 5: '五灵根' };
    tier = map[els.length];
    cost = rootCost();
  }
  const canMut = els.length === 1 && els[0] !== '无';
  const mutHtml = canMut
    ? `<div class="rc-mut-row"><span class="lbl">变异</span>${MUTATIONS.filter(m => m.el === els[0] || m.el === '混沌')
        .map(m => `<span class="rc-chip ${root.mutationId === m.id ? 'sel' : ''}" data-mut="${m.id}">${m.name}</span>`)
        .join('')}
    <span class="rc-chip ${root.mutation && !root.mutationId ? 'sel' : ''}" data-mut="custom">自拟</span>
    ${root.mutation && !root.mutationId ? `<input class="c-input" id="mutCustomName" placeholder="变异名" value="${esc(root.customName)}" />` : ''}
    </div>`
    : '';
  const body = `<div class="rc-elems">${elemsHtml}</div><div class="rc-root-sum">${tier} · 点数 <b>${cost > 0 ? '+' : ''}${cost}</b></div>${mutHtml}`;
  return groupShell('改变灵根', '五→四→三→双→单：0/-30/0/30/60；无灵根 −100', body);
}

function resetPhyCustom(tier: PhysiqueTier) {
  const total = PHYSIQUE_TIER_S[tier];
  const base = Math.floor(total / 3);
  phyCustom.name = '';
  phyCustom.悟性 = base;
  phyCustom.根骨 = base;
  phyCustom.气感 = total - base * 2;
  phyCustom.effects = tier === '凡体' ? [] : [{ name: '', value: '' }];
}

function renderPhysiquePicker() {
  if (!phyPickerOpen) return '';
  const tierItems = physiques.filter(item => item.tier === phyPickerTier);
  const categories = physiqueCategoriesByTier(phyPickerTier);
  if (phyPickerCategory && !categories.includes(phyPickerCategory)) phyPickerCategory = null;
  const query = phyPickerQuery.trim().toLocaleLowerCase();
  const filtered = tierItems.filter(item => {
    if (phyPickerCategory && item.category !== phyPickerCategory) return false;
    if (!query) return true;
    return [
      item.name,
      item.subtitle,
      item.category,
      item.五行,
      ...(item.tags || []),
      ...(item.效果 || []).flatMap(x => [x.name, x.value]),
    ]
      .filter(Boolean)
      .some(value => String(value).toLocaleLowerCase().includes(query));
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PHY_PICKER_PAGE_SIZE));
  phyPickerPage = Math.min(Math.max(1, phyPickerPage), pageCount);
  const pageItems = filtered.slice((phyPickerPage - 1) * PHY_PICKER_PAGE_SIZE, phyPickerPage * PHY_PICKER_PAGE_SIZE);
  const tiers = PHYSIQUE_TIERS.map(tier => {
    const count = physiques.filter(item => item.tier === tier).length;
    const cost = REINCARNATION_PHY_COST[tier];
    return `<button type="button" class="rc-picker-filter ${phyPickerTier === tier ? 'sel' : ''}" data-picker-tier="${tier}"><b>${tier}</b><span>${count}项 · ${cost ? `+${cost}` : '0'}业力</span></button>`;
  }).join('');
  const categoryButtons = [
    `<button type="button" class="rc-chip ${phyPickerCategory === null ? 'sel' : ''}" data-picker-category="">全部 ${tierItems.length}</button>`,
    ...categories.map(category => {
      const count = tierItems.filter(item => item.category === category).length;
      return `<button type="button" class="rc-chip ${phyPickerCategory === category ? 'sel' : ''}" data-picker-category="${category}">${category} ${count}</button>`;
    }),
  ].join('');
  const cards = pageItems.length
    ? pageItems
        .map(item => {
          const effects = (item.效果 || [])
            .map(effect => `<div class="pc-effect"><b>${esc(effect.name)}</b><span>${esc(effect.value)}</span></div>`)
            .join('');
          return `<button type="button" class="rc-picker-card ${phyPreset === item.id ? 'sel' : ''}" data-picker-preset="${esc(item.id)}">
            <span class="pc-head"><b>${esc(item.name)}</b><i>${esc(item.五行 || '无相')}</i></span>
            <span class="pc-tags"><em>${item.tier}</em><em>${item.category}</em><em>悟 ${item.悟性} · 骨 ${item.根骨} · 感 ${item.气感}</em></span>
            <span class="pc-effects">${effects || '<span class="pc-empty">无额外效果</span>'}</span>
            ${item.desc ? `<span class="pc-desc">${esc(item.desc)}</span>` : ''}
          </button>`;
        })
        .join('')
    : `<div class="rc-picker-empty">没有符合当前条件的预设体质</div>`;
  const pager =
    pageCount > 1
      ? `<div class="rc-picker-pager"><button type="button" data-picker-page="${phyPickerPage - 1}" ${phyPickerPage <= 1 ? 'disabled' : ''}>上一页</button><span>${phyPickerPage} / ${pageCount}</span><button type="button" data-picker-page="${phyPickerPage + 1}" ${phyPickerPage >= pageCount ? 'disabled' : ''}>下一页</button></div>`
      : '';
  return `<div class="rc-phy-picker">
    <div class="rc-picker-head"><div><b>预设体质选择</b><span>数据与“自定义开局”完全共用；当前共 ${physiques.length} 项</span></div><button type="button" class="rc-picker-close" data-picker-close>收起</button></div>
    <div class="rc-picker-tiers">${tiers}</div>
    <div class="rc-picker-tools"><div class="rc-picker-search"><input id="phyPickerSearch" value="${esc(phyPickerQuery)}" placeholder="搜索名称、五行、分类或效果……" /><button type="button" data-picker-search>搜索</button></div><button type="button" class="rc-picker-custom" data-picker-custom>自创${phyPickerTier}</button></div>
    <div class="rc-picker-categories">${categoryButtons}</div>
    <div class="rc-picker-grid">${cards}</div>${pager}
  </div>`;
}

function renderPhysique() {
  const preset = findPhysique(phyPreset);
  const current = preset
    ? `<div class="rc-phy-current"><div class="pc-main"><span class="pc-glyph">${esc(preset.glyph || preset.五行 || '体')}</span><span class="pc-copy"><b>${esc(preset.name)}</b><small>${preset.tier} · ${preset.category} · ${esc(preset.五行 || '无相')}</small></span><span class="pc-cost">${REINCARNATION_PHY_COST[preset.tier] ? `+${REINCARNATION_PHY_COST[preset.tier]}` : '0'}</span></div><div class="pc-stats"><span>悟性 <b>${preset.悟性}</b></span><span>根骨 <b>${preset.根骨}</b></span><span>气感 <b>${preset.气感}</b></span></div><div class="pc-detail">${(preset.效果 || []).map(effect => `<span><b>${esc(effect.name)}</b> ${esc(effect.value)}</span>`).join('') || '<span>无额外效果</span>'}</div></div>`
    : `<div class="rc-phy-current"><div class="pc-main"><span class="pc-glyph">自</span><span class="pc-copy"><b>${esc(phyCustom.name || `${phyTier}（自创）`)}</b><small>${phyTier} · 自定义三维与效果</small></span><span class="pc-cost">${REINCARNATION_PHY_COST[phyTier] ? `+${REINCARNATION_PHY_COST[phyTier]}` : '0'}</span></div><div class="pc-stats"><span>悟性 <b>${phyCustom.悟性}</b></span><span>根骨 <b>${phyCustom.根骨}</b></span><span>气感 <b>${phyCustom.气感}</b></span></div></div>`;
  const editor =
    phyPreset === null
      ? `<div class="rc-phy-editor">
        <div class="pe-row pe-fields"><label><span>体质名号</span><input class="pe-name" id="phyName" placeholder="输入自创体质名称" value="${esc(phyCustom.name)}" /></label><label><span>悟性</span><input id="phyWu" type="number" min="1" value="${phyCustom.悟性}" /></label><label><span>根骨</span><input id="phyGen" type="number" min="1" value="${phyCustom.根骨}" /></label><label><span>气感</span><input id="phyQi" type="number" min="1" value="${phyCustom.气感}" /></label></div>
        <div class="pe-sum">三维总和 <b>${phyCustom.悟性 + phyCustom.根骨 + phyCustom.气感}</b> / ${PHYSIQUE_TIER_S[phyTier]} · ${esc(PHYSIQUE_TIER_INTRO[phyTier])}</div>
        <div id="phyEffects"></div>
        <div class="pe-row"><button type="button" class="rc-mini-action" id="phyAddEff">＋ 添加效果</button></div>
      </div>`
      : '';
  const body = `${current}<div class="rc-phy-actions"><button type="button" class="rc-mini-action primary" data-open-phy-picker>${phyPickerOpen ? '收起体质选择器' : '更换体质'}</button></div>${renderPhysiquePicker()}${editor}`;
  return groupShell('改变体质', '预设与自定义开局完全一致；凡0 / 灵+10 / 道+30 / 仙+60', body);
}

function renderDest() {
  const dSel = DEST.find(d => d.id === dest);
  const inputExtra =
    dSel && dSel.input
      ? `<input class="c-input" id="destInput" placeholder="${dSel.inputPh}" value="${esc(destInput)}" />`
      : '';
  const areaExtra =
    dest === 'custom'
      ? `<textarea class="rc-textarea" id="destArea" placeholder="详细描述转生身世（自由发挥）">${esc(destArea)}</textarea>`
      : '';
  const chips = DEST.map(o => chipHtml(o, dest === o.id ? 'sel' : '', `data-dest="${o.id}"`)).join('');
  return groupShell(
    '六道轮回',
    '仅人族可选；负分为偿报',
    `<div class="rc-chips">${chips}${inputExtra}</div>${areaExtra}`,
  );
}

function renderLocation() {
  return groupShell(
    '转生位置',
    '单选',
    `<div class="rc-chips">${LOCATIONS.map(o => chipHtml(o, loc === o.id ? 'sel' : '', `data-loc="${o.id}"`)).join('')}</div>`,
  );
}
function renderMemory() {
  return groupShell(
    '保留记忆',
    '是则保留已学会功法与全部记忆',
    `<div class="rc-chips">${MEMORY.map(o => chipHtml(o, mem === o.id ? 'sel' : '', `data-mem="${o.id}"`)).join('')}</div>`,
  );
}

function itemsGridHtml() {
  if (!ITEMS.length) {
    return `<div class="rc-empty-state"><b>当前没有可保留物品</b><span>已读取当前楼层的 MVU <code>stat_data.物品</code>，未发现具名物品。</span></div>`;
  }
  return ITEMS.map(it => {
    const q = itemQty[it.id] || 0;
    const c = itemCost(it, q);
    return `<div class="rc-card ${q > 0 ? 'sel' : ''}" data-item="${it.id}">
      <span class="box">✓</span>
      <span class="cd-info"><div class="cd-name">${esc(it.name)}</div><div class="cd-meta">${esc(it.品质)}品 · ${esc(it.类型)} · 拥有 ${it.数量}${it.秘籍 ? ' · 阅读进度清零' : ''}</div></span>
      <span class="rc-qty">
        <span class="rc-qty-btn" data-item-dec="${esc(it.id)}">−</span>
        <span class="rc-qty-num">${q}</span>
        <span class="rc-qty-btn ${q >= it.数量 ? 'disabled' : ''}" data-item-inc="${esc(it.id)}">+</span>
      </span>
      <span class="cd-cost pos">+${c}</span>
    </div>`;
  }).join('');
}
function renderItems() {
  return groupShell(
    '保留物品',
    '可调整保留数量；秘籍保留时阅读进度清零；成本=品质×数量',
    `<div class="rc-grid" id="rcItemsGrid">${itemsGridHtml()}</div>`,
  );
}

function renderStatuses() {
  const cusCost = cusSt.on ? CUS_STATUS_COST[cusSt.type] || 0 : 0;
  const cusCard = `<div class="rc-card ${cusSt.on ? 'sel' : ''}" data-status="__custom__"><span class="box">✓</span><span class="cd-info"><div class="cd-name">自创状态</div><div class="cd-meta">自定义永久状态（叙述效果）</div></span><span class="cd-cost ${cusCost >= 0 ? 'pos' : 'neg'}">${cusCost > 0 ? '+' : ''}${cusCost}</span></div>`;
  const cards = STATUSES.map(x => {
    const cls = x.cost >= 0 ? 'pos' : 'neg';
    return `<div class="rc-card ${selStatus.includes(x.id) ? 'sel' : ''}" data-status="${x.id}"><span class="box">✓</span><span class="cd-info"><div class="cd-name">${x.name} <span class="cd-type">${x.type}</span></div><div class="cd-meta">${x.desc}</div></span><span class="cd-cost ${cls}">${x.cost > 0 ? '+' : ''}${x.cost}</span></div>`;
  }).join('');
  const editor = cusSt.on
    ? `<div class="rc-phy-editor">
    <div class="pe-row"><label>名称</label><input class="pe-name rc-status-input" id="cusName" placeholder="如：天妒之体" value="${esc(cusSt.name)}" /></div>
    <div class="pe-row"><label>类型</label>${Object.keys(CUS_STATUS_COST)
      .map(
        t =>
          `<span class="rc-chip ${cusSt.type === t ? 'sel' : ''}" data-cus-type="${t}">${t}（${CUS_STATUS_COST[t] > 0 ? '+' : ''}${CUS_STATUS_COST[t]}）</span>`,
      )
      .join('')}</div>
    <div class="pe-row pe-effect-area"><label>效果</label><textarea class="rc-textarea rc-status-input" id="cusEff" placeholder="叙述性效果描述">${esc(cusSt.eff)}</textarea></div>
  </div>`
    : '';
  return groupShell(
    '转世状态',
    '永久 · 仅叙述效果；增益正分/减益负分；可自创',
    `<div class="rc-grid">${cards}${cusCard}</div>${editor}`,
  );
}

function renderRootOnly() {
  const g = $('rcGroups');
  g.innerHTML = '';
  const d = document.createElement('div');
  d.innerHTML = renderFateGroups();
  g.appendChild(d);
  renderPhyEffects();
}
function renderPhyOnly() {
  renderRootOnly();
}
function renderPhyEffects() {
  const box = $('phyEffects');
  if (!box) return;
  box.innerHTML = phyCustom.effects
    .map(
      (ef, i) =>
        `<div class="pe-row"><label>效果</label><input class="pe-eff-name" data-eff="${i}" data-k="n" placeholder="效果名" value="${esc(ef.name)}" /><input class="pe-eff-val" data-eff="${i}" data-k="v" placeholder="数值/描述" value="${esc(ef.value)}" /><button type="button" class="rc-mini-action danger" data-del-eff="${i}">删除</button></div>`,
    )
    .join('');
  box.querySelectorAll('[data-del-eff]').forEach(x =>
    x.addEventListener('click', () => {
      phyCustom.effects.splice(+x.getAttribute('data-del-eff')!, 1);
      renderPhyOnly();
    }),
  );
}

function markCards() {
  document
    .querySelectorAll('[data-status]')
    .forEach(el =>
      el.classList.toggle(
        'sel',
        selStatus.includes(el.getAttribute('data-status')!) ||
          (el.getAttribute('data-status') === '__custom__' && cusSt.on),
      ),
    );
}
function refreshItems() {
  const grid = $('rcItemsGrid');
  if (grid) grid.innerHTML = itemsGridHtml();
  else renderRootOnly();
}

function updateBudget() {
  if (path === 'ghost') return;
  const sp = spent(),
    left = remaining();
  $('bBud').textContent = `${E}`;
  $('bSpent').textContent = `${sp}`;
  const le = $('bLeft');
  le.textContent = `${left}`;
  le.className = 'b-num ' + (left >= 0 ? 'left' : 'over');
  $('bHint').textContent =
    E >= 0
      ? left >= 0
        ? '可用点数挑选福泽；也可选偿报抵价'
        : '已超预算，请取消福泽或补选偿报'
      : left >= 0
        ? '已达偿报要求，可再补福泽（若预算允许）'
        : `业力为负，尚需 ${-left} 点偿报`;
}
function updateSubmit() {
  const v = valid();
  $('rcSubmit').disabled = !v;
  $('rcHint').textContent =
    path === 'ghost'
      ? '已定：转生冥族，保留记忆与修为，直接生成回复。'
      : v
        ? `预算剩余 ${remaining()} 点，可定数。`
        : `预算超支 ${-remaining()} 点，无法定数。`;
  $('rcResult').classList.remove('show');
}
function renderBudget() {
  $('rcBudget').innerHTML = `
    <span class="b-label">善恶预算</span><span class="b-num bud" id="bBud"></span>
    <span class="b-label">已用</span><span class="b-num spent" id="bSpent"></span>
    <span class="b-label">剩余</span><span class="b-num left" id="bLeft"></span>
    <span class="b-hint" id="bHint"></span>`;
}

// ======================================================================
// 交互
// ======================================================================
function bindEvents() {
  $('rcHead').addEventListener('click', () => $('rcPanel').classList.toggle('collapsed'));
  $('rcPathObey').addEventListener('click', () => {
    path = 'obey';
    renderPath();
    renderGroups();
    updateBudget();
    updateSubmit();
  });
  $('rcPathGhostBtn').addEventListener('click', () => {
    path = 'ghost';
    renderPath();
    renderGroups();
    updateBudget();
    updateSubmit();
  });
  $('rcSubmit').addEventListener('click', submit);

  const g = $('rcGroups');
  g.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    const closest = (sel: string) => t.closest(sel) as HTMLElement | null;

    const el = closest('[data-el]');
    if (el) {
      const name = el.getAttribute('data-el')!;
      const isExcl = name === '混沌' || name === '无';
      if (isExcl) {
        const i = root.elements.indexOf(name);
        root = { elements: i >= 0 ? [] : [name], mutation: false, mutationId: null, customName: '' };
      } else {
        if (!canToggleEl(name)) return;
        const i = root.elements.indexOf(name);
        if (i >= 0) root.elements.splice(i, 1);
        else root.elements.push(name);
      }
      if (!(root.elements.length === 1 && root.elements[0] !== '无')) {
        root.mutation = false;
        root.mutationId = null;
      }
      renderRootOnly();
      updateBudget();
      updateSubmit();
      return;
    }
    const mut = closest('[data-mut]');
    if (mut) {
      root.mutation = true;
      root.mutationId = mut.getAttribute('data-mut') === 'custom' ? null : mut.getAttribute('data-mut');
      renderRootOnly();
      updateBudget();
      updateSubmit();
      return;
    }
    const openPhyPicker = closest('[data-open-phy-picker]');
    if (openPhyPicker) {
      phyPickerOpen = !phyPickerOpen;
      if (phyPickerOpen) {
        phyPickerTier = phyTier;
        phyPickerCategory = null;
        phyPickerPage = 1;
      }
      renderPhyOnly();
      return;
    }
    if (closest('[data-picker-close]')) {
      phyPickerOpen = false;
      renderPhyOnly();
      return;
    }
    const pickerTier = closest('[data-picker-tier]');
    if (pickerTier) {
      phyPickerTier = pickerTier.getAttribute('data-picker-tier') as PhysiqueTier;
      phyPickerCategory = null;
      phyPickerPage = 1;
      renderPhyOnly();
      return;
    }
    const pickerCategory = closest('[data-picker-category]');
    if (pickerCategory) {
      phyPickerCategory = (pickerCategory.getAttribute('data-picker-category') || null) as PhysiqueCategory | null;
      phyPickerPage = 1;
      renderPhyOnly();
      return;
    }
    const pickerPage = closest('[data-picker-page]');
    if (pickerPage) {
      phyPickerPage = Math.max(1, Number(pickerPage.getAttribute('data-picker-page')) || 1);
      renderPhyOnly();
      return;
    }
    if (closest('[data-picker-search]')) {
      phyPickerQuery = (($('phyPickerSearch') as HTMLInputElement | null)?.value || '').trim();
      phyPickerPage = 1;
      renderPhyOnly();
      return;
    }
    const pickerPreset = closest('[data-picker-preset]');
    if (pickerPreset) {
      const preset = findPhysique(pickerPreset.getAttribute('data-picker-preset'));
      if (!preset) return;
      phyTier = preset.tier;
      phyPreset = preset.id;
      phyPickerOpen = false;
      renderPhyOnly();
      updateBudget();
      updateSubmit();
      return;
    }
    if (closest('[data-picker-custom]')) {
      phyTier = phyPickerTier;
      phyPreset = null;
      phyPickerOpen = false;
      resetPhyCustom(phyTier);
      renderPhyOnly();
      updateBudget();
      updateSubmit();
      return;
    }
    const rc = closest('[data-race]');
    if (rc) {
      const r = RACES.find(x => x.id === rc.getAttribute('data-race'));
      if (!r || !r.sel) return;
      race = r.id;
      raceInput = '';
      renderGroups();
      updateBudget();
      updateSubmit();
      return;
    }
    const genderCard = closest('[data-gender]');
    if (genderCard) {
      gender = genderCard.getAttribute('data-gender') as ReincarnationGender;
      renderRootOnly();
      updateSubmit();
      return;
    }
    const dc = closest('[data-dest]');
    if (dc && race === 'human') {
      dest = dc.getAttribute('data-dest');
      destInput = '';
      renderGroups();
      updateBudget();
      updateSubmit();
      return;
    }
    const lc = closest('[data-loc]');
    if (lc) {
      loc = lc.getAttribute('data-loc')!;
      renderGroups();
      updateBudget();
      updateSubmit();
      return;
    }
    const mc = closest('[data-mem]');
    if (mc) {
      mem = mc.getAttribute('data-mem')!;
      renderGroups();
      updateBudget();
      updateSubmit();
      return;
    }
    const inc = closest('[data-item-inc]');
    if (inc) {
      const id = inc.getAttribute('data-item-inc')!;
      const it = ITEMS.find(i => i.id === id);
      if (it && (itemQty[id] || 0) < it.数量) {
        itemQty[id] = (itemQty[id] || 0) + 1;
        refreshItems();
        updateBudget();
        updateSubmit();
      }
      return;
    }
    const dec = closest('[data-item-dec]');
    if (dec) {
      const id = dec.getAttribute('data-item-dec')!;
      if (itemQty[id]) {
        itemQty[id] -= 1;
        if (itemQty[id] <= 0) delete itemQty[id];
        refreshItems();
        updateBudget();
        updateSubmit();
      }
      return;
    }
    const item = closest('[data-item]');
    if (item) {
      const it = ITEMS.find(i => i.id === item.getAttribute('data-item'));
      if (!it) return;
      if ((itemQty[it.id] || 0) > 0) delete itemQty[it.id];
      else itemQty[it.id] = it.数量;
      refreshItems();
      updateBudget();
      updateSubmit();
      return;
    }
    const st = closest('[data-status]');
    if (st) {
      const id = st.getAttribute('data-status')!;
      if (id === '__custom__') {
        cusSt.on = !cusSt.on;
        if (!cusSt.on) {
          cusSt.name = '';
          cusSt.eff = '';
        }
        renderRootOnly();
        updateBudget();
        updateSubmit();
        return;
      }
      const i = selStatus.indexOf(id);
      if (i >= 0) selStatus.splice(i, 1);
      else selStatus.push(id);
      markCards();
      updateBudget();
      updateSubmit();
      return;
    }
    const cusType = closest('[data-cus-type]');
    if (cusType) {
      cusSt.type = cusType.getAttribute('data-cus-type')!;
      renderRootOnly();
      updateBudget();
      updateSubmit();
      return;
    }
    const addEff = closest('#phyAddEff');
    if (addEff) {
      phyCustom.effects.push({ name: '', value: '' });
      renderPhyOnly();
      return;
    }
  });

  g.addEventListener('input', e => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'phyPickerSearch') {
      phyPickerQuery = t.value;
      return;
    }
    if (t.id === 'raceInput') {
      raceInput = t.value;
      return;
    }
    if (t.id === 'destInput') {
      destInput = t.value;
      return;
    }
    if (t.id === 'destArea') {
      destArea = t.value;
      return;
    }
    if (t.id === 'mutCustomName') {
      root.customName = t.value;
      return;
    }
    if (t.id === 'phyName') {
      phyCustom.name = t.value;
      return;
    }
    if (t.id === 'phyWu') {
      phyCustom.悟性 = Math.max(0, +t.value || 0);
    }
    if (t.id === 'phyGen') {
      phyCustom.根骨 = Math.max(0, +t.value || 0);
    }
    if (t.id === 'phyQi') {
      phyCustom.气感 = Math.max(0, +t.value || 0);
    }
    if (t.id === 'cusName') {
      cusSt.name = t.value;
      updateBudget();
      updateSubmit();
      return;
    }
    if (t.id === 'cusEff') {
      cusSt.eff = t.value;
      return;
    }
    const eff = t.getAttribute('data-eff');
    if (eff !== null) {
      const i = +eff;
      if (t.getAttribute('data-k') === 'n') phyCustom.effects[i].name = t.value;
      else phyCustom.effects[i].value = t.value;
    }
  });

  g.addEventListener('keydown', e => {
    const t = e.target as HTMLInputElement;
    if (t.id !== 'phyPickerSearch' || e.key !== 'Enter') return;
    e.preventDefault();
    phyPickerQuery = t.value.trim();
    phyPickerPage = 1;
    renderPhyOnly();
  });
}

// ======================================================================
// 提交：组装 MVU 补丁 + 回复提示词，写变量并发消息
// ======================================================================
function rootTierName(): string {
  const els = root.elements;
  if (!els.length) return '未择';
  if (els.includes('无')) return '无灵根';
  if (els.includes('混沌')) return root.mutation ? '变异上品灵根' : '上品灵根';
  if (root.mutation && els.length === 1) return '变异天灵根';
  const map: Record<number, string> = { 1: '单灵根', 2: '双灵根', 3: '三灵根', 4: '四灵根', 5: '五灵根' };
  return map[els.length] || '混合灵根';
}
function rootDisplay(): string {
  const els = root.elements;
  if (!els.length) return '未择';
  if (els.includes('无')) return '无灵根';
  if (els.includes('混沌')) return root.mutation ? root.customName || '变异上品灵根' : '混沌灵根';
  if (els.length === 1) {
    if (root.mutation) {
      const m = MUTATIONS.find(x => x.id === root.mutationId);
      return root.customName || m?.name || `${els[0]}变异灵根`;
    }
    return `${els[0]}灵根`;
  }
  const map: Record<number, string> = { 2: '双灵根', 3: '三灵根', 4: '四灵根', 5: '五灵根' };
  return `${els.join('')}${map[els.length] || '灵根'}`;
}
function phyName(): string {
  if (phyPreset) return findPhysique(phyPreset)?.name || '未知体质';
  return phyCustom.name.trim() || '自拟体质';
}

function summarize(): string {
  const parts: string[] = [];
  const r = RACES.find(x => x.id === race)!;
  parts.push(`种族→${r.name}${r.input && raceInput ? `（${raceInput}）` : ''}[${r.cost > 0 ? '+' : ''}${r.cost}]`);
  const essenceSummary = gender === '男' ? '元阳尚存' : gender === '女' ? '元阴尚存' : '元阴/元阳均无';
  parts.push(`性别→${gender}（${essenceSummary}）`);
  if (root.elements.length)
    parts.push(
      `灵根→${rootDisplay()}${root.mutation && !root.customName ? '' : ''}[${rootCost() > 0 ? '+' : ''}${rootCost()}]`,
    );
  const physiquePoint = REINCARNATION_PHY_COST[phyTier];
  parts.push(`体质→${phyTier}·${phyName()}[${physiquePoint > 0 ? '+' : ''}${physiquePoint}]`);
  if (race === 'human' && dest) {
    const d = DEST.find(x => x.id === dest)!;
    parts.push(
      `六道→${d.name}${destInput ? `（${destInput}）` : ''}${destArea ? `：${destArea}` : ''}[${d.cost > 0 ? '+' : ''}${d.cost}]`,
    );
  }
  parts.push(`位置→${LOCATIONS.find(l => l.id === loc)!.name}[+${locCost()}]`);
  if (mem === 'yes') parts.push('保留记忆[+30]');
  const kept = Object.entries(itemQty).filter(([, q]) => q > 0);
  if (kept.length)
    parts.push(
      '保留物品→' +
        kept.map(([id, q]) => `${ITEMS.find(i => i.id === id)!.name}×${q}`).join('、') +
        `[+${itemsCost()}]`,
    );
  if (selStatus.length)
    parts.push(
      '转世状态→' + selStatus.map(id => STATUSES.find(x => x.id === id)!.name).join('、') + `[${statusCost()}]`,
    );
  if (cusSt.on && cusSt.name.trim())
    parts.push(
      `转世状态→自创·${cusSt.name}（${cusSt.type}：${cusSt.eff || '未描述'}）[${CUS_STATUS_COST[cusSt.type] > 0 ? '+' : ''}${CUS_STATUS_COST[cusSt.type]}]`,
    );
  return parts.join('；') || '未作选择';
}

function buildPrompt(): string {
  const { sumGood, sumEvil } = compute();
  const d = S.亡魂;
  if (path === 'ghost') {
    return [
      `【转生定论 · 不入轮回】`,
      `亡魂：${d.name}（年${d.years} · ${d.realm}）｜死因：${d.cause}`,
      `业力 E = ${E} → ${grade.level} · ${grade.title}，但拒绝饮孟婆汤。`,
      `---`,
      `判官宣判后，<user>折返忘川南岸【鬼域荒野】，种族变为冥族，保留记忆与修为，踏入幽冥生涯线。请据此展开后续。`,
    ].join('\n');
  }
  const keptManuals = Object.entries(itemQty)
    .filter(([id, qty]) => qty > 0 && ITEMS.find(item => item.id === id)?.秘籍)
    .map(([id]) => id);
  const 秘籍 = keptManuals.length ? `；所保留秘籍（${keptManuals.join('、')}）阅读进度→0` : '';
  const memTxt = mem === 'yes' ? '，保留已学会功法与全部记忆' : '，功法清空、记忆归零';
  return [
    `【转生定论 · 投胎轮回】`,
    `亡魂：${d.name}（年${d.years} · ${d.realm}）｜死因：${d.cause}`,
    `善恶：Σ善 ${sumGood} / Σ恶 ${sumEvil} ｜ 修正 Z[${signed(Number((S.Z * 100).toFixed(0)))}%] W[${signed(S.W)}] ｜ 天谴罚 ${penalty}`,
    `业力 E = ${E} → ${grade.level} · ${grade.title}（${grade.desc}）`,
    `所择命途：${summarize()}`,
    `消耗 ${spent()} / 预算 ${E} 点，剩余 ${remaining()}。`,
    `---`,
    `新生身体从 0 岁开始：修为重置为凡人，年龄与外观年龄均为 0，基础寿命为 ${NEWBORN_LIFESPAN} 年；请重新描写符合所选种族与性别的婴儿外貌。`,
    `请据此展开冥府宣判与投胎剧情，严格落实所选命途效果${秘籍}${memTxt}，并结合转生设定推进故事。`,
  ].join('\n');
}

function buildPatch(): Record<string, any> {
  const cur: Record<string, any> = {
    种族: 种族Raw || '人族',
    物品: JSON.parse(JSON.stringify(物品Raw || {})),
    功法: JSON.parse(JSON.stringify(功法Raw || {})),
    关系列表: JSON.parse(JSON.stringify(关系Raw || {})),
    灵根: JSON.parse(JSON.stringify(STAT.灵根 || {})),
    体质: JSON.parse(JSON.stringify(STAT.体质 || {})),
    寿元: JSON.parse(JSON.stringify(STAT.寿元 || {})),
    修炼进度: JSON.parse(JSON.stringify(STAT.修炼进度 || {})),
    地点: JSON.parse(JSON.stringify(地点Raw || {})),
    状态效果: JSON.parse(JSON.stringify(状态Raw || {})),
  };
  const savedArts = mem === 'yes' ? JSON.parse(JSON.stringify(cur.功法)) : {};
  // 清空物品 / 功法
  cur.物品 = {};
  cur.功法 = {};
  // 关系列表：保留条目，好感=0、道侣=false
  for (const k of Object.keys(cur.关系列表 || {})) {
    const r = cur.关系列表[k];
    if (r && typeof r === 'object') {
      r.好感度 = 0;
      r.道侣 = false;
    }
  }
  // 保留物品（秘籍阅读进度清零）
  for (const [id, qty] of Object.entries(itemQty)) {
    if (!qty) continue;
    const it = ITEMS.find(i => i.id === id);
    if (!it) continue;
    const entry: any = JSON.parse(JSON.stringify(物品Raw[id] || {}));
    entry.品质 = entry.品质 || it.品质 || '凡';
    entry.类型 = entry.类型 || (it.秘籍 ? '秘籍' : it.类型 || '物品');
    entry.数量 = qty;
    if (it.秘籍) {
      if ('阅读进度' in entry) entry.阅读进度 = 0;
      if (Array.isArray(entry.标签)) {
        entry.标签 = entry.标签.map((tag: unknown) =>
          typeof tag === 'string'
            ? tag.replace(
                /^(阅读进度\s*[:：]\s*)\d+(\s*\/\s*\d+)$/u,
                (_match, prefix: string, total: string) => `${prefix}0${total}`,
              )
            : tag,
        );
      }
    }
    cur.物品[id] = entry;
  }
  // 保留记忆 → 恢复功法
  if (mem === 'yes') cur.功法 = savedArts;
  // 不入轮回 → 冥族
  if (path === 'ghost') {
    cur.种族 = '冥族';
    // 保留记忆与修为（功法已保留；修为=境界不变，不做处理）
    cur.功法 = JSON.parse(JSON.stringify(功法Raw || {}));
  } else {
    // 种族
    const r = RACES.find(x => x.id === race)!;
    cur.种族 = r.name;
    // 灵根
    if (root.elements.length) {
      cur.灵根 = {
        ...cur.灵根,
        名称: rootDisplay(),
        五行: root.elements.slice(),
        品阶: rootTierName(),
        变异: root.mutation,
        描述: '',
      };
    }
    // 体质
    if (phyPreset) {
      const p = findPhysique(phyPreset)!;
      const effects = Object.fromEntries((p.效果 || []).map(effect => [effect.name, effect.value]));
      cur.体质 = {
        ...cur.体质,
        名称: p.name,
        品阶: p.tier,
        悟性: p.悟性,
        根骨: p.根骨,
        气感: p.气感,
        效果: effects,
        描述: p.desc || '',
      };
    } else {
      const effs: Record<string, string> = {};
      for (const e of phyCustom.effects) if (e.name.trim()) effs[e.name.trim()] = e.value;
      cur.体质 = {
        ...cur.体质,
        名称: phyCustom.name.trim() || '自拟体质',
        品阶: phyTier,
        悟性: phyCustom.悟性,
        根骨: phyCustom.根骨,
        气感: phyCustom.气感,
        效果: effs,
        描述: '',
      };
    }
    // 新生身体：元阴/元阳不能继承旧身体的“已损(false)”状态。
    cur.体质.元阴 = gender === '女' ? true : null;
    cur.体质.元阳 = gender === '男' ? true : null;
    // 投胎后从凡人婴儿重新开始；寿命沿用自定义开局的凡人基础值。
    cur.寿元 = {
      ...cur.寿元,
      年龄: 0,
      寿命: NEWBORN_LIFESPAN,
      外观年龄: 0,
    };
    cur.修炼进度 = {
      ...cur.修炼进度,
      境界: '凡人',
      当前进度: 0,
      进度上限: 100,
      天谴: 0,
      丹毒: 0,
    };
    // 位置
    cur.地点 = { ...cur.地点, 世界: LOCATIONS.find(l => l.id === loc)!.name };
    // 转世状态
    for (const id of selStatus) {
      const s = STATUSES.find(x => x.id === id)!;
      cur.状态效果[s.name] = { 类型: s.type, 效果: { 叙述: s.desc }, 层数: 1, 剩余时间: '永久', 来源: '转世' };
    }
    if (cusSt.on && cusSt.name.trim()) {
      cur.状态效果[cusSt.name.trim()] = {
        类型: cusSt.type,
        效果: { 叙述: cusSt.eff || '' },
        层数: 1,
        剩余时间: '永久',
        来源: '转世',
      };
    }
  }
  return cur;
}

function showPreview(prompt: string, note: string) {
  $('rcResultText').textContent = prompt;
  $('rcResultNote').textContent = note;
  $('rcResult').classList.add('show');
}

async function submit() {
  const prompt = buildPrompt();
  const patch = buildPatch();
  // 1) 写 MVU 变量
  let wrote = false;
  try {
    if (typeof insertOrAssignVariables === 'function') {
      const message_id = typeof getCurrentMessageId === 'function' ? getCurrentMessageId() : -1;
      await insertOrAssignVariables({ stat_data: patch }, { type: 'message', message_id });
      wrote = true;
    }
  } catch (err) {
    console.error('[轮回转生] 写入 MVU 失败:', err);
  }
  // 2) 发送消息并触发回复
  try {
    if (typeof createChatMessages === 'function') {
      await createChatMessages([{ role: 'user', message: prompt }]);
      if (typeof triggerSlash === 'function') await triggerSlash('/trigger');
      showPreview(prompt, `已发送给 AI 生成转生剧情${wrote ? '；MVU 变量已更新' : '；MVU 写入不可用（仅本地预览）'}。`);
      return;
    }
  } catch (err) {
    console.error('[轮回转生] 发送失败:', err);
  }
  showPreview(prompt, '当前环境不支持 createChatMessages，以下为将发送的提示词预览（本地预览模式）。');
}

// ======================================================================
// 启动
// ======================================================================
function boot() {
  const app = (PENDING_HOST?.querySelector('#app') || document.getElementById('app')) as HTMLElement | null;
  if (!app) return;
  APP_ROOT = app;
  if (PENDING_HOST) PENDING_HOST.dataset.rcBooted = 'true';
  app.innerHTML = PANEL_HTML;
  renderBudget();
  render();
  bindEvents();
  renderPhyEffects();
  // 调试/集成钩子（真实运行不依赖）
  (window as any).__rc = { buildPatch, buildPrompt, summarize };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
