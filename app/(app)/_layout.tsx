import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/features/auth';

export default function AppLayout() {
  const status = useSessionStore((s) => s.status);

  if (status === 'loading') return null;
  if (status !== 'signedIn') return <Redirect href="/(public)/login" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
