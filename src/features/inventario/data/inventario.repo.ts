import type { InventoryItem } from '@/features/inventario/domain/inventario.types';
import { kv } from '@/lib/storage/kv';

const KEY = 'ud.inventory.v1';

export async function loadInventory(): Promise<InventoryItem[]> {
  const raw = await kv.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as InventoryItem[];
  } catch {
    return [];
  }
}

export async function saveInventory(items: InventoryItem[]): Promise<void> {
  await kv.setItem(KEY, JSON.stringify(items));
}

