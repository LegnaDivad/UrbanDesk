import type { Booking } from '@/features/reservas/domain/reservas.types';

export interface BookingRepo {
  load(): Promise<Booking[]>;
  save(next: Booking[]): Promise<void>;
}

