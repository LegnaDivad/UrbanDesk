import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useInventoryStore } from '@/features/inventory';
import { useNotificationsStore } from '@/features/notifications';
import type {
  AppNotification,
  NotificationPayload,
} from '@/features/notifications/domain/notifications.types';
import { useReservasStore } from '@/features/reservas';
import { Screen } from '@/ui/components/Screen';

type RouteTarget =
  | { pathname: '/(app)/reservas' }
  | { pathname: '/(app)/inventory/[assetId]'; params: { assetId: string } };

function routeForPayload(payload: NotificationPayload): RouteTarget | null {
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

type ActionTone = 'primary' | 'neutral' | 'danger';

function actionClasses(tone: ActionTone): { bg: string; fg: string } {
  if (tone === 'primary') return { bg: 'bg-black', fg: 'text-white' };
  if (tone === 'danger') return { bg: 'bg-neutral-700', fg: 'text-white' };
  return { bg: 'bg-neutral-200', fg: 'text-black' };
}

function primaryLabelForPayload(payload: NotificationPayload): string {
  switch (payload.kind) {
    case 'booking_created':
    case 'booking_cancelled':
      return 'Ver reservas';
    case 'loan_created':
    case 'loan_returned':
      return 'Ver asset';
    default:
      return 'Abrir';
  }
}

export default function NotificationsIndex() {
  const router = useRouter();

  const status = useNotificationsStore((s) => s.status);
  const items = useNotificationsStore((s) => s.items);

  const hydrate = useNotificationsStore((s) => s.hydrate);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markUnread = useNotificationsStore((s) => s.markUnread);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const clearAll = useNotificationsStore((s) => s.clearAll);

  const unread = useMemo(() => items.filter((n) => !n.readAtISO).length, [items]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const navigateToTarget = (target: RouteTarget) => {
    if (target.pathname === '/(app)/reservas') {
      router.push(target.pathname as any);
      return;
    }

    router.push({
      pathname: target.pathname as any,
      params: target.params,
    });
  };

  const onOpenNotification = async (n: AppNotification) => {
    await markRead(n.id);

    const target = routeForPayload(n.payload);
    if (target) navigateToTarget(target);
  };

  const onMarkReadOnly = async (n: AppNotification) => {
    await markRead(n.id);
  };

  const onMarkUnreadOnly = async (n: AppNotification) => {
    await markUnread(n.id);
  };

  const onCancelBookingFromNotification = async (
    n: AppNotification,
    payload: Extract<NotificationPayload, { kind: 'booking_created' }>,
  ) => {
    await markRead(n.id);

    try {
      await useReservasStore.getState().hydrate();
      await useReservasStore.getState().cancelBooking(payload.bookingId);
    } catch {
      await useNotificationsStore.getState().push({
        title: 'No se pudo cancelar',
        body: `Reserva: ${payload.bookingId}`,
        payload: { kind: 'system' },
      });
    }
  };

  const onReturnLoanFromNotification = async (
    n: AppNotification,
    payload: Extract<NotificationPayload, { kind: 'loan_created' }>,
  ) => {
    await markRead(n.id);

    try {
      await useInventoryStore.getState().hydrate();
      await useInventoryStore.getState().returnLoan(payload.loanId);
    } catch {
      await useNotificationsStore.getState().push({
        title: 'No se pudo devolver',
        body: `Préstamo: ${payload.loanId}`,
        payload: { kind: 'system' },
      });
    }
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
              className={`rounded-xl px-3 py-2 ${
                items.length ? 'bg-neutral-200' : 'bg-neutral-100'
              }`}
              disabled={!items.length}
              onPress={() => void markAllRead()}
            >
              <Text className="text-xs">Leer todo</Text>
            </Pressable>

            <Pressable
              className={`rounded-xl px-3 py-2 ${
                items.length ? 'bg-neutral-200' : 'bg-neutral-100'
              }`}
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
            {items.map((n) => {
              const isUnread = !n.readAtISO;
              const target = routeForPayload(n.payload);
              const hasNav = Boolean(target);

              const actions: {
                label: string;
                tone: ActionTone;
                onPress: () => void;
              }[] = [];

              if (hasNav) {
                actions.push({
                  label: primaryLabelForPayload(n.payload),
                  tone: 'primary',
                  onPress: () => void onOpenNotification(n),
                });
              }

              if (isUnread) {
                actions.push({
                  label: 'Marcar leída',
                  tone: 'neutral',
                  onPress: () => void onMarkReadOnly(n),
                });
              } else {
                actions.push({
                  label: 'Marcar no leída',
                  tone: 'neutral',
                  onPress: () => void onMarkUnreadOnly(n),
                });
              }

              if (n.payload.kind === 'booking_created') {
                const payload = n.payload;
                actions.push({
                  label: 'Cancelar',
                  tone: 'danger',
                  onPress: () => void onCancelBookingFromNotification(n, payload),
                });
              }

              if (n.payload.kind === 'loan_created') {
                const payload = n.payload;
                actions.push({
                  label: 'Devolver',
                  tone: 'neutral',
                  onPress: () => void onReturnLoanFromNotification(n, payload),
                });
              }

              return (
                <View
                  key={n.id}
                  className={`rounded-2xl px-4 py-3 ${
                    isUnread ? 'bg-neutral-200' : 'bg-neutral-100'
                  }`}
                >
                  <Pressable onPress={() => void onOpenNotification(n)}>
                    <View className="flex-row items-start justify-between gap-3">
                      <View className="flex-1">
                        <Text className={`text-sm ${isUnread ? 'font-semibold' : ''}`}>
                          {n.title}
                        </Text>

                        {n.body ? (
                          <Text className="text-xs text-neutral-700">{n.body}</Text>
                        ) : null}

                        <Text className="text-[10px] text-neutral-600 mt-1">
                          {new Date(n.createdAtISO).toLocaleString()}{' '}
                          {isUnread ? '• NUEVA' : ''}
                        </Text>
                      </View>

                      {hasNav ? (
                        <Text className="text-xs text-neutral-700">›</Text>
                      ) : null}
                    </View>
                  </Pressable>

                  {actions.length ? (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                      {actions.map((a, idx) => {
                        const { bg, fg } = actionClasses(a.tone);

                        return (
                          <Pressable
                            key={`${n.id}-action-${idx}`}
                            className={`rounded-xl px-3 py-2 ${bg}`}
                            onPress={a.onPress}
                          >
                            <Text className={`text-xs ${fg}`}>{a.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
