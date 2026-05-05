/**
 * Event time helpers — keep all live-event datetime logic in one place.
 * Storage convention: `content.event_date` is stored as UTC; `content.event_timezone`
 * holds the IANA zone the admin scheduled it in (default 'Asia/Dhaka').
 */
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export const DEFAULT_EVENT_TZ = "Asia/Dhaka";
export const TZ_LABEL: Record<string, string> = {
  "Asia/Dhaka": "BDT",
  "Asia/Kolkata": "IST",
  "Asia/Karachi": "PKT",
  "Asia/Singapore": "SGT",
  "Asia/Dubai": "GST",
  "Europe/London": "GMT",
  "America/New_York": "ET",
  "America/Los_Angeles": "PT",
  UTC: "UTC",
};

export const COMMON_TIMEZONES = Object.keys(TZ_LABEL);

/** Format an event date for display in its scheduled timezone, e.g. "Fri, May 8 · 10:00 PM BDT" */
export function formatEventTime(
  utcDate: string | Date | null | undefined,
  tz: string = DEFAULT_EVENT_TZ,
  pattern = "EEE, MMM d · h:mm a",
): string {
  if (!utcDate) return "";
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return `${formatInTimeZone(d, tz, pattern)} ${TZ_LABEL[tz] ?? tz}`;
}

/** Format same event in viewer's local zone, e.g. "Your time: Fri, May 8 · 10:30 PM" */
export function formatEventLocal(utcDate: string | Date | null | undefined): string {
  if (!utcDate) return "";
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  return `Your time: ${format(d, "EEE, MMM d · h:mm a")}`;
}

/** Convert a local datetime-input string ("2026-05-08T22:00") in `tz` to a UTC ISO string. */
export function zonedInputToUtcIso(localInput: string, tz: string = DEFAULT_EVENT_TZ): string {
  if (!localInput) return "";
  return fromZonedTime(localInput, tz).toISOString();
}

/** Convert a UTC ISO string back to a `<input type="datetime-local">` value rendered in `tz`. */
export function utcIsoToZonedInput(utcIso: string | null | undefined, tz: string = DEFAULT_EVENT_TZ): string {
  if (!utcIso) return "";
  const zoned = toZonedTime(new Date(utcIso), tz);
  return format(zoned, "yyyy-MM-dd'T'HH:mm");
}
