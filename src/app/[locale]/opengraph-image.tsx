import { ImageResponse } from "next/og";
import { connection } from "next/server";
import { DEFAULT_LANGUAGE, isSupportedLanguage, type LanguageCode } from "@/lib/i18n/locales";

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

async function loadSubsetFont(family: string, text: string): Promise<ArrayBuffer | null> {
  const uniqueChars = Array.from(new Set(text)).join("");
  const cssUrl =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@700` +
    `&text=${encodeURIComponent(uniqueChars)}`;

  try {
    const cssRes = await fetch(cssUrl, {
      signal: AbortSignal.timeout(2500),
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

  const isKo = lang === "ko";
  const isJa = lang === "ja";
  const subtitle = isKo
    ? "137개국 · 13,054 빈티지샵 · 136 로컬 중고앱 · 664 골목"
    : isJa
      ? "137か国 · 13,054 古着屋 · 136 中古アプリ · 664 エリア"
      : "137 Countries · 13,054 Vintage Shops · 136 Local Apps · 664 Alleys";

  const fontFamily = NON_LATIN_FONT_FAMILY[lang];
  const fontData = fontFamily ? await loadSubsetFont(fontFamily, `WORLD VINTAGE ATLAS ${subtitle}`) : null;
  const activeFontName = fontData && fontFamily ? fontFamily : "sans-serif";
  const displaySubtitle = fontFamily && !fontData
    ? "137 Countries · 13,054 Vintage Shops · 136 Local Apps · 664 Alleys"
    : subtitle;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#F6F6F4",
          color: "#18181B",
          fontFamily: activeFontName,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="#18181B" />
              <circle cx="24" cy="24" r="13" stroke="#FFFFFF" strokeWidth="2.2" />
              <ellipse cx="24" cy="24" rx="6.5" ry="13" stroke="#FFFFFF" strokeWidth="1.8" />
              <line x1="11" y1="24" x2="37" y2="24" stroke="#FFFFFF" strokeWidth="1.8" />
            </svg>
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
              WORLD VINTAGE ATLAS
            </span>
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 9999,
              backgroundColor: "#18181B",
              color: "#FFFFFF",
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.06em",
            }}
          >
            WORLDVINTAGEMAP.COM
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.06 }}>
            Global Digging Atlas
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: "#52525B", letterSpacing: "-0.015em" }}>
            {displaySubtitle}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["JP TOKYO", "KR SEOUL", "FR PARIS", "GB LONDON", "US NYC", "DE BERLIN"].map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                padding: "8px 16px",
                borderRadius: 9999,
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.12)",
                fontSize: 16,
                fontWeight: 600,
                color: "#18181B",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      fonts:
        fontData && fontFamily
          ? [{ name: fontFamily, data: fontData, weight: 700, style: "normal" }]
          : undefined,
    },
  );
}
