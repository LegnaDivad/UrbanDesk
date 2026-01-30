export type NotificationKind = 'info' | 'success' | 'warning' | 'error';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAtISO: string;
  readAtISO: string | null;
  meta?: Record<string, string>;
}
