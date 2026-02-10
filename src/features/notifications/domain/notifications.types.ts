export type NotificationKind =
  | 'booking_created'
  | 'booking_cancelled'
  | 'loan_created'
  | 'loan_returned'
  | 'system';

export type NotificationPayload =
  | { kind: 'booking_created'; bookingId: string; spaceId: string }
  | { kind: 'booking_cancelled'; bookingId: string; spaceId: string }
  | { kind: 'loan_created'; loanId: string; assetId: string }
  | { kind: 'loan_returned'; loanId: string; assetId: string }
  | { kind: 'system' };

export type NotificationActionKind = 'primary' | 'neutral' | 'danger';

export interface NotificationAction {
  label: string;
  deepLink: string;
  kind?: NotificationActionKind;
}

export interface NotificationMeta {
  deepLink?: string;
  actions?: NotificationAction[];
}

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  createdAtISO: string;
  readAtISO: string | null;
  payload: NotificationPayload;
  meta?: NotificationMeta;
}
