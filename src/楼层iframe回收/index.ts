// ============================================================
// 楼层 iframe 回收
//
// 【要解决的问题】
// 酒馆助手把消息里的 <body> 渲染成【每层楼一个】无沙盒 iframe，而且没有任何销毁机制
// (@types/iframe/event.d.ts 里只有 MESSAGE_IFRAME_RENDER_STARTED/_ENDED，没有 destroy)。
//
// 正则的「最大深度」是 SillyTavern 的设置，它只在某条消息的 HTML【被构建的那一刻】决定
// 要不要插入 <body>。第 10 楼在它还是最新楼时(深度 0)被格式化 → 生成了 iframe；等玩到第
// 40 楼，它深度已经 30、早超出最大深度，但【没有人重新格式化它】，iframe 原封不动留着。
// 于是 iframe 随楼层线性累积，只有整页 reload / 切聊天时才会被清掉 —— 这正是玩家反馈的
// 「玩到 50~70 楼黑屏崩溃，重载后又能玩一会儿」。
//
// 每个存活的 iframe 都是一个完整 realm，固定成本极高：
//   - 酒馆助手给每个消息 iframe 注入 tailwind + jQuery + jQuery-UI + lodash (~500KB JS)
//   - 正文美化 iframe: 228KB 文档 + 自己的一整套样式
//   - 状态栏  iframe: 248KB 的 Vue + Pinia + zod bundle
// 几十个叠起来就是几百 MB，手机标签页直接被系统杀掉。
//
// 【做法】
// 不能直接 remove() 掉 iframe 元素 —— 正文美化的 iframe【装的就是正文本身】，摘掉那层楼
// 会变成一片空白。正确做法是让酒馆【重新渲染】那一楼：refreshOneMessage() 会重跑一遍
// messageFormatting()，此时正则的深度检查已经把这层楼排除 → 不再注入 <body> → 不再生成
// iframe，旧 iframe 元素被新 DOM 替换掉，整个 realm 被 GC 回收。
//
// 效果等价于「只重载这一楼」，旧楼显示退化为未美化的纯文本 —— 这跟玩家现在每次崩溃重载后
// 看到的旧楼状态完全一致，不是新的行为退化。
// ============================================================

// 保留最近多少层的 iframe 不回收。
// 必须 >= 卡里所有正则的「最大深度」最大值(本格修仙: 正文美化=3)，否则会去刷新一层
// 「深度检查仍然会给它注入 <body>」的楼层 —— iframe 立刻重建，白刷一次。
const KEEP_DEPTH = 4;

// 已经回收过的楼层。防止万一某楼刷新后 iframe 依然存在(深度判断与预期不符)时反复刷新它。
// 切换聊天 / 删楼会让楼层号错位，届时整体清空重来。
const pruned = new Set<number>();

// 从 iframe 的 id 取出它所在的楼层号。
// 命名规则见 @types/iframe/util.d.ts: 前端界面的 iframe 名为 `TH-message--楼层号--该楼第几个界面`
function floor_of(iframe_id: string): number | null {
  const matched = /^TH-message--(-?\d+)--/.exec(iframe_id);
  if (matched === null) {
    return null;
  }
  const floor = Number(matched[1]);
  return Number.isFinite(floor) ? floor : null;
}

// 找出所有「已超出深度窗口、但 iframe 还活着」的楼层。
function find_stale_floors(): number[] {
  const last_message_id = getLastMessageId();
  const stale = new Set<number>();
  $('iframe[id^="TH-message--"]').each((_index, element) => {
    const floor = floor_of(element.id);
    if (floor === null || pruned.has(floor)) {
      return;
    }
    if (last_message_id - floor > KEEP_DEPTH) {
      stale.add(floor);
    }
  });
  return [...stale].sort((a, b) => a - b);
}

let is_pruning = false;

async function prune(): Promise<void> {
  // refreshOneMessage 是异步的，而消息事件可能密集触发；避免重入导致同一楼被刷两次。
  if (is_pruning) {
    return;
  }
  is_pruning = true;
  try {
    for (const floor of find_stale_floors()) {
      pruned.add(floor);
      // 该楼若未显示在网页上，refreshOneMessage 什么也不做，是安全的。
      await refreshOneMessage(floor);
    }
  } catch (error) {
    console.warn('[楼层iframe回收] 回收失败', error);
  } finally {
    is_pruning = false;
  }
}

// 楼层号会错位(删楼)或整体失效(换聊天)，已回收记录必须作废重来。
function reset(): void {
  pruned.clear();
  void prune();
}

$(() => {
  // 新楼产生 → 有旧楼掉出深度窗口
  eventOn(tavern_events.MESSAGE_RECEIVED, prune);
  eventOn(tavern_events.MESSAGE_SENT, prune);
  // swipe 不改变楼层数，但会重建当前楼的 iframe；顺手扫一遍没坏处
  eventOn(tavern_events.MESSAGE_SWIPED, prune);
  eventOn(tavern_events.MESSAGE_DELETED, reset);
  eventOn(tavern_events.CHAT_CHANGED, reset);

  // 脚本可能在一局玩到一半时才被启用，此时页面上已经堆了一批陈旧 iframe，先清一次。
  void prune();
});
