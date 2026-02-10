import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useReservasStore } from '@/features/reservas';
import {
  AppHeader,
  Button,
  Card,
  Content,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Section,
} from '@/ui';

function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default function ReservasIndex() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    spaceId?: string | string[];
    bookingId?: string | string[];
  }>();

  const deepLinkSpaceId = firstParam(params.spaceId) ?? null;
  const deepLinkBookingId = firstParam(params.bookingId) ?? null;

  const userId = useSessionStore((s) => s.session?.userId) ?? 'unknown';
  const role = useSessionStore((s) => s.session?.role ?? null);

  const status = useReservasStore((s) => s.status);
  const config = useReservasStore((s) => s.config);
  const spaces = useReservasStore((s) => s.spaces);
  const bookings = useReservasStore((s) => s.bookings);
  const selectedSpaceId = useReservasStore((s) => s.selectedSpaceId);

  const hydrate = useReservasStore((s) => s.hydrate);
  const selectSpace = useReservasStore((s) => s.selectSpace);
  const createMockBooking = useReservasStore((s) => s.createMockBooking);

  const bookingStartISO = useReservasStore((s) => s.bookingStartISO);
  const durationMinutes = useReservasStore((s) => s.durationMinutes);
  const setBookingStartISO = useReservasStore((s) => s.setBookingStartISO);
  const setDurationMinutes = useReservasStore((s) => s.setDurationMinutes);

  const cancelBooking = useReservasStore((s) => s.cancelBooking);
  const isSpaceOccupied = useReservasStore((s) => s.isSpaceOccupied);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Deep-link: al estar ready y existir spaceId, selecciona el espacio
  useEffect(() => {
    if (status !== 'ready') return;
    if (!deepLinkSpaceId) return;

    const exists = spaces.some((s) => s.id === deepLinkSpaceId);
    if (!exists) return;

    selectSpace(deepLinkSpaceId);
  }, [deepLinkSpaceId, selectSpace, spaces, status]);

  const selectedBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.spaceId === selectedSpaceId).length;
  }, [bookings, selectedSpaceId]);

  const myBookingsCount = useMemo(() => {
    return bookings.filter((b) => b.userId === userId).length;
  }, [bookings, userId]);

  const myBookings = useMemo(() => {
    return bookings.filter((b) => b.userId === userId).slice(0, 5);
  }, [bookings, userId]);

  const areasById = useMemo(() => {
    return new Map(config?.areas.map((a) => [a.id, a.name]) ?? []);
  }, [config?.areas]);

  const grouped = useMemo(() => {
    return spaces.reduce<Record<string, typeof spaces>>((acc, s) => {
      const areaName = areasById.get(s.areaId) ?? 'Sin área';
      const key = `${areaName} / ${s.type}`;
      acc[key] = acc[key] ? [...acc[key], s] : [s];
      return acc;
    }, {});
  }, [areasById, spaces]);

  const openedFromNotification = Boolean(deepLinkSpaceId || deepLinkBookingId);

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-5">
        <Content className="gap-5">
          <AppHeader
            title="Reservas"
            subtitle={`${myBookingsCount} mías • ${bookings.length} total`}
            right={
              role === 'admin' ? (
                <Button
                  size="sm"
                  variant="secondary"
                  label="Admin"
                  onPress={() => router.push('/(admin)/space-builder')}
                />
              ) : null
            }
          />

          {openedFromNotification ? (
            <Card className="gap-1">
              <Text className="text-xs text-neutral-700">
                Abierto desde notificación
                {deepLinkSpaceId ? ` • spaceId: ${deepLinkSpaceId}` : ''}
                {deepLinkBookingId ? ` • bookingId: ${deepLinkBookingId}` : ''}
              </Text>
            </Card>
          ) : null}

          {status === 'idle' || status === 'loading' ? (
            <LoadingState lines={4} />
          ) : status === 'error' ? (
            <ErrorState
              title="No se pudieron cargar las reservas"
              description="Revisa tu storage o vuelve a intentar."
              onRetry={() => void hydrate()}
            />
          ) : spaces.length === 0 ? (
            <EmptyState
              title="Aún no hay espacios configurados"
              description="Si eres admin, crea y guarda una configuración en Space Builder."
              actionLabel={role === 'admin' ? 'Ir a Space Builder' : undefined}
              onAction={
                role === 'admin'
                  ? () => {
                      router.push('/(admin)/space-builder');
                    }
                  : undefined
              }
            />
          ) : (
            <>
              <Section
                title="Horario"
                subtitle={`${new Date(bookingStartISO).toLocaleString()} • ${durationMinutes} min`}
                right={
                  <Text className="text-xs text-neutral-600">
                    {selectedBookingsCount} en este espacio
                  </Text>
                }
              >
                <View className="flex-row gap-2">
                  <Button
                    size="sm"
                    label="−15m"
                    onPress={() => {
                      const d = new Date(bookingStartISO);
                      d.setMinutes(d.getMinutes() - 15);
                      setBookingStartISO(d.toISOString());
                    }}
                  />
                  <Button
                    size="sm"
                    label="+15m"
                    onPress={() => {
                      const d = new Date(bookingStartISO);
                      d.setMinutes(d.getMinutes() + 15);
                      setBookingStartISO(d.toISOString());
                    }}
                  />
                  <Button
                    size="sm"
                    label={durationMinutes === 60 ? '60→30' : '30→60'}
                    onPress={() => setDurationMinutes(durationMinutes === 60 ? 30 : 60)}
                  />
                </View>
              </Section>

              <Section title="Mis reservas" subtitle="Últimas 5">
                {myBookings.length === 0 ? (
                  <Card>
                    <Text className="text-xs text-neutral-600">
                      No tienes reservas todavía.
                    </Text>
                  </Card>
                ) : (
                  <View className="gap-2">
                    {myBookings.map((b) => (
                      <Card key={b.id} className="gap-2">
                        <View className="flex-row items-start justify-between gap-3">
                          <View className="flex-1">
                            <Text className="text-sm text-neutral-900">{b.spaceId}</Text>
                            <Text className="text-xs text-neutral-600 mt-0.5">
                              {new Date(b.startISO).toLocaleString()} • {b.status}
                            </Text>
                          </View>
                          {b.status === 'active' ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              label="Cancelar"
                              onPress={() => void cancelBooking(b.id)}
                            />
                          ) : null}
                        </View>
                      </Card>
                    ))}
                  </View>
                )}
              </Section>

              <Section
                title="Espacios"
                subtitle={`Seleccionado: ${selectedSpaceId ?? '-'}`}
              >
                <View className="gap-3">
                  {Object.entries(grouped).map(([groupKey, list]) => (
                    <View key={groupKey} className="gap-2">
                      <Text className="text-xs font-semibold text-neutral-700">
                        {groupKey}
                      </Text>

                      <View className="gap-2">
                        {list.map((s) => {
                          const occupied = isSpaceOccupied(s.id);
                          const isSelected = selectedSpaceId === s.id;

                          return (
                            <Pressable
                              key={s.id}
                              className={[
                                'rounded-2xl px-4 py-3',
                                isSelected
                                  ? 'bg-black'
                                  : occupied
                                    ? 'bg-neutral-200'
                                    : 'bg-neutral-100',
                              ].join(' ')}
                              onPress={() => selectSpace(s.id)}
                            >
                              <View className="flex-row items-center justify-between gap-3">
                                <View className="flex-1">
                                  <Text
                                    className={[
                                      'text-sm',
                                      isSelected ? 'text-white' : 'text-neutral-900',
                                    ].join(' ')}
                                  >
                                    {s.name}
                                  </Text>
                                  <Text
                                    className={[
                                      'text-xs mt-0.5',
                                      isSelected
                                        ? 'text-neutral-200'
                                        : 'text-neutral-600',
                                    ].join(' ')}
                                  >
                                    {s.type}
                                    {occupied ? ' • Ocupado' : ''}
                                  </Text>
                                </View>

                                {isSelected ? (
                                  <View className="rounded-full bg-white/15 px-2 py-1">
                                    <Text className="text-[10px] text-white">
                                      Seleccionado
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </Section>

              <Button
                variant="primary"
                size="lg"
                label="Crear reserva (mock)"
                onPress={() => void createMockBooking(userId)}
              />
            </>
          )}
        </Content>
      </ScrollView>
    </Screen>
  );
}
