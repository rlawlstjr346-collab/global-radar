import type { CountryCode } from "@/data/platforms";

export type LanguageCode =
  | "ko"
  | "ja"
  | "en"
  | "hi"
  | "id"
  | "de"
  | "fr"
  | "zh"
  | "ms"
  | "th"
  | "vi"
  | "ur"
  | "bn"
  | "si"
  | "ar"
  | "tr"
  | "he"
  | "es"
  | "it"
  | "nl"
  | "pt"
  | "sv"
  | "no"
  | "da"
  | "fi"
  | "pl"
  | "cs"
  | "ro"
  | "el"
  | "ru"
  | "uk"
  | "hu"
  | "hr"
  | "bg"
  | "lt";

export const SUPPORTED_LANGUAGES: LanguageCode[] = [
  "ko",
  "ja",
  "en",
  "hi",
  "id",
  "de",
  "fr",
  "zh",
  "ms",
  "th",
  "vi",
  "ur",
  "bn",
  "si",
  "ar",
  "tr",
  "he",
  "es",
  "it",
  "nl",
  "pt",
  "sv",
  "no",
  "da",
  "fi",
  "pl",
  "cs",
  "ro",
  "el",
  "ru",
  "uk",
  "hu",
  "hr",
  "bg",
  "lt",
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";
export const DEFAULT_COUNTRY: CountryCode = "US";

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
  CN: "zh",
  TW: "zh",
  HK: "zh",
  SG: "en",
  MY: "ms",
  TH: "th",
  VN: "vi",
  PH: "en",
  PK: "ur",
  BD: "bn",
  LK: "si",
  AE: "ar",
  SA: "ar",
  TR: "tr",
  IL: "he",
  QA: "ar",
  ES: "es",
  IT: "it",
  NL: "nl",
  BE: "nl",
  CH: "de",
  AT: "de",
  PT: "pt",
  IE: "en",
  SE: "sv",
  NO: "no",
  DK: "da",
  FI: "fi",
  PL: "pl",
  CZ: "cs",
  RO: "ro",
  GR: "el",
  RU: "ru",
  UA: "uk",
  CA: "en",
  MX: "es",
  BR: "pt",
  AR: "es",
  CL: "es",
  CO: "es",
  PE: "es",
  ZA: "en",
  NG: "en",
  EG: "ar",
  KE: "en",
  MA: "ar",
  AU: "en",
  NZ: "en",
  HU: "hu",
  HR: "hr",
  SK: "cs",
  SI: "hr",
  BG: "bg",
  RS: "hr",
  LT: "lt",
  LV: "en",
  EE: "en",
  IS: "en",
  LU: "fr",
  CY: "el",
  JO: "ar",
  LB: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  IQ: "ar",
  KZ: "ru",
  AZ: "tr",
  GE: "ru",
  AM: "ru",
  NP: "hi",
  MM: "en",
  KH: "en",
  LA: "th",
  MN: "ru",
  GH: "en",
  TZ: "en",
  UG: "en",
  ET: "en",
  DZ: "ar",
  TN: "ar",
  ZW: "en",
  ZM: "en",
  SN: "fr",
  CI: "fr",
  CM: "fr",
  EC: "es",
  VE: "es",
  UY: "es",
  PY: "es",
  BO: "es",
  GT: "es",
  CR: "es",
  PA: "es",
  DO: "es",
};

export function isSupportedLanguage(value: string): value is LanguageCode {
  return (SUPPORTED_LANGUAGES as string[]).includes(value);
}

/** Each language's own name for itself, shown in the language picker. */
export const LANGUAGE_NATIVE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  ko: "한국어",
  ja: "日本語",
  hi: "हिन्दी",
  id: "Bahasa Indonesia",
  de: "Deutsch",
  fr: "Français",
  zh: "中文",
  ms: "Bahasa Melayu",
  th: "ภาษาไทย",
  vi: "Tiếng Việt",
  ur: "اردو",
  bn: "বাংলা",
  si: "සිංහල",
  ar: "العربية",
  tr: "Türkçe",
  he: "עברית",
  es: "Español",
  it: "Italiano",
  nl: "Nederlands",
  pt: "Português",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
  pl: "Polski",
  cs: "Čeština",
  ro: "Română",
  el: "Ελληνικά",
  ru: "Русский",
  uk: "Українська",
  hu: "Magyar",
  hr: "Hrvatski",
  bg: "Български",
  lt: "Lietuvių",
};
