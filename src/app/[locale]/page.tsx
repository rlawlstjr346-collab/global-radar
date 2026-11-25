import Link from "next/link";
import { notFound } from "next/navigation";
import { readAtlasBootstrapSync } from "@/lib/atlasData";
import { isSupportedLanguage } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/siteUrl";
import HomeClient from "./HomeClient";

export const instant = false;

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) notFound();

  const bootstrap = readAtlasBootstrapSync();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "World Vintage Atlas",
    url: `${SITE_URL}/${locale}`,
    description: `${bootstrap.meta.countries} countries, ${bootstrap.meta.shops.toLocaleString()} offline vintage shops, ${bootstrap.meta.platforms} local secondhand apps, ${bootstrap.meta.alleys} alleys, and ${bootstrap.meta.events} flea markets.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient bootstrap={bootstrap} uiLanguage={locale} />
      {/* 0px visual footprint internal crawl hub for Programmatic SEO */}
      <nav className="sr-only" aria-label="Global Vintage Atlas Directory">
        <ul>
          {bootstrap.featuredCities.map((city) => (
            <li key={city.slug}>
              <Link href={`/${locale}/explore/${city.slug}`}>
                {locale === "ko"
                  ? `${city.nameKo} 빈티지샵 지도 (${city.shopCount}곳)`
                  : `${city.nameEn} Vintage Shops Map (${city.shopCount})`}
              </Link>
            </li>
          ))}
          {bootstrap.countries.slice(0, 60).map((country) => (
            <li key={country.code}>
              <Link href={`/${locale}/explore/${country.code.toLowerCase()}`}>
                {locale === "ko"
                  ? `${country.nameKo} 빈티지샵 및 로컬 중고앱`
                  : `${country.nameEn} Vintage Shops & Secondhand Apps`}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
