import { create } from 'zustand';

export type InventoryItemStatus = 'available' | 'loaned' | 'rented' | 'maintenance';

export interface InventarioState {
  query: string;
  setQuery: (q: string) => void;
}

export const useInventarioStore = create<InventarioState>((set) => ({
  query: '',
  setQuery: (q) => set({ query: q }),
}));
