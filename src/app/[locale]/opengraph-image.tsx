import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from "@/lib/i18n/locales";
import { getUiStrings } from "@/lib/i18n/uiStrings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NON_LATIN_FONT_FAMILY: Partial<Record<LanguageCode, string>> = {
  ko: "Noto Sans KR",
  ja: "Noto Sans JP",
  zh: "Noto Sans SC",
  ar: "Noto Sans Arabic",
  ur: "Noto Sans Arabic",
  he: "Noto Sans Hebrew",
  hi: "Noto Sans Devanagari",
  th: "Noto Sans Thai",
  bn: "Noto Sans Bengali",
  si: "Noto Sans Sinhala",
  ru: "Noto Sans",
  uk: "Noto Sans",
  bg: "Noto Sans",
  el: "Noto Sans",
};

/**
 * Fetches a minimal Google Fonts TTF subset containing only the characters
 * rendered in this OG image, with a strict 2.5s timeout so slow/offline
 * environments safely fall back instead of hanging or emitting tofu boxes.
 */
async function loadSubsetFont(family: string, text: string): Promise<ArrayBuffer | null> {
  const uniqueChars = Array.from(new Set(text)).join("");
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@700` +
    `&text=${encodeURIComponent(uniqueChars)}`;

  try {
    const cssRes = await fetch(cssUrl, {
      signal: AbortSignal.timeout(2500),
      // Legacy Safari UA asks Google Fonts for a direct .ttf (Satori does not support woff2).
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1",
      },
    });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const fontUrlMatch = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:truetype|opentype)['"]?\)/);
    if (!fontUrlMatch?.[1]) return null;

    const fontRes = await fetch(fontUrlMatch[1], {
      signal: AbortSignal.timeout(2500),
    });
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

interface OgImageProps {
  params: Promise<{ locale: string }>;
}

export default async function Image({ params }: OgImageProps) {
  await connection();
  const { locale } = await params;
  const lang = isSupportedLanguage(locale) ? locale : DEFAULT_LANGUAGE;
  const localized = getUiStrings(lang);

  const fontFamily = NON_LATIN_FONT_FAMILY[lang];
  const fullText = `${localized.brand.before}${localized.brand.accent}${localized.brand.after}${localized.titleDetail}`;
  const fontData = fontFamily ? await loadSubsetFont(fontFamily, fullText) : null;

  // If a non-Latin locale failed to fetch its webfont (e.g. timeout), safely
  // fall back to English copy so Satori never renders missing-glyph tofu boxes.
  const t = fontFamily && !fontData ? getUiStrings(DEFAULT_LANGUAGE) : localized;
  const activeFontName = fontData && fontFamily ? fontFamily : "sans-serif";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 64px",
          backgroundColor: "#fff5f6",
          fontFamily: activeFontName,
        }}
      >
        <svg width="140" height="140" viewBox="0 0 48 48" style={{ marginBottom: 28 }}>
          <path
            d="M24 4C15.164 4 8 11.164 8 20c0 11.5 16 24 16 24s16-12.5 16-24c0-8.836-7.164-16-16-16z"
            fill="#FF3C5C"
          />
          <circle cx="24" cy="20" r="6.5" fill="#ffffff" />
        </svg>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            fontSize: 64,
            fontWeight: 700,
            color: "#171717",
            textAlign: "center",
          }}
        >
          <span>{t.brand.before}</span>
          <span style={{ color: "#FF3C5C" }}>{t.brand.accent}</span>
          <span>{t.brand.after}</span>
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            color: "#555555",
            textAlign: "center",
          }}
        >
          {t.titleDetail}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData && fontFamily
        ? [{ name: fontFamily, data: fontData, weight: 700, style: "normal" }]
        : undefined,
    },
  );
}
