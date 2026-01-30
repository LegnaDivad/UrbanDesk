import { create } from 'zustand';

import { di } from '@/di';
import type { Asset, AssetStatus, Loan, LoanStatus } from '@/features/inventory/domain/inventory.types';
import { useNotificationsStore } from '@/features/notifications';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface InventoryState {
  status: LoadStatus;
  assets: Asset[];
  loans: Loan[];

  hydrate: () => Promise<void>;
  seedMockAssets: () => Promise<void>;

  addMockAsset: () => Promise<void>;
  createMockLoan: (userId: string) => Promise<void>;
  createMockLoanForAsset: (assetId: string, userId: string) => Promise<void>;
  returnLoan: (loanId: string) => Promise<void>;

  getAssetById: (assetId: string) => Asset | null;
  getActiveLoanForAsset: (assetId: string) => Loan | null;
  getLoansForAsset: (assetId: string) => Loan[];
}

const ASSET_AVAILABLE: AssetStatus = 'available';
const ASSET_LOANED: AssetStatus = 'loaned';
const LOAN_ACTIVE: LoanStatus = 'active';
const LOAN_RETURNED: LoanStatus = 'returned';

export const useInventoryStore = create<InventoryState>((set, get) => ({
  status: 'idle',
  assets: [],
  loans: [],

  getAssetById: (assetId) => get().assets.find((a) => a.id === assetId) ?? null,

  getActiveLoanForAsset: (assetId) =>
    get().loans.find((l) => l.assetId === assetId && l.status === LOAN_ACTIVE) ?? null,

  getLoansForAsset: (assetId) => get().loans.filter((l) => l.assetId === assetId),

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

  seedMockAssets: async () => {
    const { assets } = get();
    if (assets.length > 0) return;

    const seed: Asset[] = [
      {
        id: 'as-seed-1',
        name: 'Monitor 24" #1',
        category: 'Monitor',
        status: ASSET_AVAILABLE,
        tags: ['MVP'],
      },
      {
        id: 'as-seed-2',
        name: 'Laptop Stand #1',
        category: 'Soporte',
        status: ASSET_AVAILABLE,
        tags: ['MVP'],
      },
      {
        id: 'as-seed-3',
        name: 'HDMI Cable #1',
        category: 'Cable',
        status: ASSET_AVAILABLE,
        tags: ['MVP'],
      },
    ];

    await Promise.all([
      di.inventory.inventoryRepo.saveAssets(seed),
      di.inventory.inventoryRepo.saveLoans([]),
    ]);

    set({ assets: seed, loans: [] });

    await useNotificationsStore.getState().notify({
      kind: 'info',
      title: 'Inventario inicializado',
      message: `Se cargaron ${seed.length} assets mock.`,
    });
  },

  addMockAsset: async () => {
    const { assets } = get();
    const next: Asset = {
      id: `as-${Date.now()}`,
      name: `Monitor ${assets.length + 1}`,
      category: 'Monitor',
      status: ASSET_AVAILABLE,
      tags: ['MVP'],
    };

    const updated = [next, ...assets];
    await di.inventory.inventoryRepo.saveAssets(updated);
    set({ assets: updated });

    await useNotificationsStore.getState().notify({
      kind: 'success',
      title: 'Asset creado',
      message: `${next.name} agregado al inventario.`,
      meta: { assetId: next.id },
    });
  },

  createMockLoan: async (userId) => {
    const { assets } = get();

    const candidate = assets.find((a) => a.status === ASSET_AVAILABLE);
    if (!candidate) {
      await useNotificationsStore.getState().notify({
        kind: 'warning',
        title: 'Sin assets disponibles',
        message: 'No hay assets disponibles para prestar.',
      });
      return;
    }

    await get().createMockLoanForAsset(candidate.id, userId);
  },

  createMockLoanForAsset: async (assetId, userId) => {
    const { assets, loans } = get();

    const asset = assets.find((a) => a.id === assetId);
    if (!asset) {
      await useNotificationsStore.getState().notify({
        kind: 'error',
        title: 'Asset no encontrado',
        message: `No existe el asset ${assetId}.`,
        meta: { assetId },
      });
      return;
    }

    if (asset.status !== ASSET_AVAILABLE) {
      await useNotificationsStore.getState().notify({
        kind: 'warning',
        title: 'Asset no disponible',
        message: `${asset.name} ya está prestado.`,
        meta: { assetId },
      });
      return;
    }

    const now = new Date().toISOString();

    const loan: Loan = {
      id: `ln-${Date.now()}`,
      assetId,
      userId,
      startISO: now,
      endISO: null,
      status: LOAN_ACTIVE,
    };

    const updatedLoans: Loan[] = [loan, ...loans];
    const updatedAssets: Asset[] = assets.map((a) =>
      a.id === assetId ? { ...a, status: ASSET_LOANED } : a,
    );

    await Promise.all([
      di.inventory.inventoryRepo.saveLoans(updatedLoans),
      di.inventory.inventoryRepo.saveAssets(updatedAssets),
    ]);

    set({ loans: updatedLoans, assets: updatedAssets });

    await useNotificationsStore.getState().notify({
      kind: 'success',
      title: 'Préstamo creado',
      message: `${asset.name} prestado a ${userId}.`,
      meta: { assetId, loanId: loan.id, userId },
    });
  },

  returnLoan: async (loanId) => {
    const { loans, assets } = get();

    const loan = loans.find((l) => l.id === loanId);
    if (!loan) {
      await useNotificationsStore.getState().notify({
        kind: 'error',
        title: 'Préstamo no encontrado',
        message: `No existe el loan ${loanId}.`,
        meta: { loanId },
      });
      return;
    }

    if (loan.status !== LOAN_ACTIVE) {
      await useNotificationsStore.getState().notify({
        kind: 'warning',
        title: 'Préstamo ya cerrado',
        message: `El loan ${loanId} ya está en estado ${loan.status}.`,
        meta: { loanId, status: loan.status },
      });
      return;
    }

    const ended = new Date().toISOString();

    const updatedLoans: Loan[] = loans.map((l) =>
      l.id === loanId ? { ...l, status: LOAN_RETURNED, endISO: ended } : l,
    );

    const updatedAssets: Asset[] = assets.map((a) =>
      a.id === loan.assetId ? { ...a, status: ASSET_AVAILABLE } : a,
    );

    await Promise.all([
      di.inventory.inventoryRepo.saveLoans(updatedLoans),
      di.inventory.inventoryRepo.saveAssets(updatedAssets),
    ]);

    set({ loans: updatedLoans, assets: updatedAssets });

    const assetName = assets.find((a) => a.id === loan.assetId)?.name ?? loan.assetId;

    await useNotificationsStore.getState().notify({
      kind: 'info',
      title: 'Préstamo devuelto',
      message: `${assetName} devuelto por ${loan.userId}.`,
      meta: { assetId: loan.assetId, loanId, userId: loan.userId },
    });
  },
}));
