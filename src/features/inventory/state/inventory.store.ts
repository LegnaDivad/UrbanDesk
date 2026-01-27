import { create } from 'zustand';

import { di } from '@/di';
import type { Asset, Loan } from '@/features/inventory/domain/inventory.types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface InventoryState {
  status: Status;
  assets: Asset[];
  loans: Loan[];

  hydrate: () => Promise<void>;

  seedMockAssets: () => Promise<void>;
  addMockAsset: () => Promise<void>;
  createMockLoan: (userId: string) => Promise<void>;
  returnLoan: (loanId: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  status: 'idle',
  assets: [],
  loans: [],

  seedMockAssets: async () => {
    const { assets } = get();
    if (assets.length > 0) return;

    const seed: Asset[] = [
      {
        id: 'as-seed-1',
        name: 'Monitor 24" #1',
        category: 'Monitor',
        status: 'available',
        tags: ['MVP'],
      },
      {
        id: 'as-seed-2',
        name: 'Laptop Stand #1',
        category: 'Soporte',
        status: 'available',
        tags: ['MVP'],
      },
      {
        id: 'as-seed-3',
        name: 'HDMI Cable #1',
        category: 'Cable',
        status: 'available',
        tags: ['MVP'],
      },
    ];

    await di.inventory.inventoryRepo.saveAssets(seed);
    set({ assets: seed });
  },

  hydrate: async () => {
    set({ status: 'loading' });
    try {
      const [assets, loans] = await Promise.all([
        di.inventory.inventoryRepo.loadAssets(),
        di.inventory.inventoryRepo.loadLoans(),
      ]);

      set({ status: 'ready', assets, loans });
    } catch {
      set({ status: 'error' });
    }
  },

  addMockAsset: async () => {
    const { assets } = get();

    const next: Asset = {
      id: `as-${Date.now()}`,
      name: `Monitor ${assets.length + 1}`,
      category: 'Monitor',
      status: 'available',
      tags: ['MVP'],
    };

    const updated: Asset[] = [next, ...assets];
    await di.inventory.inventoryRepo.saveAssets(updated);
    set({ assets: updated });
  },

  createMockLoan: async (userId) => {
    const { assets, loans } = get();
    const candidate = assets.find((a) => a.status === 'available');
    if (!candidate) return;

    const nowISO = new Date().toISOString();

    const loan: Loan = {
      id: `ln-${Date.now()}`,
      assetId: candidate.id,
      userId,
      startISO: nowISO,
      endISO: null,
      status: 'active',
    };

    const updatedLoans: Loan[] = [loan, ...loans];

    const updatedAssets: Asset[] = assets.map((a) =>
      a.id === candidate.id ? { ...a, status: 'loaned' } : a,
    );

    await Promise.all([
      di.inventory.inventoryRepo.saveLoans(updatedLoans),
      di.inventory.inventoryRepo.saveAssets(updatedAssets),
    ]);

    set({ loans: updatedLoans, assets: updatedAssets });
  },

  returnLoan: async (loanId) => {
    const { loans, assets } = get();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status !== 'active') return;

    const endedISO = new Date().toISOString();

    const updatedLoans: Loan[] = loans.map((l) =>
      l.id === loanId ? { ...l, status: 'returned', endISO: endedISO } : l,
    );

    const updatedAssets: Asset[] = assets.map((a) =>
      a.id === loan.assetId ? { ...a, status: 'available' } : a,
    );

    await Promise.all([
      di.inventory.inventoryRepo.saveLoans(updatedLoans),
      di.inventory.inventoryRepo.saveAssets(updatedAssets),
    ]);

    set({ loans: updatedLoans, assets: updatedAssets });
  },
}));
