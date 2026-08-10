/**
 * 轮回转生面板 —— 正文美化加载的独立前端模块。
 *
 * 宿主（正文美化）识别消息里的 <reincarnation_info> 后，把原始内容放进
 * window.__reincarnation_payload，再通过 jQuery .load 把本模块（dist/轮回转生/index.html）
 * 注入对应楼层。本模块据此解析亡魂/善恶/功过修正，读取 MVU stat_data 计算天谴罚与业力 E，
 * 玩家挑选福泽/偿报后，回写 MVU 变量并发送消息触发 AI 回复。
 */
import './styles.css';

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
  { id: 'm-jian', name: '剑灵根', el: '金' }, { id: 'm-xue', name: '血灵根', el: '金' },
  { id: 'm-feng', name: '风灵根', el: '木' }, { id: 'm-du', name: '毒灵根', el: '木' },
  { id: 'm-bing', name: '冰灵根', el: '水' }, { id: 'm-lei', name: '雷灵根', el: '火' },
  { id: 'm-ci', name: '磁灵根', el: '土' }, { id: 'm-you', name: '幽灵根', el: '阴' },
  { id: 'm-long', name: '龙灵根', el: '阳' }, { id: 'm-xukong', name: '虚空灵根', el: '混沌' },
  { id: 'm-hunyuan', name: '混元灵根', el: '混沌' },
];
const ROOT_COST: Record<string, number> = { 1: 60, 2: 30, 3: 0, 4: -30, 5: 0, 无: -100, 混沌: 60 };

const PHY_TIERS = [
  { id: '凡体', S: 30, cost: 0 }, { id: '灵体', S: 50, cost: 10 },
  { id: '道体', S: 75, cost: 30 }, { id: '仙体', S: 100, cost: 60 },
];
const PHY_PRESETS: Record<string, { id: string; name: string; stat: string; sub: string; eff?: string }[]> = {
  凡体: [
    { id: 'fg', name: '凡骨', stat: '10/10/10', sub: '无特效' },
    { id: 'fh', name: '灵慧凡躯', stat: '14/8/8', sub: '无特效·水' },
    { id: 'fz', name: '朴拙凡躯', stat: '8/14/8', sub: '无特效·金' },
    { id: 'fm', name: '灵敏凡躯', stat: '8/8/14', sub: '无特效·木' },
  ],
  灵体: [
    { id: 'll', name: '蛮力之躯', stat: '14/22/14', sub: '战斗·土', eff: '近身攻击力+15%' },
    { id: 'cy', name: '赤焰灵体', stat: '16/16/18', sub: '战斗·火', eff: '火系威力+10%' },
    { id: 'hf', name: '寒霜灵体', stat: '18/14/18', sub: '修炼·水', eff: '凝气速度+10%' },
    { id: 'lz', name: '灵植之躯', stat: '16/14/20', sub: '生产·木', eff: '灵植培育+15%' },
  ],
  道体: [
    { id: 'dj', name: '道基道体', stat: '24/26/25', sub: '修炼·综合', eff: '所有修炼效果+12%' },
    { id: 'tj', name: '通明道体', stat: '30/20/25', sub: '领悟·水', eff: '领悟效率+15%' },
    { id: 'bf', name: '不灭道体', stat: '20/32/23', sub: '战斗·土', eff: '受到伤害-12%' },
  ],
  仙体: [
    { id: 'hy', name: '鸿蒙仙体', stat: '34/34/32', sub: '综合·混沌', eff: '全属性大幅提升' },
    { id: 'xz', name: '玄黄仙体', stat: '32/36/32', sub: '战斗·金', eff: '攻伐威力+20%' },
  ],
};

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
function readStat(key: string): any {
  try {
    if (typeof getMessageVar === 'function') {
      return getMessageVar('stat_data.' + key, { defaults: {} }) || {};
    }
  } catch { /* ignore */ }
  return {};
}
function readWholeStat(): any {
  try {
    const t = (window as any).__reincarnation_stat;
    if (t && typeof t === 'object') return t;
    if (typeof getMessageVar === 'function') return getMessageVar('stat_data', { defaults: {} }) || {};
  } catch { /* ignore */ }
  return {};
}

const STAT = readWholeStat();
const 修炼 = STAT.修炼进度 || readStat('修炼进度');
const 寿元 = STAT.寿元 || readStat('寿元');
const 物品Raw = STAT.物品 || readStat('物品');
const 功法Raw = STAT.功法 || readStat('功法');
const 关系Raw = STAT.关系列表 || readStat('关系列表');
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

