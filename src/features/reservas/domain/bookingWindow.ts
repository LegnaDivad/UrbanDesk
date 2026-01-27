export function addMinutes(startISO: string, minutes: number): string {
  const ms = new Date(startISO).getTime() + minutes * 60 * 1000;
  return new Date(ms).toISOString();
}

export function roundToNext15Min(date: Date): Date {
  const ms = date.getTime();
  const fifteen = 15 * 60 * 1000;
  return new Date(Math.ceil(ms / fifteen) * fifteen);
}

