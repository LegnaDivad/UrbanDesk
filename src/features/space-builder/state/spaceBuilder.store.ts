import { create } from 'zustand';

import { loadWorkspaceConfig, saveWorkspaceConfig } from '@/features/space-builder/data/workspaceConfig.repo';
import type { WorkspaceConfig } from '@/features/space-builder/domain/spaceBuilder.types';

interface SpaceBuilderState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  config: WorkspaceConfig | null;
  isDirty: boolean;

  hydrate: () => Promise<void>;
  setConfig: (config: WorkspaceConfig) => void;
  persist: () => Promise<void>;
}

export const useSpaceBuilderStore = create<SpaceBuilderState>((set, get) => ({
  status: 'idle',
  config: null,
  isDirty: false,

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const config = await loadWorkspaceConfig();
      set({ status: 'ready', config, isDirty: false });
    } catch {
      set({ status: 'error' });
    }
  },

  setConfig: (config) => set({ config, isDirty: true }),

  persist: async () => {
    const { config } = get();
    if (!config) return;
    await saveWorkspaceConfig(config);
    set({ isDirty: false });
  },
}));
