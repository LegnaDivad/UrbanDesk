import { create } from 'zustand';

import { di } from '@/di';
import type { AppNotification, NotificationKind } from '@/features/notifications/domain/notifications.types';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export interface NotificationsState {
  status: LoadStatus;
  items: AppNotification[];

  hydrate: () => Promise<void>;

  notify: (input: {
    kind?: NotificationKind;
    title: string;
    message: string;
    meta?: Record<string, string>;
  }) => Promise<void>;

  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  clear: () => Promise<void>;

  unreadCount: () => number;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  status: 'idle',
  items: [],

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const items = await di.notifications.notificationsRepo.load();
      const sorted = [...items].sort((a, b) => (a.createdAtISO < b.createdAtISO ? 1 : -1));
      set({ status: 'ready', items: sorted });
    } catch {
      set({ status: 'error' });
    }
  },

  notify: async ({ kind = 'info', title, message, meta }) => {
    const next: AppNotification = {
      id: uid('ntf'),
      kind,
      title,
      message,
      meta,
      createdAtISO: new Date().toISOString(),
      readAtISO: null,
    };

    const updated = [next, ...get().items];
    await di.notifications.notificationsRepo.save(updated);
    set({ items: updated });
  },

  markRead: async (id) => {
    const { items } = get();
    const now = new Date().toISOString();
    const updated = items.map((n) => (n.id === id ? { ...n, readAtISO: n.readAtISO ?? now } : n));
    await di.notifications.notificationsRepo.save(updated);
    set({ items: updated });
  },

  markAllRead: async () => {
    const { items } = get();
    const now = new Date().toISOString();
    const updated = items.map((n) => ({ ...n, readAtISO: n.readAtISO ?? now }));
    await di.notifications.notificationsRepo.save(updated);
    set({ items: updated });
  },

  clear: async () => {
    await di.notifications.notificationsRepo.save([]);
    set({ items: [] });
  },

  unreadCount: () => get().items.filter((n) => !n.readAtISO).length,
}));
