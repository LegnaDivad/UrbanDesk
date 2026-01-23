import { create } from 'zustand';

import type { Session, UserRole } from '@/features/auth/domain/session.types';
import { kv } from '@/lib/storage/kv';

const SESSION_KEY = 'ud.session.v1';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: AuthStatus;
  session: Session | null;

  hydrate: () => Promise<void>;
  signInMock: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  status: 'loading',
  session: null,

  hydrate: async () => {
    const raw = await kv.getItem(SESSION_KEY);
    if (!raw) {
      set({ status: 'signedOut', session: null });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Session;
      if (!parsed?.userId || !parsed?.role) {
        set({ status: 'signedOut', session: null });
        return;
      }
      set({ status: 'signedIn', session: parsed });
    } catch {
      set({ status: 'signedOut', session: null });
    }
  },

  signInMock: async (role) => {
    const session: Session = { userId: 'dev-user', role };
    await kv.setItem(SESSION_KEY, JSON.stringify(session));
    set({ status: 'signedIn', session });
  },

  signOut: async () => {
    await kv.removeItem(SESSION_KEY);
    set({ status: 'signedOut', session: null });
  },
}));
