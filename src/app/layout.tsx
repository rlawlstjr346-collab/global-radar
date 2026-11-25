import type { Metadata } from "next";
import { headers } from "next/headers";
import ConsentManager from "@/components/ConsentManager";
import { isEuCountry } from "@/lib/i18n/euCountries";
import { getGeoCountry } from "@/lib/i18n/geo";
import { DEFAULT_LANGUAGE, getLanguageDir, isSupportedLanguage } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const naverVerification =
  process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION || "bcaffdcaad9c5e3d64a84c341a0d9b14a71b679b";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    types: {
      "application/rss+xml": `${SITE_URL}/rss.xml`,
    },
  },
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    other: {
      "naver-site-verification": naverVerification,
    },
  },
};

export const instant = false;

/** Global landing (/ko, /en ...) only, once per tab session, never under prefers-reduced-motion. */
const INTRO_GATE_SCRIPT = `(function(){try{if(!/^\\/[a-z]{2}\\/?$/.test(location.pathname))return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(sessionStorage.getItem("atlas-intro"))return;sessionStorage.setItem("atlas-intro","1");document.documentElement.setAttribute("data-intro","");}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers();
  const headerLocale = hdrs.get("x-locale");
  const locale = headerLocale && isSupportedLanguage(headerLocale) ? headerLocale : DEFAULT_LANGUAGE;
  const requiresConsent = isEuCountry(getGeoCountry({ headers: hdrs }));

  return (
    <html lang={locale} dir={getLanguageDir(locale)} suppressHydrationWarning>
      <body>
        {/* Decides the once-per-session orbital intro before first paint (no flash, no hydration mismatch). */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE_SCRIPT }} />
        {children}
        <ConsentManager requiresConsent={requiresConsent} uiLanguage={locale} />
      </body>
    </html>
  );
}
