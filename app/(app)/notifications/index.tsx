import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useNotificationsStore } from '@/features/notifications';
import type {
  AppNotification,
  NotificationPayload,
} from '@/features/notifications/domain/notifications.types';
import {
  AppHeader,
  Button,
  Card,
  Chip,
  Content,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
} from '@/ui';

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
      return {
        pathname: '/(app)/inventory/[assetId]',
        params: { assetId: payload.assetId },
      };

    case 'system':
    default:
      return null;
  }
}

function buttonVariantForMetaKind(kind?: 'primary' | 'neutral' | 'danger') {
  if (kind === 'primary') return 'primary' as const;
  if (kind === 'danger') return 'danger' as const;
  return 'secondary' as const;
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
        <Content className="gap-4">
          <AppHeader
            title="Notificaciones"
            subtitle={`${unreadCount} sin leer • ${items.length} total`}
            right={
              <View className="flex-row gap-2">
                <Button
                  size="sm"
                  label="Leer todo"
                  disabled={!items.length}
                  onPress={() => void markAllRead()}
                />
                <Button
                  size="sm"
                  label="Limpiar"
                  disabled={!items.length}
                  onPress={() => void clearAll()}
                />
              </View>
            }
          />

          {/* Filters */}
          <View className="flex-row flex-wrap gap-2">
            <Chip
              label="Todas"
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            <Chip
              label="Sin leer"
              active={filter === 'unread'}
              onPress={() => setFilter('unread')}
            />
            <Chip
              label="Reservas"
              active={filter === 'reservas'}
              onPress={() => setFilter('reservas')}
            />
            <Chip
              label="Inventario"
              active={filter === 'inventory'}
              onPress={() => setFilter('inventory')}
            />
            <Chip
              label="Sistema"
              active={filter === 'system'}
              onPress={() => setFilter('system')}
            />
          </View>

          {/* Body */}
          {status === 'loading' ? (
            <LoadingState lines={3} />
          ) : status === 'error' ? (
            <ErrorState
              title="No se pudieron cargar las notificaciones"
              onRetry={() => void hydrate()}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title={
                filter === 'unread'
                  ? 'No tienes notificaciones sin leer'
                  : 'No hay notificaciones todavía'
              }
              description="Cuando crees reservas o préstamos, aparecerán aquí."
            />
          ) : (
            <View className="gap-2">
              {filtered.map((n) => {
                const isUnread = !n.readAtISO;
                const deepLink = n.meta?.deepLink ?? null;
                const actions = n.meta?.actions ?? [];
                const fallback = fallbackRouteForPayload(n.payload);
                const hasNav = Boolean(deepLink || fallback);

                return (
                  <Card
                    key={n.id}
                    className={`px-4 py-3 ${isUnread ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                  >
                    <Pressable onPress={() => openNotification(n)}>
                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <View className="flex-row items-center gap-2">
                            {isUnread ? (
                              <View className="h-2 w-2 rounded-full bg-black" />
                            ) : null}
                            <Text
                              className={`text-sm ${isUnread ? 'font-semibold' : ''}`}
                            >
                              {n.title}
                            </Text>
                          </View>

                          {n.body ? (
                            <Text className="text-xs text-neutral-700 mt-1">
                              {n.body}
                            </Text>
                          ) : null}

                          <View className="flex-row items-center gap-2 mt-2">
                            <View className="rounded-full bg-neutral-300 px-2 py-1">
                              <Text className="text-[10px] text-neutral-700">
                                {labelForPayload(n.payload)}
                              </Text>
                            </View>

                            <Text className="text-[10px] text-neutral-600">
                              {new Date(n.createdAtISO).toLocaleString()}
                            </Text>

                            {hasNav ? (
                              <Text className="text-[10px] text-neutral-600">
                                • abrir
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        {hasNav ? (
                          <Text className="text-xs text-neutral-700">›</Text>
                        ) : null}
                      </View>
                    </Pressable>

                    {/* Quick actions (smoke-friendly) */}
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {actions.map((a, idx) => {
                        const variant = buttonVariantForMetaKind(a.kind as any);
                        return (
                          <Button
                            key={`${n.id}-action-${idx}`}
                            size="sm"
                            variant={variant}
                            label={a.label}
                            onPress={() => {
                              void markRead(n.id);
                              router.push(a.deepLink as any);
                            }}
                          />
                        );
                      })}

                      <Button
                        size="sm"
                        label={isUnread ? 'Marcar leído' : 'Marcar sin leer'}
                        onPress={() => void toggleRead(n.id)}
                      />

                      <Button
                        size="sm"
                        label="Eliminar"
                        onPress={() => void remove(n.id)}
                      />
                    </View>
                  </Card>
                );
              })}
            </View>
          )}
        </Content>
      </ScrollView>
    </Screen>
  );
}
