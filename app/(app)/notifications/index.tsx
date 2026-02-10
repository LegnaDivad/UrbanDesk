import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { useNotificationsStore } from '@/features/notifications';
import type {
  AppNotification,
  NotificationPayload,
} from '@/features/notifications/domain/notifications.types';
import { Screen } from '@/ui/components/Screen';

function fallbackRouteForPayload(
  payload: NotificationPayload,
): { pathname: string; params?: Record<string, string> } | null {
  switch (payload.kind) {
    case 'booking_created':
    case 'booking_cancelled':
      return { pathname: '/(app)/reservas' };

    case 'loan_created':
    case 'loan_returned':
      return {
        pathname: '/(app)/inventory/[assetId]',
        params: { assetId: payload.assetId },
      };

    case 'system':
    default:
      return null;
  }
}

function actionClasses(kind?: 'primary' | 'neutral' | 'danger'): { bg: string; fg: string } {
  if (kind === 'primary') return { bg: 'bg-black', fg: 'text-white' };
  if (kind === 'danger') return { bg: 'bg-neutral-700', fg: 'text-white' };
  return { bg: 'bg-neutral-200', fg: 'text-black' };
}

function SwipeNotificationRow(props: {
  n: AppNotification;
  onOpen: (n: AppNotification) => void;
  onToggleRead: (id: string) => void;
  onRemove: (id: string) => void;
  onOpenDeepLink: (deepLink: string, notificationId: string) => void;
}) {
  const { n, onOpen, onToggleRead, onRemove, onOpenDeepLink } = props;

  const translateX = useMemo(() => new Animated.Value(0), []);

  const THRESHOLD = 90;
  const MAX = 140;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => {
          const dx = Math.abs(g.dx);
          const dy = Math.abs(g.dy);
          return dx > 8 && dy < 10;
        },
        onPanResponderMove: (_, g) => {
          const clamped = Math.max(-MAX, Math.min(MAX, g.dx));
          translateX.setValue(clamped);
        },
        onPanResponderRelease: (_, g) => {
          const dx = g.dx;

          if (dx >= THRESHOLD) onToggleRead(n.id);
          if (dx <= -THRESHOLD) onRemove(n.id);

          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 30,
            bounciness: 0,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            speed: 30,
            bounciness: 0,
          }).start();
        },
      }),
    [n.id, onRemove, onToggleRead, translateX],
  );

  const isUnread = !n.readAtISO;

  const leftLabel = isUnread ? 'Marcar leída' : 'Marcar no leída';
  const rightLabel = 'Borrar';

  const actions = n.meta?.actions ?? [];

  return (
    <View className="rounded-2xl overflow-hidden">
      {/* underlay */}
      <View className="absolute inset-0 flex-row">
        <View className="flex-1 justify-center pl-4 bg-neutral-300">
          <Text className="text-xs">{leftLabel}</Text>
        </View>
        <View className="flex-1 justify-center items-end pr-4 bg-neutral-400">
          <Text className="text-xs text-white">{rightLabel}</Text>
        </View>
      </View>

      {/* foreground */}
      <Animated.View
        style={{ transform: [{ translateX }] }}
        {...panResponder.panHandlers}
      >
        <View className={`rounded-2xl px-4 py-3 ${isUnread ? 'bg-neutral-200' : 'bg-neutral-100'}`}>
          <Pressable onPress={() => onOpen(n)}>
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className={`text-sm ${isUnread ? 'font-semibold' : ''}`}>
                  {n.title}
                </Text>

                {n.body ? <Text className="text-xs text-neutral-700">{n.body}</Text> : null}

                <Text className="text-[10px] text-neutral-600 mt-1">
                  {new Date(n.createdAtISO).toLocaleString()} {isUnread ? '• NUEVA' : ''}
                </Text>
              </View>

              <Text className="text-xs text-neutral-700">›</Text>
            </View>
          </Pressable>

          {actions.length ? (
            <View className="flex-row flex-wrap gap-2 mt-3">
              {actions.map((a, idx) => {
                const { bg, fg } = actionClasses(a.kind);

                return (
                  <Pressable
                    key={`${n.id}-action-${idx}`}
                    className={`rounded-xl px-3 py-2 ${bg}`}
                    onPress={() => onOpenDeepLink(a.deepLink, n.id)}
                  >
                    <Text className={`text-xs ${fg}`}>{a.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

export default function NotificationsIndex() {
  const router = useRouter();

  const status = useNotificationsStore((s) => s.status);
  const items = useNotificationsStore((s) => s.items);

  const hydrate = useNotificationsStore((s) => s.hydrate);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  const toggleRead = useNotificationsStore((s) => s.toggleRead);
  const remove = useNotificationsStore((s) => s.remove);

  const unread = useMemo(() => items.filter((n) => !n.readAtISO).length, [items]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const onOpenNotification = (n: AppNotification) => {
    void markRead(n.id);

    const deepLink = n.meta?.deepLink;
    if (deepLink) {
      router.push(deepLink as any);
      return;
    }

    const fallback = fallbackRouteForPayload(n.payload);
    if (fallback) {
      router.push({ pathname: fallback.pathname as any, params: fallback.params });
    }
  };

  const onOpenDeepLink = (deepLink: string, notificationId: string) => {
    void markRead(notificationId);
    router.push(deepLink as any);
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-base">Notificaciones</Text>
            <Text className="text-xs text-neutral-600">
              {unread} sin leer • {items.length} total
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable
              className={`rounded-xl px-3 py-2 ${items.length ? 'bg-neutral-200' : 'bg-neutral-100'}`}
              disabled={!items.length}
              onPress={() => void markAllRead()}
            >
              <Text className="text-xs">Leer todo</Text>
            </Pressable>

            <Pressable
              className={`rounded-xl px-3 py-2 ${items.length ? 'bg-neutral-200' : 'bg-neutral-100'}`}
              disabled={!items.length}
              onPress={() => void clearAll()}
            >
              <Text className="text-xs">Limpiar</Text>
            </Pressable>
          </View>
        </View>

        {status === 'loading' ? (
          <Text className="text-sm">Cargando…</Text>
        ) : items.length === 0 ? (
          <View className="rounded-2xl bg-neutral-100 px-4 py-4">
            <Text className="text-sm">No hay notificaciones todavía.</Text>
            <Text className="text-xs text-neutral-600">
              Cuando crees reservas o préstamos, aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {items.map((n) => (
              <SwipeNotificationRow
                key={n.id}
                n={n}
                onOpen={onOpenNotification}
                onToggleRead={(id) => void toggleRead(id)}
                onRemove={(id) => void remove(id)}
                onOpenDeepLink={onOpenDeepLink}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
