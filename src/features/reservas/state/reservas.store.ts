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

function getActiveBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.status === 'active');
}

function buildReservasDeepLink(params?: {
  spaceId?: string;
  bookingId?: string;
}): string {
  const base = '/(app)/reservas';
  if (!params?.spaceId && !params?.bookingId) return base;

  const qs = new URLSearchParams();
  if (params.spaceId) qs.set('spaceId', params.spaceId);
  if (params.bookingId) qs.set('bookingId', params.bookingId);

  return `${base}?${qs.toString()}`;
}

/**
 * Notificaciones v1.1
 * - "deep-links" y "acciones" se adjuntan en `meta` para que el UI las interprete
 *   sin acoplar el store de reservas a un contrato específico del feature notifications.
 */
async function notifyV11(input: {
  kind: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  deepLink?: string;
  actions?: { label: string; deepLink: string }[];
  meta?: Record<string, unknown>;
}) {
  const { deepLink, actions, meta, ...rest } = input;

  await useNotificationsStore.getState().push({
    title: rest.title,
    body: rest.message,
    payload: { kind: 'system' },
    meta: {
      ...(meta ?? {}),
      deepLink,
      actions,
    },
  });
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

      await notifyV11({
        kind: 'error',
        title: 'Error al cargar reservas',
        message: 'No se pudo hidratar el módulo de reservas.',
        deepLink: buildReservasDeepLink(),
        actions: [{ label: 'Abrir Reservas', deepLink: buildReservasDeepLink() }],
      });
    }
  },

  selectSpace: (spaceId) => set({ selectedSpaceId: spaceId }),

  setBookingStartISO: (iso) => set({ bookingStartISO: iso }),
  setDurationMinutes: (min) => set({ durationMinutes: min }),

  cancelBooking: async (bookingId) => {
    const { bookings } = get();

    const target = bookings.find((b) => b.id === bookingId) ?? null;
    if (!target) {
      await notifyV11({
        kind: 'error',
        title: 'Reserva no encontrada',
        message: `No existe la reserva ${bookingId}.`,
        deepLink: buildReservasDeepLink({ bookingId }),
        actions: [{ label: 'Abrir Reservas', deepLink: buildReservasDeepLink() }],
        meta: { bookingId },
      });
      return;
    }

    if (target.status !== 'active') {
      await notifyV11({
        kind: 'warning',
        title: 'Reserva no cancelable',
        message: `La reserva ${bookingId} ya está en estado ${target.status}.`,
        deepLink: buildReservasDeepLink({ bookingId, spaceId: target.spaceId }),
        actions: [
          {
            label: 'Abrir Reservas',
            deepLink: buildReservasDeepLink({ bookingId, spaceId: target.spaceId }),
          },
        ],
        meta: { bookingId, status: target.status, spaceId: target.spaceId },
      });
      return;
    }

    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, status: 'cancelled' as const } : b,
    );

    await di.reservas.bookingRepo.save(updated);
    set({ bookings: updated });

    await notifyV11({
      kind: 'warning',
      title: 'Reserva cancelada',
      message: `Se canceló la reserva ${bookingId}.`,
      deepLink: buildReservasDeepLink({ bookingId, spaceId: target.spaceId }),
      actions: [
        {
          label: 'Ver en Reservas',
          deepLink: buildReservasDeepLink({ bookingId, spaceId: target.spaceId }),
        },
      ],
      meta: {
        bookingId,
        spaceId: target.spaceId,
        userId: target.userId,
        prevStatus: 'active',
        nextStatus: 'cancelled',
      },
    });
  },

  isSpaceOccupied: (spaceId) => {
    const { bookings, bookingStartISO, durationMinutes } = get();
    const active = getActiveBookings(bookings);
    const endISO = addMinutes(bookingStartISO, durationMinutes);
    return !canBook(spaceId, bookingStartISO, endISO, active);
  },

  createMockBooking: async (userId) => {
    const { selectedSpaceId, bookings, bookingStartISO, durationMinutes, spaces } = get();

    if (!selectedSpaceId) {
      await notifyV11({
        kind: 'warning',
        title: 'Sin espacio seleccionado',
        message: 'Selecciona un espacio antes de reservar.',
        deepLink: buildReservasDeepLink(),
        actions: [{ label: 'Abrir Reservas', deepLink: buildReservasDeepLink() }],
      });
      return;
    }

    const active = getActiveBookings(bookings);

    const startISO = bookingStartISO;
    const endISO = addMinutes(startISO, durationMinutes);

    if (!canBook(selectedSpaceId, startISO, endISO, active)) {
      await notifyV11({
        kind: 'warning',
        title: 'Espacio ocupado',
        message: 'No se puede reservar en ese rango de tiempo.',
        deepLink: buildReservasDeepLink({ spaceId: selectedSpaceId }),
        actions: [
          {
            label: 'Ver disponibilidad',
            deepLink: buildReservasDeepLink({ spaceId: selectedSpaceId }),
          },
        ],
        meta: { spaceId: selectedSpaceId, startISO, endISO },
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

    const spaceName =
      spaces.find((s) => s.id === selectedSpaceId)?.name ?? selectedSpaceId;

    await notifyV11({
      kind: 'success',
      title: 'Reserva creada',
      message: `${spaceName} reservado por ${durationMinutes} min.`,
      deepLink: buildReservasDeepLink({ bookingId: next.id, spaceId: selectedSpaceId }),
      actions: [
        {
          label: 'Abrir reserva',
          deepLink: buildReservasDeepLink({
            bookingId: next.id,
            spaceId: selectedSpaceId,
          }),
        },
      ],
      meta: {
        bookingId: next.id,
        spaceId: selectedSpaceId,
        userId,
        startISO,
        endISO,
        durationMinutes,
      },
    });
  },
}));
