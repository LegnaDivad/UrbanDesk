import type { SpaceType } from '@/features/spaces/domain/workspace.types';

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  areaId: string;
  capacity: number;
}

export type BookingStatus = 'active' | 'cancelled';

export interface Booking {
  id: string;
  spaceId: string;
  userId: string;
  startISO: string;
  endISO: string;
  status: BookingStatus;
}
