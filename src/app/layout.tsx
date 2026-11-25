import type { Metadata } from "next";
import { headers } from "next/headers";
import ConsentManager from "@/components/ConsentManager";
import { isEuCountry } from "@/lib/i18n/euCountries";
import { getGeoCountry } from "@/lib/i18n/geo";
import { DEFAULT_LANGUAGE, getLanguageDir, isSupportedLanguage } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

// Ownership tokens. Google & Naver are also verified by the HTML files in /public
// (google9ae0e13efc369bc9.html, navera06b483a2c8a598883a6b86657b88a14.html) carried over
// from the previous deployment of this domain; env vars override the meta tokens.
const googleVerification =
  process.env.GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const naverVerification =
  process.env.NAVER_SITE_VERIFICATION ||
  process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION ||
  "bcaffdcaad9c5e3d64a84c341a0d9b14a71b679b";

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

/** Global landing (/ko, /en ...) only, once per tab session (not gated on reduced-motion: Linux reports "reduce"). */
const INTRO_GATE_SCRIPT = `(function(){try{if(!/^\\/[a-z]{2}\\/?$/.test(location.pathname))return;if(sessionStorage.getItem("atlas-intro"))return;sessionStorage.setItem("atlas-intro","1");document.documentElement.setAttribute("data-intro","");}catch(e){}})();`;

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
