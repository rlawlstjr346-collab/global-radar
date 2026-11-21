import { COUNTRY_POINTS } from "@/data/countries";
import type { CountryCode } from "@/data/platforms";
import type { LanguageCode } from "./locales";

const displayNamesByLanguage = new Map<LanguageCode, Intl.DisplayNames>();

function getDisplayNames(lang: LanguageCode): Intl.DisplayNames {
  let displayNames = displayNamesByLanguage.get(lang);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([lang], { type: "region" });
    displayNamesByLanguage.set(lang, displayNames);
  }
  return displayNames;
}

/**
 * Translates a country code into the given UI language (e.g. "JP" + "ko" →
 * "일본") using CLDR region-name data — no manual per-language, per-country
 * translation table needed.
 */
export function getLocalizedCountryName(code: CountryCode, lang: LanguageCode): string {
  try {
    return getDisplayNames(lang).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Pre-computes all supported country names for a UI language on the server
 * so the client receives identical strings during SSR and hydration (no
 * English-first FOUC and no ICU server/browser hydration mismatch).
 */
export function getLocalizedCountryNamesMap(lang: LanguageCode): Record<CountryCode, string> {
  const map = {} as Record<CountryCode, string>;
  for (const point of COUNTRY_POINTS) {
    map[point.code] = getLocalizedCountryName(point.code, lang);
  }
  return map;
}

/**
 * Common colloquial country names that differ from formal CLDR names
 * (e.g. "한국" vs "대한민국", "USA" vs "United States", "UK" vs "United Kingdom").
 */
export const COUNTRY_SEARCH_ALIASES: Partial<Record<CountryCode, string[]>> = {
  KR: ["한국", "Korea", "대한민국"],
  US: ["USA", "America", "U.S.", "U.S.A."],
  GB: ["UK", "U.K.", "Britain", "England"],
  CZ: ["Czechia", "체코"],
  TR: ["Türkiye", "Turkiye", "터키"],
  NL: ["Holland", "네덜란드"],
  CI: ["Côte d'Ivoire", "Cote d'Ivoire"],
};
