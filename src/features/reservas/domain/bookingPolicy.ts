import type { Booking } from '@/features/reservas/domain/reservas.types';

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const aS = new Date(aStart).getTime();
  const aE = new Date(aEnd).getTime();
  const bS = new Date(bStart).getTime();
  const bE = new Date(bEnd).getTime();
  return aS < bE && bS < aE;
}

export function canBook(
  spaceId: string,
  startISO: string,
  endISO: string,
  bookings: Booking[],
): boolean {
  const active = bookings.filter((b) => b.status !== 'cancelled');
  return !active.some((b) => b.spaceId === spaceId && overlaps(startISO, endISO, b.startISO, b.endISO));
}

