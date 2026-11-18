import { BRAND_MAP, SPELL_FIX, TERM_MAP } from "@/data/translationDictionary";
import type { CountryCode } from "@/data/platforms";

const HANGUL = /[가-힣]/;

const LEXICON = Object.entries({ ...TERM_MAP, ...BRAND_MAP }).sort(
  (a, b) => b[0].length - a[0].length,
);

function applyLexicon(text: string): string {
  let out = text;
  for (const [ko, en] of LEXICON) {
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

/**
 * Normalizes a Korean query (brand/term names) into English for platforms
 * outside Korea, the same lexicon RADAR already uses for eBay/Mercari.
 * Non-Korean queries, or queries headed to a Korean platform, pass through
 * untouched since no cross-language search is needed there.
 */
export function normalizeQueryForPlatform(query: string, platformCountry: CountryCode): string {
  const trimmed = query.trim();
  if (!trimmed || platformCountry === "KR" || !HANGUL.test(trimmed)) return trimmed;

  const mapped = applyLexicon(trimmed);
  if (!HANGUL.test(mapped)) return applySpellFix(trimmed, mapped).trim();

  // Lexicon alone couldn't clear every Hangul token (no LLM step configured
  // here) - still return the partial mapping, which is usually enough.
  return mapped.trim();
}
