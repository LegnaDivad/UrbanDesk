import { create } from 'zustand';

import { di } from '@/di';
import type {
  AppNotification,
  NotificationMeta,
  NotificationPayload,
} from '@/features/notifications/domain/notifications.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isValidPayload(value: unknown): value is NotificationPayload {
  if (!isRecord(value)) return false;
  const kind = value.kind;
  if (typeof kind !== 'string') return false;

  if (kind === 'system') return true;

  if (kind === 'booking_created' || kind === 'booking_cancelled') {
    return typeof value.bookingId === 'string' && typeof value.spaceId === 'string';
  }

  if (kind === 'loan_created' || kind === 'loan_returned') {
    return typeof value.loanId === 'string' && typeof value.assetId === 'string';
  }

  return false;
}

function sanitizeNotification(value: unknown): AppNotification | null {
  if (!isRecord(value)) return null;

  const id = typeof value.id === 'string' ? value.id : `nt-${Date.now()}`;
  const title = typeof value.title === 'string' ? value.title : 'Notificación';
  const body = typeof value.body === 'string' ? value.body : undefined;
  const createdAtISO =
    typeof value.createdAtISO === 'string' ? value.createdAtISO : new Date().toISOString();
  const readAtISO =
    value.readAtISO === null || typeof value.readAtISO === 'string' ? value.readAtISO : null;

  const payload = isValidPayload(value.payload) ? value.payload : ({ kind: 'system' } as const);
  const meta = isRecord(value.meta) ? (value.meta as NotificationMeta) : undefined;

  return { id, title, body, createdAtISO, readAtISO, payload, meta };
}

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface NotificationsState {
  status: LoadStatus;
  items: AppNotification[];

  hydrate: () => Promise<void>;

  push: (input: {
    title: string;
    body?: string;
    payload: NotificationPayload;
    meta?: NotificationMeta;
  }) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markUnread: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clearAll: () => Promise<void>;

  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  status: 'idle',
  items: [],

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const raw = await di.notifications.notificationsRepo.load();
      const needsMigration = (raw ?? []).some((n) => {
        if (!isRecord(n)) return true;
        if (!isValidPayload(n.payload)) return true;
        if (typeof n.id !== 'string') return true;
        if (typeof n.title !== 'string') return true;
        if (typeof n.createdAtISO !== 'string') return true;
        if (!(n.readAtISO === null || typeof n.readAtISO === 'string')) return true;
        return false;
      });

      const sanitized = (raw ?? [])
        .map((n) => sanitizeNotification(n))
        .filter((n): n is AppNotification => Boolean(n));

      set({ status: 'ready', items: sanitized });

      // Persist best-effort migration if something was invalid.
      if (needsMigration) {
        void di.notifications.notificationsRepo.save(sanitized);
      }
    } catch {
      set({ status: 'error' });
    }
  },

  push: async ({ title, body, payload, meta }) => {
    const next: AppNotification = {
      id: `nt-${Date.now()}`,
      title,
      body,
      createdAtISO: new Date().toISOString(),
      readAtISO: null,
      payload,
      meta,
    };

    const updated = [next, ...get().items];
    await di.notifications.notificationsRepo.save(updated);
    set({ items: updated });
  },

  markRead: async (id) => {
    const { items } = get();
    const now = new Date().toISOString();

    const updated = items.map((n) =>
      n.id === id && !n.readAtISO ? { ...n, readAtISO: now } : n,
    );

    await di.notifications.notificationsRepo.save(updated);
    set({ items: updated });
  },

  markUnread: async (id) => {
    const { items } = get();

    const updated = items.map((n) =>
      n.id === id && n.readAtISO ? { ...n, readAtISO: null } : n,
    );

    await di.notifications.notificationsRepo.save(updated);
    set({ items: updated });
  },

  markAllRead: async () => {
    const now = new Date().toISOString();
    const updated = get().items.map((n) => (n.readAtISO ? n : { ...n, readAtISO: now }));
    await di.notifications.notificationsRepo.save(updated);
    set({ items: updated });
  },

  clearAll: async () => {
    await di.notifications.notificationsRepo.save([]);
    set({ items: [] });
  },

  unreadCount: () => get().items.filter((n) => !n.readAtISO).length,
}));
