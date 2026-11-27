import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { SITE_URL } from "../src/lib/siteUrl.ts";
import { resolveLegacyPath } from "../src/lib/legacyRoutes.ts";
import { PLATFORMS } from "../src/data/platforms.ts";
import { buildAlleyZoneGeoJson, formatCityLocalClock } from "../src/lib/alleyZones.ts";
import sitemap from "../src/app/sitemap.ts";
import { GET as getRss } from "../src/app/rss.xml/route.ts";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "public", "data");
const SHARDS_DIR = path.join(DATA_DIR, "shops");

const EMOJI_RE =
  /[\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}]|[\u2600-\u27BF]/gu;

function walkFiles(dir, exts) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

test("1. Lossless dataset integrity: 137 countries, 13,054 compact pins, 134 shards summing to 13,054, 136 platforms, 664 alleys, 88 events", () => {
  const bootstrap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "atlas-bootstrap.json"), "utf8"));
  const pins = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "pins-compact.json"), "utf8"));

  assert.ok(bootstrap.countries.length >= 137, `Expected >= 137 countries, got ${bootstrap.countries.length}`);
  assert.equal(pins.length, 13054, "pins-compact.json must contain exactly 13,054 offline shops");
  assert.equal(bootstrap.platforms.length, 136, "atlas-bootstrap must contain all 136 online platforms");
  assert.equal(bootstrap.alleys.length, 664, "atlas-bootstrap must contain all 664 alleys");
  assert.equal(bootstrap.events.length, 88, "atlas-bootstrap must contain all 88 markets/events");

  // Validate 100% coordinate validity and tuple schema
  for (const pin of pins) {
    assert.equal(pin.length, 11, `Bad tuple length for ${pin[0]}`);
    const [, name, cc, citySlug, , , lng, lat] = pin;
    assert.ok(typeof name === "string" && name.length > 0, `Empty shop name on ${pin[0]}`);
    assert.match(cc, /^[A-Z]{2}$/, `Invalid country code ${cc}`);
    assert.match(citySlug, /^[a-z]{2}\/[a-z0-9-]+$/, `Invalid citySlug ${citySlug}`);
    assert.ok(Number.isFinite(lng) && lng >= -180 && lng <= 180, `Invalid lng ${lng} on ${pin[0]}`);
    assert.ok(Number.isFinite(lat) && lat >= -90 && lat <= 90, `Invalid lat ${lat} on ${pin[0]}`);
  }

  // Validate per-country shards sum to 13,054
  const shardFiles = fs.readdirSync(SHARDS_DIR).filter((f) => f.endsWith(".json"));
  assert.equal(shardFiles.length, 134, `Expected 134 lowercase country shards, got ${shardFiles.length}`);
  let shardSum = 0;
  for (const file of shardFiles) {
    assert.match(file, /^[a-z]{2}\.json$/, `Shard filename must be lowercase ISO2: ${file}`);
    const shard = JSON.parse(fs.readFileSync(path.join(SHARDS_DIR, file), "utf8"));
    shardSum += shard.shops.length;
  }
  assert.equal(shardSum, 13054, `Shard total must equal 13,054, got ${shardSum}`);

  // Verify every bootstrap platform matches runtime PLATFORMS URL builder
  const runtimeIds = new Set(PLATFORMS.map((p) => p.id));
  for (const p of bootstrap.platforms) {
    assert.ok(runtimeIds.has(p.id), `Bootstrap platform ${p.id} missing from src/data/platforms.ts`);
  }

  // Verify no country has a flag emoji field
  for (const c of bootstrap.countries) {
    assert.equal("flag" in c, false, `Country ${c.code} must not contain flag field`);
  }
});

