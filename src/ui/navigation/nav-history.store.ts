import { create } from 'zustand';

type NavHistoryState = {
  stack: string[];
  push: (href: string) => void;
  reset: () => void;
};

const MAX_ENTRIES = 50;

export const useNavHistoryStore = create<NavHistoryState>((set) => ({
  stack: [],
  push: (href) =>
    set((state) => {
      const normalized = href.startsWith('/') ? href : `/${href}`;
      const last = state.stack[state.stack.length - 1] ?? null;
      if (last === normalized) return state;

      const next = [...state.stack, normalized];
      if (next.length > MAX_ENTRIES) next.splice(0, next.length - MAX_ENTRIES);
      return { stack: next };
    }),
  reset: () => set({ stack: [] }),
}));
