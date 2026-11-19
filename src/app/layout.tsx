import type { Metadata } from "next";
import { headers } from "next/headers";
import ConsentManager from "@/components/ConsentManager";
import { isEuCountry } from "@/lib/i18n/euCountries";
import { getGeoCountry } from "@/lib/i18n/geo";
import { DEFAULT_LANGUAGE, isSupportedLanguage } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  verification: {
    other: {
      "naver-site-verification": "bcaffdcaad9c5e3d64a84c341a0d9b14a71b679b",
    },
  },
};

// <html lang> depends on the `x-locale` header proxy.ts sets per request
// (the root layout sits above the `[locale]` segment and can't read its
// route params directly), so this can't be statically prerendered.
export const instant = false;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const hdrs = await headers();
  const headerLocale = hdrs.get("x-locale");
  const locale = headerLocale && isSupportedLanguage(headerLocale) ? headerLocale : DEFAULT_LANGUAGE;
  // Gates the cookie-consent banner to actual EU visitors (geo-IP), not
  // language or search-sort preference — see euCountries.ts.
  const requiresConsent = isEuCountry(getGeoCountry({ headers: hdrs }));

  return (
    <html lang={locale}>
      <body>
        {children}
        <ConsentManager requiresConsent={requiresConsent} uiLanguage={locale} />
      </body>
    </html>
  );
}