test("2. Zero Unicode emojis, zero Mapbox/API tokens, zero banned copy, zero banned animations across src/ and public/data/", () => {
  const dataFiles = [
    path.join(DATA_DIR, "atlas-bootstrap.json"),
    path.join(DATA_DIR, "pins-compact.json"),
    ...walkFiles(SHARDS_DIR, [".json"]),
  ];

  for (const f of dataFiles) {
    const text = fs.readFileSync(f, "utf8");
    EMOJI_RE.lastIndex = 0;
    const hit = text.match(EMOJI_RE);
    assert.equal(hit, null, `Unicode emoji leaked into ${path.relative(ROOT, f)}: ${hit?.slice(0, 5)}`);
  }

  const srcFiles = walkFiles(path.join(ROOT, "src"), [".ts", ".tsx", ".css"]);
  const bannedPatterns = [
    { name: "mapbox-gl", re: /mapbox-gl|NEXT_PUBLIC_MAPBOX_TOKEN/ },
    { name: "hardcoded pk token", re: /['"]pk\.[A-Za-z0-9._-]{16,}['"]/ },
    { name: "banned personal/placeholder text", re: /KREAM\s*취업|준비\s*중|Coming\s+Soon|샘플\s*데이터/i },
    { name: "banned bounce/ping animation", re: /animate-bounce|animate-ping/ },
  ];

  for (const f of srcFiles) {
    const text = fs.readFileSync(f, "utf8");
    const rel = path.relative(ROOT, f);

    EMOJI_RE.lastIndex = 0;
    const emojiHit = text.match(EMOJI_RE);
    assert.equal(emojiHit, null, `Unicode emoji found in ${rel}: ${emojiHit?.slice(0, 5)}`);

    for (const rule of bannedPatterns) {
      assert.equal(rule.re.test(text), false, `${rule.name} found in ${rel}`);
    }
  }

  // Verify package.json has maplibre-gl and zero mapbox-gl
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.ok(pkg.dependencies?.["maplibre-gl"], "maplibre-gl must be installed in dependencies");
  assert.equal(pkg.dependencies?.["mapbox-gl"], undefined, "mapbox-gl must be removed");
  assert.equal(pkg.devDependencies?.["@types/mapbox-gl"], undefined, "@types/mapbox-gl must be removed");
});

test("3. Domain worldvintagemap.com, /v2/* 308 redirects, sitemap, RSS 2.0, and IndexNow verification key", async () => {
  assert.equal(SITE_URL, "https://worldvintagemap.com");

  // Verify /v2/* legacy URLs 308 to live pages (resolved in src/proxy.ts)
  const proxySrc = fs.readFileSync(path.join(ROOT, "src", "proxy.ts"), "utf8");
  assert.ok(proxySrc.includes("resolveLegacyPath"), "proxy.ts must resolve legacy /v2 URLs");
  assert.ok(proxySrc.includes("status: 308"), "proxy.ts must emit 308 Permanent Redirect");
  assert.deepEqual(resolveLegacyPath("/v2/ko/south-korea/seoul/", "en"), { redirect: "/ko/explore/kr/seoul" });

  // Verify IndexNow 32-char hex key file exists
  const indexNowKey = "a9d9b58ea7453d2f536fdc21f97c77ed";
  const keyFile = fs.readFileSync(path.join(ROOT, "public", `${indexNowKey}.txt`), "utf8").trim();
  assert.equal(keyFile, indexNowKey);
  assert.match(keyFile, /^[a-f0-9]{32}$/);

  // Verify sitemap output includes canonical worldvintagemap.com explore URLs
  const entries = await sitemap();
  assert.ok(entries.length > 500, `Sitemap expected > 500 URLs, got ${entries.length}`);
  assert.ok(
    entries.some((e) => e.url === "https://worldvintagemap.com/ko/explore/jp/tokyo"),
    "Sitemap missing /ko/explore/jp/tokyo",
  );
  assert.ok(
    entries.some((e) => e.url === "https://worldvintagemap.com/ko/explore/kr/seoul"),
    "Sitemap missing /ko/explore/kr/seoul",
  );

  // Verify RSS 2.0 XML feed
  const rssRes = await getRss();
  assert.equal(rssRes.status, 200);
  const rssText = await rssRes.text();
  assert.ok(rssText.includes('<rss version="2.0"'), "RSS feed must be RSS 2.0");
  assert.ok(rssText.includes("https://worldvintagemap.com/ko/explore/jp/tokyo"), "RSS missing Tokyo item");
  assert.ok(rssText.includes("https://worldvintagemap.com/ko/explore/kr/seoul"), "RSS missing Seoul item");
});

test("4. Hoodmaps 664 alley polygons (Convex Hull + fallback) and clean street stamps coverage", () => {
  const bootstrap = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "atlas-bootstrap.json"), "utf8"));
  const pins = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "pins-compact.json"), "utf8"));

  const zones = buildAlleyZoneGeoJson(bootstrap.alleys, pins);
  assert.equal(zones.stats.total, 664, "All 664 alleys must produce Hoodmaps polygons");
  assert.equal(zones.polygons.features.length, 664);
  assert.equal(zones.stamps.features.length, 664);
  assert.ok(zones.stats.convexHullCount >= 400, `Expected >= 400 Convex Hull alleys, got ${zones.stats.convexHullCount}`);

  // Verify every polygon ring is closed with >= 4 vertices and valid coords
  for (const feat of zones.polygons.features) {
    const ring = feat.geometry.coordinates[0];
    assert.ok(Array.isArray(ring) && ring.length >= 4, `Degenerate polygon on ${feat.id}`);
    assert.deepEqual(ring[0], ring[ring.length - 1], `Unclosed polygon ring on ${feat.id}`);
  }

  // Spot-check clean street stamps (including Paris & NYC overrides)
  const stampById = new Map(zones.stamps.features.map((f) => [f.properties.id, f.properties.stamp]));
  assert.equal(stampById.get("도쿄-01"), "SHIMOKITAZAWA");
  assert.equal(stampById.get("서울-02"), "SEONGSU");
  assert.equal(stampById.get("파리-01"), "LE MARAIS");
  assert.equal(stampById.get("뉴욕-01"), "SOHO · LES");
  assert.equal(stampById.get("런던-01"), "BRICK LANE");
  assert.equal(stampById.get("베를린-01"), "KREUZBERG");

  // Verify live local city clock formatting
  const tokyoClock = formatCityLocalClock("jp/tokyo", "JP", 139.69, new Date("2026-11-25T05:00:00Z"));
  assert.match(tokyoClock, /^14:00\s+/, `Unexpected Tokyo local clock: ${tokyoClock}`);
});

