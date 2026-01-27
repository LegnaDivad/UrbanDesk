import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useInventoryStore } from '@/features/inventory';

export default function InventoryIndex() {
  const userId = useSessionStore((s) => s.session?.userId) ?? 'unknown';

  // Store state
  const status = useInventoryStore((s) => s.status);
  const assets = useInventoryStore((s) => s.assets);
  const loans = useInventoryStore((s) => s.loans);

  // Store actions
  const hydrate = useInventoryStore((s) => s.hydrate);
  const seedMockAssets = useInventoryStore((s) => s.seedMockAssets);
  const createMockLoan = useInventoryStore((s) => s.createMockLoan);
  const returnLoan = useInventoryStore((s) => s.returnLoan);

  // Store selectors (NO useMemo aquí)
  const getActiveLoanForAsset = useInventoryStore((s) => s.getActiveLoanForAsset);

  // UI filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Filter options derived from assets
  const categoryOptions = useMemo(() => {
    const set = new Set<string>(assets.map((a) => a.category));
    return ['all', ...Array.from(set)];
  }, [assets]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>(assets.map((a) => a.status));
    return ['all', ...Array.from(set)];
  }, [assets]);

  // Filtered assets derived from assets + UI filter state
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const byCat = categoryFilter === 'all' || a.category === categoryFilter;
      const byStatus = statusFilter === 'all' || a.status === statusFilter;
      return byCat && byStatus;
    });
  }, [assets, categoryFilter, statusFilter]);

  // User loans (all + active)
  const myLoans = useMemo(() => loans.filter((l) => l.userId === userId), [loans, userId]);

  const myActiveLoans = useMemo(
    () => loans.filter((l) => l.userId === userId && l.status === 'active'),
    [loans, userId],
  );

  const lastMyActiveLoanId = myActiveLoans[0]?.id ?? null;

  return (
    <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-4">
      <Text className="text-base">Inventario (MVP)</Text>
      <Text className="text-sm">status: {status}</Text>

      <View className="gap-1">
        <Text className="text-sm">assets: {assets.length}</Text>
        <Text className="text-sm">loans: {loans.length}</Text>
        <Text className="text-sm">my loans: {myLoans.length}</Text>
        <Text className="text-sm">my active loans: {myActiveLoans.length}</Text>
      </View>

      {/* Actions */}
      <View className="gap-2">
        <Pressable
          className="rounded-xl bg-neutral-200 px-4 py-3"
          onPress={() => void seedMockAssets()}
        >
          <Text className="text-center">Seed mock assets</Text>
        </Pressable>

        <Pressable
          className="rounded-xl bg-black px-4 py-3"
          onPress={() => void createMockLoan(userId)}
        >
          <Text className="text-white text-center">Crear préstamo mock</Text>
        </Pressable>

        <Pressable
          className={`rounded-xl px-4 py-3 ${lastMyActiveLoanId ? 'bg-neutral-200' : 'bg-neutral-100'}`}
          disabled={!lastMyActiveLoanId}
          onPress={() => lastMyActiveLoanId && void returnLoan(lastMyActiveLoanId)}
        >
          <Text className="text-center">Regresar mi último préstamo activo</Text>
        </Pressable>
      </View>

      {/* Filters */}
      <View className="gap-2">
        <Text className="text-sm">Filtro categoría</Text>
        <View className="flex-row flex-wrap gap-2">
          {categoryOptions.map((opt) => (
            <Pressable
              key={opt}
              className={`rounded-full px-3 py-2 ${categoryFilter === opt ? 'bg-black' : 'bg-neutral-200'}`}
              onPress={() => setCategoryFilter(opt)}
            >
              <Text className={`${categoryFilter === opt ? 'text-white' : 'text-black'}`}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="gap-2">
        <Text className="text-sm">Filtro status</Text>
        <View className="flex-row flex-wrap gap-2">
          {statusOptions.map((opt) => (
            <Pressable
              key={opt}
              className={`rounded-full px-3 py-2 ${statusFilter === opt ? 'bg-black' : 'bg-neutral-200'}`}
              onPress={() => setStatusFilter(opt)}
            >
              <Text className={`${statusFilter === opt ? 'text-white' : 'text-black'}`}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Assets list with active loan info */}
      <View className="gap-2">
        <Text className="text-sm">Assets</Text>

        {filteredAssets.map((a) => {
          const activeLoan = getActiveLoanForAsset(a.id);

          return (
            <View key={a.id} className="rounded-xl bg-neutral-100 px-4 py-3 gap-1">
              <Text className="text-sm">{a.name}</Text>
              <Text className="text-xs text-neutral-600">
                {a.category} • {a.status}
              </Text>

              {activeLoan ? (
                <Text className="text-xs text-neutral-600">
                  Prestado a: {activeLoan.userId} •{' '}
                  {new Date(activeLoan.startISO).toLocaleString()}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>

      {/* Loans list (debug / MVP) */}
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
