import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const card = '../Cultivation-Card-Game/';
const source = fs.readFileSync(card + '脚本/【本格修仙】总结.js', 'utf8');
const ast = ts.createSourceFile('summary.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const snippets = new Map();
function collect(node) {
  if (ts.isFunctionDeclaration(node) && node.name) snippets.set(node.name.text, node.getText(ast));
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) snippets.set(declaration.name.getText(ast), node.getText(ast));
  }
  ts.forEachChild(node, collect);
}
collect(ast);
let checks = 0;
function check(value, label) { assert.ok(value, label); checks++; }
function summaryHarness() {
  const state = { chat: 'A', book: 'A', writes: [], errors: [], successes: [], hidden: 0, fail: false };
  const c = {
    console: { error() {}, warn() {} },
    SillyTavern: { getCurrentChatId: () => state.chat },
    getActiveWorldbookName: () => state.book,
    formatErrorMessage: e => e.message,
    toastr: { error: x => state.errors.push(x), success: x => state.successes.push(x) },
    showSummaryHint() {}, showSummaryHintFor() {},
    ensureWorldbookExists: async () => {}, getWorldbookEntriesSafe: async () => [],
    buildSummaryOrderMap: () => new Map(), CONFIG: { ENTRY_START_ORDER: 1 },
    createWorldbookEntries: async (book, entries) => {
      if (state.fail) throw Error('write failed');
      state.writes.push({ book, entries });
    },
    reorderAllSummaryEntries: async () => {}, reorderAllMegaSummaryEntries: async () => {},
    setMegaSummaryMapping: async () => {}, parseMegaSummaryEntryName: () => null,
    getSettings: () => ({ autoHideSummarizedFloors: true }),
    applySummarizedFloorsVisibility: async () => { state.hidden++; },
    buildSummaryPromptParams: async () => ({}), buildMegaSummaryPromptParams: async () => ({}),
    callSummaryApi: async () => '正常总结', callMegaSummaryApi: async () => '正常大总结',
    normalizeWorldbookEntries: x => x,
    updateWorldbookWith: async (_name, fn) => { const old = [{ name: '原总结', enabled: true }]; fn(old); state.disabled = !old[0].enabled; },
  };
  vm.createContext(c);
  const names = ['errorCatched', 'summaryChatEpoch', 'captureSummaryContext', 'validateSummaryContent',
    'upsertSummaryEntryByName', 'upsertMegaSummaryEntry', 'executeSummary', 'executeMegaSummary'];
  vm.runInContext(names.map(n => snippets.get(n)).join('\n') + '\nglobalThis.run=executeSummary; globalThis.mega=executeMegaSummary;', c);
  return { state, c };
}
for (const invalid of ['API Error: HTTP 524', 'API请求失败 [HTTP 524]', '{"error":{"message":"timeout"}}', '<html>Bad Gateway</html>', '']) {
  const { state, c } = summaryHarness(); c.callSummaryApi = async () => invalid;
  await c.run(0, 20, '总结0-20楼');
  check(!state.writes.length && !state.hidden && !state.successes.length, 'invalid response not saved: ' + invalid);
}
for (const mega of [false, true]) {
  const { state, c } = summaryHarness(); state.fail = true;
  await (mega ? c.mega(['原总结'], '大总结0-20楼') : c.run(0, 20, '总结0-20楼'));
  check(!state.hidden && !state.disabled && !state.successes.length && state.errors.length, 'save failure stops dependent operations');
}
for (const switchBack of [false, true]) {
  const { state, c } = summaryHarness(); let finish;
  c.callSummaryApi = () => new Promise(resolve => { finish = resolve; });
  const running = c.run(0, 20, '总结0-20楼'); await new Promise(resolve => setImmediate(resolve));
  state.chat = state.book = 'B'; vm.runInContext('summaryChatEpoch++', c);
  if (switchBack) state.chat = state.book = 'A';
  finish('A聊天总结'); await running;
  check(!state.writes.length && !state.hidden, 'switching chats cancels stale result, even after switching back');
}
{
  const { state, c } = summaryHarness(); await c.run(0, 20, '总结0-20楼');
  check(state.writes.length === 1 && state.hidden === 1 && state.successes.length === 1, 'successful summary unchanged');
}

