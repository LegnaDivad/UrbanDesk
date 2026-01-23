import { create } from 'zustand';

import { loadBookings, saveBookings } from '@/features/reservas/data/bookings.repo';
import { addMinutes, roundToNext15Min } from '@/features/reservas/domain/bookingWindow';
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
  bookingStartISO: string;
  durationMinutes: number;

  setBookingStartISO: (iso: string) => void;
  setDurationMinutes: (min: number) => void;
  cancelBooking: (bookingId: string) => Promise<void>;
  isSpaceOccupied: (spaceId: string) => boolean;

  hydrate: () => Promise<void>;
  selectSpace: (spaceId: string) => void;
  createMockBooking: (userId: string) => Promise<void>;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  return aS < bE && bS < aE;
}

function canBook(
  spaceId: string,
  startISO: string,
  endISO: string,
  bookings: Booking[],
): boolean {
  return !bookings.some(
    (b) => b.spaceId === spaceId && overlaps(startISO, endISO, b.startISO, b.endISO),
  );
}

export const useReservasStore = create<ReservasState>((set, get) => ({
  status: 'idle',
  config: null,
  spaces: [],
  bookings: [],
  selectedSpaceId: null,
  bookingStartISO: roundToNext15Min(new Date()).toISOString(),
  durationMinutes: 60,

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const [config, bookings] = await Promise.all([
        loadWorkspaceConfig(),
        loadBookings(),
      ]);
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

  setBookingStartISO: (iso) => set({ bookingStartISO: iso }),

  setDurationMinutes: (min) => set({ durationMinutes: min }),

  cancelBooking: async (bookingId) => {
    const { bookings } = get();
    const updated = bookings.filter((b) => b.id !== bookingId);
    await saveBookings(updated);
    set({ bookings: updated });
  },

  isSpaceOccupied: (spaceId) => {
    const { bookings, bookingStartISO, durationMinutes } = get();
    const endISO = addMinutes(bookingStartISO, durationMinutes);
    return !canBook(spaceId, bookingStartISO, endISO, bookings);
  },

  createMockBooking: async (userId) => {
    const { selectedSpaceId, bookings, bookingStartISO, durationMinutes } = get();
    if (!selectedSpaceId) return;

    const startISO = bookingStartISO;
    const endISO = addMinutes(startISO, durationMinutes);

    if (!canBook(selectedSpaceId, startISO, endISO, bookings)) return;

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
