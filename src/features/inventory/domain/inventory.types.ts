export type AssetStatus = 'available' | 'loaned' | 'maintenance';

export interface Asset {
  id: string;
  name: string;
  category: string; // ej: "Monitor", "Laptop", "Cable"
  status: AssetStatus;
  tags?: string[];
}

export type LoanStatus = 'active' | 'returned';

export interface Loan {
  id: string;
  assetId: string;
  userId: string;
  startISO: string;
  endISO: string | null;
  status: LoanStatus;
}
