import type { Session, SessionRepo } from '@/features/auth/data/session.repo';
import { kv } from '@/lib/storage/kv';

const KEY = 'ud.session.v1';

export const sessionRepoLocal: SessionRepo = {
  async load() {
    return (await kv.getJson<Session>(KEY)) ?? null;
  },
  async save(next) {
    if (!next) {
      await kv.removeItem(KEY);
      return;
    }
    await kv.setJson(KEY, next);
  },
};

