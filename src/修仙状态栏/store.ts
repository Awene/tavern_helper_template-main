import { defineMvuDataStore } from '@util/mvu';
import { CultivationStatusSchema } from './schema';

export const useDataStore = defineMvuDataStore(CultivationStatusSchema, {
  type: 'message',
  message_id: getCurrentMessageId(),
});
