import { getItem, removeItem, setItem } from '@/platform/kv';

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export const kv = {
  getItem,
  setItem,
  removeItem,

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await getItem(key);
    if (!raw) return null;
    return safeJsonParse<T>(raw);
  },

  async setJson<T>(key: string, value: T): Promise<void> {
    await setItem(key, JSON.stringify(value));
  },
};
