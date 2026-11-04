/** 将旧任务字典迁移为管理字段 + 条目；不修改输入，也不重发奖励。 @param {any} input @returns {any} */
export function normalizeTasks(input) {
  const record = value => value && typeof value === 'object' && !Array.isArray(value);
  const source = record(input) ? input : {};
  const entries = Object.fromEntries(Object.entries(source).filter(([key, value]) =>
    !['聚焦任务', '已完成任务', '条目'].includes(key) && record(value)));
  if (record(source.条目)) Object.assign(entries, source.条目);
  const completed = Array.isArray(source.已完成任务)
    ? [...new Set(source.已完成任务.filter(name => typeof name === 'string').map(name => name.trim()).filter(Boolean))]
    : [];
  const focused = typeof source.聚焦任务 === 'string' ? source.聚焦任务.trim() : '';
  return {
    聚焦任务: focused && Object.hasOwn(entries, focused) ? focused : null,
    已完成任务: completed,
    条目: entries,
  };
}
