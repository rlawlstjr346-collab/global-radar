#!/usr/bin/env node
/**
 * Syncs live public offline vintage / flea / thrift market events from Luma (https://luma.com/<city>)
 * via public SSR Event JSON-LD (zero private API / zero api.lu.ma),
 * strips all Unicode emojis, and merges cleanly with the 88 curated
 * vintage flea markets from atlas-bootstrap.json into public/data/live-events.json.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "public", "data");

const EMOJI_REGEX =
  /[\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}]|[\uFE0E\uFE0F\u20E3]|[\u2600-\u27BF]|\u200D/gu;

function stripEmojis(input) {
  if (typeof input !== "string") return "";
  return input.replace(EMOJI_REGEX, " ").replace(/\s+/g, " ").trim();
}

const LUMA_CITY_TARGETS = [
  { slug: "seoul", cc: "KR", citySlug: "kr/seoul", cityKo: "서울", cityEn: "Seoul", fallbackCenter: [126.9782, 37.5554] },
  { slug: "tokyo", cc: "JP", citySlug: "jp/tokyo", cityKo: "도쿄", cityEn: "Tokyo", fallbackCenter: [139.6986, 35.6767] },
  { slug: "nyc", cc: "US", citySlug: "us/new-york-city", cityKo: "뉴욕", cityEn: "New York City", fallbackCenter: [-73.9911, 40.7282] },
  { slug: "la", cc: "US", citySlug: "us/los-angeles", cityKo: "로스앤젤레스", cityEn: "Los Angeles", fallbackCenter: [-118.2437, 34.0522] },
  { slug: "london", cc: "GB", citySlug: "gb/london", cityKo: "런던", cityEn: "London", fallbackCenter: [-0.1276, 51.5072] },
  { slug: "paris", cc: "FR", citySlug: "fr/paris", cityKo: "파리", cityEn: "Paris", fallbackCenter: [2.3522, 48.8566] },
  { slug: "berlin", cc: "DE", citySlug: "de/berlin", cityKo: "베를린", cityEn: "Berlin", fallbackCenter: [13.405, 52.52] },
  { slug: "amsterdam", cc: "NL", citySlug: "nl/amsterdam", cityKo: "암스테르담", cityEn: "Amsterdam", fallbackCenter: [4.9041, 52.3676] },
  { slug: "bangkok", cc: "TH", citySlug: "th/bangkok", cityKo: "방콕", cityEn: "Bangkok", fallbackCenter: [100.5018, 13.7563] },
  { slug: "taipei", cc: "TW", citySlug: "tw/taipei", cityKo: "타이베이", cityEn: "Taipei", fallbackCenter: [121.5654, 25.033] },
];

// Real run date (UTC). ATLAS_TODAY=YYYY-MM-DD overrides it for reproducible runs.
const TODAY_ISO = /^\d{4}-\d{2}-\d{2}$/.test(process.env.ATLAS_TODAY ?? "")
  ? process.env.ATLAS_TODAY
  : new Date().toISOString().slice(0, 10);
const PAST_YEAR_RE = /\b20(1\d|2[0-5])\b/;
const DISCONTINUED_OR_IRREGULAR_RE =
  /일정\s*미확인|부정기|개최\s*영상|시즌\s*\d+\s*=\s*20(1\d|2[0-5])|종료됨|폐지/i;
const VERIFIED_RECURRING_RE =
  /매일|매주|매월|매년|상설|정기|연\s*\d|격주|첫째|둘째|셋째|넷째|주말|토요일|일요일|every|weekly|monthly|daily|annual|permanent|recurring|weekend/i;

function sanitizeRecurrenceText(raw) {
  if (!raw) return undefined;
  let s = stripEmojis(raw);
  // Remove parenthetical historical year notes like "(2025년 9월 ...)" or "(2020~)" or "(vol.5 2024.11 → vol.7 2025.9)"
  s = s
    .replace(/\([^)]*20(?:1\d|2[0-5])[^)]*\)/g, "")
    .replace(/20(?:1\d|2[0-5])년\s*(?:\d+월)?(?:\s*\d+일)?/g, "")
    .replace(/\b20(?:1\d|2[0-5])(?:[.\-/]\d{1,2}(?:[.\-/]\d{1,2})?)?\s*[~→–-]?\s*/g, "")
    .replace(/\s*[·—–-]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s || "정기 운영 · 공식 페이지 확인";
}

