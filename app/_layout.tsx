import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { useSessionStore } from '@/features/auth';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.session?.role ?? null);
  const hydrate = useSessionStore((s) => s.hydrate);

  // 1) Hidrata sesión al arrancar (web + mobile)
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // 2) Aplica reglas por “zona” de rutas
  useEffect(() => {
    if (status === 'loading') return;

    const [group] = segments; // "(public)" | "(app)" | "(admin)" | undefined
    const inPublic = group === '(public)';
    const inAdmin = group === '(admin)';

    if (status === 'signedOut') {
      if (!inPublic) router.replace('/(public)/login');
      return;
    }

    // signedIn
    if (inPublic) {
      router.replace('/(app)/reservas');
      return;
    }

    if (inAdmin && role !== 'admin') {
      router.replace('/(app)/reservas');
    }
  }, [status, role, segments, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
