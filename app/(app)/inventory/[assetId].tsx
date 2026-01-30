import { useLocalSearchParams } from 'expo-router';

import { InventoryDetailScreen } from '@/features/inventory/ui/screens/inventory-detail.screen';

export default function InventoryAssetDetailRoute() {
  const { assetId } = useLocalSearchParams<{ assetId?: string | string[] }>();
  const id = Array.isArray(assetId) ? assetId[0] : assetId;

  // route = solo routing; el screen maneja el resto
  return <InventoryDetailScreen assetId={id ?? ''} />;
}
