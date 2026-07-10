import { StoreDefinition } from 'pinia';

export function defineMvuDataStore<T extends z.ZodObject>(
  schema: T,
  variable_option: VariableOption,
  additional_setup?: (data: Ref<z.infer<T>>) => void,
): StoreDefinition<`mvu_data.${string}`, { data: Ref<z.infer<T>> }> {
  if (
    variable_option.type === 'message' &&
    (variable_option.message_id === undefined || variable_option.message_id === 'latest')
  ) {
    variable_option.message_id = -1;
  }

  return defineStore(
    `mvu_data.${_(variable_option)
      .entries()
      .sortBy(entry => entry[0])
      .map(entry => entry[1])
      .join('.')}`,
    errorCatched(() => {
      const data = ref(
        schema.parse(_.get(getVariables(variable_option), 'stat_data', {}), { reportInput: true }),
      ) as Ref<z.infer<T>>;
      if (additional_setup) {
        additional_setup(data);
      }

      useIntervalFn(() => {
<<<<<<< HEAD
        const variables = getVariables(variable_option);
        // 楼层还没有真实 stat_data 时（如聊天刚加载、变量尚未就位）跳过：既不同步也不写回，
        // 避免用 schema 默认值覆盖尚未加载/位于别处的真存档。
        if (!_.has(variables, 'stat_data')) {
          return;
        }
        const stat_data = _.get(variables, 'stat_data', {});
=======
        const stat_data = _.get(getVariables(variable_option), 'stat_data', {});
>>>>>>> 299b9bb0dd0e1b9c9863f20ca4cbc261e552bdd5
        const result = schema.safeParse(stat_data);
        if (result.error) {
          return;
        }
        if (!_.isEqual(data.value, result.data)) {
          ignoreUpdates(() => {
            data.value = result.data;
          });
          if (!_.isEqual(stat_data, result.data)) {
            updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
          }
        }
      }, 2000);

      const { ignoreUpdates } = watchIgnorable(
        data,
        new_data => {
          const result = schema.safeParse(new_data);
          if (result.error) {
            return;
          }
          if (!_.isEqual(new_data, result.data)) {
            ignoreUpdates(() => {
              data.value = result.data;
            });
          }
<<<<<<< HEAD
          // 关键护栏：楼层当前没有 stat_data 时绝不写回。
          // 前端只应“修改已有存档”，绝不该用 schema 默认值去“初始化”一个楼层的变量——
          // 否则在聊天加载竞态下（读到空/残缺 → 被 prefault 补成默认）会把默认值写回、覆盖真存档
          // （灵根/体质/物品被清成默认的“状态栏清空”根因）。
          if (!_.has(getVariables(variable_option), 'stat_data')) {
            return;
          }
=======
>>>>>>> 299b9bb0dd0e1b9c9863f20ca4cbc261e552bdd5
          updateVariablesWith(variables => _.set(variables, 'stat_data', result.data), variable_option);
        },
        { deep: true },
      );

      return { data };
    }),
  );
}
