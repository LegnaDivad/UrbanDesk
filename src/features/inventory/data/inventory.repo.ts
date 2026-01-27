import type { Asset, Loan } from '@/features/inventory/domain/inventory.types';

export interface InventoryRepo {
  loadAssets: () => Promise<Asset[]>;
  saveAssets: (next: Asset[]) => Promise<void>;

  loadLoans: () => Promise<Loan[]>;
  saveLoans: (next: Loan[]) => Promise<void>;
}
