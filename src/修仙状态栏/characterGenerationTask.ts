/** Keep preparation, API retries and result handling in one cancellable task. */
export function beginCharacterGeneration() {
  const doc = window.top?.document || document;
  if (doc.body.dataset.generating === 'true') throw new Error('请先停止或等待当前生成结束。');
  const generationId = crypto.randomUUID();
  let cancelled = false;
  let finished = false;
  const check = () => {
    if (cancelled) throw new DOMException('已停止本次人物生成', 'AbortError');
  };
  const cancel = (id?: string) => {
    if (finished || cancelled || (id && id !== generationId)) return;
    cancelled = true;
    stopGenerationById(generationId);
  };
  const listener = eventOn(tavern_events.GENERATION_STOPPED, cancel);
  SillyTavern.deactivateSendButtons();
  return {
    generationId,
    check,
    cancel: () => cancel(),
    get cancelled() { return cancelled; },
    finish() {
      if (finished) return;
      finished = true;
      listener.stop();
      SillyTavern.activateSendButtons();
    },
  };
}
