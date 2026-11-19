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
 * "일본") using the browser's built-in CLDR region-name data — no manual
 * per-language, per-country translation table needed.
 */
export function getLocalizedCountryName(code: CountryCode, lang: LanguageCode): string {
  try {
    return getDisplayNames(lang).of(code) ?? code;
  } catch {
    return code;
  }
}
