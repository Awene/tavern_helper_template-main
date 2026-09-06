import { defineMvuDataStore } from '@util/mvu';
import { CultivationStatusSchema } from './schema';

// message_id 用 'latest' (内部转为 -1)：始终读写最新楼层。
// 这样:
//   1. 世界推进按钮与传闻展示读取最新楼层，而非 iframe 所在的历史楼层
//   2. 玩家无论从哪一楼打开 修仙状态栏，看到的都是当前最新状态
//   3. 避免从历史楼层操作时读到过期时间和传闻
export const useDataStore = defineMvuDataStore(CultivationStatusSchema, {
  type: 'message',
  message_id: 'latest',
});
