import type { LanguageCode } from "./i18n/locales";

const OSM_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const KO_DAYS: Record<string, string> = {
  Mo: "월",
  Tu: "화",
  We: "수",
  Th: "목",
  Fr: "금",
  Sa: "토",
  Su: "일",
  PH: "공휴일",
};
const JA_DAYS: Record<string, string> = {
  Mo: "月",
  Tu: "火",
  We: "水",
  Th: "木",
  Fr: "金",
  Sa: "土",
  Su: "日",
  PH: "祝日",
};
const EN_DAYS: Record<string, string> = {
  Mo: "Mon",
  Tu: "Tue",
  We: "Wed",
  Th: "Thu",
  Fr: "Fri",
  Sa: "Sat",
  Su: "Sun",
  PH: "Holidays",
};
const OFF: Record<string, string> = { ko: "휴무", ja: "定休", en: "closed" };

/** Notes that carry no information for the visitor (data-pipeline defaults). */
const PLACEHOLDER_NOTES = [/^인스타 검색으로 영업 확인$/];

export function isMeaningfulNote(note: string | undefined): note is string {
  const t = note?.trim();
  return Boolean(t) && !PLACEHOLDER_NOTES.some((re) => re.test(t!));
}

/**
 * Formats OpenStreetMap `opening_hours` (e.g. "Mo-Sa 10:00-19:00; Su off") for the UI locale.
 * Non-OSM strings (already-localised Korean hours) only get their time ranges normalised to an en dash.
 */
export function formatOpeningHours(raw: string | undefined, lang: LanguageCode): string | undefined {
  const text = raw?.trim();
  if (!text) return undefined;
  const dayToken = new RegExp(`\\b(${[...OSM_DAYS, "PH"].join("|")})\\b`, "g");
  if (!dayToken.test(text)) return text.replace(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g, "$1–$2");

  const dict = lang === "ko" ? KO_DAYS : lang === "ja" ? JA_DAYS : EN_DAYS;
  const off = OFF[lang === "ko" || lang === "ja" ? lang : "en"];
  return text
    .split(/\s*;\s*/)
    .filter(Boolean)
    .map((part) =>
      part
        .replace(dayToken, (d) => dict[d] ?? d)
        .replace(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g, "$1–$2")
        .replace(/([^\d\s,])-([^\d\s,])/g, "$1–$2")
        .replace(/\boff\b|\bclosed\b/gi, off)
        .replace(/,(?=\S)/g, "·"),
    )
    .join(" · ");
}
