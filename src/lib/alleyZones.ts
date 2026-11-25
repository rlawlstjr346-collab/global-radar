import type { AtlasAlley, CompactPinTuple } from "./atlasTypes";

/**
 * Clean street-stamp overrides for major global vintage districts,
 * including administrative-name cleanups (e.g. Paris(Paris), New York County).
 */
const ALLEY_STAMP_OVERRIDES: Record<string, { stampEn: string; labelKo: string }> = {
  // Tokyo
  "도쿄-01": { stampEn: "SHIMOKITAZAWA", labelKo: "시모키타자와" },
  "도쿄-02": { stampEn: "HARAJUKU", labelKo: "하라주쿠" },
  "도쿄-03": { stampEn: "KOENJI", labelKo: "고엔지" },
  "도쿄-04": { stampEn: "DAIKANYAMA", labelKo: "다이칸야마" },
  "도쿄-05": { stampEn: "GINZA", labelKo: "긴자" },
  "도쿄-06": { stampEn: "SANGENJAYA", labelKo: "산겐자야" },
  "도쿄-07": { stampEn: "SHIBUYA", labelKo: "시부야" },
  "도쿄-08": { stampEn: "SHIBUYA WEST", labelKo: "시부야 서쪽" },
  "도쿄-09": { stampEn: "UENO", labelKo: "우에노" },
  "도쿄-10": { stampEn: "NAKANO", labelKo: "나카노" },
  "도쿄-14": { stampEn: "SHINJUKU", labelKo: "신주쿠" },
  "도쿄-16": { stampEn: "YUTENJI", labelKo: "유텐지" },
  "도쿄-20": { stampEn: "AOYAMA", labelKo: "미나미아오야마" },
  // Osaka
  "오사카-01": { stampEn: "AMEMURA", labelKo: "아메무라" },
  "오사카-02": { stampEn: "HORIE", labelKo: "호리에" },
  "오사카-03": { stampEn: "NAKAZAKICHO", labelKo: "나카자키초" },
  // Seoul
  "서울-01": { stampEn: "DONGMYO", labelKo: "동묘" },
  "서울-02": { stampEn: "SEONGSU", labelKo: "성수" },
  "서울-03": { stampEn: "MANGWON", labelKo: "망원" },
  "서울-04": { stampEn: "HONGDAE", labelKo: "홍대" },
  "서울-05": { stampEn: "YEONNAM", labelKo: "연남" },
  "서울-06": { stampEn: "HANNAM · ITAEWON", labelKo: "한남·이태원" },
  "서울-07": { stampEn: "GAROSUGIL", labelKo: "가로수길" },
  "서울-08": { stampEn: "HAPJEONG", labelKo: "합정" },
  "서울-09": { stampEn: "EULJIRO", labelKo: "을지로" },
  "서울-10": { stampEn: "HAEBANGCHON", labelKo: "해방촌" },
  "서울-11": { stampEn: "YEONHUI", labelKo: "연희동" },
  "서울-12": { stampEn: "SEOCHON", labelKo: "서촌" },
  "서울-13": { stampEn: "GWANGJANG", labelKo: "광장시장" },
  // Paris (replace raw Paris(Paris) administrative names with actual districts)
  "파리-01": { stampEn: "LE MARAIS", labelKo: "마레 지구" },
  "파리-02": { stampEn: "CANAL ST-MARTIN", labelKo: "생마르탱" },
  "파리-03": { stampEn: "SAINT-OUEN", labelKo: "생투앙 벼룩시장" },
  "파리-04": { stampEn: "PIGALLE", labelKo: "피갈" },
  // London
  "런던-01": { stampEn: "BRICK LANE", labelKo: "브릭레인" },
  "런던-02": { stampEn: "PORTOBELLO", labelKo: "포토벨로" },
  "런던-03": { stampEn: "CAMDEN", labelKo: "캠든" },
  "런던-04": { stampEn: "BLOOMSBURY", labelKo: "블룸즈버리" },
  "런던-05": { stampEn: "NOTTING HILL", labelKo: "노팅힐" },
  // New York (replace raw New York County / Kings County)
  "뉴욕-01": { stampEn: "SOHO · LES", labelKo: "소호·로어이스트" },
  "뉴욕-02": { stampEn: "WILLIAMSBURG", labelKo: "윌리엄스버그" },
  "뉴욕-03": { stampEn: "BUSHWICK", labelKo: "부시윅" },
  "뉴욕-04": { stampEn: "EAST VILLAGE", labelKo: "이스트빌리지" },
  // Berlin
  "베를린-01": { stampEn: "KREUZBERG", labelKo: "크로이츠베르크" },
  "베를린-02": { stampEn: "MITTE", labelKo: "미테" },
  "베를린-03": { stampEn: "PRENZLAUER BERG", labelKo: "프렌츨라우어 베르크" },
  "베를린-04": { stampEn: "FRIEDRICHSHAIN", labelKo: "프리드리히샤인" },
  "베를린-05": { stampEn: "NEUKOLLN", labelKo: "노이쾰른" },
};

