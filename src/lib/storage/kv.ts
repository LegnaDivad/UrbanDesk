import AsyncStorage from '@react-native-async-storage/async-storage';
export const kv = {
  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async getItem(key: string): Promise<string | null> {
    return kv.get(key);
  },

  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async setItem(key: string, value: string): Promise<void> {
    await kv.set(key, value);
  },

  async remove(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async removeItem(key: string): Promise<void> {
    await kv.remove(key);
  },

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setJson<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
};
