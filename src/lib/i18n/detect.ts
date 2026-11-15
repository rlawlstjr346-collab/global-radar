import type { CountryCode } from "@/data/platforms";
import {
  COUNTRY_TO_DEFAULT_LANGUAGE,
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  LANGUAGE_TO_DEFAULT_COUNTRY,
  isSupportedLanguage,
  type LanguageCode,
} from "./locales";

export type LocaleSource = "manual" | "accept-language" | "geo" | "default";

export interface LocaleContext {
  language: LanguageCode;
  country: CountryCode;
  source: LocaleSource;
}

export interface ManualLocaleOverride {
  language: LanguageCode;
  country: CountryCode;
}

function isKnownCountry(value: string): value is CountryCode {
  return value in COUNTRY_TO_DEFAULT_LANGUAGE;
}

/**
 * Parses an `Accept-Language` header into language tags ordered by quality
 * (highest first). Ignores malformed entries instead of throwing, since this
 * header is fully client-controlled input.
 */
export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];

  return header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";q=");
      const quality = qPart ? Number.parseFloat(qPart) : 1;
      return { tag: tag?.trim(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .filter((entry): entry is { tag: string; quality: number } => Boolean(entry.tag))
    .sort((a, b) => b.quality - a.quality)
    .map((entry) => entry.tag);
}

/** Matches a BCP-47 tag like "ko-KR" or "en" against our supported languages. */
function matchSupportedLanguage(tag: string): LanguageCode | null {
  const primary = tag.split("-")[0]?.toLowerCase();
  return primary && isSupportedLanguage(primary) ? primary : null;
}

/**
 * Resolves the active (language, country) pair.
 *
 * Priority: manual override (always wins, persisted by the caller) >
 * Accept-Language header > geo-IP country lookup > hard default.
 */
export function resolveLocaleContext(input: {
  acceptLanguageHeader?: string | null;
  geoCountry?: string | null;
  manualOverride?: ManualLocaleOverride | null;
}): LocaleContext {
  if (input.manualOverride) {
    return { ...input.manualOverride, source: "manual" };
  }

  for (const tag of parseAcceptLanguage(input.acceptLanguageHeader)) {
    const language = matchSupportedLanguage(tag);
    if (!language) continue;

    const regionSubtag = tag.split("-")[1]?.toUpperCase();
    const country =
      regionSubtag && isKnownCountry(regionSubtag)
        ? regionSubtag
        : LANGUAGE_TO_DEFAULT_COUNTRY[language];

    return { language, country, source: "accept-language" };
  }

  const geoCountry = input.geoCountry?.toUpperCase();
  if (geoCountry && isKnownCountry(geoCountry)) {
    return {
      language: COUNTRY_TO_DEFAULT_LANGUAGE[geoCountry],
      country: geoCountry,
      source: "geo",
    };
  }

  return { language: DEFAULT_LANGUAGE, country: DEFAULT_COUNTRY, source: "default" };
}