const NAME_STAMP_FALLBACK: Record<string, string> = {
  "시모키타자와": "SHIMOKITAZAWA",
  "하라주쿠": "HARAJUKU",
  "고엔지": "KOENJI",
  "다이칸야마": "DAIKANYAMA",
  "긴자": "GINZA",
  "시부야": "SHIBUYA",
  "신주쿠": "SHINJUKU",
  "나카노": "NAKANO",
  "아메무라": "AMEMURA",
  "호리에": "HORIE",
  "동묘": "DONGMYO",
  "성수": "SEONGSU",
  "망원": "MANGWON",
  "홍대": "HONGDAE",
  "연남": "YEONNAM",
  "가로수길": "GAROSUGIL",
  "합정": "HAPJEONG",
  "을지로": "EULJIRO",
  "해방촌": "HAEBANGCHON",
  "서촌": "SEOCHON",
  "광장시장": "GWANGJANG",
  "남포동": "NAMPODONG",
  "서면": "SEOMYEON",
  "전포": "JEONPO",
};

/**
 * Resolves a clean Hoodmaps-style uppercase street stamp & localized display name.
 */
export function resolveAlleyDisplay(alley: Pick<AtlasAlley, "id" | "name" | "gu" | "dong">): {
  stamp: string;
  labelKo: string;
} {
  const override = ALLEY_STAMP_OVERRIDES[alley.id];
  if (override) {
    return { stamp: override.stampEn, labelKo: override.labelKo };
  }

  let clean = alley.name
    .replace(/\([^)]*\)/g, "")
    .replace(/·.*$/, "")
    .trim();
  if (!clean) clean = alley.dong || alley.gu || alley.name;

  const fallbackEn = NAME_STAMP_FALLBACK[clean];
  if (fallbackEn) {
    return { stamp: fallbackEn, labelKo: clean };
  }

  // If Latin-dominant, uppercase cleanly; otherwise show crisp short label
  const isLatin = /^[A-Za-z0-9\s\-'.&/À-ÿ]+$/.test(clean);
  const stamp = isLatin ? clean.toUpperCase().slice(0, 22) : clean.slice(0, 14);
  return { stamp, labelKo: clean };
}

type Pt = [number, number]; // [lng, lat]

/** Andrew's Monotone Chain 2D Convex Hull (returns CCW ring without duplicate closing point). */
function convexHull(points: Pt[]): Pt[] {
  if (points.length <= 2) return points;
  const pts = points
    .slice()
    .sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));

  const cross = (o: Pt, a: Pt, b: Pt) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: Pt[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: Pt[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Expands a CCW convex hull outward by `bufferMeters` with rounded corner vertices
 * so Hoodmaps-style street blocks wrap cleanly around perimeter shops.
 */
function bufferHull(hull: Pt[], bufferMeters: number): Pt[] {
  const n = hull.length;
  if (n < 3) return hull;
  let cy = 0;
  for (const [, y] of hull) cy += y;
  cy /= n;

  const latRad = (cy * Math.PI) / 180;
  const mPerDegLng = Math.max(111320 * Math.cos(latRad), 10000);
  const mPerDegLat = 110540;

  const ring: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = hull[(i - 1 + n) % n];
    const curr = hull[i];
    const next = hull[(i + 1) % n];

    // Outward unit normals of adjacent edges (in metric space)
    const e1x = (curr[0] - prev[0]) * mPerDegLng;
    const e1y = (curr[1] - prev[1]) * mPerDegLat;
    const l1 = Math.hypot(e1x, e1y) || 1;
    const n1x = e1y / l1;
    const n1y = -e1x / l1;

    const e2x = (next[0] - curr[0]) * mPerDegLng;
    const e2y = (next[1] - curr[1]) * mPerDegLat;
    const l2 = Math.hypot(e2x, e2y) || 1;
    const n2x = e2y / l2;
    const n2y = -e2x / l2;

    // 3 arc points per corner (n1, bisector, n2) for smooth Hoodmaps rounded block
    const bx = n1x + n2x;
    const by = n1y + n2y;
    const bl = Math.hypot(bx, by) || 1;
    const dirs: [number, number][] = [
      [n1x, n1y],
      [bx / bl, by / bl],
      [n2x, n2y],
    ];
    for (const [dx, dy] of dirs) {
      ring.push([
        Number((curr[0] + (dx * bufferMeters) / mPerDegLng).toFixed(6)),
        Number((curr[1] + (dy * bufferMeters) / mPerDegLat).toFixed(6)),
      ]);
    }
  }
  if (ring.length > 0) ring.push(ring[0]);
  return ring;
}

/** Builds a clean chamfered octagon / rounded block from a bbox or center + radiusMeters. */
function buildFallbackOctagon(
  center: Pt,
  bbox: [number, number, number, number] | undefined,
  minRadiusMeters = 90,
): Pt[] {
  const latRad = (center[1] * Math.PI) / 180;
  const mPerDegLng = Math.max(111320 * Math.cos(latRad), 10000);
  const mPerDegLat = 110540;
  const minDLng = minRadiusMeters / mPerDegLng;
  const minDLat = minRadiusMeters / mPerDegLat;

  let halfW = minDLng;
  let halfH = minDLat;
  let cx = center[0];
  let cy = center[1];

  if (bbox && bbox.length === 4 && bbox[2] > bbox[0] && bbox[3] > bbox[1]) {
    const padLng = 35 / mPerDegLng;
    const padLat = 35 / mPerDegLat;
    cx = (bbox[0] + bbox[2]) / 2;
    cy = (bbox[1] + bbox[3]) / 2;
    halfW = Math.max((bbox[2] - bbox[0]) / 2 + padLng, minDLng * 0.7);
    halfH = Math.max((bbox[3] - bbox[1]) / 2 + padLat, minDLat * 0.7);
  }

  // Chamfered 8-vertex rounded-rect feel
  const c = 0.58;
  const ring: Pt[] = [
    [cx - halfW * c, cy - halfH],
    [cx + halfW * c, cy - halfH],
    [cx + halfW, cy - halfH * c],
    [cx + halfW, cy + halfH * c],
    [cx + halfW * c, cy + halfH],
    [cx - halfW * c, cy + halfH],
    [cx - halfW, cy + halfH * c],
    [cx - halfW, cy - halfH * c],
  ].map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))]);
  ring.push(ring[0]);
  return ring;
}

