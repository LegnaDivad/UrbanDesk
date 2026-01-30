import { create } from 'zustand';

import type { WorkspaceConfig } from '@/core/types/workspace';
import { di } from '@/di';
import { createDefaultWorkspaceConfig } from '@/features/space-builder/domain/defaultConfig';



interface SpaceBuilderState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  config: WorkspaceConfig | null;
  isDirty: boolean;

  hydrate: () => Promise<void>;
  setConfig: (config: WorkspaceConfig) => void;
  persist: () => Promise<void>;
  seedDefault: () => void;
}

export const useSpaceBuilderStore = create<SpaceBuilderState>((set, get) => ({
  status: 'idle',
  config: null,
  isDirty: false,

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const config = await di.spaces.workspaceRepo.load();
      set({ status: 'ready', config, isDirty: false });
    } catch {
      set({ status: 'error' });
    }
  },

  setConfig: (config) => set({ config, isDirty: true }),

  persist: async () => {
    const { config } = get();
    if (!config) return;
    await di.spaces.workspaceRepo.save(config);
    set({ isDirty: false });
  },

  seedDefault: () => {
    const config = createDefaultWorkspaceConfig();
    set({ config, isDirty: true });
  },
}));
