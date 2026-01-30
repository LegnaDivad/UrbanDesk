import { create } from 'zustand';

import type { WorkspaceConfig } from '@/core/types/workspace';
import { di } from '@/di';
import { useNotificationsStore } from '@/features/notifications';
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
      const bookings = normalizeBookings((rawBookings ?? []) as BookingInput[]);

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

    const target = bookings.find((b) => b.id === bookingId) ?? null;
    if (!target) {
      await useNotificationsStore.getState().notify({
        kind: 'error',
        title: 'Reserva no encontrada',
        message: `No existe la reserva ${bookingId}.`,
        meta: { bookingId },
      });
      return;
    }

    if (target.status !== 'active') {
      await useNotificationsStore.getState().notify({
        kind: 'warning',
        title: 'Reserva no cancelable',
        message: `La reserva ${bookingId} ya está en estado ${target.status}.`,
        meta: { bookingId, status: target.status },
      });
      return;
    }

    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b,
    );

    await di.reservas.bookingRepo.save(updated);
    set({ bookings: updated });

    await useNotificationsStore.getState().notify({
      kind: 'warning',
      title: 'Reserva cancelada',
      message: `Se canceló la reserva ${bookingId}.`,
      meta: { bookingId, spaceId: target.spaceId, userId: target.userId },
    });
  },

  isSpaceOccupied: (spaceId) => {
    const { bookings, bookingStartISO, durationMinutes } = get();
    const endISO = addMinutes(bookingStartISO, durationMinutes);
    return !canBook(spaceId, bookingStartISO, endISO, bookings);
  },

  createMockBooking: async (userId) => {
    const { selectedSpaceId, bookings, bookingStartISO, durationMinutes, spaces } = get();
    if (!selectedSpaceId) {
      await useNotificationsStore.getState().notify({
        kind: 'warning',
        title: 'Sin espacio seleccionado',
        message: 'Selecciona un espacio antes de reservar.',
      });
      return;
    }

    const startISO = bookingStartISO;
    const endISO = addMinutes(startISO, durationMinutes);

    if (!canBook(selectedSpaceId, startISO, endISO, bookings)) {
      await useNotificationsStore.getState().notify({
        kind: 'warning',
        title: 'Espacio ocupado',
        message: 'No se puede reservar en ese rango de tiempo.',
        meta: { spaceId: selectedSpaceId },
      });
      return;
    }

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

    const spaceName = spaces.find((s) => s.id === selectedSpaceId)?.name ?? selectedSpaceId;

    await useNotificationsStore.getState().notify({
      kind: 'success',
      title: 'Reserva creada',
      message: `${spaceName} reservado por ${durationMinutes} min.`,
      meta: { bookingId: next.id, spaceId: selectedSpaceId, userId },
    });
  },
}));