export interface AlleyZoneCollections {
  polygons: GeoJSON.FeatureCollection<GeoJSON.Polygon>;
  stamps: GeoJSON.FeatureCollection<GeoJSON.Point>;
  stats: {
    total: number;
    convexHullCount: number;
    fallbackCount: number;
  };
}

/**
 * Generates Hoodmaps-style alley block polygons + bold street stamp points for ALL 664 alleys:
 * - >= 3 unique shop coords: Convex Hull + 40m rounded outward buffer
 * - 0..2 shop coords: chamfered bbox or 90m radius octagon around center
 */
export function buildAlleyZoneGeoJson(
  alleys: AtlasAlley[],
  pins: CompactPinTuple[],
): AlleyZoneCollections {
  const ptsByAlley = new Map<string, Pt[]>();
  for (const p of pins) {
    const aid = p[9];
    if (!aid) continue;
    const arr = ptsByAlley.get(aid) || [];
    arr.push([p[6], p[7]]);
    ptsByAlley.set(aid, arr);
  }

  const polygonFeatures: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  const stampFeatures: GeoJSON.Feature<GeoJSON.Point>[] = [];
  let convexHullCount = 0;
  let fallbackCount = 0;

  for (const alley of alleys) {
    const rawPts = ptsByAlley.get(alley.id) || [];
    // Deduplicate identical coordinates so hull stays non-degenerate
    const uniqueMap = new Map<string, Pt>();
    for (const pt of rawPts) {
      uniqueMap.set(`${pt[0].toFixed(5)},${pt[1].toFixed(5)}`, pt);
    }
    const uniquePts = Array.from(uniqueMap.values());

    let ring: Pt[];
    if (uniquePts.length >= 3) {
      const hull = convexHull(uniquePts);
      if (hull.length >= 3) {
        ring = bufferHull(hull, 40);
        convexHullCount++;
      } else {
        ring = buildFallbackOctagon(alley.center, alley.bbox, 90);
        fallbackCount++;
      }
    } else {
      ring = buildFallbackOctagon(alley.center, alley.bbox, 90);
      fallbackCount++;
    }

    const { stamp, labelKo } = resolveAlleyDisplay(alley);
    const stampLabelEn = alley.count > 0 ? `${stamp} · ${alley.count}` : stamp;
    const stampLabelKo =
      alley.count > 0
        ? `${labelKo} · ${alley.count}`
        : labelKo;

    const props = {
      id: alley.id,
      name: labelKo,
      stamp,
      stampLabel: stampLabelEn,
      stampLabelKo,
      citySlug: alley.citySlug,
      cityKo: alley.cityKo,
      cityEn: alley.cityEn,
      country: alley.country,
      count: alley.count,
      featured: alley.featured,
    };

    polygonFeatures.push({
      type: "Feature",
      id: alley.id,
      geometry: {
        type: "Polygon",
        coordinates: [ring],
      },
      properties: props,
    });

    stampFeatures.push({
      type: "Feature",
      id: alley.id,
      geometry: {
        type: "Point",
        coordinates: alley.center,
      },
      properties: props,
    });
  }

  return {
    polygons: { type: "FeatureCollection", features: polygonFeatures },
    stamps: { type: "FeatureCollection", features: stampFeatures },
    stats: {
      total: polygonFeatures.length,
      convexHullCount,
      fallbackCount,
    },
  };
}

