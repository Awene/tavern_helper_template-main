import assert from 'node:assert/strict';
import { beginCharacterGeneration } from '../src/修仙状态栏/characterGenerationTask.ts';

const listeners = new Set();
const doc = { body: { dataset: {} } };
globalThis.window = { top: { document: doc } };
globalThis.tavern_events = { GENERATION_STOPPED: 'stop' };
globalThis.eventOn = (_event, fn) => { listeners.add(fn); return { stop: () => listeners.delete(fn) }; };
globalThis.SillyTavern = {
  deactivateSendButtons() { doc.body.dataset.generating = 'true'; },
  activateSendButtons() { delete doc.body.dataset.generating; },
};
const stopped = [];
globalThis.stopGenerationById = id => {
  stopped.push(id);
  for (const fn of listeners) fn(id);
  return true;
};

let task = beginCharacterGeneration();
assert.equal(doc.body.dataset.generating, 'true');
assert.throws(() => beginCharacterGeneration(), /当前生成/);
for (const fn of listeners) fn('unrelated');
task.check();
for (const fn of listeners) fn();
assert.equal(task.cancelled, true);
assert.deepEqual(stopped, [task.generationId], 'Cancel only this task, without recursive stop events');
assert.throws(task.check, { name: 'AbortError' });
task.finish(); task.finish();
assert.equal(listeners.size, 0);
assert.equal(doc.body.dataset.generating, undefined);

task = beginCharacterGeneration();
task.check();
task.finish();
assert.equal(listeners.size, 0);
assert.equal(stopped.length, 1, 'Successful completion does not cancel another request');
console.log('Character task: button state, cancellation, overlap guard and cleanup passed.');
