/**
 * Google Analytics 4 wiring. Silently inert when NEXT_PUBLIC_GA_MEASUREMENT_ID
 * isn't set (e.g. local dev) — nothing loads, nothing errors.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "page_view", { page_path: path });
}

/** Fired when a visitor clicks through to one of a country's platforms. */
export function trackPlatformClick(params: {
  platformId: string;
  country: string;
  language: string;
}) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "platform_click", {
    platform_id: params.platformId,
    country: params.country,
    language: params.language,
  });
}