const CITY_TIMEZONES: Record<string, string> = {
  "jp/tokyo": "Asia/Tokyo",
  "jp/osaka": "Asia/Tokyo",
  "jp/kyoto": "Asia/Tokyo",
  "kr/seoul": "Asia/Seoul",
  "kr/busan": "Asia/Seoul",
  "fr/paris": "Europe/Paris",
  "gb/london": "Europe/London",
  "us/new-york-city": "America/New_York",
  "us/los-angeles": "America/Los_Angeles",
  "de/berlin": "Europe/Berlin",
  "th/bangkok": "Asia/Bangkok",
  "nl/amsterdam": "Europe/Amsterdam",
  "it/milan": "Europe/Rome",
  "tw/taipei": "Asia/Taipei",
  "es/barcelona": "Europe/Madrid",
  "au/melbourne": "Australia/Melbourne",
  "hk/hong-kong": "Asia/Hong_Kong",
  "dk/copenhagen": "Europe/Copenhagen",
  "se/stockholm": "Europe/Stockholm",
  "pt/lisbon": "Europe/Lisbon",
  "br/sao-paulo": "America/Sao_Paulo",
  "ph/manila": "Asia/Manila",
  "vn/hanoi": "Asia/Ho_Chi_Minh",
  "vn/ho-chi-minh-city": "Asia/Ho_Chi_Minh",
};

const COUNTRY_TIMEZONES: Record<string, string> = {
  KR: "Asia/Seoul",
  JP: "Asia/Tokyo",
  FR: "Europe/Paris",
  GB: "Europe/London",
  DE: "Europe/Berlin",
  IT: "Europe/Rome",
  ES: "Europe/Madrid",
  NL: "Europe/Amsterdam",
  BE: "Europe/Brussels",
  SE: "Europe/Stockholm",
  DK: "Europe/Copenhagen",
  PT: "Europe/Lisbon",
  TH: "Asia/Bangkok",
  TW: "Asia/Taipei",
  HK: "Asia/Hong_Kong",
  SG: "Asia/Singapore",
  VN: "Asia/Ho_Chi_Minh",
  PH: "Asia/Manila",
  ID: "Asia/Jakarta",
  MY: "Asia/Kuala_Lumpur",
  IN: "Asia/Kolkata",
  CN: "Asia/Shanghai",
  AU: "Australia/Sydney",
  NZ: "Pacific/Auckland",
  BR: "America/Sao_Paulo",
  MX: "America/Mexico_City",
  AR: "America/Argentina/Buenos_Aires",
  TR: "Europe/Istanbul",
  PL: "Europe/Warsaw",
  AT: "Europe/Vienna",
  CH: "Europe/Zurich",
  GR: "Europe/Athens",
  CZ: "Europe/Prague",
  FI: "Europe/Helsinki",
  NO: "Europe/Oslo",
};

/**
 * Formats live local 24h time + short timezone label (e.g. "14:25 JST")
 * for any locked city on the 3D globe.
 */
export function formatCityLocalClock(
  citySlug: string | null,
  countryCode: string | null,
  lng: number,
  now: Date = new Date(),
): string {
  const tz =
    (citySlug && CITY_TIMEZONES[citySlug]) ||
    (countryCode && COUNTRY_TIMEZONES[countryCode]);

  if (tz) {
    try {
      const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZoneName: "short",
      }).formatToParts(now);
      const hh = parts.find((p) => p.type === "hour")?.value ?? "00";
      const mm = parts.find((p) => p.type === "minute")?.value ?? "00";
      const tzName = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
      return tzName ? `${hh}:${mm} ${tzName}` : `${hh}:${mm}`;
    } catch {
      // Fall through to longitude-based UTC offset
    }
  }

  const offsetHours = Math.round(lng / 15);
  const shifted = new Date(now.getTime() + offsetHours * 3600 * 1000);
  const hh = String(shifted.getUTCHours()).padStart(2, "0");
  const mm = String(shifted.getUTCMinutes()).padStart(2, "0");
  const sign = offsetHours >= 0 ? "+" : "";
  return `${hh}:${mm} UTC${sign}${offsetHours}`;
}
