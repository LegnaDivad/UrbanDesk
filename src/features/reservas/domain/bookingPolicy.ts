import type { Booking } from '@/features/reservas/domain/reservas.types';

export function overlaps(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
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
  capacity: number = 1,
): boolean {
  const active = bookings.filter((b) => b.status !== 'cancelled');

  const limit = Math.max(1, capacity);
  const overlappingCount = active.reduce((acc, b) => {
    if (b.spaceId !== spaceId) return acc;
    if (!overlaps(startISO, endISO, b.startISO, b.endISO)) return acc;
    return acc + 1;
  }, 0);

  return overlappingCount < limit;
}
