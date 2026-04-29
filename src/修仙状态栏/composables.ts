import _ from 'lodash';
import { computed, reactive, ref } from 'vue';
import { useDataStore } from './store';

// ============ 共享 UI 状态（模块级单例）============
export const state = reactive({
  currentTab: 0,
  storageTab: 0,
  openedNPC: null as string | null,
  openedBuff: null as string | null,
  rumorFilter: 'all' as string,
  artFilter: 'all' as string,
  itemFilter: 'all' as string,
  equipFilter: 'all' as string,
  puppetFilter: 'all' as string,
  beastFilter: 'all' as string,
  lightboxImage: null as string | null,
  toast: '' as string,
  appCollapsed: false,
  editMode: false,
  userRootOpen: false,
  userBodyOpen: false,
  userSkillOpen: false,
  userBuffOpen: false,
  confirmDelete: null as null | { kind: string; key: string; label: string },
});

const npcSectionOpen = reactive<Record<string, Record<string, boolean>>>({});
const npcAvatars = reactive<Record<string, string>>({});

// ============ 常量 ============
export const tabs = [
  { label: '道身', icon: '☯' },
  { label: '功法', icon: '卷' },
  { label: '储物', icon: '囊' },
  { label: '关系', icon: '缘' },
  { label: '传闻', icon: '闻' },
];

export const storageTabs = [
  { key: '物品', label: '物品' },
  { key: '装备', label: '装备' },
  { key: '傀儡', label: '傀儡' },
  { key: '灵兽', label: '灵兽' },
] as const;

export const rumorGroups = [
  { key: 'world', label: '修仙界要闻', types: ['大派动向', '仙人行迹', '宗门战事', '灵脉异变', '道庭法令'] },
  { key: 'mystic', label: '秘境异闻', types: ['秘境传闻', '高额悬赏', '妖兽异动', '通缉魔修', '宝物现世'] },
  { key: 'jiang', label: '江湖逸闻', types: ['风流韵事', '千里同心', '缘分将至', '邂逅预兆', '恩怨流转'] },
  { key: 'sect', label: '宗门内务', types: ['同门轶事', '师长动向', '门内任务', '资源调配', '内部秘辛'] },
] as const;

export const artTypes = ['心法', '攻击', '咒法', '身法', '护体', '幻术', '神识', '其他'] as const;
export const itemTypes = ['秘籍', '配方', '符箓', '丹药', '素材', '工具', '其他'] as const;
export const equipTypes = ['法宝', '护甲', '饰品'] as const;
export const qualityRanks = ['凡', '黄', '玄', '地', '天'] as const;

export const USER_AVATAR_KEY = '__user__';
const NPC_AVATAR_KEY = (name: string) => `xy-npc-avatar::${name}`;
const NPC_AVATAR_HI_KEY = (name: string) => `xy-npc-avatar-hi::${name}`;

// 主境界等级（依《核心系数总表》）
const MAJOR_RANKS: Record<string, number> = {
  凡人: 0,
  炼气: 1,
  练气: 1,
  筑基: 2,
  金丹: 3,
  元婴: 4,
  化神: 5,
  返虚: 6,
  炼虚: 6,
  合体: 7,
  大乘: 8,
  渡劫: 9,
  飞升: 9,
};
const SUB_RANKS: Record<string, number> = {
  初期: 0,
  中期: 1,
  后期: 2,
};
const EXCLUSIVE_ART_TYPES = ['心法', '护体', '身法'] as const;

// ============ 通用辅助函数（不依赖 store）============
export const barPct = (cur: number, total: number) =>
  Math.max(0, Math.min(100, (cur / Math.max(total, 1)) * 100));

// 主境界 L (0~9)：用于按《领悟规则》计算技艺上限 Max_S = 10^(L+1)
export const realmLevel = (realm: string): number => Math.floor(realmScore(realm) / 10);

export const skillCap = (realm: string): number => Math.pow(10, realmLevel(realm) + 1);

