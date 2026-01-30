import type { SessionRepo } from '@/features/auth/data/session.repo';
import type { InventoryRepo } from '@/features/inventory/data/inventory.repo';
import type { NotificationsRepo } from '@/features/notifications/data/notifications.repo';
import type { BookingRepo } from '@/features/reservas/data/booking.repo';
import type { WorkspaceRepo } from '@/features/spaces/data/workspace.repo';

export interface DiContainer {
  auth: { sessionRepo: SessionRepo };
  spaces: { workspaceRepo: WorkspaceRepo };
  reservas: { bookingRepo: BookingRepo };
  inventory: { inventoryRepo: InventoryRepo };
    notifications: { notificationsRepo: NotificationsRepo }; 
}

