import type { AtlasBootstrap, LiveEventsPayload } from "./atlasTypes";
import { isActiveEvent } from "./activeEvents";

/**
 * Merges public/data/live-events.json (curated markets + Luma live events) into the bootstrap:
 * keeps only active/recurring events and re-syncs per-country event counts.
 * Shared by the server reader and the browser loader so both produce the same atlas.
 */
export function mergeLiveEvents(parsed: AtlasBootstrap, live: LiveEventsPayload | null): AtlasBootstrap {
  if (live && Array.isArray(live.events)) {
    parsed.events = live.events.filter((ev) => isActiveEvent(ev));
    // Sync per-country event counts with filtered active/recurring events
    const countByCc = new Map<string, number>();
    for (const ev of parsed.events) {
      countByCc.set(ev.country, (countByCc.get(ev.country) || 0) + 1);
    }
    parsed.countries = parsed.countries.map((c) => ({
      ...c,
      eventCount: countByCc.get(c.code) || 0,
    }));
  }
  return parsed;
}
