import type { AppNotification } from '@/features/notifications/domain/notifications.types';

export interface NotificationsRepo {
  load(): Promise<AppNotification[]>;
  save(next: AppNotification[]): Promise<void>;
}