// 技艺进度条百分比：log 刻度，每个数量级占 1/(L+1) 条；v 达到 10^(L+1) 时填满
export const skillPct = (v: number, realm = ''): number => {
  if (v == null || v <= 0) return 2;
  const L = realmLevel(realm);
  return Math.max(2, Math.min(100, (Math.log10(v + 1) / (L + 1)) * 100));
};

// 紧凑数字格式：< 1万 原样；< 1亿 用万；其他用亿，避免溢出
export const formatSkillNum = (v: number): string => {
  if (v == null) return '0';
  const n = Number(v);
  if (!isFinite(n)) return '0';
  const abs = Math.abs(n);
  if (abs < 10000) return String(n);
  if (abs < 100000000) {
    const x = n / 10000;
    return (abs < 100000 ? x.toFixed(1) : Math.round(x).toString()) + '万';
  }
  const x = n / 100000000;
  return (abs < 1000000000 ? x.toFixed(2) : x.toFixed(1)) + '亿';
};

export const npcBarPct = (pool?: { 现值?: number; 上限?: number }) => {
  if (!pool) return 0;
  const cur = pool.现值 ?? 0;
  const max = Math.max(pool.上限 ?? 1, 1);
  return Math.max(0, Math.min(100, (cur / max) * 100));
};

export const elColor = (el: string) =>
  ({
    金: 'var(--xy-el-jin)',
    木: 'var(--xy-el-mu)',
    水: 'var(--xy-el-shui)',
    火: 'var(--xy-el-huo)',
    土: 'var(--xy-el-tu)',
    阴: 'var(--xy-el-yin)',
    阳: 'var(--xy-el-yang)',
    混沌: 'var(--xy-el-hundun)',
  } as Record<string, string>)[el] || 'var(--xy-ink)';

export const avatarChar = (name: string) => {
  const m = name.match(/^([^\s【[]+)/);
  return (m ? m[1] : name).slice(0, 1);
};

export const favorLabel = (n: number) => {
  if (n >= 80) return '至交';
  if (n >= 50) return '亲密';
  if (n >= 20) return '友善';
  if (n >= -10) return '中立';
  if (n >= -50) return '提防';
  return '仇敌';
};
export const favorClass = (n: number) => {
  if (n >= 50) return 'xy-favor-high';
  if (n >= 0) return 'xy-favor-mid';
  if (n >= -30) return 'xy-favor-low';
  return 'xy-favor-bad';
};

export const realmScore = (realm: string): number => {
  if (!realm) return 0;
  let major = -1;
  let prefixLen = 0;
  for (const k of Object.keys(MAJOR_RANKS)) {
    if (realm.startsWith(k) && k.length > prefixLen) {
      major = MAJOR_RANKS[k];
      prefixLen = k.length;
    }
  }
  if (major < 0) major = 0;
  const subPart = realm.slice(prefixLen);
  let sub = 0;
  for (const k of Object.keys(SUB_RANKS)) {
    if (subPart.includes(k)) {
      sub = SUB_RANKS[k];
      break;
    }
  }
  return major * 10 + sub;
};

export const countNonZero = (group?: Record<string, number>): number => {
  if (!group) return 0;
  let n = 0;
  for (const v of Object.values(group)) if (Number(v) > 0) n++;
  return n;
};

export const countField = (rec: Record<string, any> | undefined, field: string, value: string): number => {
  if (!rec) return 0;
  let n = 0;
  for (const v of Object.values(rec)) if (v?.[field] === value) n++;
  return n;
};

export const filterRecord = <T extends Record<string, any>>(
  rec: T | undefined,
  field: string,
  value: string,
): Record<string, any> => {
  if (!rec) return {};
  if (value === 'all') return rec;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(rec)) {
    if ((v as any)?.[field] === value) out[k] = v;
  }
  return out;
};

