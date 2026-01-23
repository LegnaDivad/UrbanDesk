import type { Booking } from '@/features/reservas/domain/reservas.types';
import { kv } from '@/lib/storage/kv';

const KEY = 'ud.bookings.v1';

export async function loadBookings(): Promise<Booking[]> {
  const raw = await kv.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
}

export async function saveBookings(bookings: Booking[]): Promise<void> {
  await kv.setItem(KEY, JSON.stringify(bookings));
}

