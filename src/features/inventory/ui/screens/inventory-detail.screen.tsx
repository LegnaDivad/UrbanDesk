import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useInventoryStore } from '@/features/inventory/state/inventory.store';

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
  const router = useRouter();
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

  const onBack = () => {
  if (router.canGoBack()) router.back();
  else router.replace('/(app)/inventory');
};


  if (!assetId) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base">Asset inválido</Text>
        <Pressable className="mt-4 rounded-xl bg-black px-4 py-3" onPress={onBack}>
          <Text className="text-white">Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (status === 'loading' || status === 'idle') {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-base">Cargando…</Text>
      </View>
    );
  }

  if (!asset) {
    return (
      <View className="flex-1 items-center justify-center px-6 gap-3">
        <Text className="text-base">No se encontró el activo</Text>
        <Pressable className="rounded-xl bg-black px-4 py-3" onPress={onBack}>
          <Text className="text-white">Volver</Text>
        </Pressable>
      </View>
    );
  }

  const isAvailable = asset.status === 'available';
  const statusPill = isAvailable ? 'bg-emerald-100' : 'bg-amber-100';
  const statusText = isAvailable ? 'Disponible' : 'Prestado';

  return (
    <ScrollView contentContainerClassName="flex-grow px-6 py-6 gap-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base">Detalle de activo</Text>
        <Pressable className="rounded-xl bg-neutral-200 px-4 py-2" onPress={onBack}>
          <Text>Volver</Text>
        </Pressable>
      </View>

      <View className="rounded-2xl bg-neutral-100 px-4 py-4 gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-base">{asset.name}</Text>
          <View className={`rounded-full px-3 py-1 ${statusPill}`}>
            <Text className="text-xs">{statusText}</Text>
          </View>
        </View>

        <Text className="text-sm text-neutral-700">Categoría: {asset.category}</Text>
        <Text className="text-xs text-neutral-600">ID: {asset.id}</Text>
        <Text className="text-xs text-neutral-600">
          Tags: {asset.tags?.length ? asset.tags.join(', ') : '-'}
        </Text>
      </View>

      <View className="rounded-2xl bg-neutral-100 px-4 py-4 gap-2">
        <Text className="text-sm">Préstamo activo</Text>
        {activeLoan ? (
          <>
            <Text className="text-xs text-neutral-600">loanId: {activeLoan.id}</Text>
            <Text className="text-xs text-neutral-600">userId: {activeLoan.userId}</Text>
            <Text className="text-xs text-neutral-600">inicio: {fmt(activeLoan.startISO)}</Text>
          </>
        ) : (
          <Text className="text-xs text-neutral-600">No hay préstamo activo.</Text>
        )}
      </View>

      {isAvailable ? (
        <Pressable
          className="rounded-2xl bg-black px-4 py-4"
          onPress={() => void createMockLoanForAsset(asset.id, userId)}
        >
          <Text className="text-white text-center">Prestar (mock)</Text>
        </Pressable>
      ) : (
        <Pressable
          className={`rounded-2xl px-4 py-4 ${activeLoan ? 'bg-black' : 'bg-neutral-300'}`}
          disabled={!activeLoan}
          onPress={() => {
            if (!activeLoan) return;
            void returnLoan(activeLoan.id);
          }}
        >
          <Text className="text-white text-center">Devolver</Text>
        </Pressable>
      )}

      <View className="gap-2">
        <Text className="text-sm">Historial</Text>
        {history.length === 0 ? (
          <Text className="text-xs text-neutral-600">Sin registros.</Text>
        ) : (
          history.map((l) => (
            <View key={l.id} className="rounded-2xl bg-neutral-100 px-4 py-3">
              <Text className="text-xs text-neutral-600">loanId: {l.id}</Text>
              <Text className="text-xs text-neutral-600">status: {l.status}</Text>
              <Text className="text-xs text-neutral-600">inicio: {fmt(l.startISO)}</Text>
              <Text className="text-xs text-neutral-600">fin: {fmt(l.endISO)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
