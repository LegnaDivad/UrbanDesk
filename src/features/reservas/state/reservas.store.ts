import { create } from 'zustand';

import { loadWorkspaceConfig } from '@/features/space-builder/data/workspaceConfig.repo';
import type { WorkspaceConfig } from '@/features/space-builder/domain/spaceBuilder.types';

export interface ReservasState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  selectedDateISO: string | null;
  config: WorkspaceConfig | null;

  setSelectedDateISO: (dateISO: string | null) => void;
  hydrate: () => Promise<void>;
}

export const useReservasStore = create<ReservasState>((set) => ({
  status: 'idle',
  selectedDateISO: null,
  config: null,

  setSelectedDateISO: (dateISO) => set({ selectedDateISO: dateISO }),

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const config = await loadWorkspaceConfig();
      set({ status: 'ready', config });
    } catch {
      set({ status: 'error' });
    }
  },
}));
