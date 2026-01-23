import { Redirect, Stack } from 'expo-router';

import { useSessionStore } from '@/features/auth';

export default function AdminLayout() {
  const status = useSessionStore((s) => s.status);
  const role = useSessionStore((s) => s.session?.role);

  if (status === 'loading') return null;
  if (status !== 'signedIn') return <Redirect href="/(public)/login" />;
  if (role !== 'admin') return <Redirect href="/(app)/reservas" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
