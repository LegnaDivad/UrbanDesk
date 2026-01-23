import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useInventarioStore } from '@/features/inventario';

export default function InventarioIndex() {
  const status = useInventarioStore((s) => s.status);
  const items = useInventarioStore((s) => s.items);
  const hydrate = useInventarioStore((s) => s.hydrate);
  const addMockItem = useInventarioStore((s) => s.addMockItem);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <View className="flex-1 justify-center px-6 gap-3">
      <Text className="text-base">Inventario (foundation)</Text>
      <Text className="text-sm">status: {status}</Text>
      <Text className="text-sm">items: {items.length}</Text>

      <Pressable className="rounded-xl bg-black px-4 py-3" onPress={() => void addMockItem()}>
        <Text className="text-white text-center">Agregar item mock</Text>
      </Pressable>
    </View>
  );
}
