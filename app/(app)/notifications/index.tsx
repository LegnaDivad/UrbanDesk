import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useNotificationsStore } from '@/features/notifications';
import type { AppNotification, NotificationPayload } from '@/features/notifications/domain/notifications.types';
import { Screen } from '@/ui/components/Screen';

type Filter = 'all' | 'unread' | 'reservas' | 'inventory' | 'system';

function bucketForPayload(p: NotificationPayload): Exclude<Filter, 'all' | 'unread'> {
  if (p.kind === 'system') return 'system';
  if (p.kind === 'booking_created' || p.kind === 'booking_cancelled') return 'reservas';
  return 'inventory';
}

function labelForPayload(p: NotificationPayload): string {
  switch (p.kind) {
    case 'booking_created':
      return 'Reserva creada';
    case 'booking_cancelled':
      return 'Reserva cancelada';
    case 'loan_created':
      return 'Préstamo creado';
    case 'loan_returned':
      return 'Préstamo devuelto';
    default:
      return 'Sistema';
  }
}

function fallbackRouteForPayload(
  payload: NotificationPayload,
): { pathname: string; params?: Record<string, string> } | null {
  switch (payload.kind) {
    case 'booking_created':
    case 'booking_cancelled':
      return { pathname: '/(app)/reservas' };

    case 'loan_created':
    case 'loan_returned':
      return { pathname: '/(app)/inventory/[assetId]', params: { assetId: payload.assetId } };

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

function Chip(props: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      className={`rounded-full px-3 py-2 ${props.active ? 'bg-black' : 'bg-neutral-200'}`}
      onPress={props.onPress}
    >
      <Text className={`text-xs ${props.active ? 'text-white' : 'text-black'}`}>{props.label}</Text>
    </Pressable>
  );
}

export default function NotificationsIndex() {
  const router = useRouter();

  const status = useNotificationsStore((s) => s.status);
  const items = useNotificationsStore((s) => s.items);

  const hydrate = useNotificationsStore((s) => s.hydrate);
  const markRead = useNotificationsStore((s) => s.markRead);
  const toggleRead = useNotificationsStore((s) => s.toggleRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const remove = useNotificationsStore((s) => s.remove);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const unreadCount = useMemo(() => items.filter((n) => !n.readAtISO).length, [items]);

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    if (filter === 'unread') return items.filter((n) => !n.readAtISO);
    return items.filter((n) => bucketForPayload(n.payload) === filter);
  }, [items, filter]);

  const openNotification = (n: AppNotification) => {
    void markRead(n.id);

    const deepLink = n.meta?.deepLink ?? null;
    if (deepLink) {
      router.push(deepLink as any);
      return;
    }

    const fallback = fallbackRouteForPayload(n.payload);
    if (fallback) {
      router.push({ pathname: fallback.pathname as any, params: fallback.params });
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-4">
        {/* Header */}
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="text-base">Notificaciones</Text>
            <Text className="text-xs text-neutral-600">
              {unreadCount} sin leer • {items.length} total
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

        {/* Filters */}
        <View className="flex-row flex-wrap gap-2">
          <Chip label="Todas" active={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="Sin leer" active={filter === 'unread'} onPress={() => setFilter('unread')} />
          <Chip label="Reservas" active={filter === 'reservas'} onPress={() => setFilter('reservas')} />
          <Chip label="Inventario" active={filter === 'inventory'} onPress={() => setFilter('inventory')} />
          <Chip label="Sistema" active={filter === 'system'} onPress={() => setFilter('system')} />
        </View>

        {/* Body */}
        {status === 'loading' ? (
          <View className="gap-2">
            <View className="h-16 rounded-2xl bg-neutral-100" />
            <View className="h-16 rounded-2xl bg-neutral-100" />
            <View className="h-16 rounded-2xl bg-neutral-100" />
          </View>
        ) : status === 'error' ? (
          <View className="rounded-2xl bg-neutral-100 px-4 py-4 gap-2">
            <Text className="text-sm">No se pudieron cargar las notificaciones.</Text>
            <Pressable className="rounded-xl bg-neutral-200 px-3 py-2 self-start" onPress={() => void hydrate()}>
              <Text className="text-xs">Reintentar</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View className="rounded-2xl bg-neutral-100 px-4 py-4 gap-1">
            <Text className="text-sm">
              {filter === 'unread' ? 'No tienes notificaciones sin leer.' : 'No hay notificaciones todavía.'}
            </Text>
            <Text className="text-xs text-neutral-600">
              Cuando crees reservas o préstamos, aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View className="gap-2">
            {filtered.map((n) => {
              const isUnread = !n.readAtISO;
              const deepLink = n.meta?.deepLink ?? null;
              const actions = n.meta?.actions ?? [];
              const fallback = fallbackRouteForPayload(n.payload);
              const hasNav = Boolean(deepLink || fallback);

              return (
                <View
                  key={n.id}
                  className={`rounded-2xl px-4 py-3 ${isUnread ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                >
                  <Pressable onPress={() => openNotification(n)}>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          {isUnread ? <View className="h-2 w-2 rounded-full bg-black" /> : null}
                          <Text className={`text-sm ${isUnread ? 'font-semibold' : ''}`}>{n.title}</Text>
                        </View>

                        {n.body ? <Text className="text-xs text-neutral-700 mt-1">{n.body}</Text> : null}

                        <View className="flex-row items-center gap-2 mt-2">
                          <View className="rounded-full bg-neutral-300 px-2 py-1">
                            <Text className="text-[10px] text-neutral-700">{labelForPayload(n.payload)}</Text>
                          </View>

                          <Text className="text-[10px] text-neutral-600">
                            {new Date(n.createdAtISO).toLocaleString()}
                          </Text>

                          {hasNav ? <Text className="text-[10px] text-neutral-600">• abrir</Text> : null}
                        </View>
                      </View>

                      {hasNav ? <Text className="text-xs text-neutral-700">›</Text> : null}
                    </View>
                  </Pressable>

                  {/* Quick actions (smoke-friendly) */}
                  <View className="flex-row flex-wrap gap-2 mt-3">
                    {actions.map((a, idx) => {
                      const { bg, fg } = actionClasses(a.kind);
                      return (
                        <Pressable
                          key={`${n.id}-action-${idx}`}
                          className={`rounded-xl px-3 py-2 ${bg}`}
                          onPress={() => {
                            void markRead(n.id);
                            router.push(a.deepLink as any);
                          }}
                        >
                          <Text className={`text-xs ${fg}`}>{a.label}</Text>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      className="rounded-xl bg-neutral-200 px-3 py-2"
                      onPress={() => void toggleRead(n.id)}
                    >
                      <Text className="text-xs">{isUnread ? 'Marcar leído' : 'Marcar sin leer'}</Text>
                    </Pressable>

                    <Pressable
                      className="rounded-xl bg-neutral-200 px-3 py-2"
                      onPress={() => void remove(n.id)}
                    >
                      <Text className="text-xs">Eliminar</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
