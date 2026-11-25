import fs from "node:fs";
import path from "node:path";
import type { LiveEventsPayload } from "@/lib/atlasTypes";
import { isActiveEvent } from "@/lib/activeEvents";

let cachedPayload: LiveEventsPayload | null = null;

function loadLiveEvents(): LiveEventsPayload {
  if (cachedPayload) return cachedPayload;
  const livePath = path.join(process.cwd(), "public", "data", "live-events.json");
  if (fs.existsSync(livePath)) {
    cachedPayload = JSON.parse(fs.readFileSync(livePath, "utf8")) as LiveEventsPayload;
    return cachedPayload;
  }
  const bootPath = path.join(process.cwd(), "public", "data", "atlas-bootstrap.json");
  const boot = JSON.parse(fs.readFileSync(bootPath, "utf8")) as { events?: LiveEventsPayload["events"] };
  const events = (boot.events || []).map((e) => ({ ...e, source: "curated" as const }));
  return {
    generatedAt: new Date().toISOString(),
    curatedCount: events.length,
    lumaCount: 0,
    totalCount: events.length,
    events,
  };
}

export async function GET() {
  const cached = loadLiveEvents();
  // Filter at response time: the cached file outlives a one-off event's last day.
  const events = cached.events.filter((ev) => isActiveEvent(ev));
  const payload = { ...cached, events, totalCount: events.length };
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
    },
  });
}
