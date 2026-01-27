import type { SpaceType } from '@/features/spaces/domain/workspace.types';

export interface Space {
  id: string;
  name: string;
  type: SpaceType;
  areaId: string;
}


export interface Booking {
  id: string;
  spaceId: string;
  userId: string;
  startISO: string; // ISO date-time
  endISO: string;   // ISO date-time
}

