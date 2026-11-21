"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { GA_MEASUREMENT_ID, trackPageView } from "@/lib/analytics";

/**
 * Loads GA4 and fires a deduplicated `page_view` on both initial load
 * (triggered via `onReady` once `window.gtag` is initialized) and subsequent
 * client-side route changes (via `useEffect`).
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const sendIfUntracked = useCallback((path: string) => {
    if (!GA_MEASUREMENT_ID || typeof window === "undefined" || !window.gtag) return;
    if (lastTrackedPathRef.current === path) return;
    lastTrackedPathRef.current = path;
    trackPageView(path);
  }, []);

  useEffect(() => {
    sendIfUntracked(pathname);
  }, [pathname, sendIfUntracked]);

  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga-init"
        strategy="afterInteractive"
        onReady={() => sendIfUntracked(pathnameRef.current)}
      >
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
        `}
      </Script>
    </>
  );
}
