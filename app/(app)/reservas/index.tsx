import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { useReservasStore } from '@/features/reservas';

export default function ReservasIndex() {
  const status = useReservasStore((s) => s.status);
  const config = useReservasStore((s) => s.config);
  const hydrate = useReservasStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View className="flex-1 justify-center px-6 gap-2">
      <Text className="text-base">Reservas (foundation)</Text>
      <Text className="text-sm">status: {status}</Text>
      <Text className="text-sm">workspace config: {config ? 'present' : 'missing'}</Text>
    </View>
  );
}
