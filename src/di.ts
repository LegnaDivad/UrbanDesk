import type { DiContainer } from '@/di.types';
import { sessionRepoLocal } from '@/features/auth/data/session.repo.local';
import { inventoryRepoLocal } from '@/features/inventory/data/inventory.repo.local';
import { bookingRepoLocal } from '@/features/reservas/data/booking.repo.local';
import { workspaceRepoLocal } from '@/features/spaces/data/workspace.repo.local';

export const di = {
  auth: { sessionRepo: sessionRepoLocal },
  spaces: { workspaceRepo: workspaceRepoLocal },
  reservas: { bookingRepo: bookingRepoLocal },
  inventory: { inventoryRepo: inventoryRepoLocal },
} satisfies DiContainer;
