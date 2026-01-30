import { create } from 'zustand';

import type { WorkspaceConfig } from '@/core/types/workspace';
import { di } from '@/di';
import { canBook } from '@/features/reservas/domain/bookingPolicy';
import { addMinutes, roundToNext15Min } from '@/features/reservas/domain/bookingWindow';
import type { Booking, Space } from '@/features/reservas/domain/reservas.types';

function spacesFromConfig(config: WorkspaceConfig | null): Space[] {
  if (!config) return [];
  return config.spaces.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    areaId: s.areaId,
  }));
}

type BookingInput = Omit<Booking, 'status'> & Partial<Pick<Booking, 'status'>>;

function normalizeBookings(bookings: BookingInput[]): Booking[] {
  return bookings.map((b) => ({
    ...b,
    status: b.status ?? 'active',
  })) as Booking[];
}


export interface ReservasState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  config: WorkspaceConfig | null;
  spaces: Space[];
  bookings: Booking[];
  selectedSpaceId: string | null;

  bookingStartISO: string;
  durationMinutes: number;

  hydrate: () => Promise<void>;
  selectSpace: (spaceId: string) => void;

  setBookingStartISO: (iso: string) => void;
  setDurationMinutes: (min: number) => void;

  cancelBooking: (bookingId: string) => Promise<void>;
  isSpaceOccupied: (spaceId: string) => boolean;

  createMockBooking: (userId: string) => Promise<void>;
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
      const [config, rawBookings] = await Promise.all([
        di.spaces.workspaceRepo.load(),
        di.reservas.bookingRepo.load(),
      ]);

      const spaces = spacesFromConfig(config);

      const bookings = normalizeBookings((rawBookings ?? []) as any);

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

    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b,
    );

    await di.reservas.bookingRepo.save(updated);
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
      status: 'active',
    };

    const updated = [next, ...bookings];
    await di.reservas.bookingRepo.save(updated);
    set({ bookings: updated });
  },
}));
