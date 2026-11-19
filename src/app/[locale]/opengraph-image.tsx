import { ImageResponse } from "next/og";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "@/lib/i18n/locales";
import { getUiStrings } from "@/lib/i18n/uiStrings";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface OgImageProps {
  params: Promise<{ locale: string }>;
}

export default async function Image({ params }: OgImageProps) {
  const { locale } = await params;
  const lang = isSupportedLanguage(locale) ? locale : DEFAULT_LANGUAGE;
  const t = getUiStrings(lang);

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
          backgroundColor: "#fff5f6",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="140" height="140" viewBox="0 0 48 48" style={{ marginBottom: 28 }}>
          <path
            d="M24 4C15.164 4 8 11.164 8 20c0 11.5 16 24 16 24s16-12.5 16-24c0-8.836-7.164-16-16-16z"
            fill="#FF3C5C"
          />
          <circle cx="24" cy="20" r="6.5" fill="#ffffff" />
        </svg>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, color: "#171717" }}>
          <span>{t.brand.before}</span>
          <span style={{ color: "#FF3C5C" }}>{t.brand.accent}</span>
          <span>{t.brand.after}</span>
        </div>
        <div style={{ marginTop: 20, fontSize: 32, color: "#555555" }}>{t.titleDetail}</div>
      </div>
    ),
    { ...size },
  );
}