export const canControlNpc = (npc: any): boolean =>
  !!npc?.道侣 || (npc?.好感度 ?? 0) > 80;

export const isArtEffectivelyActive = (npc: any, artName: string, art: any): boolean => {
  if (canControlNpc(npc)) return !!art?.使用中;
  if (!EXCLUSIVE_ART_TYPES.includes(art?.类型)) return !!art?.使用中;
  const arts = npc?.功法 || {};
  let bestName = '';
  let bestRealm = -2;
  let bestQuality = -2;
  for (const [n, a] of Object.entries(arts) as [string, any][]) {
    if (a?.类型 !== art.类型) continue;
    const rs = realmScore(a.境界 || '');
    const qs = qualityRanks.indexOf(a.品质);
    if (rs > bestRealm || (rs === bestRealm && qs > bestQuality)) {
      bestRealm = rs;
      bestQuality = qs;
      bestName = n;
    }
  }
  return bestName === artName;
};

export const hasSkills = (npc: any) =>
  !_.isEmpty(npc?.技艺?.生产类) || !_.isEmpty(npc?.技艺?.战斗类);

export const hasStorage = (npc: any) => {
  const s = npc?.储物空间;
  if (!s) return false;
  return (
    (s.灵石 ?? 0) > 0 ||
    !_.isEmpty(s.物品) ||
    !_.isEmpty(s.装备) ||
    !_.isEmpty(s.傀儡) ||
    !_.isEmpty(s.灵兽)
  );
};

// ============ NPC 详情区折叠 ============
export const isSectionOpen = (name: string, section: string): boolean =>
  !!npcSectionOpen[name]?.[section];
export const toggleSection = (name: string, section: string) => {
  if (!npcSectionOpen[name]) npcSectionOpen[name] = {};
  npcSectionOpen[name][section] = !npcSectionOpen[name][section];
};

// ============ Toast 提示 ============
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export const showToast = (msg: string) => {
  state.toast = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (state.toast === msg) state.toast = '';
  }, 2800);
};

// ============ 灯箱 ============
export const openLightbox = (url: string) => {
  if (url) state.lightboxImage = url;
};
export const closeLightbox = () => {
  state.lightboxImage = null;
};
export const onAvatarClick = (key: string, ev: MouseEvent) => {
  const thumb = getNpcAvatar(key);
  if (thumb) {
    ev.stopPropagation();
    openLightbox(getNpcAvatarHi(key) || thumb);
  }
};

// ============ NPC 头像（玩家本地上传）============
export const avatarFileInput = ref<HTMLInputElement | null>(null);
const pendingAvatarFor = ref<string | null>(null);

export const getNpcAvatar = (name: string): string => {
  if (name in npcAvatars) return npcAvatars[name];
  let v = '';
  try {
    v = localStorage.getItem(NPC_AVATAR_KEY(name)) || '';
  } catch {
    /* localStorage 不可用 */
  }
  npcAvatars[name] = v;
  return v;
};

export const getNpcAvatarHi = (name: string): string => {
  try {
    const hi = localStorage.getItem(NPC_AVATAR_HI_KEY(name));
    if (hi) return hi;
  } catch {
    /* ignore */
  }
  return getNpcAvatar(name);
};

export const triggerAvatarUpload = (name: string) => {
  pendingAvatarFor.value = name;
  avatarFileInput.value?.click();
};

const resizeImageToDataUrl = (file: File, maxSize: number, quality = 0.85): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas context unavailable'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('file read failed'));
    reader.readAsDataURL(file);
  });