function pointInRing(pt, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInGeometry(pt, geom) {
  if (!geom) return false;
  if (geom.type === "Polygon") {
    if (!pointInRing(pt, geom.coordinates[0])) return false;
    for (let i = 1; i < geom.coordinates.length; i++) {
      if (pointInRing(pt, geom.coordinates[i])) return false;
    }
    return true;
  }
  if (geom.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      if (pointInRing(pt, poly[0])) {
        let hole = false;
        for (let i = 1; i < poly.length; i++) {
          if (pointInRing(pt, poly[i])) hole = true;
        }
        if (!hole) return true;
      }
    }
  }
  return false;
}

test("5. High-res world-countries.geojson (6 Korean coastal PIP true), zero legacy overlays, and zero expired/past events in live-events.json", () => {
  const wcRaw = fs.readFileSync(path.join(DATA_DIR, "world-countries.geojson"), "utf8");
  assert.ok(
    wcRaw.length < 3500 * 1024,
    `world-countries.geojson unexpectedly large: ${(wcRaw.length / 1024).toFixed(1)}KB`,
  );
  EMOJI_RE.lastIndex = 0;
  assert.equal(wcRaw.match(EMOJI_RE), null, "Emoji leaked into world-countries.geojson");

  const wc = JSON.parse(wcRaw);
  assert.ok(wc.features.length >= 170, `Expected >= 170 country polygons, got ${wc.features.length}`);
  const isoSet = new Set(wc.features.map((f) => f.properties.ISO_A2));
  for (const cc of ["KR", "JP", "FR", "NO", "US", "GB", "DE"]) {
    assert.ok(isoSet.has(cc), `world-countries.geojson missing ${cc}`);
  }

  // Korean coastline Point-in-Polygon precision check (Dangjin, Taean, Mokpo, Gwangju, Busan, Jeju)
  const krFeat = wc.features.find((f) => f.properties.ISO_A2 === "KR");
  const krPoints = [
    ["Dangjin", [126.63, 36.89]],
    ["Taean", [126.3, 36.75]],
    ["Mokpo", [126.39, 34.81]],
    ["Gwangju", [126.85, 35.16]],
    ["Busan", [129.07, 35.18]],
    ["Jeju", [126.53, 33.5]],
  ];
  for (const [label, pt] of krPoints) {
    assert.equal(
      pointInGeometry(pt, krFeat?.geometry),
      true,
      `Korean coastline precision check failed: ${label} (${pt.join(",")}) is outside KR polygon`,
    );
  }

  // Verify legacy mismatched external admin1/adm2 overlay files are purged
  assert.equal(
    fs.existsSync(path.join(DATA_DIR, "admin1-regions.geojson")),
    false,
    "Legacy admin1-regions.geojson overlay must be removed",
  );
  assert.equal(
    fs.existsSync(path.join(DATA_DIR, "adm2")),
    false,
    "Legacy adm2/ overlay directory must be removed",
  );

  // Verify live-events.json has ZERO expired/past events (2010-2025 or endDate < 2026-11-25)
  const leRaw = fs.readFileSync(path.join(DATA_DIR, "live-events.json"), "utf8");
  EMOJI_RE.lastIndex = 0;
  assert.equal(leRaw.match(EMOJI_RE), null, "Emoji leaked into live-events.json");
  assert.equal(/\b20(1\d|2[0-5])\b/.test(leRaw), false, "Past year (2010-2025) leaked into live-events.json");
  const le = JSON.parse(leRaw);
  assert.ok(le.totalCount >= 30, `Expected active/recurring events >= 30, got ${le.totalCount}`);
  for (const ev of le.events) {
    const isRec = Boolean(ev.isRecurring);
    const endOrNext = ev.endDate || ev.nextDate || "";
    assert.ok(
      isRec || endOrNext >= "2026-11-25",
      `Expired event leaked into live-events.json: ${ev.id} (${ev.nameKo}, date=${endOrNext})`,
    );
  }
});

