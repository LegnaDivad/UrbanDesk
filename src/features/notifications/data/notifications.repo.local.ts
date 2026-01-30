import type { NotificationsRepo } from '@/features/notifications/data/notifications.repo';
import type { AppNotification } from '@/features/notifications/domain/notifications.types';
import { kv } from '@/lib/storage/kv';

const KEY = 'ud.notifications.v1';

export const notificationsRepoLocal: NotificationsRepo = {
  async load() {
    return (await kv.getJson<AppNotification[]>(KEY)) ?? [];
  },
  async save(next) {
    await kv.setJson(KEY, next);
  },
};
