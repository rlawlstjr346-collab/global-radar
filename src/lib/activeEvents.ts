import type { AtlasEvent } from "./atlasTypes";

/** Today's date (UTC) as YYYY-MM-DD, evaluated at call time (never frozen at build). */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Recurring markets always stay; one-off events only until their last day. */
export function isActiveEvent(ev: Pick<AtlasEvent, "isRecurring" | "endDate" | "nextDate">, today = todayIso()): boolean {
  if (ev.isRecurring) return true;
  const last = ev.endDate || ev.nextDate || "";
  return last >= today;
}
