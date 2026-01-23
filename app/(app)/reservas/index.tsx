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
  const selectedBookingsCount = bookings.filter((b) => b.spaceId === selectedSpaceId).length;
  const myBookingsCount = bookings.filter((b) => b.userId === userId).length;

  const hydrate = useReservasStore((s) => s.hydrate);
  const selectSpace = useReservasStore((s) => s.selectSpace);
  const createMockBooking = useReservasStore((s) => s.createMockBooking);

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
            <Text className="text-sm">bookings (selected space): {selectedBookingsCount}</Text>
            <Text className="text-sm">bookings (mine): {myBookingsCount}</Text>

            {spaces.slice(0, 4).map((s) => (
              <Pressable
                key={s.id}
                className={`rounded-xl px-4 py-3 ${selectedSpaceId === s.id ? 'bg-black' : 'bg-neutral-200'}`}
                onPress={() => selectSpace(s.id)}
              >
                <Text className={`${selectedSpaceId === s.id ? 'text-white' : 'text-black'}`}>
                  {s.name} ({s.type})
                </Text>
              </Pressable>
              
            ))}
          </View>

          <Pressable
            className="rounded-xl bg-black px-4 py-3"
            onPress={() => void createMockBooking(userId)}
          >
            <Text className="text-white text-center">Crear reserva mock (1h)</Text>
          </Pressable>
        </>
      ) : (
        <Text className="text-sm">
          No hay espacios. Entra como admin y crea/guarda una config default en Space Builder.
        </Text>
        
      )}
    </View>
  );
}
