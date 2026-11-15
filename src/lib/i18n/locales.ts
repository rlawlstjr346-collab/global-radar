import type { CountryCode } from "@/data/platforms";

export type LanguageCode = "ko" | "ja" | "en" | "hi" | "id" | "de" | "fr";

export const SUPPORTED_LANGUAGES: LanguageCode[] = [
  "ko",
  "ja",
  "en",
  "hi",
  "id",
  "de",
  "fr",
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const DEFAULT_COUNTRY: CountryCode = "US";

/** Best-guess default country for a language when no geo signal is available. */
export const LANGUAGE_TO_DEFAULT_COUNTRY: Record<LanguageCode, CountryCode> = {
  ko: "KR",
  ja: "JP",
  en: "US",
  hi: "IN",
  id: "ID",
  de: "DE",
  fr: "FR",
};

/** Best-guess default language for a country when resolving from geo-IP. */
export const COUNTRY_TO_DEFAULT_LANGUAGE: Record<CountryCode, LanguageCode> = {
  KR: "ko",
  JP: "ja",
  US: "en",
  GB: "en",
  IN: "hi",
  ID: "id",
  DE: "de",
  FR: "fr",
  EU: "en",
};

export function isSupportedLanguage(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as string[]).includes(value);
}
