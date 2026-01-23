export type InventoryItemStatus = 'available' | 'loaned' | 'rented' | 'maintenance';

export interface InventoryItem {
  id: string;
  name: string;
  status: InventoryItemStatus;
  serial?: string;
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  userId: string;
  kind: 'loan' | 'rent';
  startISO: string;
  endISO?: string;
}