export const onAvatarFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  const name = pendingAvatarFor.value;
  input.value = '';
  pendingAvatarFor.value = null;
  if (!file || !name) return;
  try {
    const [thumb, hi] = await Promise.all([
      resizeImageToDataUrl(file, 192, 0.85),
      resizeImageToDataUrl(file, 2048, 0.92),
    ]);
    localStorage.setItem(NPC_AVATAR_KEY(name), thumb);
    try {
      localStorage.setItem(NPC_AVATAR_HI_KEY(name), hi);
    } catch (quotaErr) {
      try { localStorage.removeItem(NPC_AVATAR_HI_KEY(name)); } catch { /* */ }
      console.warn('[修仙状态栏] 高清头像存储失败（容量不足），仅保留缩略图', quotaErr);
    }
    npcAvatars[name] = thumb;
  } catch (err) {
    console.error('[修仙状态栏] 头像上传失败', err);
  }
};

export const clearNpcAvatar = (name: string) => {
  try {
    localStorage.removeItem(NPC_AVATAR_KEY(name));
    localStorage.removeItem(NPC_AVATAR_HI_KEY(name));
  } catch {
    /* ignore */
  }
  npcAvatars[name] = '';
};

// ============ 删除确认 ============
export const requestDelete = (kind: string, key: string, label?: string) => {
  state.confirmDelete = { kind, key, label: label || key };
};
export const cancelDelete = () => {
  state.confirmDelete = null;
};
export const performDelete = () => {
  const c = state.confirmDelete;
  const store = useDataStore();
  if (!c || !store.data) return;
  const data = store.data as any;
  switch (c.kind) {
    case 'art':
      if (data.修炼功法?.功法) delete data.修炼功法.功法[c.key];
      break;
    case 'item':
      if (data.储物空间?.物品) delete data.储物空间.物品[c.key];
      break;
    case 'equip':
      if (data.储物空间?.装备) delete data.储物空间.装备[c.key];
      break;
    case 'puppet':
      if (data.储物空间?.傀儡) delete data.储物空间.傀儡[c.key];
      break;
    case 'beast':
      if (data.储物空间?.灵兽) delete data.储物空间.灵兽[c.key];
      break;
    case 'npc':
      if (data.关系列表) delete data.关系列表[c.key];
      clearNpcAvatar(c.key);
      if (state.openedNPC === c.key) state.openedNPC = null;
      break;
    case 'rumor':
      if (Array.isArray(data.传闻)) {
        const idx = Number(c.key);
        if (Number.isInteger(idx) && idx >= 0 && idx < data.传闻.length) {
          data.传闻.splice(idx, 1);
        }
      }
      break;
    case 'user-buff':
      if (data.基本信息?.状态效果) delete data.基本信息.状态效果[c.key];
      if (state.openedBuff === c.key) state.openedBuff = null;
      break;
    case 'npc-buff': {
      const sep = c.key.indexOf('::');
      if (sep > 0) {
        const npcName = c.key.slice(0, sep);
        const buffName = c.key.slice(sep + 2);
        if (data.关系列表?.[npcName]?.状态效果) {
          delete data.关系列表[npcName].状态效果[buffName];
        }
      }
      break;
    }
    case 'npc-art':
    case 'npc-item':
    case 'npc-equip':
    case 'npc-puppet':
    case 'npc-beast': {
      const sep = c.key.indexOf('::');
      if (sep <= 0) break;
      const npcName = c.key.slice(0, sep);
      const subName = c.key.slice(sep + 2);
      const npc = data.关系列表?.[npcName];
      if (!npc) break;
      if (c.kind === 'npc-art' && npc.功法) {
        delete npc.功法[subName];
      } else if (c.kind === 'npc-item' && npc.储物空间?.物品) {
        delete npc.储物空间.物品[subName];
      } else if (c.kind === 'npc-equip' && npc.储物空间?.装备) {
        delete npc.储物空间.装备[subName];
      } else if (c.kind === 'npc-puppet' && npc.储物空间?.傀儡) {
        delete npc.储物空间.傀儡[subName];
      } else if (c.kind === 'npc-beast' && npc.储物空间?.灵兽) {
        delete npc.储物空间.灵兽[subName];
      }
      break;
    }
  }
  state.confirmDelete = null;
};

