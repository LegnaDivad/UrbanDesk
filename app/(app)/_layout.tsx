import { Tabs } from 'expo-router';
import { useEffect } from 'react';

import { useNotificationsStore } from '@/features/notifications';

export default function AppTabsLayout() {
  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);
  const unread = useNotificationsStore((s) => s.unreadCount());

  useEffect(() => {
    void hydrateNotifications();
  }, [hydrateNotifications]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0a0a0a',
        tabBarInactiveTintColor: '#737373',
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e5e5',
          borderTopWidth: 1,
          height: 62,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}
    >
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
  );
}
