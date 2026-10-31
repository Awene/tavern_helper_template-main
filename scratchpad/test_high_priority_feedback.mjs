import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { compileString } from 'sass';

const read = path => fs.readFileSync(path, 'utf8');
const compile = source => ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
const summary = read('../Cultivation-Card-Game/脚本/【本格修仙】总结.js');
const ast = ts.createSourceFile('summary.js', summary, ts.ScriptTarget.Latest, true);
const nodes = new Map();
function visit(node) {
  if (ts.isFunctionDeclaration(node) && node.name) nodes.set(node.name.text, node.getText(ast));
  if (ts.isVariableStatement(node)) for (const d of node.declarationList.declarations) nodes.set(d.name.getText(ast), node.getText(ast));
  ts.forEachChild(node, visit);
}
visit(ast);
let count = 0;
const check = (value, message) => { assert.ok(value, message); count++; };
{
  let chat = 'A', book = 'A', changed = 0, listener;
  const c = { SillyTavern: { getCurrentChatId: () => chat }, getActiveWorldbookName: () => book,
    eventOn: (_, fn) => listener = fn, tavern_events: { CHAT_CHANGED: 'changed' },
    onChatChanged: async () => changed++, console };
  vm.createContext(c);
  const handler = summary.slice(summary.indexOf('eventOn(tavern_events.CHAT_CHANGED,'), summary.indexOf('// 初始化：加载设置'));
  vm.runInContext(['summaryChatEpoch', 'summaryChatId', 'captureSummaryContext'].map(n => nodes.get(n)).join('\n') + '\n' + handler, c);
  const guard = vm.runInContext('captureSummaryContext()', c);
  await listener(); guard(); check(changed === 0, 'same-chat refresh does not invalidate summary');
  chat = 'B'; await listener(); assert.throws(guard); count++;
  chat = 'A'; await listener(); assert.throws(guard); count++;
  check(changed === 2, 'real chat switches still processed');
  const bookGuard = vm.runInContext('captureSummaryContext()', c);
  book = 'B'; assert.throws(bookGuard); count++;
}

const apiSource = compile(read('src/创意工坊/api.ts'));
function apiHarness() {
  let next = 0, saved, opened = false, activated = true;
  const intervals = new Map(), timers = new Map(), listeners = new Map();
  const popup = { closed: true, location: {}, close() {} };
  const parent = { location: { origin: 'http://localhost:8000' }, open() { check(activated, 'popup opens before first await'); opened = true; return popup; },
    addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: key => listeners.delete(key) };
  const win = { parent, setInterval: fn => { intervals.set(++next, fn); return next; }, clearInterval: id => intervals.delete(id),
    setTimeout: (fn, delay) => { timers.set(++next, { fn, delay }); return next; }, clearTimeout: id => timers.delete(id) };
  const c = { exports: {}, require: () => ({ putAuthRecord: async auth => saved = auth, clearAuthRecord: async () => {} }),
    window: win, crypto: { randomUUID: () => 'fake-random-uuid' }, URL, AbortController, console };
  vm.runInNewContext(apiSource, c);
  const api = new c.exports.WorkshopApi(async () => { activated = false; return 'https://example.test'; });
  let ready = false, exchanges = 0;
  api.request = async path => {
    if (path === '/api/auth/me') return { user: { id: 'tester' } };
    exchanges++;
    if (!ready) throw new c.exports.WorkshopApiError('not ready', 400);
    return { token: 'test-token', expires_at: 9999999999 };
  };
  return { api, timers, intervals, listeners, popup, isOpened: () => opened, saved: () => saved,
    exchanges: () => exchanges, ready: () => ready = true };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
{
  const h = apiHarness(); const pending = h.api.login(); await tick();
  check(h.isOpened() && h.popup.location.href.includes('/auth/discord/start'), 'blank popup navigates to OAuth');
  for (let i = 0; i < 20; i++) { for (const fn of h.intervals.values()) fn(); await tick(); }
  check(h.exchanges() >= 20 && h.intervals.size === 1, 'closed popup handle does not cancel active OAuth');
  h.ready(); for (const fn of h.intervals.values()) fn(); await pending;
  check(h.saved().token === 'test-token', 'polling recovers login without postMessage');
  check(!h.intervals.size && !h.timers.size && !h.listeners.size, 'success cleans timers and listeners');
}
{
  const h = apiHarness(); const pending = h.api.login(); await tick(); h.api.cancelLogin();
  await assert.rejects(pending, /已取消/); count++;
  check(!h.intervals.size && !h.timers.size, 'manual cancellation cleans timers');
}
{
  const h = apiHarness(); const pending = h.api.login(); await tick();
  [...h.timers.values()].find(t => t.delay === 300000).fn();
  await assert.rejects(pending, /未能取得/); count++;
  check(!h.intervals.size, 'timeout stops polling');
}

const frameSource = compile(read('src/shared/visible-frame.ts'));
const fc = { exports: {}, require: () => ({}) }; vm.runInNewContext(frameSource, fc);
const host = { innerHeight: 800 }; host.parent = host;
const frame = { innerHeight: 3000, parent: host, frameElement: { offsetHeight: 3000, clientTop: 0, getBoundingClientRect: () => ({ top: -600, height: 3000 }) } };
check(JSON.stringify(fc.exports.visibleFrameBounds(frame)) === JSON.stringify({ top: 600, height: 800 }), 'tall scrolled iframe uses visible slice');
host.visualViewport = { offsetTop: 0, height: 400 };
check(fc.exports.visibleFrameBounds(frame).height === 400, 'mobile keyboard reduces visible height');
host.visualViewport = undefined;
host.getComputedStyle = () => ({ overflowY: 'auto' });
frame.frameElement.parentElement = { offsetHeight: 480, clientHeight: 480, clientTop: 0,
  getBoundingClientRect: () => ({ top: 60, height: 480 }) };
check(JSON.stringify(fc.exports.visibleFrameBounds(frame)) === JSON.stringify({ top: 660, height: 480 }), 'chat scroll container clips above input bar');

if (process.argv.includes('--fixture')) {
  const modalCss = read('src/修仙状态栏/pages/CharacterRefinementModal.vue').match(/<style scoped>([\s\S]*?)<\/style>/)[1];
  const boundsSource = fc.exports.visibleFrameBounds.toString();
  console.log(JSON.stringify({ modalCss, workshopCss: compileString(read('src/创意工坊/style.scss')).css, boundsSource }));
} else console.log(`High-priority feedback: ${count} checks passed`);
