import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useInventoryStore } from '@/features/inventory';
import { useNotificationsStore } from '@/features/notifications';
import type {
  AppNotification,
  NotificationPayload,
} from '@/features/notifications/domain/notifications.types';
import { useReservasStore } from '@/features/reservas';
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

function chipClasses(variant: 'neutral' | 'ok' | 'warn'): { bg: string; fg: string } {
  if (variant === 'ok') return { bg: 'bg-neutral-900', fg: 'text-white' };
  if (variant === 'warn') return { bg: 'bg-neutral-300', fg: 'text-black' };
  return { bg: 'bg-neutral-200', fg: 'text-black' };
}

export default function NotificationsIndex() {
  const router = useRouter();
  const userId = useSessionStore((s) => s.session?.userId) ?? 'unknown';

  // Notifications
  const nStatus = useNotificationsStore((s) => s.status);
  const items = useNotificationsStore((s) => s.items);
  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const toggleRead = useNotificationsStore((s) => s.toggleRead);
  const remove = useNotificationsStore((s) => s.remove);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  // Reservas
  const rStatus = useReservasStore((s) => s.status);
  const bookings = useReservasStore((s) => s.bookings);
  const hydrateReservas = useReservasStore((s) => s.hydrate);
  const createMockBooking = useReservasStore((s) => s.createMockBooking);
  const cancelBooking = useReservasStore((s) => s.cancelBooking);

  // Inventory
  const iStatus = useInventoryStore((s) => s.status);
  const assets = useInventoryStore((s) => s.assets);
  const loans = useInventoryStore((s) => s.loans);
  const hydrateInventory = useInventoryStore((s) => s.hydrate);
  const seedMockAssets = useInventoryStore((s) => s.seedMockAssets);
  const createMockLoan = useInventoryStore((s) => s.createMockLoan);
  const returnLoan = useInventoryStore((s) => s.returnLoan);

  const unread = useMemo(() => items.filter((n) => !n.readAtISO).length, [items]);

  const myActiveBookingId = useMemo(() => {
    const b = bookings.find((x) => x.userId === userId && x.status === 'active');
    return b?.id ?? null;
  }, [bookings, userId]);

  const myActiveLoanId = useMemo(() => {
    const l = loans.find((x) => x.userId === userId && x.status === 'active');
    return l?.id ?? null;
  }, [loans, userId]);

  const hydrateAll = async () => {
    await Promise.all([hydrateNotifications(), hydrateReservas(), hydrateInventory()]);
  };

  useEffect(() => {
    void hydrateAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const statusChip = (label: string, status: string) => {
    const variant = status === 'ready' ? 'ok' : status === 'error' ? 'warn' : 'neutral';
    const { bg, fg } = chipClasses(variant);

    return (
      <View className={`rounded-full px-3 py-1 ${bg}`} style={{ alignSelf: 'flex-start' }}>
        <Text className={`text-xs ${fg}`}>{label}: {status}</Text>
      </View>
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-4" contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <View
          className="flex-row items-center justify-between"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Text className="text-base">Notificaciones</Text>
            <Text className="text-xs text-neutral-600">
              {unread} sin leer • {items.length} total
            </Text>
          </View>

          <View className="flex-row gap-2" style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable
              className={`rounded-xl px-3 py-2 ${items.length ? 'bg-neutral-200' : 'bg-neutral-100'}`}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
              disabled={!items.length}
              onPress={() => void markAllRead()}
            >
              <Text className="text-xs">Leer todo</Text>
            </Pressable>

            <Pressable
              className={`rounded-xl px-3 py-2 ${items.length ? 'bg-neutral-200' : 'bg-neutral-100'}`}
              style={{ paddingHorizontal: 12, paddingVertical: 8 }}
              disabled={!items.length}
              onPress={() => void clearAll()}
            >
              <Text className="text-xs">Limpiar</Text>
            </Pressable>
          </View>
        </View>

        {/* Smoke Panel */}
        <View className="rounded-2xl bg-neutral-100 px-4 py-4 gap-3" style={{ padding: 16, gap: 12 }}>
          <View className="gap-1" style={{ gap: 4 }}>
            <Text className="text-sm">Smoke Panel</Text>
            <Text className="text-xs text-neutral-600">
              Genera eventos reales (reservas/préstamos) y valida deep-links + acciones.
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {statusChip('notif', nStatus)}
            {statusChip('reservas', rStatus)}
            {statusChip('inventory', iStatus)}
          </View>

          <View className="gap-2" style={{ gap: 8 }}>
            <Text className="text-xs text-neutral-600">
              assets: {assets.length} • loans: {loans.length} • myActiveLoan: {myActiveLoanId ? 'yes' : 'no'} • bookings: {bookings.length} • myActiveBooking: {myActiveBookingId ? 'yes' : 'no'}
            </Text>

            <View className="flex-row flex-wrap gap-2" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Pressable className="rounded-xl bg-neutral-200 px-3 py-2" style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => void hydrateAll()}>
                <Text className="text-xs">Refresh todo</Text>
              </Pressable>

              <Pressable className="rounded-xl bg-neutral-200 px-3 py-2" style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => void seedMockAssets()}>
                <Text className="text-xs">Seed assets</Text>
              </Pressable>

              <Pressable className="rounded-xl bg-black px-3 py-2" style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => void createMockLoan(userId)}>
                <Text className="text-xs text-white">+ Préstamo</Text>
              </Pressable>

              <Pressable
                className={`rounded-xl px-3 py-2 ${myActiveLoanId ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                disabled={!myActiveLoanId}
                onPress={() => myActiveLoanId && void returnLoan(myActiveLoanId)}
              >
                <Text className="text-xs">Devolver préstamo</Text>
              </Pressable>

              <Pressable className="rounded-xl bg-black px-3 py-2" style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => void createMockBooking(userId)}>
                <Text className="text-xs text-white">+ Reserva</Text>
              </Pressable>

              <Pressable
                className={`rounded-xl px-3 py-2 ${myActiveBookingId ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                disabled={!myActiveBookingId}
                onPress={() => myActiveBookingId && void cancelBooking(myActiveBookingId)}
              >
                <Text className="text-xs">Cancelar reserva</Text>
              </Pressable>

              <Pressable className="rounded-xl bg-neutral-200 px-3 py-2" style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/(app)/reservas')}>
                <Text className="text-xs">Ir a Reservas</Text>
              </Pressable>

              <Pressable className="rounded-xl bg-neutral-200 px-3 py-2" style={{ paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => router.push('/(app)/inventory')}>
                <Text className="text-xs">Ir a Inventario</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* List */}
        {nStatus === 'loading' ? (
          <Text className="text-sm">Cargando…</Text>
        ) : items.length === 0 ? (
          <View className="rounded-2xl bg-neutral-100 px-4 py-4" style={{ padding: 16 }}>
            <Text className="text-sm">No hay notificaciones todavía.</Text>
            <Text className="text-xs text-neutral-600">
              Usa el Smoke Panel para generar reservas/préstamos y validar navegación.
            </Text>
          </View>
        ) : (
          <View className="gap-2" style={{ gap: 8 }}>
            {items.map((n) => {
              const isUnread = !n.readAtISO;
              const deepLink = n.meta?.deepLink ?? null;
              const actions = n.meta?.actions ?? [];
              const fallback = fallbackRouteForPayload(n.payload);
              const hasNav = Boolean(deepLink || fallback);

              return (
                <View
                  key={n.id}
                  className={`rounded-2xl px-4 py-3 ${isUnread ? 'bg-neutral-200' : 'bg-neutral-100'}`}
                  style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                >
                  <Pressable onPress={() => onOpenNotification(n)}>
                    <View
                      className="flex-row items-start justify-between gap-3"
                      style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text className={`text-sm ${isUnread ? 'font-semibold' : ''}`}>
                          {n.title}
                        </Text>

                        {n.body ? <Text className="text-xs text-neutral-700">{n.body}</Text> : null}

                        <View
                          className="flex-row flex-wrap gap-2 mt-2"
                          style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}
                        >
                          <View className="rounded-full bg-neutral-300 px-2 py-1" style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Text className="text-[10px] text-neutral-700">{n.payload.kind}</Text>
                          </View>

                          <View className="rounded-full bg-neutral-300 px-2 py-1" style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                            <Text className="text-[10px] text-neutral-700">
                              {new Date(n.createdAtISO).toLocaleString()}
                            </Text>
                          </View>

                          {isUnread ? (
                            <View className="rounded-full bg-neutral-900 px-2 py-1" style={{ paddingHorizontal: 8, paddingVertical: 4 }}>
                              <Text className="text-[10px] text-white">NUEVA</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {hasNav ? <Text className="text-xs text-neutral-700">›</Text> : null}
                    </View>
                  </Pressable>

                  <View
                    className="flex-row flex-wrap gap-2 mt-3"
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}
                  >
                    <Pressable
                      className="rounded-xl bg-neutral-200 px-3 py-2"
                      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                      onPress={() => void toggleRead(n.id)}
                    >
                      <Text className="text-xs">{isUnread ? 'Marcar leída' : 'Marcar no leída'}</Text>
                    </Pressable>

                    <Pressable
                      className="rounded-xl bg-neutral-200 px-3 py-2"
                      style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                      onPress={() => void remove(n.id)}
                    >
                      <Text className="text-xs">Eliminar</Text>
                    </Pressable>

                    {actions.map((a, idx) => {
                      const { bg, fg } = actionClasses(a.kind);

                      return (
                        <Pressable
                          key={`${n.id}-action-${idx}`}
                          className={`rounded-xl px-3 py-2 ${bg}`}
                          style={{ paddingHorizontal: 12, paddingVertical: 8 }}
                          onPress={() => {
                            void markRead(n.id);
                            router.push(a.deepLink as any);
                          }}
                        >
                          <Text className={`text-xs ${fg}`}>{a.label}</Text>
                        </Pressable>
                      );
                    })}
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
