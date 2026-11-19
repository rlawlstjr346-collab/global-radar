import type { CountryCode } from "@/data/platforms";
import {
  COUNTRY_TO_DEFAULT_LANGUAGE,
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  type LanguageCode,
} from "./locales";

export type CountrySource = "manual" | "accept-language" | "geo" | "default";

export interface CountryResolution {
  country: CountryCode;
  source: CountrySource;
}

function isKnownCountry(value: string): value is CountryCode {
  return value in COUNTRY_TO_DEFAULT_LANGUAGE;
}

/**
 * One representative country per language, derived from
 * `COUNTRY_TO_DEFAULT_LANGUAGE` (first entry wins) so the two never drift
 * out of sync. Used as a last-resort country guess when a visitor's
 * Accept-Language carries a language but no region subtag (e.g. just "ko"
 * rather than "ko-KR") and geo-IP isn't available either — and by the
 * language picker, which sets this as the new home country too (picking a
 * language is usually also a signal about which country you care about).
 */
export const LANGUAGE_TO_FALLBACK_COUNTRY: Partial<Record<LanguageCode, CountryCode>> = {};
for (const [country, language] of Object.entries(COUNTRY_TO_DEFAULT_LANGUAGE) as [
  CountryCode,
  LanguageCode,
][]) {
  LANGUAGE_TO_FALLBACK_COUNTRY[language] ??= country;
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

/** Parses the `grl_country_override` cookie value (a bare CountryCode). */
export function parseCountryOverride(raw: string | undefined): CountryCode | null {
  if (!raw) return null;
  const upper = raw.toUpperCase();
  return isKnownCountry(upper) ? (upper as CountryCode) : null;
}

/** Matches a BCP-47 tag like "ko-KR" or "en" against our supported languages. */
function matchSupportedLanguage(tag: string): LanguageCode | null {
  const primary = tag.split("-")[0]?.toLowerCase();
  return primary && isSupportedLanguage(primary) ? primary : null;
}

/**
 * Resolves which country's platforms should sort first in the sidebar.
 *
 * Priority: manual override (the "use my location" button) > the region
 * subtag of an Accept-Language entry (e.g. "de-CH") > geo-IP > the language
 * of an Accept-Language entry with no region subtag (e.g. bare "ko") > hard
 * default. Independent of UI language, which comes from the URL's locale
 * segment.
 */
export function resolveHomeCountry(input: {
  acceptLanguageHeader?: string | null;
  geoCountry?: string | null;
  countryOverride?: CountryCode | null;
}): CountryResolution {
  if (input.countryOverride) {
    return { country: input.countryOverride, source: "manual" };
  }

  const acceptedTags = parseAcceptLanguage(input.acceptLanguageHeader);

  for (const tag of acceptedTags) {
    const region = tag.split("-")[1]?.toUpperCase();
    if (region && isKnownCountry(region)) {
      return { country: region, source: "accept-language" };
    }
  }

  const geoCountry = input.geoCountry?.toUpperCase();
  if (geoCountry && isKnownCountry(geoCountry)) {
    return { country: geoCountry, source: "geo" };
  }

  for (const tag of acceptedTags) {
    const language = matchSupportedLanguage(tag);
    const fallbackCountry = language && LANGUAGE_TO_FALLBACK_COUNTRY[language];
    if (fallbackCountry) {
      return { country: fallbackCountry, source: "accept-language" };
    }
  }

  return { country: DEFAULT_COUNTRY, source: "default" };
}

/**
 * Picks which locale a first-time visitor to "/" should be redirected to.
 * Priority: Accept-Language > geo-IP's default language for that country >
 * hard default. Used only for that one-time redirect — every page after
 * that lives at an explicit `/<language>` URL.
 */
export function pickPreferredLanguage(input: {
  acceptLanguageHeader?: string | null;
  geoCountry?: string | null;
}): LanguageCode {
  for (const tag of parseAcceptLanguage(input.acceptLanguageHeader)) {
    const language = matchSupportedLanguage(tag);
    if (language) return language;
  }

  const geoCountry = input.geoCountry?.toUpperCase();
  if (geoCountry && isKnownCountry(geoCountry)) {
    return COUNTRY_TO_DEFAULT_LANGUAGE[geoCountry];
  }

  return DEFAULT_LANGUAGE;
}
