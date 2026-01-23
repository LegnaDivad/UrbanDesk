import { create } from 'zustand';

import { loadInventory, saveInventory } from '@/features/inventario/data/inventario.repo';
import type { InventoryItem } from '@/features/inventario/domain/inventario.types';

interface InventarioState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  items: InventoryItem[];
  query: string;

  hydrate: () => Promise<void>;
  setQuery: (q: string) => void;
  addMockItem: () => Promise<void>;
}

export const useInventarioStore = create<InventarioState>((set, get) => ({
  status: 'idle',
  items: [],
  query: '',

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const items = await loadInventory();
      set({ status: 'ready', items });
    } catch {
      set({ status: 'error' });
    }
  },

  setQuery: (q) => set({ query: q }),

  addMockItem: async () => {
    const next: InventoryItem = {
      id: `item-${Date.now()}`,
      name: 'Monitor 24" (mock)',
      status: 'available',
    };
    const items = [next, ...get().items];
    await saveInventory(items);
    set({ items });
  },
}));

