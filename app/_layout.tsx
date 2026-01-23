import '../global.css';

import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useSessionStore } from '@/features/auth';

export default function RootLayout() {
  const hydrate = useSessionStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
