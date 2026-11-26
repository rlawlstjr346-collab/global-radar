import { isSupportedLanguage, type LanguageCode } from "@/lib/i18n/locales";
import { CITY_SLUGS, COUNTRY_CODES, COUNTRY_NAME_SLUGS } from "./legacyRoutes.data";

/**
 * Maps every URL shape this domain has ever served (the retired minimap static site and the
 * pre-atlas global-radar app) onto the live ATLAS routes, so search-engine traffic to old
 * links lands on a real page instead of a 404.
 *
 *   { redirect }  -> 308 to the canonical live path
 *   { notFound }  -> no live page exists (served as a real 404 with the ATLAS not-found screen)
 *   null          -> already canonical / not ours to touch (pass through)
 */
export type LegacyResolution = { redirect: string } | { notFound: true } | null;

const COUNTRIES = new Set(COUNTRY_CODES.split(" "));
const CITIES = new Set(CITY_SLUGS.split(" "));

/** minimap language folders that are not ATLAS locale codes */
const LANGUAGE_ALIASES: Record<string, LanguageCode> = {
  "zh-hans": "zh",
  "zh-hant": "zh",
  "zh-cn": "zh",
  "zh-tw": "zh",
  nb: "no",
  nn: "no",
};

/** minimap country folders whose English name changed in the atlas dataset */
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "kingdom-of-the-netherlands": "nl",
  "people-s-republic-of-china": "cn",
};

/** minimap city folders whose slug differs in the atlas dataset */
const CITY_ALIASES: Record<string, string> = {
  "kr/jeju": "kr/jeju-province",
  "kr/gwangju-148": "kr/gwangju",
  "pl/wrocaw": "pl/wroc-aw",
  "jp/okayama": "jp/okayama-prefecture",
  "jp/tokushima": "jp/tokushima-prefecture",
  "vn/da-lat": "vn/a-lat",
  "us/portland-309": "us/portland",
  "tw/pingtung": "tw/pingtung-county",
};

/** minimap pages / app shells with no ATLAS counterpart: their visitors go to the globe */
const RETIRED_PAGES = new Set([
  "home", "index", "feed", "me", "plaza", "shop", "web", "app", "app-map", "crowd", "review", "yt", "terms",
]);

/** Top-level ATLAS routes that are not a language segment */
const TOP_LEVEL_ROUTES = new Set([
  "privacy", "icon", "apple-icon", "opengraph-image", "rss.xml", "robots.txt", "sitemap.xml",
]);

/** Static .html files that must be served as-is (search-console ownership proofs) */
const PUBLIC_HTML = new Set(["google9ae0e13efc369bc9.html", "navera06b483a2c8a598883a6b86657b88a14.html"]);

function toLanguage(seg: string): LanguageCode | null {
  if (isSupportedLanguage(seg)) return seg;
  return LANGUAGE_ALIASES[seg] ?? null;
}

function toCountry(seg: string | undefined): string | null {
  if (!seg) return null;
  if (COUNTRIES.has(seg)) return seg;
  const byName = COUNTRY_NAME_SLUGS[seg] ?? COUNTRY_NAME_ALIASES[seg];
  return byName && COUNTRIES.has(byName) ? byName : null;
}

function cityPath(lang: string, cc: string, city: string): string {
  const slug = CITY_ALIASES[`${cc}/${city}`] ?? `${cc}/${city}`;
  return CITIES.has(slug) ? `/${lang}/explore/${slug}` : `/${lang}/explore/${cc}`;
}

/** minimap: /v2/<lang>/<country-name>/<city>/ (every level optional) */
function resolveMinimap(segs: string[], fallback: LanguageCode): string {
  const lang = segs.length > 0 ? toLanguage(segs[0]) : null;
  const rest = lang ? segs.slice(1) : segs;
  const target = lang ?? fallback;
  const cc = toCountry(rest[0]);
  if (!cc) return `/${target}`;
  return rest[1] ? cityPath(target, cc, rest[1]) : `/${target}/explore/${cc}`;
}

/** Live ATLAS shapes under a language: canonical path, or null when no page exists. */
function resolveAtlas(lang: LanguageCode, rest: string[]): string | null {
  if (rest.length === 0) return `/${lang}`;
  if (rest[0] === "opengraph-image" && rest.length === 1) return `/${lang}/opengraph-image`;
  if (rest[0] === "explore") {
    if (rest.length === 1) return `/${lang}`;
    const cc = toCountry(rest[1]);
    if (!cc || rest.length > 3) return null;
    return rest[2] ? cityPath(lang, cc, rest[2]) : `/${lang}/explore/${cc}`;
  }
  const cc = toCountry(rest[0]);
  if (!cc) return null;
  // /<lang>/<country>/<city> never existed; a city under it still has a live page
  if (rest.length === 2) return cityPath(lang, cc, rest[1]);
  return rest.length === 1 ? `/${lang}/${cc}` : null;
}

export function resolveLegacyPath(pathname: string, fallbackLanguage: LanguageCode): LegacyResolution {
  if (pathname === "/" || PUBLIC_HTML.has(pathname.slice(1))) return null;

  // Old static-site spellings: /x/index.html, /x.html, /x.htm, trailing slashes
  const stripped = pathname
    .replace(/\/index\.html?$/i, "/")
    .replace(/\.html?$/i, "")
    .replace(/\/+$/, "");
  let segs: string[];
  try {
    segs = stripped.split("/").filter(Boolean).map((s) => decodeURIComponent(s).toLowerCase());
  } catch {
    return { notFound: true };
  }
  if (segs.length === 0) return { redirect: `/${fallbackLanguage}` };

  const [first, ...rest] = segs;
  if (first === "v2") return { redirect: resolveMinimap(rest, fallbackLanguage) };

  const lang = toLanguage(first);
  if (lang) {
    const canonical = resolveAtlas(lang, rest);
    if (!canonical) return { notFound: true };
    return canonical === pathname ? null : { redirect: canonical };
  }

  if (TOP_LEVEL_ROUTES.has(first) && rest.length === 0) {
    return `/${first}` === pathname ? null : { redirect: `/${first}` };
  }
  if (RETIRED_PAGES.has(first)) return { redirect: `/${fallbackLanguage}` };
  // Bare /<country-name>[/<city>] without the old /v2/<lang> prefix
  if (toCountry(first)) return { redirect: resolveMinimap(segs, fallbackLanguage) };
  return { notFound: true };
}
