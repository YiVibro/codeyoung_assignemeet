import { DateTime } from "luxon";

export function getBrowserTimezone(): string {
  return (
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "UTC"
  );
}

export function formatLocalDate(
  iso: string,
  timezone: string,
): string {
  return DateTime.fromISO(iso, {
    setZone: true,
  })
    .setZone(timezone)
    .toFormat("ccc, dd LLL yyyy");
}

export function formatLocalTime(
  iso: string,
  timezone: string,
): string {
  return DateTime.fromISO(iso, {
    setZone: true,
  })
    .setZone(timezone)
    .toFormat("hh:mm a");
}

export function formatLocalDateTime(
  iso: string,
  timezone: string,
): string {
  return DateTime.fromISO(iso, {
    setZone: true,
  })
    .setZone(timezone)
    .toFormat("ccc, dd LLL yyyy · hh:mm a");
}