const worldSource = fs.readFileSync(card + '脚本/【本格修仙】世界推进.js', 'utf8');
const time = day => ({ 年: 7026, 月: 9, 日: day, 时辰: '子时' });
const stat = (start, end) => ({ 传闻: { 上次世界推进时间点: time(start) }, 时间: time(end) });
let current = stat(1, 3), resolver, timer;
const events = {}, warnings = [];
const context = { chat: [], chatMetadata: { variables: {} }, eventTypes: { CHAT_CHANGED: 'chat', WORLDINFO_ENTRIES_LOADED: 'entries' },
  eventSource: { on: (k, f) => events[k] = f, makeLast: (k, f) => events[k] = f, removeListener() {} } };
const host = { SillyTavern: { getContext: () => context },
  TavernHelper: { getVariables: ({ message_id }) => ({ stat_data: typeof message_id === 'number' ? stat(1, 3) : current }) },
  CultivationRuleRouter: { registerFixedRouteResolver: (_k, f) => { resolver = f; return () => {}; } },
  toastr: { warning: x => warnings.push(x) } };
const probe = worldSource.replace('const api = { send };', 'const api = { send, pending: () => pendingInterval };');
vm.runInNewContext(probe, { window: { parent: host, addEventListener() {} },
  setInterval: () => 1, clearInterval() {}, setTimeout: f => { timer = f; return 1; }, clearTimeout: () => { timer = null; } });
const trigger = '请明确以[时间推进规则]进行世界演进。';
const route = resolver({ type: 'normal', input: trigger, isMainRequest: true });
context.chat = [{ is_user: false }, { is_user: true, mes: trigger }, { is_user: false, extra: { crr_route: { requestData: route.data } } }];
events.mag_variable_update_ended({ stat_data: stat(1, 2) }); timer();
check(host.CultivationWorldAdvance.pending() && !warnings.length, 'unsettled update does not warn prematurely');
current = stat(3, 3); events.mag_variable_update_ended({ stat_data: stat(1, 2) }); timer();
check(!host.CultivationWorldAdvance.pending(), 'settlement checks persisted data and clears pending');
check(resolver({ type: 'continue', input: '', isMainRequest: true }).enabled.length === 0, 'settled continuation does not rerun time rule');
current = stat(1, 3);
check(resolver({ type: 'continue', input: '', isMainRequest: true }).data.cultivationWorldAdvance.end.日 === 3, 'unfinished continuation keeps original interval');
assert.throws(() => resolver({ type: 'normal', input: trigger, isMainRequest: true }), /尚未正确更新/); checks++;
check(resolver({ type: 'regenerate', input: '', isMainRequest: true }).data.cultivationWorldAdvance.start.日 === 1, 'regeneration uses original snapshot');
events.chat(); check(!host.CultivationWorldAdvance.pending(), 'chat change clears pending');

const ejsContext = {};
vm.runInNewContext(fs.readFileSync('D:/application/Tavern/SillyTavern-1.16.0/data/default-user/extensions/ST-Prompt-Template/src/3rdparty/ejs.js', 'utf8'), ejsContext);
for (const filename of ['⚓️Gemini3.1p开.txt', '⚓️Gemini3.7F与3.8开.txt']) {
  const text = fs.readFileSync(card + '预设/本格修仙/条目/' + filename, 'utf8');
  await ejsContext.ejs.render(text, {}, { async: true });
  check(!text.includes('lastMessageId') && text.includes('cot头'), filename + ' keeps format variables without context dependency');
}
console.log('Discord fixes:', checks, 'checks passed');

const { config, store, exporter } = await import('./test_start_selection.mjs');
store.resetAll();
for (const id of ['stone-low-100', 'stone-low-1000', 'stone-mid-10', 'stone-mid-50', 'stone-up-1']) {
  const item = config.findItem(id);
  const selection = { ...store.selection, itemIds: [id], customItems: [] };
  const initial = exporter.buildInitialStatData(selection);
  const prompt = exporter.generateAIPrompt(selection);
  check(item.name === `${item.灵石}枚灵石`, 'stone name uses direct amount');
  check(initial.灵石 === item.灵石, 'stone amount written without conversion');
  check(prompt.includes(`- ${item.灵石}枚灵石`) && !/中品灵石|上品灵石/.test(prompt), 'prompt uses direct amount');
}
console.log('Including opening amounts:', checks, 'checks passed');
