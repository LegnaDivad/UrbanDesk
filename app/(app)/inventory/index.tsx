import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useInventoryStore } from '@/features/inventory';

export default function InventoryIndex() {
  const userId = useSessionStore((s) => s.session?.userId) ?? 'unknown';

  const status = useInventoryStore((s) => s.status);
  const assets = useInventoryStore((s) => s.assets);
  const loans = useInventoryStore((s) => s.loans);

  const hydrate = useInventoryStore((s) => s.hydrate);
  const seedMockAssets = useInventoryStore((s) => s.seedMockAssets);
  const createMockLoan = useInventoryStore((s) => s.createMockLoan);
  const returnLoan = useInventoryStore((s) => s.returnLoan);

  const [assetStatusFilter, setAssetStatusFilter] = useState<string>('all');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>(assets.map((a) => a.status));
    return ['all', ...Array.from(set)];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    if (assetStatusFilter === 'all') return assets;
    return assets.filter((a) => a.status === assetStatusFilter);
  }, [assets, assetStatusFilter]);

  const myLoans = useMemo(() => loans.filter((l) => l.userId === userId), [loans, userId]);

  const lastMyLoanId = myLoans[0]?.id ?? null;

  return (
    <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-4">
      <Text className="text-base">Inventario (MVP)</Text>
      <Text className="text-sm">status: {status}</Text>

      <View className="gap-1">
        <Text className="text-sm">assets: {assets.length}</Text>
        <Text className="text-sm">loans: {loans.length}</Text>
        <Text className="text-sm">my loans: {myLoans.length}</Text>
      </View>

      <View className="gap-2">
        <Pressable className="rounded-xl bg-neutral-200 px-4 py-3" onPress={() => seedMockAssets()}>
          <Text className="text-center">Seed mock assets</Text>
        </Pressable>

        <Pressable className="rounded-xl bg-black px-4 py-3" onPress={() => void createMockLoan(userId)}>
          <Text className="text-white text-center">Crear préstamo mock</Text>
        </Pressable>

        <Pressable
          className={`rounded-xl px-4 py-3 ${lastMyLoanId ? 'bg-neutral-200' : 'bg-neutral-100'}`}
          disabled={!lastMyLoanId}
          onPress={() => lastMyLoanId && void returnLoan(lastMyLoanId)}
        >
          <Text className="text-center">Regresar mi último préstamo</Text>
        </Pressable>
      </View>

      <View className="gap-2">
        <Text className="text-sm">Filtro asset.status</Text>
        <View className="flex-row flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <Pressable
              key={opt}
              className={`rounded-full px-3 py-2 ${assetStatusFilter === opt ? 'bg-black' : 'bg-neutral-200'}`}
              onPress={() => setAssetStatusFilter(opt)}
            >
              <Text className={`${assetStatusFilter === opt ? 'text-white' : 'text-black'}`}>{opt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm">Assets</Text>
        {filteredAssets.map((a) => (
          <View key={a.id} className="rounded-xl bg-neutral-100 px-4 py-3">
            <Text className="text-sm">{a.name}</Text>
            <Text className="text-xs text-neutral-600">
              {a.category} • {a.status}
            </Text>
          </View>
        ))}
      </View>

      <View className="gap-2">
        <Text className="text-sm">Loans</Text>
        {loans.slice(0, 10).map((l) => (
          <View key={l.id} className="rounded-xl bg-neutral-100 px-4 py-3">
            <Text className="text-xs">
              {l.assetId} • {l.userId}
            </Text>
            <Text className="text-xs text-neutral-600">
              {l.status} • {new Date(l.startISO).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
