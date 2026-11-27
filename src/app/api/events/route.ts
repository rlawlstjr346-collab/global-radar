import type { LiveEventsPayload } from "@/lib/atlasTypes";
import { isActiveEvent } from "@/lib/activeEvents";
import { readPublicJson } from "@/lib/publicFile";

let cachedPayload: LiveEventsPayload | null = null;

async function loadLiveEvents(): Promise<LiveEventsPayload> {
  if (cachedPayload) return cachedPayload;
  const live = await readPublicJson<LiveEventsPayload>("data/live-events.json");
  if (live) {
    cachedPayload = live;
    return cachedPayload;
  }
  const boot = (await readPublicJson<{ events?: LiveEventsPayload["events"] }>("data/atlas-bootstrap.json")) ?? {};
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
  const cached = await loadLiveEvents();
  // Filter at response time: the cached file outlives a one-off event's last day.
  const events = cached.events.filter((ev) => isActiveEvent(ev));
  const payload = { ...cached, events, totalCount: events.length };
  return Response.json(payload, {
    headers: {
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
    },
  });
}
