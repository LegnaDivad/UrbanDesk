import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useReservasStore } from '@/features/reservas';

export default function ReservasIndex() {
  const userId = useSessionStore((s) => s.session?.userId) ?? 'unknown';

  const status = useReservasStore((s) => s.status);
  const config = useReservasStore((s) => s.config);
  const spaces = useReservasStore((s) => s.spaces);
  const bookings = useReservasStore((s) => s.bookings);
  const selectedSpaceId = useReservasStore((s) => s.selectedSpaceId);
  const selectedBookingsCount = bookings.filter(
    (b) => b.spaceId === selectedSpaceId,
  ).length;
  const myBookingsCount = bookings.filter((b) => b.userId === userId).length;

  const hydrate = useReservasStore((s) => s.hydrate);
  const selectSpace = useReservasStore((s) => s.selectSpace);
  const createMockBooking = useReservasStore((s) => s.createMockBooking);
  const bookingStartISO = useReservasStore((s) => s.bookingStartISO);
  const durationMinutes = useReservasStore((s) => s.durationMinutes);
  const setBookingStartISO = useReservasStore((s) => s.setBookingStartISO);
  const setDurationMinutes = useReservasStore((s) => s.setDurationMinutes);
  const cancelBooking = useReservasStore((s) => s.cancelBooking);
  const isSpaceOccupied = useReservasStore((s) => s.isSpaceOccupied);

  const myBookings = bookings.filter((b) => b.userId === userId).slice(0, 5);

  const areasById = new Map(config?.areas.map((a) => [a.id, a.name]) ?? []);

  const router = useRouter();
  const role = useSessionStore((s) => s.session?.role ?? null);

  const grouped = spaces.reduce<Record<string, typeof spaces>>((acc, s) => {
    const areaName = areasById.get(s.areaId) ?? 'Sin área';
    const key = `${areaName} / ${s.type}`;
    acc[key] = acc[key] ? [...acc[key], s] : [s];
    return acc;
  }, {});

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (status === 'loading') return null;

  return (
    <View className="flex-1 justify-center px-6 gap-3">
      <Text className="text-base">Reservas (MVP)</Text>
      <Text className="text-sm">status: {status}</Text>
      <Text className="text-sm">workspace config: {config ? 'present' : 'missing'}</Text>

      <Text className="text-sm">spaces: {spaces.length}</Text>
      <Text className="text-sm">bookings: {bookings.length}</Text>

      {spaces.length > 0 ? (
        <>
          <Text className="text-sm">selected: {selectedSpaceId}</Text>

          <View className="gap-2">
            <Text className="text-sm">bookings (total): {bookings.length}</Text>
            <Text className="text-sm">
              bookings (selected space): {selectedBookingsCount}
            </Text>
            <Text className="text-sm">bookings (mine): {myBookingsCount}</Text>
            <Text className="text-sm">Mis reservas (últimas 5): {myBookings.length}</Text>
            <Text className="text-sm">
              start: {new Date(bookingStartISO).toLocaleString()}
            </Text>
            <Text className="text-sm">duration: {durationMinutes} min</Text>

            <View className="flex-row gap-2">
              <Pressable
                className="rounded-xl bg-neutral-200 px-4 py-3"
                onPress={() => {
                  const d = new Date(bookingStartISO);
                  d.setMinutes(d.getMinutes() - 15);
                  setBookingStartISO(d.toISOString());
                }}
              >
                <Text>−15m</Text>
              </Pressable>

              <Pressable
                className="rounded-xl bg-neutral-200 px-4 py-3"
                onPress={() => {
                  const d = new Date(bookingStartISO);
                  d.setMinutes(d.getMinutes() + 15);
                  setBookingStartISO(d.toISOString());
                }}
              >
                <Text>+15m</Text>
              </Pressable>

              <Pressable
                className="rounded-xl bg-neutral-200 px-4 py-3"
                onPress={() => setDurationMinutes(durationMinutes === 60 ? 30 : 60)}
              >
                <Text>{durationMinutes === 60 ? '60→30' : '30→60'}</Text>
              </Pressable>
            </View>

            {myBookings.map((b) => (
              <View key={b.id} className="flex-row items-center justify-between">
                <Text className="text-xs">
                  {b.spaceId} • {new Date(b.startISO).toLocaleString()}
                </Text>

                <Pressable
                  className="rounded-lg bg-neutral-200 px-3 py-2"
                  onPress={() => void cancelBooking(b.id)}
                >
                  <Text className="text-xs">Cancelar</Text>
                </Pressable>
              </View>
            ))}

            {Object.entries(grouped).map(([groupKey, list]) => (
              <View key={groupKey} className="gap-2">
                <Text className="text-sm">{groupKey}</Text>

                {list.map((s) => {
                  const occupied = isSpaceOccupied(s.id);

                  return (
                    <Pressable
                      key={s.id}
                      className={`rounded-xl px-4 py-3 ${
                        selectedSpaceId === s.id
                          ? 'bg-black'
                          : occupied
                            ? 'bg-neutral-300'
                            : 'bg-neutral-200'
                      }`}
                      onPress={() => selectSpace(s.id)}
                    >
                      <Text
                        className={`${selectedSpaceId === s.id ? 'text-white' : 'text-black'}`}
                      >
                        {s.name} ({s.type}) {occupied ? '• Ocupado' : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <Pressable
            className="rounded-xl bg-black px-4 py-3"
            onPress={() => void createMockBooking(userId)}
          >
            {role === 'admin' ? (
              <Pressable
                className="rounded-xl bg-neutral-200 px-4 py-3"
                onPress={() => router.push('/(admin)/space-builder')}
              >
                <Text className="text-center">Ir a Space Builder (Admin)</Text>
              </Pressable>
            ) : null}

            <Text className="text-white text-center">Crear reserva mock (1h)</Text>
          </Pressable>
        </>
      ) : (
        <Text className="text-sm">
          No hay espacios. Entra como admin y crea/guarda una config default en Space
          Builder.
        </Text>
      )}
    </View>
  );
}
