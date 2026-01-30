import { Tabs } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useNotificationsStore } from '@/features/notifications';

export default function AppTabsLayout() {
  const unread = useNotificationsStore((s) => s.unreadCount());

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="reservas" options={{ title: 'Reservas' }} />
        <Tabs.Screen name="inventory" options={{ title: 'Inventario' }} />
        <Tabs.Screen
          name="notifications"
          options={{
            title: 'Notificaciones',
            tabBarBadge: unread > 0 ? unread : undefined,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
