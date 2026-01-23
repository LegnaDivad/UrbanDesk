export type InventoryItemStatus = 'available' | 'loaned' | 'rented' | 'maintenance';

export interface InventoryItem {
  id: string;
  name: string;
  status: InventoryItemStatus;
  serial?: string;
}

