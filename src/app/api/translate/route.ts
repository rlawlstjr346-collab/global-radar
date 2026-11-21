import { type NextRequest } from "next/server";
import { isSupportedLanguage, type LanguageCode } from "@/lib/i18n/locales";
import { instantTranslateToEnglish } from "@/lib/translateQuery";

const CACHE_MAX_ENTRIES = 1000;
const TRANSLATE_CACHE = new Map<string, string>();

const GOOGLE_LANG_OVERRIDES: Partial<Record<LanguageCode, string>> = {
  zh: "zh-CN",
  he: "iw",
};

function cacheGet(key: string): string | undefined {
  const hit = TRANSLATE_CACHE.get(key);
  if (hit !== undefined) {
    // Refresh LRU order.
    TRANSLATE_CACHE.delete(key);
    TRANSLATE_CACHE.set(key, hit);
  }
  return hit;
}

function cacheSet(key: string, value: string) {
  if (TRANSLATE_CACHE.size >= CACHE_MAX_ENTRIES) {
    const oldest = TRANSLATE_CACHE.keys().next().value;
    if (oldest !== undefined) TRANSLATE_CACHE.delete(oldest);
  }
  TRANSLATE_CACHE.set(key, value);
}

function extractGoogleTranslation(payload: unknown): string | null {
  if (!Array.isArray(payload) || !Array.isArray(payload[0])) return null;
  const parts: string[] = [];
  for (const segment of payload[0]) {
    if (Array.isArray(segment) && typeof segment[0] === "string") {
      parts.push(segment[0]);
    }
  }
  const joined = parts.join("").trim().replace(/\s+/g, " ");
  return joined || null;
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get("q") ?? "";
  const query = rawQuery.trim().replace(/\s+/g, " ").slice(0, 120);
  const slParam = request.nextUrl.searchParams.get("sl") ?? "";
  const uiLang: LanguageCode = isSupportedLanguage(slParam) ? slParam : "en";

  if (!query) {
    return Response.json({ translated: "", fallback: false });
  }

  // 1. Instant dictionary short-circuit (0ms, works offline).
  const instant = instantTranslateToEnglish(query, uiLang);
  if (instant.complete) {
    return Response.json(
      { translated: instant.translated, fallback: false },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  }

  // 2. Server-side LRU memory cache.
  const cacheKey = `${uiLang}:${query.toLowerCase()}`;
  const cached = cacheGet(cacheKey);
  if (cached !== undefined) {
    return Response.json(
      { translated: cached, fallback: false },
      { headers: { "Cache-Control": "public, max-age=86400" } },
    );
  }

  // 3. Zero-cost public translation endpoint with strict 2-second timeout.
  const sourceLang = slParam && isSupportedLanguage(slParam)
    ? (GOOGLE_LANG_OVERRIDES[slParam] ?? slParam)
    : "auto";

  try {
    const url =
      `https://translate.googleapis.com/translate_a/single` +
      `?client=gtx&sl=${encodeURIComponent(sourceLang)}&tl=en&dt=t&q=${encodeURIComponent(query)}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000),
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const data: unknown = await res.json();
      const translated = extractGoogleTranslation(data);
      if (translated) {
        cacheSet(cacheKey, translated);
        return Response.json(
          { translated, fallback: false },
          { headers: { "Cache-Control": "public, max-age=86400" } },
        );
      }
    }
  } catch {
    // Timeout or network failure — safely fall back to instant dictionary / original query.
  }

  return Response.json(
    { translated: instant.translated || query, fallback: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
