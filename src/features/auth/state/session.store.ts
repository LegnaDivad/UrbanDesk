import { create } from 'zustand';

import { di } from '@/di';
import type { Session, UserRole } from '@/features/auth/domain/session.types';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface SessionState {
  status: AuthStatus;
  session: Session | null;

  hydrate: () => Promise<void>;
  signInMock: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

function createMockSession(role: UserRole): Session {
  return {
    userId: `u-${Date.now()}`,
    role,
  };
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'loading',
  session: null,

  hydrate: async () => {
    try {
      const session = await di.auth.sessionRepo.load();
      if (!session) {
        set({ status: 'signedOut', session: null });
        return;
      }
      set({ status: 'signedIn', session });
    } catch {
      set({ status: 'signedOut', session: null });
    }
  },

  signInMock: async (role) => {
    const session = createMockSession(role);
    await di.auth.sessionRepo.save(session);
    set({ status: 'signedIn', session });
  },

  signOut: async () => {
    await di.auth.sessionRepo.save(null);
    set({ status: 'signedOut', session: null });
  },
}));
