import fs from "node:fs";
import path from "node:path";
import type { AtlasBootstrap, AtlasShopShard, LiveEventsPayload } from "./atlasTypes";
import { isActiveEvent } from "./activeEvents";

let cachedBootstrap: AtlasBootstrap | null = null;
let cachedLiveEvents: LiveEventsPayload | null = null;
const cachedShards = new Map<string, AtlasShopShard | null>();

const DATA_DIR = path.join(process.cwd(), "public", "data");

/**
 * Server-side cached reader for public/data/atlas-bootstrap.json.
 * Merges public/data/live-events.json (88 curated markets + Luma live events) when available.
 */
export function readAtlasBootstrapSync(): AtlasBootstrap {
  if (cachedBootstrap) return cachedBootstrap;
  const raw = fs.readFileSync(path.join(DATA_DIR, "atlas-bootstrap.json"), "utf8");
  const parsed = JSON.parse(raw) as AtlasBootstrap;

  const live = readLiveEventsSync();
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

  cachedBootstrap = parsed;
  return cachedBootstrap;
}

export function readLiveEventsSync(): LiveEventsPayload | null {
  if (cachedLiveEvents) return cachedLiveEvents;
  const livePath = path.join(DATA_DIR, "live-events.json");
  if (!fs.existsSync(livePath)) return null;
  cachedLiveEvents = JSON.parse(fs.readFileSync(livePath, "utf8")) as LiveEventsPayload;
  return cachedLiveEvents;
}

/**
 * Server-side cached reader for an individual country's shop shard.
 */
export function readCountryShardSync(countryCode: string): AtlasShopShard | null {
  const cc = countryCode.toLowerCase().replace(/[^a-z]/g, "");
  if (!cc) return null;
  if (cachedShards.has(cc)) return cachedShards.get(cc) ?? null;

  const shardPath = path.join(DATA_DIR, "shops", `${cc}.json`);
  if (!fs.existsSync(shardPath)) {
    cachedShards.set(cc, null);
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(shardPath, "utf8")) as AtlasShopShard;
  cachedShards.set(cc, parsed);
  return parsed;
}
