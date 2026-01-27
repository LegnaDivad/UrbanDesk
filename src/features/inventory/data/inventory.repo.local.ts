import type { InventoryRepo } from '@/features/inventory/data/inventory.repo';
import type { Asset, Loan } from '@/features/inventory/domain/inventory.types';
import { kv } from '@/lib/storage/kv';

const ASSETS_KEY = 'ud.inventory.assets.v1';
const LOANS_KEY = 'ud.inventory.loans.v1';

export const inventoryRepoLocal: InventoryRepo = {
  async loadAssets() {
    return (await kv.getJson<Asset[]>(ASSETS_KEY)) ?? [];
  },
  async saveAssets(next) {
    await kv.setJson(ASSETS_KEY, next);
  },

  async loadLoans() {
    return (await kv.getJson<Loan[]>(LOANS_KEY)) ?? [];
  },
  async saveLoans(next) {
    await kv.setJson(LOANS_KEY, next);
  },
};
