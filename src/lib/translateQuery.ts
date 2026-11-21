import { BRAND_MAP, MULTILINGUAL_MAP, SPELL_FIX, TERM_MAP } from "@/data/translationDictionary";
import type { CountryCode } from "@/data/platforms";
import { COUNTRY_TO_DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/i18n/locales";

const HANGUL = /[가-힣]/;
const KANA = /[\u3040-\u30ff]/;
const HANZI = /[\u4e00-\u9fff]/;
const CYRILLIC = /[\u0400-\u04ff]/;
const ARABIC = /[\u0600-\u06ff]/;
const HEBREW = /[\u0590-\u05ff]/;
const THAI = /[\u0e00-\u0e7f]/;
const DEVANAGARI = /[\u0900-\u097f]/;
const BENGALI = /[\u0980-\u09ff]/;
const SINHALA = /[\u0d80-\u0dff]/;
const GREEK = /[\u0370-\u03ff]/;
const NON_ASCII = /[^\x00-\x7f]/;
const ASCII_LATIN = /^[a-zA-Z0-9\s\-._+'&/()]+$/;
const ONLY_NUMBERS_OR_MODEL = /^[\d\s\-._/]+$/;

const KO_LEXICON = Object.entries({ ...TERM_MAP, ...BRAND_MAP }).sort(
  (a, b) => b[0].length - a[0].length,
);

const NON_LATIN_MULTI = Object.entries(MULTILINGUAL_MAP)
  .filter(([k]) => NON_ASCII.test(k) && !/^[a-zA-ZÀ-ÿ\s]+$/.test(k))
  .sort((a, b) => b[0].length - a[0].length);

const LATIN_MULTI = Object.entries(MULTILINGUAL_MAP)
  .filter(([k]) => /^[a-zA-ZÀ-ÿ\u0100-\u017f\u1e00-\u1eff\s]+$/.test(k))
  .sort((a, b) => b[0].length - a[0].length);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function applyKoLexicon(text: string): string {
  let out = text;
  for (const [ko, en] of KO_LEXICON) {
    if (out.includes(ko)) out = out.split(ko).join(en);
  }
  return out;
}

function applySpellFix(original: string, translated: string): string {
  let out = translated;
  for (const [ko, fixes] of Object.entries(SPELL_FIX)) {
    if (!original.includes(ko)) continue;
    for (const [pattern, correct] of fixes) {
      out = out.replace(pattern, correct);
    }
  }
  return out;
}

export interface InstantTranslationResult {
  translated: string;
  complete: boolean;
  changed: boolean;
}

/**
 * Zero-latency dictionary translation to English for cross-language search.
 * Handles Korean (RADAR lexicon), CJK/Arabic/Cyrillic/Thai, and common
 * European secondhand terms before any network call is needed.
 */
export function instantTranslateToEnglish(
  query: string,
  uiLanguage: LanguageCode = "en",
): InstantTranslationResult {
  const trimmed = query.trim().replace(/\s+/g, " ");
  if (!trimmed || ONLY_NUMBERS_OR_MODEL.test(trimmed)) {
    return { translated: trimmed, complete: true, changed: false };
  }

  let out = trimmed;

  if (HANGUL.test(out)) {
    out = applyKoLexicon(out);
    out = applySpellFix(trimmed, out);
  }

  if (NON_ASCII.test(out)) {
    for (const [src, en] of NON_LATIN_MULTI) {
      if (out.includes(src)) out = out.split(src).join(en);
    }
  }

  if (uiLanguage !== "en" || NON_ASCII.test(out)) {
    for (const [src, en] of LATIN_MULTI) {
      const re = new RegExp(`(^|[\\s,./()\\-])${escapeRegex(src)}(?=$|[\\s,./()\\-])`, "gi");
      out = out.replace(re, `$1${en}`);
    }
  }

  out = out.replace(/\s+/g, " ").trim();
  const changed = out.toLowerCase() !== trimmed.toLowerCase();
  const stillHasNonAscii = NON_ASCII.test(out);

  // For English UI with pure ASCII, or when dictionary fully cleared non-ASCII
  // tokens (e.g. "아이폰 17 프로" → "iPhone 17 Pro"), no remote lookup needed.
  const complete = !stillHasNonAscii && (changed || uiLanguage === "en");
  return { translated: out, complete, changed };
}

/**
 * Detects whether a query written by the user natively belongs to the target
 * platform's country/language — in which case we keep the original text untouched.
 */
export function isSameLanguagePlatform(
  query: string,
  uiLanguage: LanguageCode,
  platformCountry: CountryCode,
): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  const platformLang = COUNTRY_TO_DEFAULT_LANGUAGE[platformCountry];

  if (HANGUL.test(trimmed)) return platformCountry === "KR";
  if (KANA.test(trimmed)) return platformCountry === "JP";
  if (HANZI.test(trimmed)) {
    if (platformCountry === "JP" && uiLanguage === "ja") return true;
    return platformCountry === "CN" || platformCountry === "TW" || platformCountry === "HK";
  }
  if (CYRILLIC.test(trimmed)) return platformLang === "ru" || platformLang === "uk" || platformLang === "bg";
  if (ARABIC.test(trimmed)) return platformLang === "ar" || platformLang === "ur";
  if (HEBREW.test(trimmed)) return platformLang === "he";
  if (THAI.test(trimmed)) return platformLang === "th";
  if (DEVANAGARI.test(trimmed)) return platformLang === "hi";
  if (BENGALI.test(trimmed)) return platformLang === "bn";
  if (SINHALA.test(trimmed)) return platformLang === "si";
  if (GREEK.test(trimmed)) return platformLang === "el";

  // Latin-script input: matches if UI language equals the platform's own language.
  return platformLang === uiLanguage;
}

/**
 * Decides whether the client should call `/api/translate` (250ms debounced)
 * to obtain an English keyword for cross-language platforms.
 */
export function needsRemoteTranslation(query: string, uiLanguage: LanguageCode): boolean {
  const trimmed = query.trim();
  if (trimmed.length < 2 || ONLY_NUMBERS_OR_MODEL.test(trimmed)) return false;

  const instant = instantTranslateToEnglish(trimmed, uiLanguage);
  if (instant.complete) return false;

  // Non-ASCII text that still contains untranslated tokens always benefits from translation.
  if (NON_ASCII.test(instant.translated)) return true;

  // For non-English Latin UIs (fr, de, es, it, nl, pl, tr, vi, id, ms, etc.),
  // translate words that aren't obviously short model codes/all-caps acronyms.
  if (uiLanguage !== "en" && ASCII_LATIN.test(trimmed)) {
    const words = trimmed.split(/\s+/);
    const allShortOrAcronyms = words.every((w) => w.length <= 2 || /^[A-Z0-9\-]+$/.test(w));
    return !allShortOrAcronyms;
  }

  return false;
}

/**
 * Resolves the exact search term to pass to a given platform's URL builder:
 * - Same-language platform (or user opted into original): original text
 * - Other-language platform: English translated keyword (remote or instant dict)
 */
export function resolveQueryForPlatform(params: {
  query: string;
  uiLanguage: LanguageCode;
  platformCountry: CountryCode;
  translatedEnglish?: string | null;
  useOriginal?: boolean;
}): string {
  const trimmed = params.query.trim();
  if (!trimmed) return "";
  if (params.useOriginal) return trimmed;
  if (isSameLanguagePlatform(trimmed, params.uiLanguage, params.platformCountry)) {
    return trimmed;
  }

  if (params.translatedEnglish && params.translatedEnglish.trim()) {
    return params.translatedEnglish.trim();
  }

  return instantTranslateToEnglish(trimmed, params.uiLanguage).translated || trimmed;
}

/** Backwards-compatible wrapper for direct callers. */
export function normalizeQueryForPlatform(
  query: string,
  platformCountry: CountryCode,
  uiLanguage: LanguageCode = "ko",
): string {
  return resolveQueryForPlatform({ query, uiLanguage, platformCountry });
}
