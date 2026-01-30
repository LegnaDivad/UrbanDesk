import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useNotificationsStore } from '@/features/notifications';

export default function NotificationsIndex() {
  const status = useNotificationsStore((s) => s.status);
  const items = useNotificationsStore((s) => s.items);

  const hydrate = useNotificationsStore((s) => s.hydrate);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clear = useNotificationsStore((s) => s.clear);
  const unread = useNotificationsStore((s) => s.unreadCount());

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-3">
      <Text className="text-base">Notificaciones</Text>
      <Text className="text-sm">status: {status}</Text>
      <Text className="text-sm">unread: {unread}</Text>

      <View className="flex-row gap-2">
        <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={() => void markAllRead()}>
          <Text className="text-center">Marcar todo leído</Text>
        </Pressable>

        <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={() => void clear()}>
          <Text className="text-center">Limpiar</Text>
        </Pressable>
      </View>

      <View className="gap-2">
        {items.length === 0 ? (
          <Text className="text-sm text-neutral-600">No hay notificaciones.</Text>
        ) : (
          items.map((n) => (
            <Pressable
              key={n.id}
              className={`rounded-xl px-4 py-3 ${n.readAtISO ? 'bg-neutral-100' : 'bg-neutral-200'}`}
              onPress={() => void markRead(n.id)}
            >
              <Text className="text-sm">
                {n.readAtISO ? '' : '• '}[{n.kind}] {n.title}
              </Text>
              <Text className="text-xs text-neutral-600">{n.message}</Text>
              <Text className="text-[10px] text-neutral-500">
                {new Date(n.createdAtISO).toLocaleString()}
              </Text>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}
