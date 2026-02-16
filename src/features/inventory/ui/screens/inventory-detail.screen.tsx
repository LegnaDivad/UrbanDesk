import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useInventoryStore } from '@/features/inventory/state/inventory.store';
import { AppHeader, Button, Card, Content, Screen } from '@/ui';
import { useSafeBack } from '@/ui/navigation/useSafeBack';

type Props = { assetId: string };

function fmt(iso: string | null) {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function InventoryDetailScreen({ assetId }: Props) {
  const safeBack = useSafeBack({ fallbackHref: '/(app)/inventory' });
  const [userId] = useState('user-mock'); // TODO: reemplazar por session.userId cuando exista

  const status = useInventoryStore((s) => s.status);
  const hydrate = useInventoryStore((s) => s.hydrate);
  const seedMockAssets = useInventoryStore((s) => s.seedMockAssets);

  const getAssetById = useInventoryStore((s) => s.getAssetById);
  const getActiveLoanForAsset = useInventoryStore((s) => s.getActiveLoanForAsset);
  const getLoansForAsset = useInventoryStore((s) => s.getLoansForAsset);

  const createMockLoanForAsset = useInventoryStore((s) => s.createMockLoanForAsset);
  const returnLoan = useInventoryStore((s) => s.returnLoan);

  useEffect(() => {
    // asegura que en móvil/web siempre haya estado hidratado
    void hydrate().then(() => seedMockAssets());
  }, [hydrate, seedMockAssets]);

  const asset = getAssetById(assetId);
  const activeLoan = getActiveLoanForAsset(assetId);

  const history = useMemo(() => {
    const list = getLoansForAsset(assetId);
    // ordenar newest first por startISO
    return [...list].sort((a, b) => (a.startISO < b.startISO ? 1 : -1));
  }, [assetId, getLoansForAsset]);

  const onBack = safeBack;

  if (!assetId) {
    return (
      <Screen className="px-6">
        <Content className="flex-1 justify-center gap-3">
          <Card>
            <Text className="text-base text-neutral-900">Asset inválido</Text>
            <Text className="text-xs text-neutral-600 mt-1">
              No se pudo leer el identificador del activo.
            </Text>
          </Card>
          <Button variant="primary" label="Volver" onPress={onBack} />
        </Content>
      </Screen>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <Screen className="px-6">
        <Content className="flex-1 justify-center">
          <Card>
            <Text className="text-base text-neutral-900">Cargando…</Text>
            <Text className="text-xs text-neutral-600 mt-1">
              Preparando detalle del activo.
            </Text>
          </Card>
        </Content>
      </Screen>
    );
  }

  if (!asset) {
    return (
      <Screen className="px-6">
        <Content className="flex-1 justify-center gap-3">
          <Card>
            <Text className="text-base text-neutral-900">No se encontró el activo</Text>
            <Text className="text-xs text-neutral-600 mt-1">
              Revisa si el activo existe en storage.
            </Text>
          </Card>
          <Button variant="primary" label="Volver" onPress={onBack} />
        </Content>
      </Screen>
    );
  }

  const isAvailable = asset.status === 'available';
  const statusPill = isAvailable ? 'bg-emerald-100' : 'bg-amber-100';
  const statusText = isAvailable ? 'Disponible' : 'Prestado';

  return (
    <Screen>
      <ScrollView contentContainerClassName="flex-grow px-6 py-6">
        <Content className="gap-5">
          <AppHeader title="Detalle de activo" subtitle={asset.id} onBack={onBack} />

          <Card className="gap-2">
            <View className="flex-row items-center justify-between gap-3">
              <Text className="text-base font-semibold text-neutral-900 flex-1">
                {asset.name}
              </Text>
              <View className={`rounded-full px-3 py-1 ${statusPill}`}>
                <Text className="text-xs">{statusText}</Text>
              </View>
            </View>

            <Text className="text-sm text-neutral-700">Categoría: {asset.category}</Text>
            <Text className="text-xs text-neutral-600">
              Tags: {asset.tags?.length ? asset.tags.join(', ') : '-'}
            </Text>
          </Card>

          <Card className="gap-2">
            <Text className="text-sm font-semibold text-neutral-900">
              Préstamo activo
            </Text>
            {activeLoan ? (
              <>
                <Text className="text-xs text-neutral-600">loanId: {activeLoan.id}</Text>
                <Text className="text-xs text-neutral-600">
                  userId: {activeLoan.userId}
                </Text>
                <Text className="text-xs text-neutral-600">
                  inicio: {fmt(activeLoan.startISO)}
                </Text>
              </>
            ) : (
              <Text className="text-xs text-neutral-600">No hay préstamo activo.</Text>
            )}
          </Card>

          {isAvailable ? (
            <Button
              variant="primary"
              size="lg"
              label="Prestar (mock)"
              onPress={() => void createMockLoanForAsset(asset.id, userId)}
            />
          ) : (
            <Button
              variant="primary"
              size="lg"
              label="Devolver"
              disabled={!activeLoan}
              onPress={() => {
                if (!activeLoan) return;
                void returnLoan(activeLoan.id);
              }}
            />
          )}

          <View className="gap-2">
            <Text className="text-sm font-semibold text-neutral-900">Historial</Text>
            {history.length === 0 ? (
              <Text className="text-xs text-neutral-600">Sin registros.</Text>
            ) : (
              <View className="gap-2">
                {history.map((l) => (
                  <Card key={l.id} className="px-4 py-3">
                    <Text className="text-xs text-neutral-600">loanId: {l.id}</Text>
                    <Text className="text-xs text-neutral-600">status: {l.status}</Text>
                    <Text className="text-xs text-neutral-600">
                      inicio: {fmt(l.startISO)}
                    </Text>
                    <Text className="text-xs text-neutral-600">fin: {fmt(l.endISO)}</Text>
                  </Card>
                ))}
              </View>
            )}
          </View>
        </Content>
      </ScrollView>
    </Screen>
  );
}
