import { readPublicJson } from "./publicFile";
import type { AtlasBootstrap, AtlasShopShard, LiveEventsPayload } from "./atlasTypes";
import { mergeLiveEvents } from "./atlasMerge";

let cachedBootstrap: AtlasBootstrap | null = null;
let cachedLiveEvents: LiveEventsPayload | null = null;
const cachedShards = new Map<string, AtlasShopShard | null>();

/**
 * Server-side cached reader for public/data/atlas-bootstrap.json.
 * Merges public/data/live-events.json (88 curated markets + Luma live events) when available.
 */
export async function readAtlasBootstrap(): Promise<AtlasBootstrap> {
  if (cachedBootstrap) return cachedBootstrap;
  const parsed = await readPublicJson<AtlasBootstrap>("data/atlas-bootstrap.json");
  if (!parsed) throw new Error("atlas-bootstrap.json is missing");

  cachedBootstrap = mergeLiveEvents(parsed, await readLiveEvents());
  return cachedBootstrap;
}

export async function readLiveEvents(): Promise<LiveEventsPayload | null> {
  if (cachedLiveEvents) return cachedLiveEvents;
  cachedLiveEvents = await readPublicJson<LiveEventsPayload>("data/live-events.json");
  return cachedLiveEvents;
}

/**
 * Server-side cached reader for an individual country's shop shard.
 */
export async function readCountryShard(countryCode: string): Promise<AtlasShopShard | null> {
  const cc = countryCode.toLowerCase().replace(/[^a-z]/g, "");
  if (!cc) return null;
  if (cachedShards.has(cc)) return cachedShards.get(cc) ?? null;

  const parsed = await readPublicJson<AtlasShopShard>(`data/shops/${cc}.json`);
  cachedShards.set(cc, parsed);
  return parsed;
}
