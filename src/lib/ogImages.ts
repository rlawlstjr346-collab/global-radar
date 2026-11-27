/**
 * Share cards and icons are pre-rendered PNGs in public/ (served by Workers Static Assets,
 * zero Worker CPU) instead of per-request next/og WASM renders.
 */
const CARD = { width: 1200, height: 630, type: "image/png" } as const;

export const ROOT_OG_IMAGE = { url: "/opengraph-image.png", ...CARD, alt: "ATLAS. — World Vintage & Archive Map" };

export function localeOgImage(locale: string) {
  return { url: `/og/${locale}.png`, ...CARD };
}

export const SITE_ICONS = {
  icon: [{ url: "/icon.png", type: "image/png", sizes: "32x32" }],
  apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
};
