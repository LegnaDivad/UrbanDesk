import type { BookingRepo } from '@/features/reservas/data/booking.repo';
import type { Booking } from '@/features/reservas/domain/reservas.types';
import { kv } from '@/lib/storage/kv';

const KEY = 'ud.bookings.v1';

export const bookingRepoLocal: BookingRepo = {
  async load() {
    return (await kv.getJson<Booking[]>(KEY)) ?? [];
  },
  async save(next) {
    await kv.setJson(KEY, next);
  },
};