test("6. live-events.json carries zero off-topic (IT / marketing / running) events; every Luma event is a vintage/flea market", async () => {
  const { isVintageMarketEvent } = await import("../scripts/sync-live-events.mjs");
  assert.equal(isVintageMarketEvent("Tokyo | Claude Meetup for Life Science Industry Data Scientists"), false);
  assert.equal(isVintageMarketEvent("Ahrefs Marketing Hub Tokyo, Winter 2026"), false);
  assert.equal(isVintageMarketEvent("11/26 19:30〜 赤坂Night | Tokyo Tower Run"), false);
  assert.equal(isVintageMarketEvent("XMAS MARKET — POP UP! 3D Printed Ceramics"), false);
  assert.equal(isVintageMarketEvent("Brooklyn Flea Winter Market"), true);
  assert.equal(isVintageMarketEvent("下北沢 古着マーケット"), true);

  const payload = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "live-events.json"), "utf8"));
  for (const ev of payload.events) {
    assert.doesNotMatch(ev.name, /meetup|hackathon|\bAI\b|claude|ahrefs|tower run/i, `Off-topic event leaked: ${ev.name}`);
    if (ev.source === "luma") {
      assert.ok(isVintageMarketEvent(`${ev.name} ${ev.venue ?? ""}`), `Non-vintage Luma event leaked: ${ev.name}`);
    }
  }
});

test("7. OSM opening hours are localised (ko/ja/en) and placeholder notes are hidden", async () => {
  const { formatOpeningHours, isMeaningfulNote } = await import("../src/lib/formatHours.ts");
  assert.equal(formatOpeningHours("Mo-Sa 10:00-19:00; Su off", "ko"), "월–토 10:00–19:00 · 일 휴무");
  assert.equal(formatOpeningHours("Tu,We 10:00-14:00; Mo off", "ja"), "火·水 10:00–14:00 · 月 定休");
  assert.equal(formatOpeningHours("Mo-Fr 10:00-17:00; Su,PH off", "en"), "Mon–Fri 10:00–17:00 · Sun·Holidays closed");
  assert.equal(formatOpeningHours("매일 12:00–20:00", "ko"), "매일 12:00–20:00");
  assert.equal(formatOpeningHours("13:00-19:00", "ko"), "13:00–19:00");
  assert.equal(formatOpeningHours("  ", "ko"), undefined);
  assert.equal(isMeaningfulNote("인스타 검색으로 영업 확인"), false);
  assert.equal(isMeaningfulNote(""), false);
  assert.equal(isMeaningfulNote("주말만 운영"), true);
});

test("8. External links only allow http(s); event expiry uses the real date", async () => {
  const { safeExternalUrl } = await import("../src/lib/safeUrl.ts");
  const { isActiveEvent, todayIso } = await import("../src/lib/activeEvents.ts");
  assert.equal(safeExternalUrl("javascript:alert(1)"), undefined);
  assert.equal(safeExternalUrl("data:text/html,<b>x</b>"), undefined);
  assert.equal(safeExternalUrl("/relative/path"), undefined);
  assert.equal(safeExternalUrl("HTTP://www.decrochezmoica.ca/"), "http://www.decrochezmoica.ca/");
  assert.equal(safeExternalUrl("https://map.naver.com/p/search/x"), "https://map.naver.com/p/search/x");
  assert.equal(todayIso(new Date("2027-03-01T12:00:00Z")), "2027-03-01");
  assert.equal(isActiveEvent({ isRecurring: false, endDate: "2026-11-24" }, "2026-11-25"), false);
  assert.equal(isActiveEvent({ isRecurring: false, endDate: "2026-11-25" }, "2026-11-25"), true);
  assert.equal(isActiveEvent({ isRecurring: true, endDate: "2020-01-01" }, "2026-11-25"), true);
});
