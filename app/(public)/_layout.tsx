import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/features/auth';

export default function PublicLayout() {
  const status = useSessionStore((s) => s.status);

  if (status === 'loading') return null;
  if (status === 'signedIn') return <Redirect href="/(app)/reservas" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