// ============ 切换功法/单位（依赖 store）============
export const toggleArt = (name: string, value: boolean) => {
  const store = useDataStore();
  const arts = store.data.修炼功法.功法 as Record<string, any>;
  const art = arts[name];
  if (!art) return;
  const exclusive = ['心法', '护体', '身法'];
  if (value && exclusive.includes(art.类型)) {
    for (const [k, v] of Object.entries(arts)) {
      if (k !== name && v.使用中 && v.类型 === art.类型) v.使用中 = false;
    }
  }
  art.使用中 = value;
};

export const toggleNpcArt = (npcName: string, artName: string, value: boolean) => {
  const store = useDataStore();
  const list = store.data?.关系列表 as Record<string, any> | undefined;
  const npc = list?.[npcName];
  if (!npc) return;
  if (!canControlNpc(npc)) {
    showToast(`需与「${npcName}」结为道侣或好感度大于 80，方可调整其功法`);
    return;
  }
  const arts = npc.功法 as Record<string, any> | undefined;
  const art = arts?.[artName];
  if (!arts || !art) return;
  if (value && (EXCLUSIVE_ART_TYPES as readonly string[]).includes(art.类型)) {
    for (const [k, v] of Object.entries(arts)) {
      if (k !== artName && v.使用中 && v.类型 === art.类型) v.使用中 = false;
    }
  }
  art.使用中 = value;
};

export const toggleUnit = (kind: '傀儡' | '灵兽', name: string, value: boolean) => {
  const store = useDataStore();
  const slot = (store.data.储物空间 as any)[kind];
  if (slot && slot[name]) slot[name].使用中 = value;
};

// ============ 传闻分组辅助 ============
export const rumorGroup = (t: string) => {
  for (const g of rumorGroups) if ((g.types as readonly string[]).includes(t)) return g.key;
  return 'world';
};

// ============ Computed（依赖 store；惰性求值，挂载后才使用）============
export const filteredArts = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.修炼功法?.功法, '类型', state.artFilter);
});
export const filteredItems = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.储物空间?.物品, '类型', state.itemFilter);
});
export const filteredEquips = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.储物空间?.装备, '类型', state.equipFilter);
});
export const filteredPuppets = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.储物空间?.傀儡, '品质', state.puppetFilter);
});
export const filteredBeasts = computed(() => {
  const store = useDataStore();
  return filterRecord(store.data?.储物空间?.灵兽, '品质', state.beastFilter);
});

export const sortedRelations = computed(() => {
  const store = useDataStore();
  const list = store.data?.关系列表;
  if (!list) return [] as { name: string; npc: any; idx: number }[];
  return Object.entries(list)
    .map(([name, npc], idx) => ({ name, npc: npc as any, idx }))
    .sort((a, b) => {
      const pa = a.npc?.在场 ? 0 : a.npc?.道侣 ? 1 : 2;
      const pb = b.npc?.在场 ? 0 : b.npc?.道侣 ? 1 : 2;
      if (pa !== pb) return pa - pb;
      return a.idx - b.idx;
    });
});

export const openedBuffData = computed(() => {
  if (!state.openedBuff) return null;
  const store = useDataStore();
  const buffs = store.data?.基本信息?.状态效果 as Record<string, any> | undefined;
  return buffs?.[state.openedBuff] || null;
});

export const filteredRumors = computed(() => {
  const store = useDataStore();
  const list = store.data?.传闻 || [];
  if (state.rumorFilter === 'all') return list;
  const grp = rumorGroups.find(g => g.key === state.rumorFilter);
  if (!grp) return list;
  return list.filter(r => (grp.types as readonly string[]).includes(r.类型));
});

export const storageCount = (key: '物品' | '装备' | '傀儡' | '灵兽') => {
  const store = useDataStore();
  return Object.keys((store.data.储物空间 as any)[key] || {}).length;
};

export const countByGroup = (types: readonly string[]) => {
  const store = useDataStore();
  return store.data.传闻.filter(r => types.includes(r.类型)).length;
};
