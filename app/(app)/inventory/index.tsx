import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useInventoryStore } from '@/features/inventory';

export default function InventoryIndex() {
  const userId = useSessionStore((s) => s.session?.userId) ?? 'unknown';

  const status = useInventoryStore((s) => s.status);
  const assets = useInventoryStore((s) => s.assets);
  const loans = useInventoryStore((s) => s.loans);

  const hydrate = useInventoryStore((s) => s.hydrate);
  const addMockAsset = useInventoryStore((s) => s.addMockAsset);
  const createMockLoan = useInventoryStore((s) => s.createMockLoan);
  const returnLoan = useInventoryStore((s) => s.returnLoan);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (status === 'loading') return null;

  return (
    <View className="flex-1 justify-center px-6 gap-3">
      <Text className="text-base">Inventario (MVP)</Text>
      <Text className="text-sm">status: {status}</Text>
      <Text className="text-sm">assets: {assets.length}</Text>
      <Text className="text-sm">loans: {loans.length}</Text>

      <Pressable className="rounded-xl bg-black px-4 py-3" onPress={() => void addMockAsset()}>
        <Text className="text-white text-center">Agregar asset mock</Text>
      </Pressable>

      <Pressable
        className="rounded-xl bg-black px-4 py-3"
        onPress={() => void createMockLoan(userId)}
      >
        <Text className="text-white text-center">Crear préstamo mock</Text>
      </Pressable>

      <Text className="text-sm mt-2">Préstamos activos:</Text>
      {loans
        .filter((l) => l.status === 'active')
        .slice(0, 5)
        .map((l) => (
          <View key={l.id} className="flex-row items-center justify-between">
            <Text className="text-xs">{l.assetId} • {l.userId}</Text>
            <Pressable
              className="rounded-lg bg-neutral-200 px-3 py-2"
              onPress={() => void returnLoan(l.id)}
            >
              <Text className="text-xs">Devolver</Text>
            </Pressable>
          </View>
        ))}
    </View>
  );
}
