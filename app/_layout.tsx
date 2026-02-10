import '../global.css';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSessionStore } from '@/features/auth';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.session?.role ?? null);
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (status === 'loading') return;

    const [group] = segments;
    const inPublic = group === '(public)';
    const inAdmin = group === '(admin)';

    if (status === 'signedOut') {
      if (!inPublic) router.replace('/(public)/login');
      return;
    }

    if (inPublic) {
      router.replace('/(app)/reservas');
      return;
    }

    if (inAdmin && role !== 'admin') {
      router.replace('/(app)/reservas');
    }
  }, [status, role, segments, router]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
