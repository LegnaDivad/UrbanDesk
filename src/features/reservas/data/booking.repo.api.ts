import type { BookingRepo } from '@/features/reservas/data/booking.repo';

export const bookingRepoApi: BookingRepo = {
  async load() {
    throw new Error('bookingRepoApi not implemented');
  },
  async save() {
    throw new Error('bookingRepoApi not implemented');
  },
};

