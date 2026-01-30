import { create } from 'zustand';

import { di } from '@/di';
import type {
  AppNotification,
  NotificationMeta,
  NotificationPayload,
} from '@/features/notifications/domain/notifications.types';

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
      const items = await di.notifications.notificationsRepo.load();
      set({ status: 'ready', items: items ?? [] });
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