function normalizeAndFilterEvent(ev) {
  const name = stripEmojis(ev.name || "");
  const nameKo = stripEmojis(ev.nameKo || name);
  const rawRecurrence = stripEmojis(ev.recurrence || "");
  const nextDate = typeof ev.nextDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(ev.nextDate)
    ? ev.nextDate.slice(0, 10)
    : undefined;
  const endDate = typeof ev.endDate === "string" && /^\d{4}-\d{2}-\d{2}/.test(ev.endDate)
    ? ev.endDate.slice(0, 10)
    : nextDate;

  // Reject any one-off event with a past year (2020-2025) in title
  if (PAST_YEAR_RE.test(name) || PAST_YEAR_RE.test(nameKo)) return null;
  if (DISCONTINUED_OR_IRREGULAR_RE.test(rawRecurrence)) return null;

  const isUpcoming = Boolean(endDate && endDate >= TODAY_ISO);
  const isRecurring =
    Boolean(ev.isRecurring) ||
    (Boolean(rawRecurrence) && VERIFIED_RECURRING_RE.test(rawRecurrence));

  // Must be either verified recurring OR upcoming/ongoing (>= run date)
  if (!isRecurring && !isUpcoming) return null;

  const cleanRecurrence = isRecurring ? sanitizeRecurrenceText(rawRecurrence) : undefined;
  const cleanNextDate = nextDate && nextDate >= TODAY_ISO ? nextDate : undefined;
  const cleanEndDate = endDate && endDate >= TODAY_ISO ? endDate : cleanNextDate;

  // Scrub any stale historical year from venue/address/hours/kindLabel
  const cleanVenue = ev.venue ? stripEmojis(ev.venue).replace(PAST_YEAR_RE, "").trim() : undefined;
  const cleanAddress = ev.address ? stripEmojis(ev.address).replace(PAST_YEAR_RE, "").trim() : undefined;

  const out = {
    id: ev.id,
    name,
    nameKo,
    country: ev.country,
    citySlug: ev.citySlug,
    cityKo: ev.cityKo,
    cityEn: ev.cityEn,
    kind: ev.kind || (isRecurring ? "market" : "event"),
    kindLabel: isRecurring ? "상설 · 정기" : ev.source === "luma" ? "LIVE" : "예정",
    tags: Array.isArray(ev.tags) ? ev.tags.filter((t) => !PAST_YEAR_RE.test(t)) : [],
    ...(cleanVenue ? { venue: cleanVenue } : {}),
    ...(cleanAddress ? { address: cleanAddress } : {}),
    ...(cleanRecurrence ? { recurrence: cleanRecurrence } : {}),
    isRecurring,
    ...(cleanNextDate ? { nextDate: cleanNextDate } : {}),
    ...(cleanEndDate ? { endDate: cleanEndDate } : {}),
    ...(ev.hours ? { hours: stripEmojis(ev.hours) } : {}),
    ...(ev.scheduleUrl ? { scheduleUrl: ev.scheduleUrl } : {}),
    ...(ev.instagram ? { instagram: ev.instagram } : {}),
    ...(ev.homepage ? { homepage: ev.homepage } : {}),
    center: ev.center ?? null,
    source: ev.source || "curated",
    ...(ev.near ? { near: ev.near } : {}),
  };

  // Final safety check: zero 2020-2025 references anywhere in serialized event
  if (PAST_YEAR_RE.test(JSON.stringify(out))) return null;
  return out;
}

// Strict relevance gate: a Luma event survives ONLY if its title/venue names a
// vintage / flea / thrift / second-hand market. Generic IT, marketing, running,
// startup or social meetups are dropped outright (they never reach the map).
const VINTAGE_MARKET_RE =
  /vintage|flea|thrift|second[\s-]?hand|pre[\s-]?loved|antique|clothing swap|clothes swap|kilo sale|marche aux puces|brocante|vide[\s-]?grenier|braderie|flohmarkt|trödel|rommelmarkt|vlooienmarkt|mercadillo|mercatino|rastro|古着|蚤の市|フリマ|骨董|빈티지|구제|플리|벼룩|중고|古著|跳蚤|二手|ตลาดนัด|มือสอง/i;
const OFF_TOPIC_RE =
  /meetup|hackathon|workshop|pitch|founder|startup|investor|networking|webinar|conference|summit|symposium|\bAI\b|LLM|claude|codex|devin|data scien|analytics|quant|marketing|career|\brun\b|running|book (?:club|swap)|meditation|dinner|party/i;

function isVintageMarketEvent(text) {
  return VINTAGE_MARKET_RE.test(text) && !OFF_TOPIC_RE.test(text);
}

function parseJsonLdEvents(html) {
  const events = [];
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of matches) {
    try {
      const parsed = JSON.parse(m[1]);
      const list = Array.isArray(parsed)
        ? parsed
        : parsed["@type"] === "ItemList" && Array.isArray(parsed.itemListElement)
          ? parsed.itemListElement.map((e) => e.item || e)
          : parsed["@type"] === "Event"
            ? [parsed]
            : [];
      for (const item of list) {
        if (item && item["@type"] === "Event") events.push(item);
      }
    } catch {
      // Ignore malformed JSON-LD block
    }
  }
  return events;
}

