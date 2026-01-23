import { create } from 'zustand';

import { loadBookings, saveBookings } from '@/features/reservas/data/bookings.repo';
import type { Booking, Space } from '@/features/reservas/domain/reservas.types';
import { loadWorkspaceConfig } from '@/features/space-builder/data/workspaceConfig.repo';
import type { WorkspaceConfig } from '@/features/space-builder/domain/spaceBuilder.types';

function spacesFromConfig(config: WorkspaceConfig | null): Space[] {
  if (!config) return [];
  return config.spaces.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    areaId: s.areaId,
  }));
}

export interface ReservasState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  config: WorkspaceConfig | null;
  spaces: Space[];
  bookings: Booking[];
  selectedSpaceId: string | null;

  hydrate: () => Promise<void>;
  selectSpace: (spaceId: string) => void;
  createMockBooking: (userId: string) => Promise<void>;
}

export const useReservasStore = create<ReservasState>((set, get) => ({
  status: 'idle',
  config: null,
  spaces: [],
  bookings: [],
  selectedSpaceId: null,

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const [config, bookings] = await Promise.all([loadWorkspaceConfig(), loadBookings()]);
      const spaces = spacesFromConfig(config);
      set({
        status: 'ready',
        config,
        spaces,
        bookings,
        selectedSpaceId: spaces[0]?.id ?? null,
      });
    } catch {
      set({ status: 'error' });
    }
  },

  selectSpace: (spaceId) => set({ selectedSpaceId: spaceId }),

  createMockBooking: async (userId) => {
    const { selectedSpaceId, bookings } = get();
    if (!selectedSpaceId) return;

    const now = new Date();
    const startISO = now.toISOString();
    const endISO = new Date(now.getTime() + 60 * 60 * 1000).toISOString();

    const next: Booking = {
      id: `bk-${Date.now()}`,
      spaceId: selectedSpaceId,
      userId,
      startISO,
      endISO,
    };

    const updated = [next, ...bookings];
    await saveBookings(updated);
    set({ bookings: updated });
  },
}));
