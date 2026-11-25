#!/usr/bin/env node
/**
 * Lossless 137-country online + offline global digging atlas builder.
 *
 * Reads read-only source datasets from:
 *   - ~/minimap/data/{app.json, pins.json, src/country_names.json, src/city_names.json, src/events.json}
 *   - ./src/data/{countries.ts, platforms.ts}
 *
 * Emits lightweight static artifacts into ./public/data/:
 *   1) public/data/atlas-bootstrap.json   (137 countries, 739 cities, 664 alleys, 136 platforms, 88 events)
 *   2) public/data/pins-compact.json      (13,054 ultra-light tuples)
 *   3) public/data/shops/[cc].json        (134 lowercase per-country lazy shards, totaling 13,054 shops)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const MINIMAP_DATA = process.env.MINIMAP_DATA_DIR || path.join(os.homedir(), "minimap", "data");
const OUT_DIR = path.join(ROOT, "public", "data");
const SHARDS_DIR = path.join(OUT_DIR, "shops");

// ---------------------------------------------------------------------------
// 1. Emoji & decorative pictograph incinerator (preserves all real scripts)
// ---------------------------------------------------------------------------
const EMOJI_REGEX =
  /[\u{1F1E6}-\u{1F1FF}]|\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}]|[\uFE0E\uFE0F\u20E3]|[\u2600-\u27BF]|\u200D/gu;

export function stripEmojis(input) {
  if (typeof input !== "string") return "";
  return input
    .replace(EMOJI_REGEX, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanOptional(input) {
  const s = stripEmojis(input);
  return s ? s : undefined;
}

// ---------------------------------------------------------------------------
// 2. Continent & fallback country coordinates for all 137+ countries
// ---------------------------------------------------------------------------
const EXTRA_CONTINENTS = {
  AE: "Asia",
  AL: "Europe",
  AM: "Asia",
  BA: "Europe",
  BB: "Americas",
  BF: "Africa",
  BM: "Americas",
  BN: "Asia",
  BS: "Americas",
  BW: "Africa",
  BY: "Europe",
  BZ: "Americas",
  CG: "Africa",
  CU: "Americas",
  FJ: "Oceania",
  GA: "Africa",
  HN: "Americas",
  IR: "Asia",
  JM: "Americas",
  KG: "Asia",
  KY: "Americas",
  MC: "Europe",
  MD: "Europe",
  MG: "Africa",
  MK: "Europe",
  MO: "Asia",
  MT: "Europe",
  MU: "Africa",
  PG: "Oceania",
  PR: "Americas",
  RW: "Africa",
  SM: "Europe",
  SV: "Americas",
  TT: "Americas",
  WS: "Oceania",
  XK: "Europe",
};

// Curated digging sanctuary cities (in priority order)
const CURATED_CITY_KEYS = [
  "JP|도쿄",
  "KR|서울",
  "FR|파리",
  "GB|런던",
  "US|뉴욕",
  "US|로스앤젤레스",
  "JP|오사카",
  "DE|베를린",
  "TH|방콕",
  "NL|암스테르담",
  "IT|밀라노",
  "TW|타이베이",
  "KR|부산",
  "JP|교토",
  "ES|바르셀로나",
  "AU|멜버른",
  "HK|홍콩",
  "DK|코펜하겐",
  "SE|스톡홀름",
  "PT|리스본",
  "BR|상파울루",
  "PH|마닐라",
  "VN|하노이",
  "VN|호찌민",
];

// Clean Korean->English overrides for cities missing from city_names.json
const KO_CITY_EN_OVERRIDES = {
  "성남": "Seongnam",
  "군산": "Gunsan",
  "익산": "Iksan",
  "양산": "Yangsan",
  "김해": "Gimhae",
  "진주": "Jinju",
  "원주": "Wonju",
  "춘천": "Chuncheon",
  "경주": "Gyeongju",
  "포항": "Pohang",
  "구미": "Gumi",
  "여수": "Yeosu",
  "순천": "Suncheon",
  "목포": "Mokpo",
  "안양": "Anyang",
  "안산": "Ansan",
  "부천": "Bucheon",
  "고양": "Goyang",
  "용인": "Yongin",
  "평택": "Pyeongtaek",
  "화성": "Hwaseong",
  "파주": "Paju",
  "김포": "Gimpo",
  "시흥": "Siheung",
  "광명": "Gwangmyeong",
  "의정부": "Uijeongbu",
  "남양주": "Namyangju",
  "하남": "Hanam",
  "구리": "Guri",
  "오산": "Osan",
  "이천": "Icheon",
  "안성": "Anseong",
  "군포": "Gunpo",
  "의왕": "Uiwang",
  "과천": "Gwacheon",
  "포천": "Pocheon",
  "양주": "Yangju",
  "동두천": "Dongducheon",
  "여주": "Yeoju",
  "광주시": "Gwangju-si",
  "강릉": "Gangneung",
  "속초": "Sokcho",
  "동해": "Donghae",
  "삼척": "Samcheok",
  "태백": "Taebaek",
  "충주": "Chungju",
  "제천": "Jecheon",
  "아산": "Asan",
  "서산": "Seosan",
  "당진": "Dangjin",
  "논산": "Nonsan",
  "보령": "Boryeong",
  "공주": "Gongju",
  "정읍": "Jeongeup",
  "남원": "Namwon",
  "김제": "Gimje",
  "나주": "Naju",
  "광양": "Gwangyang",
  "안동": "Andong",
  "영주": "Yeongju",
  "영천": "Yeongcheon",
  "상주": "Sangju",
  "문경": "Mungyeong",
  "경산": "Gyeongsan",
  "통영": "Tongyeong",
  "사천": "Sacheon",
  "밀양": "Miryang",
  "거제": "Geoje",
  "서귀포": "Seogwipo",
  "구라시키": "Kurashiki",
  "시모키타자와": "Shimokitazawa",
  "사이타마현": "Saitama",
  "오사카부": "Osaka Pref.",
  "아이치현": "Aichi",
  "후쿠오카현": "Fukuoka Pref.",
  "지바현": "Chiba",
  "효고현": "Hyogo",
  "가나가와현": "Kanagawa",
  "홋카이도": "Hokkaido",
  "오키나와현": "Okinawa",
  "기후현": "Gifu",
  "도쿄도": "Tokyo Metro",
  "니가타현": "Niigata",
  "이바라키현": "Ibaraki",
  "미야기현": "Miyagi",
  "시즈오카현": "Shizuoka",
  "히로시마현": "Hiroshima Pref.",
  "교토부": "Kyoto Pref.",
  "나가노현": "Nagano",
  "군마현": "Gunma",
  "도치기현": "Tochigi",
  "오카야마현": "Okayama",
  "구마모토현": "Kumamoto",
  "미에현": "Mie",
  "가고시마현": "Kagoshima",
  "이시카와현": "Ishikawa",
  "나라현": "Nara",
  "시가현": "Shiga",
  "후쿠시마현": "Fukushima",
  "에히메현": "Ehime",
  "가가와현": "Kagawa",
  "오이타현": "Oita",
  "나가사키현": "Nagasaki",
  "야마구치현": "Yamaguchi",
  "미야자키현": "Miyazaki",
  "아오모리현": "Aomori",
  "이와테현": "Iwate",
  "야마가타현": "Yamagata",
  "아키타현": "Akita",
  "도야마현": "Toyama",
  "후쿠이현": "Fukui",
  "야마나시현": "Yamanashi",
  "와카야마현": "Wakayama",
  "도쿠시마현": "Tokushima",
  "고치현": "Kochi",
  "사가현": "Saga",
  "돗토리현": "Tottori",
  "시마네현": "Shimane",
};

// Minimal Revised Romanization of Hangul fallback so every slug is pure ASCII
const CHO = [
  "g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h",
];
const JUNG = [
  "a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i",
];
const JONG = [
  "", "k", "k", "k", "n", "n", "n", "t", "l", "l", "l", "l", "l", "l", "l", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t",
];

function romanizeHangul(str) {
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const cho = Math.floor(offset / 588);
      const jung = Math.floor((offset % 588) / 28);
      const jong = offset % 28;
      out += CHO[cho] + JUNG[jung] + JONG[jong];
    } else {
      out += ch;
    }
  }
  return out;
}

function slugifyAscii(raw) {
  const normalized = romanizeHangul(stripEmojis(raw))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || "other";
}

function resolveCityLabels(cc, rawCity, cityNamesMap, countryEn) {
  const cleanRaw = stripEmojis(rawCity) || "기타";
  const key = `${cc}|${cleanRaw}`;
  const entry = cityNamesMap[key];

  let nameKo = cleanRaw;
  let nameEn = "";
  let nameNative;

  if (entry) {
    nameEn = stripEmojis(entry.en || "") || cleanRaw;
    // Keep concise Korean display (e.g. "서울" rather than "서울특별시")
    nameKo = cleanRaw;
    const nativeCandidate = entry.ja || entry.fr || entry.de || entry.es || entry.it || entry.zh;
    if (nativeCandidate && nativeCandidate !== nameEn && nativeCandidate !== nameKo) {
      nameNative = stripEmojis(nativeCandidate);
    }
  } else if (cleanRaw.includes("(기타)")) {
    const base = cleanRaw.replace("(기타)", "").trim();
    const baseEn = KO_CITY_EN_OVERRIDES[base] || (base === countryEn ? countryEn : null);
    nameEn = baseEn ? `${baseEn} (Other)` : `${countryEn} (Other)`;
  } else if (KO_CITY_EN_OVERRIDES[cleanRaw]) {
    nameEn = KO_CITY_EN_OVERRIDES[cleanRaw];
  } else {
    // Clean romanization capitalized
    const rom = romanizeHangul(cleanRaw);
    nameEn = rom.charAt(0).toUpperCase() + rom.slice(1);
  }

  return { nameKo, nameEn, nameNative };
}

// ---------------------------------------------------------------------------
// 3. Platform spectrum classifier (FASHION / GENERAL / TECH/ARCHIVE / LUXURY)
// ---------------------------------------------------------------------------
function classifyPlatformSpectrum(platform) {
  const haystack = `${platform.id} ${platform.name} ${platform.notes || ""}`.toLowerCase();
  if (
    /vestiaire|therealreal|rebag|fashionphile|chronext|chrono24|luxury/.test(haystack)
  ) {
    return { spectrum: "LUXURY", tags: ["LUXURY", "DESIGNER", "AUTHENTICATED"] };
  }
  if (
    /grailed|depop|vinted|poshmark|thredup|bunjang|2ndstreet|kindal|ragtag|zara|zalando|sellpy|tise|vestiaire|curtsy|heroine|fruit/.test(
      haystack,
    )
  ) {
    return { spectrum: "FASHION", tags: ["FASHION", "VINTAGE", "ARCHIVE"] };
  }
  if (
    /mercari|yahoo|rakuma|paypay|fril|surugaya|hardoff|mandarake|kream|joonggonara|daangn|karrot|xianyu|goofish|carousell|leboncoin|kleinanzeigen|subito|wallapop|marktplaats|ebay|etsy|trademe|blocket|finn|dba|tori|willhaben|ricardo|tutti|avito/.test(
      haystack,
    )
  ) {
    if (/mercari|yahoo|bunjang|xianyu|goofish|leboncoin|ebay|etsy|rakuma/.test(haystack)) {
      return { spectrum: "TECH/ARCHIVE", tags: ["ARCHIVE", "VINTAGE", "COLLECTIBLES"] };
    }
    return { spectrum: "GENERAL", tags: ["LOCAL", "SECONDHAND", "ALL-CATEGORY"] };
  }
  return { spectrum: "GENERAL", tags: ["LOCAL", "CLASSIFIEDS"] };
}

// ---------------------------------------------------------------------------
// 4. Parse src/data/countries.ts & src/data/platforms.ts statically (no TS transpiler needed)
// ---------------------------------------------------------------------------
function parseCountriesTs() {
  const file = fs.readFileSync(path.join(ROOT, "src", "data", "countries.ts"), "utf8");
  const list = [];
  const regex =
    /\{\s*code:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)",(?:\s*nativeName:\s*"([^"]+)",)?(?:\s*flag:\s*"[^"]+",)?\s*continent:\s*"([^"]+)",\s*coordinates:\s*\[\s*([-\d.]+),\s*([-\d.]+)\s*\]\s*\}/g;
  let m;
  while ((m = regex.exec(file)) !== null) {
    list.push({
      code: m[1],
      name: m[2],
      nativeName: m[3] || undefined,
      continent: m[4],
      coordinates: [Number(m[5]), Number(m[6])],
    });
  }
  if (list.length !== 101) {
    throw new Error(`Expected 101 countries from src/data/countries.ts, parsed ${list.length}`);
  }
  return list;
}

function parsePlatformsTs() {
  const file = fs.readFileSync(path.join(ROOT, "src", "data", "platforms.ts"), "utf8");
  const startIdx = file.indexOf("const RAW_PLATFORMS");
  const endIdx = file.indexOf("export const PLATFORMS:");
  if (startIdx === -1 || endIdx === -1) {
    throw new Error("Could not locate RAW_PLATFORMS in src/data/platforms.ts");
  }
  const block = file.slice(startIdx, endIdx);
  const items = [];
  // Match each platform object entry
  const objRegex =
    /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",([\s\S]*?)verified:\s*(true|false),([\s\S]*?)\},/g;
  let m;
  while ((m = objRegex.exec(block)) !== null) {
    const id = m[1];
    const name = m[2];
    const middle = m[3];
    const verified = m[4] === "true";
    const tail = m[5];

    const nativeMatch = middle.match(/nativeName:\s*"([^"]+)"/);
    const countryMatch = middle.match(/country:\s*"([A-Z]{2})"/);
    const homepageMatch = middle.match(/homepage:\s*"([^"]+)"/);
    const notesMatch = tail.match(/notes:\s*(?:"([^"]*)"|'([^']*)')/);

    if (!countryMatch || !homepageMatch) {
      throw new Error(`Failed to parse platform ${id}`);
    }

    const platform = {
      id,
      name: stripEmojis(name),
      nativeName: nativeMatch ? stripEmojis(nativeMatch[1]) : undefined,
      country: countryMatch[1],
      homepage: homepageMatch[1],
      verified,
      notes: notesMatch ? notesMatch[1] || notesMatch[2] || "" : "",
    };
    const { spectrum, tags } = classifyPlatformSpectrum(platform);
    items.push({
      id: platform.id,
      name: platform.name,
      ...(platform.nativeName ? { nativeName: platform.nativeName } : {}),
      country: platform.country,
      homepage: platform.homepage,
      verified: platform.verified,
      spectrum,
      tags,
    });
  }

  if (items.length !== 136) {
    throw new Error(`Expected 136 platforms from src/data/platforms.ts, parsed ${items.length}`);
  }
  return items;
}

// ---------------------------------------------------------------------------
// 5. Main build pipeline
// ---------------------------------------------------------------------------
async function main() {
  const t0 = Date.now();
  if (!fs.existsSync(path.join(MINIMAP_DATA, "app.json"))) {
    throw new Error(`minimap data not found at ${MINIMAP_DATA}`);
  }

  const app = JSON.parse(fs.readFileSync(path.join(MINIMAP_DATA, "app.json"), "utf8"));
  const pinsRaw = JSON.parse(fs.readFileSync(path.join(MINIMAP_DATA, "pins.json"), "utf8"));
  const countryNamesRaw = JSON.parse(
    fs.readFileSync(path.join(MINIMAP_DATA, "src", "country_names.json"), "utf8"),
  );
  const cityNamesRaw = JSON.parse(
    fs.readFileSync(path.join(MINIMAP_DATA, "src", "city_names.json"), "utf8"),
  );

  const onlineCountries = parseCountriesTs();
  const onlineCountryMap = new Map(onlineCountries.map((c) => [c.code, c]));
  const platforms = parsePlatformsTs();

  // Verify lossless place count against pins.json
  const allPlaces = app.places || [];
  if (allPlaces.length !== 13054 || pinsRaw.length !== 13054) {
    throw new Error(
      `Expected 13,054 places & pins, got places=${allPlaces.length}, pins=${pinsRaw.length}`,
    );
  }

  // Gather all union country codes (137+)
  const allCountryCodes = new Set([
    ...onlineCountries.map((c) => c.code),
    ...allPlaces.map((p) => p.country),
  ]);

  const KEEP_LANGS = [
    "en", "ko", "ja", "zh", "fr", "de", "es", "it", "pt", "nl", "th", "vi", "id", "ms",
    "ru", "uk", "ar", "tr", "pl", "sv", "da", "fi", "no", "cs", "ro", "hu", "el", "he",
  ];

  // Build country lookup for English name (needed for city fallback labels)
  const countryEnMap = new Map();
  const countryKoMap = new Map();
  const countryNamesCleaned = new Map();

  for (const cc of allCountryCodes) {
    const rawNames = countryNamesRaw[cc] || {};
    const online = onlineCountryMap.get(cc);
    const nameEn = stripEmojis(online?.name || rawNames.en || cc);
    const nameKo = stripEmojis(rawNames.ko || nameEn);
    const names = {};
    for (const lang of KEEP_LANGS) {
      const val = lang === "no" ? rawNames.nb || rawNames.no : rawNames[lang];
      if (val) names[lang] = stripEmojis(val);
    }
    names.en = nameEn;
    names.ko = nameKo;
    countryEnMap.set(cc, nameEn);
    countryKoMap.set(cc, nameKo);
    countryNamesCleaned.set(cc, names);
  }

  // Normalize all cities (739) & assign unique slugs per country
  const cityMetaByRawKey = new Map();
  const usedCitySlugPerCountry = new Map();

  function getOrCreateCityMeta(cc, rawCity) {
    const cleanRaw = stripEmojis(rawCity) || "기타";
    const key = `${cc}|${cleanRaw}`;
    if (cityMetaByRawKey.has(key)) return cityMetaByRawKey.get(key);

    const countryEn = countryEnMap.get(cc) || cc;
    const { nameKo, nameEn, nameNative } = resolveCityLabels(cc, cleanRaw, cityNamesRaw, countryEn);
    let baseSlug = slugifyAscii(nameEn);
    const used = usedCitySlugPerCountry.get(cc) || new Set();
    let candidate = baseSlug;
    let suffix = 2;
    while (used.has(candidate)) {
      candidate = `${baseSlug}-${suffix++}`;
    }
    used.add(candidate);
    usedCitySlugPerCountry.set(cc, used);

    const slug = `${cc.toLowerCase()}/${candidate}`;
    const meta = {
      slug,
      citySlug: candidate,
      country: cc,
      rawCity: cleanRaw,
      nameKo,
      nameEn,
      ...(nameNative ? { nameNative } : {}),
    };
    cityMetaByRawKey.set(key, meta);
    return meta;
  }

  // Pre-seed from app.cities so major cities get the primary clean slugs first (sorted by shop count desc)
  const sortedRawCities = [...(app.cities || [])].sort((a, b) => (b.count || 0) - (a.count || 0));
  for (const c of sortedRawCities) {
    getOrCreateCityMeta(c.country, c.name);
  }

  // Clean alleys (664)
  const alleyById = new Map();
  const alleysByCityKey = new Map();
  const alleysList = [];

  for (const a of app.alleys || []) {
    const cityMeta = getOrCreateCityMeta(a.country, a.city);
    let cleanName = stripEmojis(a.name || "");
    // Remove redundant "Paris(Paris)" -> "Paris" if duplicated
    const dupMatch = cleanName.match(/^(.+?)\(\1\)$/);
    if (dupMatch) cleanName = dupMatch[1].trim();
    const dong = cleanOptional(a.dong);
    const gu = cleanOptional(a.gu);
    if (cleanName === cityMeta.nameEn && gu && gu !== cleanName) {
      cleanName = gu;
    } else if (cleanName === cityMeta.nameEn && dong && dong !== cleanName) {
      cleanName = dong;
    }

    const alleyObj = {
      id: a.id,
      citySlug: cityMeta.slug,
      cityKo: cityMeta.nameKo,
      cityEn: cityMeta.nameEn,
      country: a.country,
      name: cleanName || cityMeta.nameKo,
      ...(dong ? { dong } : {}),
      ...(gu ? { gu } : {}),
      count: Number(a.count || 0),
      featured: Number(a.featured || 0),
      center: [
        Number(Number(a.center[0]).toFixed(5)),
        Number(Number(a.center[1]).toFixed(5)),
      ],
      ...(Array.isArray(a.bbox) && a.bbox.length === 4
        ? { bbox: a.bbox.map((n) => Number(Number(n).toFixed(5))) }
        : {}),
      ...(a.course?.minutes ? { walkMin: Number(a.course.minutes) } : {}),
      ...(a.course?.walk_m ? { walkM: Number(a.course.walk_m) } : {}),
      ...(a.course?.start ? { startStation: cleanOptional(a.course.start) } : {}),
    };

    alleyById.set(alleyObj.id, alleyObj);
    alleysList.push(alleyObj);

    const ck = `${a.country}|${stripEmojis(a.city)}`;
    const arr = alleysByCityKey.get(ck) || [];
    arr.push(alleyObj);
    alleysByCityKey.set(ck, arr);
  }

  // Process all 13,054 places into compact pins + 134 per-country shards
  const compactPins = [];
  const shardsByCountry = new Map();
  const countryCoordAccum = new Map();
  const countryShopCounts = new Map();
  const countryFeaturedCounts = new Map();

  for (const p of allPlaces) {
    const cc = String(p.country).toUpperCase();
    const lng = Number(Number(p.geo.lng).toFixed(5));
    const lat = Number(Number(p.geo.lat).toFixed(5));
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new Error(`Invalid coordinates on place ${p.id}: [${lng}, ${lat}]`);
    }

    const cityMeta = getOrCreateCityMeta(cc, p.city);
    const name = stripEmojis(p.name) || stripEmojis(p.name_en) || p.id;
    const nameEn = cleanOptional(p.name_en);
    const kind = p.kind || "vintage";
    const alleyId = typeof p.alley === "string" ? p.alley : "";
    const alleyObj = alleyId ? alleyById.get(alleyId) : undefined;
    const featured = p.featured ? 1 : 0;

    compactPins.push([
      p.id,
      name,
      cc,
      cityMeta.slug,
      cityMeta.nameKo,
      cityMeta.nameEn,
      lng,
      lat,
      kind,
      alleyId,
      featured,
    ]);

    // Build clean detailed shop record for shard
    const channels = {};
    if (p.channels && typeof p.channels === "object") {
      if (p.channels.website) channels.website = String(p.channels.website).trim();
      if (p.channels.instagram) {
        const ig = String(p.channels.instagram).trim().replace(/^@/, "");
        channels.instagram = ig.startsWith("http") ? ig : `https://www.instagram.com/${ig}/`;
      }
      if (p.channels.kakao) channels.kakao = String(p.channels.kakao).trim();
      if (p.channels.naver) channels.naver = String(p.channels.naver).trim();
      if (p.channels.osm) channels.osm = String(p.channels.osm).trim();
    }

    const sources = [];
    if (Array.isArray(p.links)) {
      for (const l of p.links.slice(0, 4)) {
        if (l?.url) {
          sources.push({
            title: stripEmojis(l.title || l.publisher || "Source"),
            ...(l.publisher ? { publisher: stripEmojis(l.publisher) } : {}),
            url: String(l.url).trim(),
            ...(l.type ? { type: String(l.type) } : {}),
          });
        }
      }
    }

    const near =
      p.near && p.near.name
        ? {
            name: stripEmojis(p.near.name),
            ...(p.near.name_ko ? { nameKo: stripEmojis(p.near.name_ko) } : {}),
            ...(typeof p.near.m === "number" ? { m: Math.round(p.near.m) } : {}),
            ...(typeof p.near.walk_min === "number" ? { walkMin: Math.round(p.near.walk_min) } : {}),
          }
        : undefined;

    const curation = Array.isArray(p.curation)
      ? p.curation.map((c) => stripEmojis(c)).filter(Boolean)
      : undefined;

    const shopDetail = {
      id: p.id,
      name,
      ...(nameEn && nameEn !== name ? { nameEn } : {}),
      country: cc,
      citySlug: cityMeta.slug,
      cityKo: cityMeta.nameKo,
      cityEn: cityMeta.nameEn,
      ...(cleanOptional(p.gu) ? { gu: cleanOptional(p.gu) } : {}),
      ...(cleanOptional(p.address) ? { address: cleanOptional(p.address) } : {}),
      ...(cleanOptional(p.floor) ? { floor: cleanOptional(p.floor) } : {}),
      ...(cleanOptional(p.hours) ? { hours: cleanOptional(p.hours) } : {}),
      lng,
      lat,
      kind,
      featured: Boolean(p.featured),
      ...(alleyId ? { alley: alleyId } : {}),
      ...(alleyObj ? { alleyName: alleyObj.name } : {}),
      ...(near ? { near } : {}),
      ...(Array.isArray(p.format) && p.format.length ? { format: p.format.map(stripEmojis).filter(Boolean) } : {}),
      ...(Array.isArray(p.style) && p.style.length ? { style: p.style.map(stripEmojis).filter(Boolean) } : {}),
      ...(curation && curation.length ? { curation } : {}),
      ...(cleanOptional(p.review_note) ? { note: cleanOptional(p.review_note) } : {}),
      ...(Object.keys(channels).length ? { channels } : {}),
      ...(sources.length ? { sources } : {}),
    };

    const shardArr = shardsByCountry.get(cc) || [];
    shardArr.push(shopDetail);
    shardsByCountry.set(cc, shardArr);

    countryShopCounts.set(cc, (countryShopCounts.get(cc) || 0) + 1);
    if (featured) countryFeaturedCounts.set(cc, (countryFeaturedCounts.get(cc) || 0) + 1);

    const acc = countryCoordAccum.get(cc) || { lng: 0, lat: 0, n: 0 };
    acc.lng += lng;
    acc.lat += lat;
    acc.n += 1;
    countryCoordAccum.set(cc, acc);
  }

  // Sort each shard: featured first, then alley grouped, then name
  for (const [, list] of shardsByCountry) {
    list.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  // Build cities array (739 cities)
  const curatedSet = new Set(CURATED_CITY_KEYS);
  const citiesList = [];
  const cityByRawKeyObj = new Map();

  for (const c of sortedRawCities) {
    const cleanRaw = stripEmojis(c.name);
    const rawKey = `${c.country}|${cleanRaw}`;
    const meta = getOrCreateCityMeta(c.country, cleanRaw);
    const cityAlleys = (alleysByCityKey.get(rawKey) || [])
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 12)
      .map((a) => ({
        id: a.id,
        name: a.name,
        ...(a.dong ? { dong: a.dong } : {}),
        ...(a.gu ? { gu: a.gu } : {}),
        count: a.count,
        featured: a.featured,
        center: a.center,
        ...(a.bbox ? { bbox: a.bbox } : {}),
        ...(a.walkMin ? { walkMin: a.walkMin } : {}),
        ...(a.walkM ? { walkM: a.walkM } : {}),
        ...(a.startStation ? { startStation: a.startStation } : {}),
      }));

    const cityObj = {
      slug: meta.slug,
      citySlug: meta.citySlug,
      country: c.country,
      rawCity: cleanRaw,
      nameKo: meta.nameKo,
      nameEn: meta.nameEn,
      ...(meta.nameNative ? { nameNative: meta.nameNative } : {}),
      center: [
        Number(Number(c.center[0]).toFixed(5)),
        Number(Number(c.center[1]).toFixed(5)),
      ],
      ...(Array.isArray(c.bbox) && c.bbox.length === 4
        ? { bbox: c.bbox.map((n) => Number(Number(n).toFixed(5))) }
        : {}),
      shopCount: Number(c.count || 0),
      featuredCount: Number(c.featured || 0),
      alleyCount: Number(c.alleys || 0),
      topAlleys: cityAlleys,
      curated: curatedSet.has(rawKey),
    };
    citiesList.push(cityObj);
    cityByRawKeyObj.set(rawKey, cityObj);
  }

  // Curated sanctuary cities in exact editorial priority order
  const featuredCities = CURATED_CITY_KEYS.map((k) => cityByRawKeyObj.get(k)).filter(Boolean);

  // Build cleaned events (88)
  const eventCountByCountry = new Map();
  const eventsList = (app.events || []).map((ev) => {
    const cc = String(ev.country || "").toUpperCase();
    const cityMeta = getOrCreateCityMeta(cc, ev.city || "기타");
    eventCountByCountry.set(cc, (eventCountByCountry.get(cc) || 0) + 1);

    let center = null;
    if (ev.geo && typeof ev.geo.lng === "number" && typeof ev.geo.lat === "number") {
      center = [
        Number(Number(ev.geo.lng).toFixed(5)),
        Number(Number(ev.geo.lat).toFixed(5)),
      ];
    } else {
      const cityObj = cityByRawKeyObj.get(`${cc}|${stripEmojis(ev.city || "")}`);
      if (cityObj) center = cityObj.center;
    }

    const nextDate = ev.next?.start || ev.expected?.start || undefined;
    const lastDate = ev.last?.start || undefined;
    const hours =
      cleanOptional(ev.next?.hours) ||
      cleanOptional(ev.last?.hours) ||
      cleanOptional(ev.dates?.[0]?.hours);

    const scheduleUrl = ev.schedule?.url || ev.schedule_url || ev.homepage || ev.sources?.[0]?.url || undefined;
    const igRaw = ev.instagram ? String(ev.instagram).trim().replace(/^@/, "") : "";
    const instagram = igRaw ? (igRaw.startsWith("http") ? igRaw : `https://www.instagram.com/${igRaw}/`) : undefined;

    return {
      id: ev.id,
      name: stripEmojis(ev.name || ev.name_ko || ev.id),
      nameKo: stripEmojis(ev.name_ko || ev.name || ev.id),
      country: cc,
      citySlug: cityMeta.slug,
      cityKo: cityMeta.nameKo,
      cityEn: cityMeta.nameEn,
      kind: ev.kind || "market",
      kindLabel: stripEmojis(ev.kind_label || ev.kind || "마켓"),
      tags: Array.isArray(ev.tags) ? ev.tags.map(stripEmojis).filter(Boolean) : [],
      ...(cleanOptional(ev.venue) ? { venue: cleanOptional(ev.venue) } : {}),
      ...(cleanOptional(ev.address) ? { address: cleanOptional(ev.address) } : {}),
      ...(cleanOptional(ev.recurrence) ? { recurrence: cleanOptional(ev.recurrence) } : {}),
      ...(nextDate ? { nextDate } : {}),
      ...(lastDate ? { lastDate } : {}),
      ...(hours ? { hours } : {}),
      ...(scheduleUrl ? { scheduleUrl: String(scheduleUrl).trim() } : {}),
      ...(instagram ? { instagram } : {}),
      ...(ev.homepage ? { homepage: String(ev.homepage).trim() } : {}),
      center,
      ...(ev.near?.name
        ? {
            near: {
              name: stripEmojis(ev.near.name),
              ...(ev.near.name_ko ? { nameKo: stripEmojis(ev.near.name_ko) } : {}),
              ...(typeof ev.near.m === "number" ? { m: Math.round(ev.near.m) } : {}),
              ...(typeof ev.near.walk_min === "number" ? { walkMin: Math.round(ev.near.walk_min) } : {}),
            },
          }
        : {}),
    };
  });

  // Build unified 137 countries array
  const platformCountByCountry = new Map();
  for (const p of platforms) {
    platformCountByCountry.set(p.country, (platformCountByCountry.get(p.country) || 0) + 1);
  }
  const alleyCountByCountry = new Map();
  for (const a of alleysList) {
    alleyCountByCountry.set(a.country, (alleyCountByCountry.get(a.country) || 0) + 1);
  }
  const topCitiesByCountry = new Map();
  for (const c of citiesList) {
    const arr = topCitiesByCountry.get(c.country) || [];
    if (arr.length < 4) arr.push(c.slug);
    topCitiesByCountry.set(c.country, arr);
  }

  const countries = Array.from(allCountryCodes)
    .map((cc) => {
      const online = onlineCountryMap.get(cc);
      const coordAcc = countryCoordAccum.get(cc);
      const center = online?.coordinates
        ? [Number(online.coordinates[0].toFixed(4)), Number(online.coordinates[1].toFixed(4))]
        : coordAcc && coordAcc.n > 0
          ? [Number((coordAcc.lng / coordAcc.n).toFixed(4)), Number((coordAcc.lat / coordAcc.n).toFixed(4))]
          : [0, 0];
      const continent = online?.continent || EXTRA_CONTINENTS[cc] || "Europe";

      return {
        code: cc,
        nameEn: countryEnMap.get(cc) || cc,
        nameKo: countryKoMap.get(cc) || cc,
        names: countryNamesCleaned.get(cc) || { en: cc, ko: cc },
        continent,
        center,
        shopCount: countryShopCounts.get(cc) || 0,
        featuredCount: countryFeaturedCounts.get(cc) || 0,
        platformCount: platformCountByCountry.get(cc) || 0,
        alleyCount: alleyCountByCountry.get(cc) || 0,
        eventCount: eventCountByCountry.get(cc) || 0,
        topCities: topCitiesByCountry.get(cc) || [],
      };
    })
    .sort((a, b) => {
      // Rank by combined digging density (shops + platforms*25)
      const scoreA = a.shopCount + a.platformCount * 25;
      const scoreB = b.shopCount + b.platformCount * 25;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return a.nameEn.localeCompare(b.nameEn);
    });

  // Write outputs cleanly
  fs.mkdirSync(SHARDS_DIR, { recursive: true });
  // Remove stale shard files if any
  for (const existing of fs.readdirSync(SHARDS_DIR)) {
    if (existing.endsWith(".json")) {
      fs.unlinkSync(path.join(SHARDS_DIR, existing));
    }
  }

  let shardTotal = 0;
  for (const [cc, shops] of shardsByCountry.entries()) {
    const outPath = path.join(SHARDS_DIR, `${cc.toLowerCase()}.json`);
    fs.writeFileSync(
      outPath,
      JSON.stringify({ country: cc, count: shops.length, shops }),
    );
    shardTotal += shops.length;
  }

  const bootstrap = {
    meta: {
      generatedAt: new Date().toISOString(),
      countries: countries.length,
      shops: compactPins.length,
      platforms: platforms.length,
      alleys: alleysList.length,
      events: eventsList.length,
      cities: citiesList.length,
      shards: shardsByCountry.size,
    },
    countries,
    featuredCities,
    cities: citiesList,
    alleys: alleysList,
    platforms,
    events: eventsList,
  };

  const bootstrapStr = JSON.stringify(bootstrap);
  const pinsStr = JSON.stringify(compactPins);

  // Final emoji sanity check before writing
  if (EMOJI_REGEX.test(bootstrapStr) || EMOJI_REGEX.test(pinsStr)) {
    EMOJI_REGEX.lastIndex = 0;
    const badB = bootstrapStr.match(EMOJI_REGEX) || [];
    EMOJI_REGEX.lastIndex = 0;
    const badP = pinsStr.match(EMOJI_REGEX) || [];
    throw new Error(`Emoji leaked into output! bootstrap=${badB.slice(0, 5)} pins=${badP.slice(0, 5)}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, "atlas-bootstrap.json"), bootstrapStr);
  fs.writeFileSync(path.join(OUT_DIR, "pins-compact.json"), pinsStr);

  // Build high-resolution public/data/world-countries.geojson for macro 3D globe choropleth (zoom < 6.2)
  // Clean up any legacy external admin1/adm2 overlay files so Positron vector basemap stays 100% single-source!
  await buildWorldCountriesGeoJson({
    countries,
    platforms,
    countryEnMap,
    countryKoMap,
  });

  const legacyAdmin1 = path.join(OUT_DIR, "admin1-regions.geojson");
  if (fs.existsSync(legacyAdmin1)) fs.unlinkSync(legacyAdmin1);
  const legacyAdm2 = path.join(OUT_DIR, "adm2");
  if (fs.existsSync(legacyAdm2)) fs.rmSync(legacyAdm2, { recursive: true, force: true });

  const elapsed = Date.now() - t0;
  console.log(
    `[build-atlas-data] Done in ${elapsed}ms | countries=${countries.length} | shops=${compactPins.length} (shards=${shardsByCountry.size}, sum=${shardTotal}) | cities=${citiesList.length} (curated=${featuredCities.length}) | alleys=${alleysList.length} | platforms=${platforms.length} | events=${eventsList.length}`,
  );
  console.log(
    `[build-atlas-data] Sizes: atlas-bootstrap.json=${(bootstrapStr.length / 1024).toFixed(1)}KB, pins-compact.json=${(pinsStr.length / 1024).toFixed(1)}KB`,
  );
}

const NE_50M_ADMIN0_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson";
const NE_10M_ADMIN0_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson";
const NE_50M_ADMIN1_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson";

const HIGH_RES_10M_COUNTRIES = new Set([
  "KR", "JP", "TW", "GB", "FR", "IT", "ES", "DE", "NL", "BE",
  "DK", "PT", "GR", "IE", "NO", "SE", "HK", "SG", "MY", "TH",
  "VN", "PH", "ID", "NZ", "HR",
]);

function roundCoordPair(pt, decimals = 4) {
  const f = Math.pow(10, decimals);
  return [Math.round(pt[0] * f) / f, Math.round(pt[1] * f) / f];
}

function perpDistSq(p, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyLine(pts, tolSq) {
  if (pts.length <= 4 || tolSq <= 0) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = 1;
  keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop();
    let maxDist = 0;
    let index = -1;
    for (let i = first + 1; i < last; i++) {
      const d = perpDistSq(pts[i], pts[first], pts[last]);
      if (d > maxDist) {
        maxDist = d;
        index = i;
      }
    }
    if (maxDist > tolSq && index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    if (keep[i]) out.push(pts[i]);
  }
  return out;
}

function simplifyRing(ring, tol, decimals = 4) {
  if (!Array.isArray(ring) || ring.length < 4) return ring;
  const tolSq = tol > 0 ? tol * tol : 0;
  const simplified = tolSq > 0 ? simplifyLine(ring, tolSq) : ring;
  const rounded = simplified.map((pt) => roundCoordPair(pt, decimals));
  // Deduplicate adjacent identical points
  const dedup = [];
  for (const pt of rounded) {
    const prev = dedup[dedup.length - 1];
    if (!prev || prev[0] !== pt[0] || prev[1] !== pt[1]) dedup.push(pt);
  }
  if (dedup.length < 4) {
    return ring.map((pt) => roundCoordPair(pt, decimals));
  }
  const first = dedup[0];
  const last = dedup[dedup.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    dedup.push([first[0], first[1]]);
  }
  return dedup;
}

function transformGeometry(geom, tol = 0, decimals = 4) {
  if (!geom) return geom;
  if (geom.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geom.coordinates.map((ring) => simplifyRing(ring, tol, decimals)),
    };
  }
  if (geom.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geom.coordinates.map((poly) =>
        poly.map((ring) => simplifyRing(ring, tol, decimals)),
      ),
    };
  }
  return geom;
}

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
        let inHole = false;
        for (let i = 1; i < poly.length; i++) {
          if (pointInRing(pt, poly[i])) {
            inHole = true;
            break;
          }
        }
        if (!inHole) return true;
      }
    }
  }
  return false;
}

function geometryCenter(geom) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let bestRing = null;
  let bestSpan = -1;

  const inspectRing = (ring) => {
    let rMinX = Infinity;
    let rMinY = Infinity;
    let rMaxX = -Infinity;
    let rMaxY = -Infinity;
    for (const pt of ring) {
      if (pt[0] < rMinX) rMinX = pt[0];
      if (pt[0] > rMaxX) rMaxX = pt[0];
      if (pt[1] < rMinY) rMinY = pt[1];
      if (pt[1] > rMaxY) rMaxY = pt[1];
    }
    const span = (rMaxX - rMinX) * (rMaxY - rMinY);
    if (span > bestSpan) {
      bestSpan = span;
      bestRing = { minX: rMinX, minY: rMinY, maxX: rMaxX, maxY: rMaxY };
    }
    if (rMinX < minX) minX = rMinX;
    if (rMaxX > maxX) maxX = rMaxX;
    if (rMinY < minY) minY = rMinY;
    if (rMaxY > maxY) maxY = rMaxY;
  };

  if (geom?.type === "Polygon" && geom.coordinates[0]) {
    inspectRing(geom.coordinates[0]);
  } else if (geom?.type === "MultiPolygon") {
    for (const poly of geom.coordinates) {
      if (poly[0]) inspectRing(poly[0]);
    }
  }

  const box = bestRing || { minX, minY, maxX, maxY };
  if (!Number.isFinite(box.minX)) return [0, 0];
  return [
    Number(((box.minX + box.maxX) / 2).toFixed(4)),
    Number(((box.minY + box.maxY) / 2).toFixed(4)),
  ];
}

function resolveIso2FromNeProps(p) {
  let iso2 =
    p.ISO_A2 && p.ISO_A2 !== "-99"
      ? String(p.ISO_A2).toUpperCase()
      : p.ISO_A2_EH && p.ISO_A2_EH !== "-99"
        ? String(p.ISO_A2_EH).toUpperCase()
        : "";
  if (!iso2 && p.ADMIN === "Kosovo") iso2 = "XK";
  if (!iso2 && p.ADMIN === "Somaliland") iso2 = "SO";
  if (!iso2 && p.ADMIN === "Northern Cyprus") iso2 = "CY";
  return iso2;
}

function shortPlatformLabel(name) {
  return stripEmojis(name)
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+(Japan|Korea|USA|US|UK|France|Germany|Spain|Italy|Brazil|Canada|Australia|Poland|India|Indonesia)$/i, "")
    .trim();
}

function resolveNearestCity(cc, geom, center, citiesByCc) {
  const list = citiesByCc.get(cc) || [];
  if (list.length === 0) return "";
  // Prefer highest shopCount city whose center falls inside the polygon
  let bestInside = null;
  for (const c of list) {
    if (pointInGeometry(c.center, geom)) {
      if (!bestInside || c.shopCount > bestInside.shopCount) {
        bestInside = c;
      }
    }
  }
  if (bestInside) return bestInside.slug;

  // Otherwise nearest city to polygon center
  let best = list[0];
  let bestDist = Infinity;
  for (const c of list) {
    const dx = c.center[0] - center[0];
    const dy = c.center[1] - center[1];
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best.slug;
}

async function buildWorldCountriesGeoJson({ countries, platforms, countryEnMap, countryKoMap }) {
  const outPath = path.join(OUT_DIR, "world-countries.geojson");
  const countryByCode = new Map(countries.map((c) => [c.code, c]));
  const platformsByCc = new Map();
  for (const p of platforms) {
    const arr = platformsByCc.get(p.country) || [];
    arr.push(p);
    platformsByCc.set(p.country, arr);
  }

  let raw50m = null;
  let raw10m = null;
  try {
    const [res50, res10] = await Promise.all([
      fetch(NE_50M_ADMIN0_URL, { signal: AbortSignal.timeout(20000) }),
      fetch(NE_10M_ADMIN0_URL, { signal: AbortSignal.timeout(30000) }),
    ]);
    if (res50.ok) raw50m = await res50.json();
    if (res10.ok) raw10m = await res10.json();
  } catch {
    // Offline fallback: reuse existing world-countries.geojson if present
  }

  if (!raw50m && fs.existsSync(outPath)) {
    const existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    console.log(
      `[build-atlas-data] Reused existing world-countries.geojson (${existing.features?.length ?? 0} features)`,
    );
    return;
  }

  if (!raw50m || !Array.isArray(raw50m.features)) {
    throw new Error("Unable to fetch Natural Earth 50m countries GeoJSON and no local copy exists");
  }

  // Index 10m features by ISO2 for precision coastal overrides
  const ne10mByIso = new Map();
  if (raw10m && Array.isArray(raw10m.features)) {
    for (const feat of raw10m.features) {
      const iso = resolveIso2FromNeProps(feat.properties || {});
      if (iso && HIGH_RES_10M_COUNTRIES.has(iso) && !ne10mByIso.has(iso)) {
        ne10mByIso.set(iso, feat.geometry);
      }
    }
  }

  const seenIso = new Set();
  const features = [];
  for (const feat of raw50m.features) {
    const p = feat.properties || {};
    const iso2 = resolveIso2FromNeProps(p);
    if (!iso2 || iso2 === "AQ" || seenIso.has(iso2)) continue;
    seenIso.add(iso2);

    const meta = countryByCode.get(iso2);
    const ccPlatforms = platformsByCc.get(iso2) || [];
    const topPlatform = ccPlatforms[0] ? shortPlatformLabel(ccPlatforms[0].name) : "";
    const platformBadge =
      ccPlatforms.length > 1
        ? `${iso2} · ${topPlatform} +${ccPlatforms.length - 1}`
        : ccPlatforms.length === 1
          ? `${iso2} · ${topPlatform}`
          : "";

    const hiGeom = ne10mByIso.get(iso2);
    let geometry;
    if (hiGeom) {
      // Keep KR/JP/TW razor-sharp (~0.0008 deg), other 10m coastal countries crisp (~0.004 deg)
      const tol = iso2 === "KR" || iso2 === "JP" || iso2 === "TW" ? 0.0008 : 0.004;
      geometry = transformGeometry(hiGeom, tol, 4);
    } else {
      const tol = ["RU", "CA", "US", "CN", "BR", "AU", "GL"].includes(iso2) ? 0.015 : 0.006;
      geometry = transformGeometry(feat.geometry, tol, 4);
    }

    features.push({
      type: "Feature",
      id: iso2,
      properties: {
        ISO_A2: iso2,
        nameEn: stripEmojis(meta?.nameEn || countryEnMap.get(iso2) || p.NAME_EN || p.ADMIN || iso2),
        nameKo: stripEmojis(meta?.nameKo || countryKoMap.get(iso2) || p.NAME_KO || p.NAME_EN || iso2),
        shopCount: meta?.shopCount || 0,
        platformCount: ccPlatforms.length,
        eventCount: meta?.eventCount || 0,
        topPlatformName: topPlatform,
        platformBadge,
      },
      geometry,
    });
  }

  // Mandatory Point-in-Polygon verification for Korean coastal & island cities
  const krFeat = features.find((f) => f.properties.ISO_A2 === "KR");
  const krCoastalCheck = [
    ["Dangjin", [126.63, 36.89]],
    ["Taean", [126.3, 36.75]],
    ["Mokpo", [126.39, 34.81]],
    ["Yeosu", [127.66, 34.76]],
    ["Geoje", [128.62, 34.88]],
    ["Gwangju", [126.85, 35.16]],
    ["Busan", [129.07, 35.18]],
    ["Jeju", [126.53, 33.5]],
  ];
  for (const [label, pt] of krCoastalCheck) {
    if (!krFeat || !pointInGeometry(pt, krFeat.geometry)) {
      throw new Error(`Coastline precision check failed: ${label} (${pt.join(",")}) outside KR polygon!`);
    }
  }

  const fc = { type: "FeatureCollection", features };
  const serialized = JSON.stringify(fc);
  if (EMOJI_REGEX.test(serialized)) {
    EMOJI_REGEX.lastIndex = 0;
    throw new Error("Emoji leaked into world-countries.geojson");
  }
  fs.writeFileSync(outPath, serialized);
  console.log(
    `[build-atlas-data] world-countries.geojson: ${features.length} countries (10m overrides=${ne10mByIso.size}, ${(serialized.length / 1024).toFixed(1)}KB)`,
  );
}

const KR_PROVINCE_META = {
  서울특별시: { nameEn: "Seoul", citySlug: "kr/seoul" },
  부산광역시: { nameEn: "Busan", citySlug: "kr/busan" },
  대구광역시: { nameEn: "Daegu", citySlug: "kr/daegu" },
  인천광역시: { nameEn: "Incheon", citySlug: "kr/incheon" },
  광주광역시: { nameEn: "Gwangju", citySlug: "kr/gwangju" },
  대전광역시: { nameEn: "Daejeon", citySlug: "kr/daejeon" },
  울산광역시: { nameEn: "Ulsan", citySlug: "kr/ulsan" },
  세종특별자치시: { nameEn: "Sejong", citySlug: "kr/daejeon" },
  경기도: { nameEn: "Gyeonggi", citySlug: "kr/suwon" },
  강원도: { nameEn: "Gangwon", citySlug: "" },
  충청북도: { nameEn: "Chungbuk", citySlug: "kr/cheongju" },
  충청남도: { nameEn: "Chungnam", citySlug: "kr/cheonan-si" },
  전라북도: { nameEn: "Jeonbuk", citySlug: "kr/jeonju" },
  전라남도: { nameEn: "Jeonnam", citySlug: "kr/gwangju" },
  경상북도: { nameEn: "Gyeongbuk", citySlug: "kr/daegu" },
  경상남도: { nameEn: "Gyeongnam", citySlug: "kr/busan" },
  제주특별자치도: { nameEn: "Jeju", citySlug: "kr/jeju-province" },
};

const JP_PREF_KO = {
  北海道: ["홋카이도", "Hokkaido"],
  青森県: ["아오모리현", "Aomori"],
  岩手県: ["이와테현", "Iwate"],
  宮城県: ["미야기현", "Miyagi"],
  秋田県: ["아키타현", "Akita"],
  山形県: ["야마가타현", "Yamagata"],
  福島県: ["후쿠시마현", "Fukushima"],
  茨城県: ["이바라키현", "Ibaraki"],
  栃木県: ["도치기현", "Tochigi"],
  群馬県: ["군마현", "Gunma"],
  埼玉県: ["사이타마현", "Saitama"],
  千葉県: ["지바현", "Chiba"],
  東京都: ["도쿄도", "Tokyo"],
  神奈川県: ["가나가와현", "Kanagawa"],
  新潟県: ["니가타현", "Niigata"],
  富山県: ["도야마현", "Toyama"],
  石川県: ["이시카와현", "Ishikawa"],
  福井県: ["후쿠이현", "Fukui"],
  山梨県: ["야마나시현", "Yamanashi"],
  長野県: ["나가노현", "Nagano"],
  岐阜県: ["기후현", "Gifu"],
  静岡県: ["시즈오카현", "Shizuoka"],
  愛知県: ["아이치현", "Aichi"],
  三重県: ["미에현", "Mie"],
  滋賀県: ["시가현", "Shiga"],
  京都府: ["교토부", "Kyoto"],
  大阪府: ["오사카부", "Osaka"],
  兵庫県: ["효고현", "Hyogo"],
  奈良県: ["나라현", "Nara"],
  和歌山県: ["와카야마현", "Wakayama"],
  鳥取県: ["돗토리현", "Tottori"],
  島根県: ["시마네현", "Shimane"],
  岡山県: ["오카야마현", "Okayama"],
  広島県: ["히로시마현", "Hiroshima"],
  山口県: ["야마구치현", "Yamaguchi"],
  徳島県: ["도쿠시마현", "Tokushima"],
  香川県: ["가가와현", "Kagawa"],
  愛媛県: ["에히메현", "Ehime"],
  高知県: ["고치현", "Kochi"],
  福岡県: ["후쿠오카현", "Fukuoka"],
  佐賀県: ["사가현", "Saga"],
  長崎県: ["나가사키현", "Nagasaki"],
  熊本県: ["구마모토현", "Kumamoto"],
  大分県: ["오이타현", "Oita"],
  宮崎県: ["미야자키현", "Miyazaki"],
  鹿児島県: ["가고시마현", "Kagoshima"],
  沖縄県: ["오키나와현", "Okinawa"],
};

async function buildAdmin1RegionsGeoJson({ citiesList }) {
  const outPath = path.join(OUT_DIR, "admin1-regions.geojson");
  const cityBySlug = new Map(citiesList.map((c) => [c.slug, c]));
  const citiesByCc = new Map();
  for (const c of citiesList) {
    const arr = citiesByCc.get(c.country) || [];
    arr.push(c);
    citiesByCc.set(c.country, arr);
  }

  const features = [];
  const coveredCountries = new Set();

  // 1) Korea 17 provinces from ~/minimap/data/korea_provinces.geojson
  const krProvPath = path.join(MINIMAP_DATA, "korea_provinces.geojson");
  if (fs.existsSync(krProvPath)) {
    const krProv = JSON.parse(fs.readFileSync(krProvPath, "utf8"));
    coveredCountries.add("KR");
    for (const feat of krProv.features || []) {
      const nameKo = stripEmojis(feat.properties?.name || "");
      const code = String(feat.properties?.code || nameKo);
      const geom = transformGeometry(feat.geometry, 0.001, 4);
      const center = geometryCenter(geom);
      const override = KR_PROVINCE_META[nameKo];
      const explicitSlug = override?.citySlug && cityBySlug.has(override.citySlug) ? override.citySlug : "";
      const citySlug = explicitSlug || resolveNearestCity("KR", geom, center, citiesByCc);
      features.push({
        type: "Feature",
        id: `KR-${code}`,
        properties: {
          id: `KR-${code}`,
          cc: "KR",
          name: nameKo,
          nameKo,
          nameEn: override?.nameEn || romanizeHangul(nameKo),
          citySlug,
          center,
        },
        geometry: geom,
      });
    }
  }

  // 2) Japan 47 prefectures from ~/minimap/data/japan_prefectures.geojson
  const jpPrefPath = path.join(MINIMAP_DATA, "japan_prefectures.geojson");
  if (fs.existsSync(jpPrefPath)) {
    const jpPref = JSON.parse(fs.readFileSync(jpPrefPath, "utf8"));
    coveredCountries.add("JP");
    for (const feat of jpPref.features || []) {
      const rawName = stripEmojis(feat.properties?.name || "");
      const code = String(feat.properties?.code || rawName);
      const geom = transformGeometry(feat.geometry, 0.0015, 4);
      const center = geometryCenter(geom);
      const mapped = JP_PREF_KO[rawName];
      const citySlug = resolveNearestCity("JP", geom, center, citiesByCc);
      features.push({
        type: "Feature",
        id: `JP-${code}`,
        properties: {
          id: `JP-${code}`,
          cc: "JP",
          name: rawName,
          nameKo: mapped ? mapped[0] : rawName,
          nameEn: mapped ? mapped[1] : rawName,
          citySlug,
          center,
        },
        geometry: geom,
      });
    }
  }

  // 3) Taiwan 16 counties from ~/minimap/data/taiwan_counties.geojson
  const twPath = path.join(MINIMAP_DATA, "taiwan_counties.geojson");
  if (fs.existsSync(twPath)) {
    const tw = JSON.parse(fs.readFileSync(twPath, "utf8"));
    coveredCountries.add("TW");
    (tw.features || []).forEach((feat, idx) => {
      const rawName = stripEmojis(feat.properties?.name || `TW-${idx + 1}`);
      const geom = transformGeometry(feat.geometry, 0.001, 4);
      const center = geometryCenter(geom);
      const citySlug = resolveNearestCity("TW", geom, center, citiesByCc);
      features.push({
        type: "Feature",
        id: `TW-${idx + 1}`,
        properties: {
          id: `TW-${idx + 1}`,
          cc: "TW",
          name: rawName,
          nameKo: rawName,
          nameEn: rawName,
          citySlug,
          center,
        },
        geometry: geom,
      });
    });
  }

  // 4) Natural Earth 50m Admin-1 (US, CA, AU, BR, CN, IN, ID, RU, ZA)
  try {
    const res = await fetch(NE_50M_ADMIN1_URL, { signal: AbortSignal.timeout(20000) });
    if (res.ok) {
      const neAdm1 = await res.json();
      const neAddedCcs = new Set();
      (neAdm1.features || []).forEach((feat, idx) => {
        const p = feat.properties || {};
        const cc = String(p.iso_a2 || "").toUpperCase();
        if (!cc || cc === "-99" || coveredCountries.has(cc)) return;
        neAddedCcs.add(cc);
        const nameEn = stripEmojis(p.name_en || p.name || `${cc}-${idx + 1}`);
        const nameKo = stripEmojis(p.name_ko || nameEn);
        const geom = transformGeometry(feat.geometry, 0.015, 4);
        const center = geometryCenter(geom);
        const citySlug = resolveNearestCity(cc, geom, center, citiesByCc);
        features.push({
          type: "Feature",
          id: `${cc}-${p.adm1_code || idx + 1}`,
          properties: {
            id: `${cc}-${p.adm1_code || idx + 1}`,
            cc,
            name: nameEn,
            nameKo,
            nameEn,
            citySlug,
            center,
          },
          geometry: geom,
        });
      });
      for (const cc of neAddedCcs) coveredCountries.add(cc);
    }
  } catch {
    // Offline fallback: map_bounds.geojson below will cover
  }

  // 5) Europe & remaining countries from ~/minimap/data/map_bounds.geojson
  const mbPath = path.join(MINIMAP_DATA, "map_bounds.geojson");
  if (fs.existsSync(mbPath)) {
    const mb = JSON.parse(fs.readFileSync(mbPath, "utf8"));
    let idx = 0;
    for (const feat of mb.features || []) {
      const cc = String(feat.properties?.cc || "").toUpperCase();
      if (!cc || coveredCountries.has(cc)) continue;
      idx += 1;
      const geom = transformGeometry(feat.geometry, 0.01, 4);
      const center = geometryCenter(geom);
      const citySlug = resolveNearestCity(cc, geom, center, citiesByCc);
      const cityObj = citySlug ? cityBySlug.get(citySlug) : null;
      const labelKo = cityObj ? cityObj.nameKo : cc;
      const labelEn = cityObj ? cityObj.nameEn : cc;
      features.push({
        type: "Feature",
        id: `${cc}-R${idx}`,
        properties: {
          id: `${cc}-R${idx}`,
          cc,
          name: labelEn,
          nameKo: labelKo,
          nameEn: labelEn,
          citySlug,
          center,
        },
        geometry: geom,
      });
    }
  }

  const fc = { type: "FeatureCollection", features };
  const serialized = JSON.stringify(fc);
  if (EMOJI_REGEX.test(serialized)) {
    EMOJI_REGEX.lastIndex = 0;
    throw new Error("Emoji leaked into admin1-regions.geojson");
  }
  fs.writeFileSync(outPath, serialized);
  console.log(
    `[build-atlas-data] admin1-regions.geojson: ${features.length} regions (${(serialized.length / 1024).toFixed(1)}KB)`,
  );
}

const KR_METRO_CODE_PREFIX_TO_SLUG = {
  "11": "kr/seoul",
  "21": "kr/busan",
  "22": "kr/daegu",
  "23": "kr/incheon",
  "24": "kr/gwangju",
  "25": "kr/daejeon",
  "26": "kr/ulsan",
  "29": "kr/daejeon",
};

async function buildAdm2Shards({ citiesList }) {
  const adm2OutDir = path.join(OUT_DIR, "adm2");
  fs.mkdirSync(adm2OutDir, { recursive: true });
  for (const existing of fs.readdirSync(adm2OutDir)) {
    if (existing.endsWith(".geojson") || existing === "index.json") {
      fs.unlinkSync(path.join(adm2OutDir, existing));
    }
  }

  const cityBySlug = new Map(citiesList.map((c) => [c.slug, c]));
  const citiesByCc = new Map();
  const krCityByKoBase = new Map();
  for (const c of citiesList) {
    const arr = citiesByCc.get(c.country) || [];
    arr.push(c);
    citiesByCc.set(c.country, arr);
    if (c.country === "KR") {
      const base = c.nameKo.replace(/(특별시|광역시|특별자치시|특별자치도|시|군|구)$/, "");
      if (!krCityByKoBase.has(base)) krCityByKoBase.set(base, c.slug);
    }
  }

  const availableShards = [];

  // 1) Korea 250 시·군·구 from ~/minimap/data/korea_municipalities.geojson
  const krMuniPath = path.join(MINIMAP_DATA, "korea_municipalities.geojson");
  if (fs.existsSync(krMuniPath)) {
    const krMuni = JSON.parse(fs.readFileSync(krMuniPath, "utf8"));
    const krFeatures = (krMuni.features || []).map((feat, idx) => {
      const name = stripEmojis(feat.properties?.name || `KR-M${idx + 1}`);
      const code = String(feat.properties?.code || idx + 1);
      const geom = transformGeometry(feat.geometry, 0.0006, 4);
      const center = geometryCenter(geom);

      const metroPrefix = code.slice(0, 2);
      let citySlug = KR_METRO_CODE_PREFIX_TO_SLUG[metroPrefix] || "";
      if (citySlug && !cityBySlug.has(citySlug)) citySlug = "";
      if (!citySlug) {
        const base = name.replace(/(시|군|구)$/, "");
        if (krCityByKoBase.has(base)) {
          citySlug = krCityByKoBase.get(base);
        }
      }
      if (!citySlug) {
        citySlug = resolveNearestCity("KR", geom, center, citiesByCc);
      }

      return {
        type: "Feature",
        id: `KR-${code}`,
        properties: {
          id: `KR-${code}`,
          cc: "KR",
          name,
          citySlug,
          center,
        },
        geometry: geom,
      };
    });

    const krStr = JSON.stringify({ type: "FeatureCollection", features: krFeatures });
    fs.writeFileSync(path.join(adm2OutDir, "kr.geojson"), krStr);
    availableShards.push("kr");
    console.log(
      `[build-atlas-data] adm2/kr.geojson: ${krFeatures.length} municipalities (${(krStr.length / 1024).toFixed(1)}KB)`,
    );
  }

  // 2) Copy & optimize all 56 country adm2 shards from ~/minimap/data/adm2/*.geojson
  const srcAdm2Dir = path.join(MINIMAP_DATA, "adm2");
  if (fs.existsSync(srcAdm2Dir)) {
    const files = fs.readdirSync(srcAdm2Dir).filter((f) => f.endsWith(".geojson")).sort();
    for (const file of files) {
      const ccUpper = path.basename(file, ".geojson").toUpperCase();
      const ccLower = ccUpper.toLowerCase();
      if (ccLower === "kr") continue;
      const srcPath = path.join(srcAdm2Dir, file);
      const rawSize = fs.statSync(srcPath).size;
      const raw = JSON.parse(fs.readFileSync(srcPath, "utf8"));
      // Keep crisp lines while trimming oversized files (>400KB) slightly for instant lazy-load
      const tol = rawSize > 500_000 ? 0.004 : rawSize > 200_000 ? 0.002 : 0.0008;
      const features = (raw.features || []).map((feat, idx) => {
        const geom = transformGeometry(feat.geometry, tol, 4);
        const center = geometryCenter(geom);
        const citySlug = resolveNearestCity(ccUpper, geom, center, citiesByCc);
        return {
          type: "Feature",
          id: `${ccUpper}-A2-${idx + 1}`,
          properties: {
            id: `${ccUpper}-A2-${idx + 1}`,
            cc: ccUpper,
            name: stripEmojis(feat.properties?.name || ""),
            citySlug,
            center,
          },
          geometry: geom,
        };
      });
      fs.writeFileSync(
        path.join(adm2OutDir, `${ccLower}.geojson`),
        JSON.stringify({ type: "FeatureCollection", features }),
      );
      availableShards.push(ccLower);
    }
  }

  availableShards.sort();
  fs.writeFileSync(path.join(adm2OutDir, "index.json"), JSON.stringify(availableShards));
  console.log(`[build-atlas-data] adm2 shards ready: ${availableShards.length} countries`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
