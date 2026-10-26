import type { OrderFilters } from "@/lib/services/order.service";

export function localDateBoundary(date: string, endExclusive = false): string {
  const boundary = new Date(`${date}T00:00:00`);
  if (endExclusive) boundary.setDate(boundary.getDate() + 1);
  return boundary.toISOString();
}

export function makeDateFilters(fromDate: string, toDate: string): OrderFilters {
  return {
    ...(fromDate ? { from: localDateBoundary(fromDate) } : {}),
    ...(toDate ? { to: localDateBoundary(toDate, true) } : {}),
  };
}

export function dateRangeIsValid(fromDate: string, toDate: string): boolean {
  return !fromDate || !toDate || fromDate <= toDate;
}

export function dateIsInRange(
  timestamp: string,
  fromDate: string,
  toDate: string,
): boolean {
  const time = Date.parse(timestamp);
  if (fromDate && time < Date.parse(localDateBoundary(fromDate))) return false;
  if (toDate && time >= Date.parse(localDateBoundary(toDate, true))) return false;
  return true;
}