async function fetchCityLumaEvents(target) {
  const url = `https://luma.com/${target.slug}`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4500),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const rawEvents = parseJsonLdEvents(html);

    const parsed = [];
    for (let i = 0; i < rawEvents.length; i++) {
      const ev = rawEvents[i];
      const attendance = String(ev.eventAttendanceMode || "");
      if (attendance.includes("OnlineEventAttendanceMode")) continue;

      const cleanName = stripEmojis(ev.name || "");
      if (!cleanName) continue;

      const loc = ev.location || {};
      const geo = loc.geo || {};
      const lat = Number(geo.latitude);
      const lng = Number(geo.longitude);
      // Slight deterministic jitter if falling back to city center so markers never stack identically
      const center =
        Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
          ? [Number(lng.toFixed(5)), Number(lat.toFixed(5))]
          : [
              Number((target.fallbackCenter[0] + ((i % 5) - 2) * 0.008).toFixed(5)),
              Number((target.fallbackCenter[1] + (Math.floor(i / 5) - 1) * 0.006).toFixed(5)),
            ];

      const venue = stripEmojis(typeof loc.name === "string" ? loc.name : "");
      const addrObj = loc.address;
      const address = stripEmojis(
        typeof addrObj === "string"
          ? addrObj
          : [addrObj?.streetAddress, addrObj?.addressLocality, addrObj?.addressRegion]
              .filter(Boolean)
              .join(", "),
      );

      const startIso = typeof ev.startDate === "string" ? ev.startDate : "";
      const endIso = typeof ev.endDate === "string" ? ev.endDate : startIso;
      const nextDate = startIso ? startIso.slice(0, 10) : undefined;
      const endDate = endIso ? endIso.slice(0, 10) : nextDate;
      if (!endDate || endDate < TODAY_ISO) continue;
      const hours = startIso && startIso.length >= 16 ? startIso.slice(11, 16) : undefined;
      const scheduleUrl = typeof ev.url === "string" ? ev.url.trim() : url;
      const idSlug = scheduleUrl.split("/").filter(Boolean).pop() || `${target.slug}-${i}`;
      if (!isVintageMarketEvent(`${cleanName} ${venue}`)) continue;

      parsed.push({
        event: {
          id: `LUMA-${target.cc}-${idSlug}`.slice(0, 48),
          name: cleanName,
          nameKo: cleanName,
          country: target.cc,
          citySlug: target.citySlug,
          cityKo: target.cityKo,
          cityEn: target.cityEn,
          kind: "luma-live",
          kindLabel: "LIVE",
          tags: ["LUMA", "OFFLINE", target.cityEn.toUpperCase()],
          ...(venue ? { venue } : {}),
          ...(address ? { address } : {}),
          isRecurring: false,
          ...(nextDate ? { nextDate } : {}),
          ...(endDate ? { endDate } : {}),
          ...(hours ? { hours } : {}),
          scheduleUrl,
          center,
          source: "luma",
        },
      });
    }

    return parsed.slice(0, 6).map((x) => x.event);
  } catch {
    return [];
  }
}

export { isVintageMarketEvent };

async function main() {
  const t0 = Date.now();
  const bootstrap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "atlas-bootstrap.json"), "utf8"));
  const curatedEvents = (bootstrap.events || [])
    .map((ev) => normalizeAndFilterEvent({ ...ev, source: "curated" }))
    .filter(Boolean);

  const settled = await Promise.all(LUMA_CITY_TARGETS.map((t) => fetchCityLumaEvents(t)));
  const seenUrls = new Set(curatedEvents.map((e) => e.scheduleUrl).filter(Boolean));
  const lumaEvents = [];
  for (const list of settled) {
    for (const rawEv of list) {
      const ev = normalizeAndFilterEvent(rawEv);
      if (!ev) continue;
      if (ev.scheduleUrl && seenUrls.has(ev.scheduleUrl)) continue;
      if (ev.scheduleUrl) seenUrls.add(ev.scheduleUrl);
      lumaEvents.push(ev);
    }
  }

  // Sort: upcoming dated events soonest-first, then verified recurring markets
  const merged = [...curatedEvents, ...lumaEvents].sort((a, b) => {
    const aHasUpcoming = Boolean(a.nextDate && a.nextDate >= TODAY_ISO);
    const bHasUpcoming = Boolean(b.nextDate && b.nextDate >= TODAY_ISO);
    if (aHasUpcoming && bHasUpcoming) return a.nextDate.localeCompare(b.nextDate);
    if (aHasUpcoming !== bHasUpcoming) return aHasUpcoming ? -1 : 1;
    return a.nameKo.localeCompare(b.nameKo);
  });

  const payload = {
    generatedAt: new Date().toISOString(),
    referenceDate: TODAY_ISO,
    curatedCount: curatedEvents.length,
    lumaCount: lumaEvents.length,
    totalCount: merged.length,
    events: merged,
  };

  const json = JSON.stringify(payload);
  if (EMOJI_REGEX.test(json)) {
    EMOJI_REGEX.lastIndex = 0;
    throw new Error("Unicode emoji leaked into live-events.json");
  }
  if (PAST_YEAR_RE.test(json)) {
    throw new Error("Past year (2010-2025) leaked into live-events.json");
  }

  fs.writeFileSync(path.join(DATA_DIR, "live-events.json"), json);
  console.log(
    `[sync-live-events] Done in ${Date.now() - t0}ms | curated=${curatedEvents.length} | luma=${lumaEvents.length} | total=${merged.length} (${(json.length / 1024).toFixed(1)}KB)`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
