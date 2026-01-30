import { Redirect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSessionStore } from '@/features/auth';

export default function PublicLayout() {
  const status = useSessionStore((s) => s.status);

  if (status === 'loading') return null;
  if (status === 'signedIn') return <Redirect href="/(app)/reservas" />;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}
