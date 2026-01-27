import { getItem, removeItem, setItem } from '@/platform/kv';

export const kv = {
  getItem,
  setItem,
  removeItem,

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJson<T>(key: string, value: T): Promise<void> {
    await setItem(key, JSON.stringify(value));
  },
};
