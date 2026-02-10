import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSessionStore } from '@/features/auth';
import { useInventoryStore } from '@/features/inventory';
import {
  AppHeader,
  Button,
  Card,
  Chip,
  Content,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  Section,
} from '@/ui';

export default function InventoryIndex() {
  const router = useRouter();
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
  const myActiveLoans = useMemo(
    () => loans.filter((l) => l.userId === userId && l.status === 'active'),
    [loans, userId],
  );

  const lastMyActiveLoanId = myActiveLoans[0]?.id ?? null;

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-5">
        <Content className="gap-5">
          <AppHeader
            title="Inventario"
            subtitle={`${assets.length} activos • ${myActiveLoans.length} préstamos activos míos`}
          />

          {status === 'idle' || status === 'loading' ? (
            <LoadingState lines={4} />
          ) : status === 'error' ? (
            <ErrorState
              title="No se pudo cargar inventario"
              description="Vuelve a intentar hidratar el módulo."
              onRetry={() => void hydrate()}
            />
          ) : assets.length === 0 ? (
            <EmptyState
              title="Aún no hay activos"
              description="Crea datos mock para empezar a probar el flujo."
              actionLabel="Seed mock assets"
              onAction={() => void seedMockAssets()}
            />
          ) : (
            <>
              <Section title="Acciones">
                <View className="gap-2">
                  <Button
                    label="Seed mock assets"
                    onPress={() => void seedMockAssets()}
                  />
                  <Button
                    variant="primary"
                    label="Crear préstamo (mock)"
                    onPress={() => void createMockLoan(userId)}
                  />
                  <Button
                    label="Devolver mi último préstamo activo"
                    disabled={!lastMyActiveLoanId}
                    onPress={() =>
                      lastMyActiveLoanId && void returnLoan(lastMyActiveLoanId)
                    }
                  />
                </View>
              </Section>

              <Section title="Filtros" subtitle="Refina por categoría y estado">
                <Card className="gap-3">
                  <View className="gap-2">
                    <Text className="text-xs font-semibold text-neutral-700">
                      Categoría
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {categoryOptions.map((opt) => (
                        <Chip
                          key={opt}
                          label={opt}
                          active={categoryFilter === opt}
                          onPress={() => setCategoryFilter(opt)}
                        />
                      ))}
                    </View>
                  </View>

                  <View className="gap-2">
                    <Text className="text-xs font-semibold text-neutral-700">Estado</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {statusOptions.map((opt) => (
                        <Chip
                          key={opt}
                          label={opt}
                          active={statusFilter === opt}
                          onPress={() => setStatusFilter(opt)}
                        />
                      ))}
                    </View>
                  </View>
                </Card>
              </Section>

              <Section
                title="Activos"
                subtitle={`${filteredAssets.length} de ${assets.length}`}
              >
                {filteredAssets.length === 0 ? (
                  <EmptyState
                    title="Sin resultados"
                    description="Ajusta los filtros para ver activos."
                  />
                ) : (
                  <View className="gap-2">
                    {filteredAssets.map((a) => {
                      const activeLoan = getActiveLoanForAsset(a.id);

                      return (
                        <Pressable
                          key={a.id}
                          className="rounded-2xl bg-neutral-100 px-4 py-3 gap-1"
                          onPress={() =>
                            router.push({
                              pathname: '/(app)/inventory/[assetId]',
                              params: { assetId: a.id },
                            })
                          }
                        >
                          <View className="flex-row items-start justify-between gap-3">
                            <View className="flex-1">
                              <Text className="text-sm text-neutral-900">{a.name}</Text>
                              <Text className="text-xs text-neutral-600 mt-0.5">
                                {a.category} • {a.status}
                              </Text>
                            </View>
                            <Text className="text-xs text-neutral-700">›</Text>
                          </View>

                          {activeLoan ? (
                            <Text className="text-xs text-neutral-600 mt-1">
                              Prestado a: {activeLoan.userId} •{' '}
                              {new Date(activeLoan.startISO).toLocaleString()}
                            </Text>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </Section>

              <Section title="Préstamos" subtitle="Debug (últimos 10)">
                <View className="gap-2">
                  {loans.slice(0, 10).map((l) => (
                    <Card key={l.id} className="px-4 py-3">
                      <Text className="text-xs text-neutral-900">
                        {l.assetId} • {l.userId}
                      </Text>
                      <Text className="text-xs text-neutral-600 mt-0.5">
                        {l.status} • {new Date(l.startISO).toLocaleString()}
                      </Text>
                    </Card>
                  ))}
                </View>
              </Section>
            </>
          )}
        </Content>
      </ScrollView>
    </Screen>
  );
}