// 保留物品清单：真实取自 stat_data.物品；本地预览/空数据用样例
function buildItems(): any[] {
  const keys = Object.keys(物品Raw || {});
  if (!keys.length) return SAMPLE_ITEMS;
  return keys.map(name => {
    const it = 物品Raw[name] || {};
    return {
      id: name, name,
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
const 寿命 = Number(寿元.寿命) || (Number(寿元.年龄) || 1);

// ======================================================================
// 解析 <reincarnation_info>（宿主注入 window.__reincarnation_payload）
// ======================================================================
const FALLBACK = {
  亡魂: { name: '无名亡魂', years: 0, realm: '未知', cause: '未知' },
  善业: [] as { t: string; p: number }[],
  恶业: [] as { t: string; p: number }[],
  Z: 0,
  W: 0,
};

function parseDeed(row: string): { t: string; p: number } | null {
  const m = row.replace(/^\||\|$/g, '').trim().match(/^(.*?)[:：]\s*([+-]?\d+)\s*$/);
  if (m) return { t: m[1].trim(), p: Math.abs(+m[2]) };
  const t = row.replace(/^\||\|$/g, '').trim();
  return t ? { t, p: 0 } : null;
}

function parseReincarnation(raw: string) {
  const out: any = JSON.parse(JSON.stringify(FALLBACK));
  if (!raw) return out;
  const sections: Record<string, string[]> = {};
  let current = '';
  for (const line of raw.split('\n')) {
    const h = line.match(/^\s*\{(.+?)\}\s*$/);
    if (h) { current = h[1]; (sections[current] = sections[current] || []); continue; }
    if (current && line.trim()) sections[current].push(line.trim());
  }
  for (const row of sections['亡魂信息'] || []) {
    const inner = row.replace(/^\||\|$/g, '').trim();
    for (const part of inner.split('|')) {
      const idx = part.indexOf(':');
      if (idx < 0) continue;
      const key = part.slice(0, idx).trim();
      let val = part.slice(idx + 1).trim().replace(/^\[|\]$/g, '').trim();
      if (key === '亡魂') out.亡魂.name = val;
      else if (key === '生卒') { const mm = val.match(/(\d+)/); out.亡魂.years = mm ? +mm[1] : 0; }
      else if (key === '生前境界') out.亡魂.realm = val;
      else if (key === '死因') out.亡魂.cause = val;
    }
  }
  out.善业 = (sections['善业'] || []).map(parseDeed).filter(Boolean);
  out.恶业 = (sections['恶业'] || []).map(parseDeed).filter(Boolean);
  for (const row of sections['功过修正'] || []) {
    const zm = row.match(/Z\[?\s*([+-]?\d+)\s*%?\]?/);
    const wm = row.match(/W\[?\s*([+-]?\d+)\s*\]?/);
    if (zm) out.Z = +zm[1] / 100;
    if (wm) out.W = +wm[1];
  }
  return out;
}

const RAW = (window as any).__reincarnation_payload || '';
const S = parseReincarnation(RAW);

// ======================================================================
// 面板状态
// ======================================================================
let E = 0, penalty = 0, grade = GRADES[6], path = 'obey';
let race = 'human', raceInput = '';
let dest: string | null = null, destInput = '', destArea = '';
let root = { elements: [] as string[], mutation: false, mutationId: null as string | null, customName: '' };
let phyTier = '凡体', phyPreset: string | null = null;
let phyCustom = { name: '', 悟性: 10, 根骨: 10, 气感: 10, effects: [{ name: '', value: '' }] };
let loc = 'fanjie', mem = 'no';
let itemQty: Record<string, number> = {};
let selStatus: string[] = [];
let cusSt = { on: false, name: '', type: '增益', eff: '' };

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
function raceCost() { return RACES.find(r => r.id === race)?.cost ?? 0; }
function destCost() { return DEST.find(d => d.id === dest)?.cost ?? 0; }
function rootCost() {
  const els = root.elements;
  if (els.includes('无')) return -100;
  if (els.includes('混沌')) return 60 + (root.mutation ? 10 : 0);
  const c = els.length;
  return c === 0 ? 0 : (ROOT_COST[c] ?? 0);
}
function phyCost() { return PHY_TIERS.find(t => t.id === phyTier)?.cost ?? 0; }
function locCost() { return LOCATIONS.find(l => l.id === loc)?.cost ?? 0; }
function memCost() { return MEMORY.find(m => m.id === mem)?.cost ?? 0; }
function itemsCost() {
  return Object.entries(itemQty).reduce((a, [id, q]) => a + (q > 0 ? itemCost(ITEMS.find(i => i.id === id), q) : 0), 0);
}
function statusCost() {
  let n = selStatus.reduce((a, id) => a + (STATUSES.find(x => x.id === id)?.cost ?? 0), 0);
  if (cusSt.on && cusSt.name.trim()) n += CUS_STATUS_COST[cusSt.type] || 0;
  return n;
}
function spent() { return raceCost() + destCost() + rootCost() + phyCost() + locCost() + memCost() + itemsCost() + statusCost(); }
const remaining = () => E - spent();
const valid = () => path === 'ghost' || remaining() >= 0;

// ======================================================================
// 渲染
// ======================================================================
const $ = (id: string) => document.getElementById(id) as HTMLElement;

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
  $('rcGoodRows').innerHTML = S.善业.map((x: any) => `<div class="rc-deed-row good"><span class="t">${esc(x.t)}</span><span class="p">+${x.p}</span></div>`).join('');
  $('rcEvilRows').innerHTML = S.恶业.map((x: any) => `<div class="rc-deed-row evil"><span class="t">${esc(x.t)}</span><span class="p">−${x.p}</span></div>`).join('');
  $('rcSumGood').textContent = `+${sumGood}`;
  $('rcSumEvil').textContent = `${sumEvil}`;
  $('rcZw').innerHTML = `<span>功过修正</span><span class="z">Z[+${(S.Z * 100).toFixed(0)}%]</span><span class="w">W[+${S.W}]</span>`;
  const avg = (天谴 / 寿命).toFixed(1);
  $('rcPenaltyFormula').textContent = `天谴 ${天谴} ÷ 寿命 ${寿命} = ${avg}/年 × 10`;
  $('rcPenalty').textContent = `−${penalty}`;
  $('rcEFormula').textContent = `floor((Σ善 ${sumGood} + Σ恶 ${sumEvil}) × (1+${(S.Z * 100).toFixed(0)}%)) + W ${S.W} − 罚 ${penalty}`;
  $('rcE').textContent = `${E}`;
  const tag = $('rcGrade'); tag.textContent = `${grade.level} · ${grade.title}`;
  tag.className = 'rc-grade-tag' + (grade.good ? '' : ' evil');
  $('rcGradeDesc').textContent = grade.desc + (grade.good ? ' · 福泽预算充足' : ' · 须以偿报抵业');
  renderPath(); renderGroups(); updateBudget(); updateSubmit();
}

function renderPath() {
  $('rcPathObey').classList.toggle('sel', path === 'obey');
  $('rcPathGhostBtn').classList.toggle('sel', path === 'ghost');
  const gn = $('rcGhostNote');
  gn.className = 'rc-ghost' + (path === 'ghost' ? ' show' : '');
  gn.innerHTML = path === 'ghost' ? `<b>不入轮回 · 冥族转生</b>：折返忘川南岸【鬼域荒野】，种族变为<b>冥族</b>，<b>保留记忆与修为</b>。无需挑选福泽/偿报。` : '';
  $('rcFate').style.display = path === 'ghost' ? 'none' : '';
}

function groupShell(title: string, note: string, body: string) {
  return `<div class="rc-group"><div class="rc-group-title">${title}<span class="g-note">${note || ''}</span></div>${body}</div>`;
}
function chipHtml(o: any, cls: string, dataAttr: string) {
  const costTxt = o.cost === 0 ? '' : (o.cost > 0 ? `+${o.cost}` : `−${-o.cost}`);
  return `<span class="rc-chip ${cls}" ${dataAttr}><span class="c-name">${o.name}</span>${o.note ? `<span class="c-note">${o.note}</span>` : ''}${costTxt ? `<span class="c-cost ${o.cost >= 0 ? 'pos' : 'neg'}">${costTxt}</span>` : ''}</span>`;
}
const esc = (s: any) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function renderGroups() {
  const host = $('rcGroups');
  host.innerHTML = '';
  const g = document.createElement('div');
  g.innerHTML = `${renderRace()}${renderRoot()}${renderPhysique()}${race === 'human' ? renderDest() : ''}${renderLocation()}${renderMemory()}${renderItems()}${renderStatuses()}`;
  host.appendChild(g);
}

function renderRace() {
  const rSel = RACES.find(r => r.id === race);
  const inputExtra = rSel && rSel.input ? `<input class="c-input" id="raceInput" placeholder="${rSel.inputPh}" value="${esc(raceInput)}" />` : '';
  const chips = RACES.map(r => {
    const cls = (r.id === race ? 'sel ' : '') + (r.sel ? '' : 'disabled');
    const costTxt = r.sel ? (r.cost === 0 ? '' : (r.cost > 0 ? `+${r.cost}` : `−${-r.cost}`)) : '—';
    const note = r.sel ? '' : (r.note || '');
    return `<span class="rc-chip ${cls}" data-race="${r.id}"><span class="c-name">${r.name}</span>${note ? `<span class="c-note">${note}</span>` : ''}${costTxt ? `<span class="c-cost ${r.cost >= 0 ? 'pos' : 'neg'}">${costTxt}</span>` : ''}</span>`;
  }).join('');
  return groupShell('改变种族', '冥族/神族/域外异类灰置不可选', `<div class="rc-chips" id="raceChips">${chips}${inputExtra}</div>`);
}

function renderRoot() {
  const els = root.elements;
  const elemsHtml = [...ELEMS_NORMAL, ...ELEMS_POLAR].map(el =>
    `<span class="rc-elem ${els.includes(el) ? 'sel' : ''} ${canToggleEl(el) ? '' : 'disabled'}" data-el="${el}">${el}</span>`).join('') +
    `<span class="rc-elem ${els.includes('混沌') ? 'sel' : ''}" data-el="混沌" title="混沌">混</span>` +
    `<span class="rc-elem ${els.includes('无') ? 'sel' : ''}" data-el="无" title="无灵根">无</span>`;
  let tier = '未择', cost = 0;
  if (els.includes('无')) { tier = '无灵根 · 凡骨'; cost = -100; }
  else if (els.includes('混沌')) { tier = root.mutation ? '变异上品灵根' : '上品灵根'; cost = rootCost(); }
  else if (els.length === 1 && root.mutation) { tier = '变异天灵根'; cost = rootCost(); }
  else if (els.length >= 1) { const map: Record<number, string> = { 1: '单灵根', 2: '双灵根', 3: '三灵根', 4: '四灵根', 5: '五灵根' }; tier = map[els.length]; cost = rootCost(); }
  const canMut = els.length === 1 && els[0] !== '无';
  const mutHtml = canMut ? `<div class="rc-mut-row"><span class="lbl">变异</span>${MUTATIONS.filter(m => m.el === els[0] || m.el === '混沌').map(m =>
    `<span class="rc-chip ${root.mutationId === m.id ? 'sel' : ''}" data-mut="${m.id}">${m.name}</span>`).join('')}
    <span class="rc-chip ${root.mutation && !root.mutationId ? 'sel' : ''}" data-mut="custom">自拟</span>
    ${root.mutation && !root.mutationId ? `<input class="c-input" id="mutCustomName" placeholder="变异名" value="${esc(root.customName)}" />` : ''}
    </div>` : '';
  const body = `<div class="rc-elems">${elemsHtml}</div><div class="rc-root-sum">${tier} · 点数 <b>${cost > 0 ? '+' : ''}${cost}</b></div>${mutHtml}`;
  return groupShell('改变灵根', '五→四→三→双→单：0/-30/0/30/60；无灵根 −100', body);
}

function renderPhysique() {
  const tabs = PHY_TIERS.map(t => `<span class="rc-phy-tab ${phyTier === t.id ? 'sel' : ''}" data-tier="${t.id}">${t.id}<span style="font-size:0.72em;margin-left:4px;color:#93dca5">${t.cost === 0 ? '' : '+' + t.cost}</span></span>`).join('');
  const presets = PHY_PRESETS[phyTier].map(p =>
    `<div class="rc-phy-card ${phyPreset === p.id ? 'sel' : ''}" data-preset="${p.id}"><div class="pc-name">${p.name}</div><div class="pc-sub">${p.sub}</div><div class="pc-stat">悟/根/气 ${p.stat}</div>${p.eff ? `<div class="pc-sub">${p.eff}</div>` : ''}</div>`).join('') +
    `<div class="rc-phy-card ${phyPreset === null ? 'sel' : ''}" data-preset="custom"><div class="pc-name">自拟</div><div class="pc-sub">自定义三维与效果</div></div>`;
  const t = PHY_TIERS.find(x => x.id === phyTier)!;
  const editor = phyPreset === null ? `<div class="rc-phy-editor">
    <div class="pe-row"><label>名号</label><input class="pe-name" id="phyName" value="${esc(phyCustom.name)}" /></div>
    <div class="pe-row"><label>悟性</label><input id="phyWu" type="number" value="${phyCustom.悟性}" /><label>根骨</label><input id="phyGen" type="number" value="${phyCustom.根骨}" /><label>气感</label><input id="phyQi" type="number" value="${phyCustom.气感}" /><span style="color:#8a8070;font-size:0.76em">总和 ${phyCustom.悟性 + phyCustom.根骨 + phyCustom.气感} / ${t.S}</span></div>
    <div id="phyEffects"></div>
    <div class="pe-row"><span class="rc-chip" id="phyAddEff">+ 效果</span></div>
  </div>` : '';
  const body = `<div class="rc-phy-tabs">${tabs}</div><div class="rc-phy-presets">${presets}</div>${editor}`;
  return groupShell('改变体质', `凡0 / 灵+10 / 道+30 / 仙+60`, body);
}

function renderDest() {
  const dSel = DEST.find(d => d.id === dest);
  const inputExtra = dSel && dSel.input ? `<input class="c-input" id="destInput" placeholder="${dSel.inputPh}" value="${esc(destInput)}" />` : '';
  const areaExtra = dest === 'custom' ? `<textarea class="rc-textarea" id="destArea" placeholder="详细描述转生身世（自由发挥）">${esc(destArea)}</textarea>` : '';
  const chips = DEST.map(o => chipHtml(o, dest === o.id ? 'sel' : '', `data-dest="${o.id}"`)).join('');
  return groupShell('六道轮回', '仅人族可选；负分为偿报', `<div class="rc-chips">${chips}${inputExtra}</div>${areaExtra}`);
}

function renderLocation() {
  return groupShell('转生位置', '单选', `<div class="rc-chips">${LOCATIONS.map(o => chipHtml(o, loc === o.id ? 'sel' : '', `data-loc="${o.id}"`)).join('')}</div>`);
}
function renderMemory() {
  return groupShell('保留记忆', '是则保留已学会功法与全部记忆', `<div class="rc-chips">${MEMORY.map(o => chipHtml(o, mem === o.id ? 'sel' : '', `data-mem="${o.id}"`)).join('')}</div>`);
}

function itemsGridHtml() {
  return ITEMS.map(it => {
    const q = itemQty[it.id] || 0;
    const c = itemCost(it, q);
    return `<div class="rc-card ${q > 0 ? 'sel' : ''}" data-item="${it.id}">
      <span class="box">✓</span>
      <span class="cd-info"><div class="cd-name">${esc(it.name)}</div><div class="cd-meta">${esc(it.品质)}品 · 拥有 ${it.数量}${it.秘籍 ? ' · 秘籍（阅读进度清零）' : ''}</div></span>
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
  return groupShell('保留物品', '可调整保留数量；秘籍保留时阅读进度清零；成本=品质×数量', `<div class="rc-grid" id="rcItemsGrid">${itemsGridHtml()}</div>`);
}

function renderStatuses() {
  const cusCost = cusSt.on ? (CUS_STATUS_COST[cusSt.type] || 0) : 0;
  const cusCard = `<div class="rc-card ${cusSt.on ? 'sel' : ''}" data-status="__custom__"><span class="box">✓</span><span class="cd-info"><div class="cd-name">自创状态</div><div class="cd-meta">自定义永久状态（叙述效果）</div></span><span class="cd-cost ${cusCost >= 0 ? 'pos' : 'neg'}">${cusCost > 0 ? '+' : ''}${cusCost}</span></div>`;
  const cards = STATUSES.map(x => {
    const cls = x.cost >= 0 ? 'pos' : 'neg';
    return `<div class="rc-card ${selStatus.includes(x.id) ? 'sel' : ''}" data-status="${x.id}"><span class="box">✓</span><span class="cd-info"><div class="cd-name">${x.name} <span style="font-size:0.72em;color:#8a8070">${x.type}</span></div><div class="cd-meta">${x.desc}</div></span><span class="cd-cost ${cls}">${x.cost > 0 ? '+' : ''}${x.cost}</span></div>`;
  }).join('');
  const editor = cusSt.on ? `<div class="rc-phy-editor">
    <div class="pe-row"><label>名称</label><input class="pe-name rc-status-input" id="cusName" placeholder="如：天妒之体" value="${esc(cusSt.name)}" /></div>
    <div class="pe-row"><label>类型</label>${Object.keys(CUS_STATUS_COST).map(t => `<span class="rc-chip ${cusSt.type === t ? 'sel' : ''}" data-cus-type="${t}">${t}（${CUS_STATUS_COST[t] > 0 ? '+' : ''}${CUS_STATUS_COST[t]}）</span>`).join('')}</div>
    <div class="pe-row" style="align-items:flex-start"><label>效果</label><textarea class="rc-textarea rc-status-input" id="cusEff" placeholder="叙述性效果描述" style="flex:1;min-height:56px">${esc(cusSt.eff)}</textarea></div>
  </div>` : '';
  return groupShell('转世状态', '永久 · 仅叙述效果；增益正分/减益负分；可自创', `<div class="rc-grid">${cards}${cusCard}</div>${editor}`);
}

function renderRootOnly() {
  const g = $('rcGroups'); g.innerHTML = '';
  const d = document.createElement('div');
  d.innerHTML = `${renderRace()}${renderRoot()}${renderPhysique()}${race === 'human' ? renderDest() : ''}${renderLocation()}${renderMemory()}${renderItems()}${renderStatuses()}`;
  g.appendChild(d);
  renderPhyEffects();
}
function renderPhyOnly() { renderRootOnly(); }
function renderPhyEffects() {
  const box = $('phyEffects');
  if (!box) return;
  const t = PHY_TIERS.find(x => x.id === phyTier)!;
  box.innerHTML = phyCustom.effects.map((ef, i) =>
    `<div class="pe-row"><label>效果</label><input class="pe-eff-name" data-eff="${i}" data-k="n" placeholder="效果名" value="${esc(ef.name)}" /><input class="pe-eff-val" data-eff="${i}" data-k="v" placeholder="数值/描述" value="${esc(ef.value)}" /><span class="rc-chip" data-del-eff="${i}" style="color:#fc8181">✕</span></div>`).join('');
  box.querySelectorAll('[data-del-eff]').forEach(x => x.addEventListener('click', () => { phyCustom.effects.splice(+x.getAttribute('data-del-eff')!, 1); renderPhyOnly(); }));
}

function markCards() {
  document.querySelectorAll('[data-status]').forEach(el =>
    el.classList.toggle('sel', selStatus.includes(el.getAttribute('data-status')!) || (el.getAttribute('data-status') === '__custom__' && cusSt.on)));
}
function refreshItems() {
  const grid = $('rcItemsGrid');
  if (grid) grid.innerHTML = itemsGridHtml();
  else renderRootOnly();
}

function updateBudget() {
  if (path === 'ghost') return;
  const sp = spent(), left = remaining();
  $('bBud').textContent = `${E}`;
  $('bSpent').textContent = `${sp}`;
  const le = $('bLeft'); le.textContent = `${left}`;
  le.className = 'b-num ' + (left >= 0 ? 'left' : 'over');
  $('bHint').textContent = E >= 0
    ? (left >= 0 ? '可用点数挑选福泽；也可选偿报抵价' : '已超预算，请取消福泽或补选偿报')
    : (left >= 0 ? '已达偿报要求，可再补福泽（若预算允许）' : `业力为负，尚需 ${-left} 点偿报`);
}
function updateSubmit() {
  const v = valid();
  $('rcSubmit').disabled = !v;
  $('rcHint').textContent = path === 'ghost'
    ? '已定：转生冥族，保留记忆与修为，直接生成回复。'
    : (v ? `预算剩余 ${remaining()} 点，可定数。` : `预算超支 ${-remaining()} 点，无法定数。`);
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
  $('rcPathObey').addEventListener('click', () => { path = 'obey'; renderPath(); renderGroups(); updateBudget(); updateSubmit(); });
  $('rcPathGhostBtn').addEventListener('click', () => { path = 'ghost'; renderPath(); renderGroups(); updateBudget(); updateSubmit(); });
  $('rcSubmit').addEventListener('click', submit);

  const g = $('rcGroups');
  g.addEventListener('click', e => {
    const t = e.target as HTMLElement;
    const closest = (sel: string) => (t.closest(sel) as HTMLElement | null);

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
        if (i >= 0) root.elements.splice(i, 1); else root.elements.push(name);
      }
      if (!(root.elements.length === 1 && root.elements[0] !== '无')) { root.mutation = false; root.mutationId = null; }
      renderRootOnly(); updateBudget(); updateSubmit();
      return;
    }
    const mut = closest('[data-mut]');
    if (mut) {
      root.mutation = true;
      root.mutationId = mut.getAttribute('data-mut') === 'custom' ? null : mut.getAttribute('data-mut');
      renderRootOnly(); updateBudget(); updateSubmit();
      return;
    }
    const tier = closest('[data-tier]');
    if (tier) { phyTier = tier.getAttribute('data-tier')!; phyPreset = null; renderPhyOnly(); updateBudget(); updateSubmit(); return; }
    const preset = closest('[data-preset]');
    if (preset) { phyPreset = preset.getAttribute('data-preset') === 'custom' ? null : preset.getAttribute('data-preset'); renderPhyOnly(); updateBudget(); updateSubmit(); return; }
    const rc = closest('[data-race]');
    if (rc) {
      const r = RACES.find(x => x.id === rc.getAttribute('data-race'));
      if (!r || !r.sel) return;
      race = r.id; raceInput = '';
      renderGroups(); updateBudget(); updateSubmit();
      return;
    }
    const dc = closest('[data-dest]');
    if (dc && race === 'human') { dest = dc.getAttribute('data-dest'); destInput = ''; renderGroups(); updateBudget(); updateSubmit(); return; }
    const lc = closest('[data-loc]');
    if (lc) { loc = lc.getAttribute('data-loc')!; renderGroups(); updateBudget(); updateSubmit(); return; }
    const mc = closest('[data-mem]');
    if (mc) { mem = mc.getAttribute('data-mem')!; renderGroups(); updateBudget(); updateSubmit(); return; }
    const inc = closest('[data-item-inc]');
    if (inc) {
      const id = inc.getAttribute('data-item-inc')!;
      const it = ITEMS.find(i => i.id === id);
      if (it && (itemQty[id] || 0) < it.数量) { itemQty[id] = (itemQty[id] || 0) + 1; refreshItems(); updateBudget(); updateSubmit(); }
      return;
    }
    const dec = closest('[data-item-dec]');
    if (dec) {
      const id = dec.getAttribute('data-item-dec')!;
      if (itemQty[id]) { itemQty[id] -= 1; if (itemQty[id] <= 0) delete itemQty[id]; refreshItems(); updateBudget(); updateSubmit(); }
      return;
    }
    const item = closest('[data-item]');
    if (item) {
      const it = ITEMS.find(i => i.id === item.getAttribute('data-item'));
      if (!it) return;
      if ((itemQty[it.id] || 0) > 0) delete itemQty[it.id];
      else itemQty[it.id] = it.数量;
      refreshItems(); updateBudget(); updateSubmit();
      return;
    }
    const st = closest('[data-status]');
    if (st) {
      const id = st.getAttribute('data-status')!;
      if (id === '__custom__') {
        cusSt.on = !cusSt.on;
        if (!cusSt.on) { cusSt.name = ''; cusSt.eff = ''; }
        renderRootOnly(); updateBudget(); updateSubmit();
        return;
      }
      const i = selStatus.indexOf(id);
      if (i >= 0) selStatus.splice(i, 1); else selStatus.push(id);
      markCards(); updateBudget(); updateSubmit();
      return;
    }
    const cusType = closest('[data-cus-type]');
    if (cusType) { cusSt.type = cusType.getAttribute('data-cus-type')!; renderRootOnly(); updateBudget(); updateSubmit(); return; }
    const addEff = closest('#phyAddEff');
    if (addEff) { phyCustom.effects.push({ name: '', value: '' }); renderPhyOnly(); return; }
  });

  g.addEventListener('input', e => {
    const t = e.target as HTMLInputElement;
    if (t.id === 'raceInput') { raceInput = t.value; return; }
    if (t.id === 'destInput') { destInput = t.value; return; }
    if (t.id === 'destArea') { destArea = t.value; return; }
    if (t.id === 'mutCustomName') { root.customName = t.value; return; }
    if (t.id === 'phyName') { phyCustom.name = t.value; return; }
    if (t.id === 'phyWu') { phyCustom.悟性 = Math.max(0, +t.value || 0); }
    if (t.id === 'phyGen') { phyCustom.根骨 = Math.max(0, +t.value || 0); }
    if (t.id === 'phyQi') { phyCustom.气感 = Math.max(0, +t.value || 0); }
    if (t.id === 'cusName') { cusSt.name = t.value; updateBudget(); updateSubmit(); return; }
    if (t.id === 'cusEff') { cusSt.eff = t.value; return; }
    const eff = t.getAttribute('data-eff');
    if (eff !== null) {
      const i = +eff;
      if (t.getAttribute('data-k') === 'n') phyCustom.effects[i].name = t.value;
      else phyCustom.effects[i].value = t.value;
    }
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
  if (els.includes('混沌')) return root.mutation ? (root.customName || '变异上品灵根') : '混沌灵根';
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
  if (phyPreset) return PHY_PRESETS[phyTier].find(p => p.id === phyPreset)!.name;
  return phyCustom.name.trim() || '自拟体质';
}

function summarize(): string {
  const parts: string[] = [];
  const r = RACES.find(x => x.id === race)!;
  parts.push(`种族→${r.name}${r.input && raceInput ? `（${raceInput}）` : ''}[${r.cost > 0 ? '+' : ''}${r.cost}]`);
  if (root.elements.length) parts.push(`灵根→${rootDisplay()}${root.mutation && !root.customName ? '' : ''}[${rootCost() > 0 ? '+' : ''}${rootCost()}]`);
  const t = PHY_TIERS.find(x => x.id === phyTier)!;
  parts.push(`体质→${t.id}·${phyName()}[+${t.cost}]`);
  if (race === 'human' && dest) {
    const d = DEST.find(x => x.id === dest)!;
    parts.push(`六道→${d.name}${destInput ? `（${destInput}）` : ''}${destArea ? `：${destArea}` : ''}[${d.cost > 0 ? '+' : ''}${d.cost}]`);
  }
  parts.push(`位置→${LOCATIONS.find(l => l.id === loc)!.name}[+${locCost()}]`);
  if (mem === 'yes') parts.push('保留记忆[+30]');
  const kept = Object.entries(itemQty).filter(([, q]) => q > 0);
  if (kept.length) parts.push('保留物品→' + kept.map(([id, q]) => `${ITEMS.find(i => i.id === id)!.name}×${q}`).join('、') + `[+${itemsCost()}]`);
  if (selStatus.length) parts.push('转世状态→' + selStatus.map(id => STATUSES.find(x => x.id === id)!.name).join('、') + `[${statusCost()}]`);
  if (cusSt.on && cusSt.name.trim()) parts.push(`转世状态→自创·${cusSt.name}（${cusSt.type}：${cusSt.eff || '未描述'}）[${CUS_STATUS_COST[cusSt.type] > 0 ? '+' : ''}${CUS_STATUS_COST[cusSt.type]}]`);
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
  const 秘籍 = (itemQty['上古秘境残卷'] || itemQty['it5'] || 0) > 0 ? '；上古秘境残卷阅读进度→0' : '';
  const memTxt = mem === 'yes' ? '，保留已学会功法与全部记忆' : '，功法清空、记忆归零';
  return [
    `【转生定论 · 投胎轮回】`,
    `亡魂：${d.name}（年${d.years} · ${d.realm}）｜死因：${d.cause}`,
    `善恶：Σ善 ${sumGood} / Σ恶 ${sumEvil} ｜ 修正 Z[+${(S.Z * 100).toFixed(0)}%] W[+${S.W}] ｜ 天谴罚 ${penalty}`,
    `业力 E = ${E} → ${grade.level} · ${grade.title}（${grade.desc}）`,
    `所择命途：${summarize()}`,
    `消耗 ${spent()} / 预算 ${E} 点，剩余 ${remaining()}。`,
    `---`,
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
    if (r && typeof r === 'object') { r.好感度 = 0; r.道侣 = false; }
  }
  // 保留物品（秘籍阅读进度清零）
  for (const [id, qty] of Object.entries(itemQty)) {
    if (!qty) continue;
    const it = ITEMS.find(i => i.id === id);
    if (!it) continue;
    const entry: any = { 品质: it.品质 || '凡', 类型: it.秘籍 ? '秘籍' : (it.类型 || '物品'), 数量: qty };
    if (it.秘籍) { entry.完整度 = '0%'; entry.阅读进度 = 0; }
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
      cur.灵根 = { ...cur.灵根, 名称: rootDisplay(), 五行: root.elements.slice(), 品阶: rootTierName(), 变异: root.mutation, 描述: '' };
    }
    // 体质
    const t = PHY_TIERS.find(x => x.id === phyTier)!;
    if (phyPreset) {
      const p = PHY_PRESETS[phyTier].find(x => x.id === phyPreset)!;
      const [悟, 根, 气] = p.stat.split('/').map(Number);
      cur.体质 = { ...cur.体质, 名称: p.name, 品阶: t.id, 悟性: 悟, 根骨: 根, 气感: 气, 效果: p.eff ? { [p.name]: p.eff } : {}, 描述: '' };
    } else {
      const effs: Record<string, string> = {};
      for (const e of phyCustom.effects) if (e.name.trim()) effs[e.name.trim()] = e.value;
      cur.体质 = { ...cur.体质, 名称: phyCustom.name.trim() || '自拟体质', 品阶: t.id, 悟性: phyCustom.悟性, 根骨: phyCustom.根骨, 气感: phyCustom.气感, 效果: effs, 描述: '' };
    }
    // 位置
    cur.地点 = { ...cur.地点, 世界: LOCATIONS.find(l => l.id === loc)!.name };
    // 转世状态
    for (const id of selStatus) {
      const s = STATUSES.find(x => x.id === id)!;
      cur.状态效果[s.name] = { 类型: s.type, 效果: { 叙述: s.desc }, 层数: 1, 剩余时间: '永久', 来源: '转世' };
    }
    if (cusSt.on && cusSt.name.trim()) {
      cur.状态效果[cusSt.name.trim()] = { 类型: cusSt.type, 效果: { 叙述: cusSt.eff || '' }, 层数: 1, 剩余时间: '永久', 来源: '转世' };
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
  const app = document.getElementById('app');
  if (!app) return;
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
