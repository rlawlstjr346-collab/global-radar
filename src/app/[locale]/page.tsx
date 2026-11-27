import Link from "next/link";
import { notFound } from "next/navigation";
import { readAtlasBootstrap } from "@/lib/atlasData";
import { isSupportedLanguage } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/siteUrl";
import AtlasClient from "./AtlasClient";

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) notFound();

  const bootstrap = await readAtlasBootstrap();

  const ko = locale === "ko";
  const hubs = [...bootstrap.cities]
    .filter((c) => !c.nameKo.includes("기타"))
    .sort((a, b) => b.shopCount - a.shopCount)
    .slice(0, 28);
  const hubName = (c: (typeof hubs)[number]) => (ko ? c.nameKo : c.nameEn);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "World Vintage Atlas",
      alternateName: ["ATLAS.", "worldvintagemap"],
      url: `${SITE_URL}/${locale}`,
      inLanguage: locale,
      description: `${bootstrap.meta.countries} countries, ${bootstrap.meta.shops.toLocaleString()} offline vintage shops, ${bootstrap.meta.platforms} local secondhand apps, ${bootstrap.meta.alleys} alleys, and ${bootstrap.events.length} flea markets.`,
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: ko ? "세계 빈티지샵 · 구제샵 지도" : "World vintage & thrift shop map",
      url: `${SITE_URL}/${locale}`,
      inLanguage: locale,
      about: ["vintage clothing", "thrift stores", "flea markets", "secondhand marketplaces"],
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: hubs.length,
        itemListElement: hubs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: ko ? `${c.nameKo} 빈티지샵 지도` : `${c.nameEn} vintage shop map`,
          url: `${SITE_URL}/${locale}/explore/${c.slug}`,
        })),
      },
    },
  ];
  const alleyLinks = bootstrap.alleys
    .filter((a) => a.count >= 15)
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AtlasClient uiLanguage={locale} />
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
          {hubs.map((city) => (
            <li key={`hub-${city.slug}`}>
              <Link href={`/${locale}/explore/${city.slug}`}>
                {ko ? `${hubName(city)} 빈티지샵 · 구제샵 지도` : `${hubName(city)} vintage & thrift shop map`}
              </Link>
            </li>
          ))}
          {alleyLinks.map((a) => (
            <li key={`alley-${a.id}`}>
              <Link href={`/${locale}/explore/${a.citySlug}`}>
                {ko ? `${a.name} 구제샵 코스 (${a.cityKo})` : `${a.name} vintage shop walk (${a.cityEn})`}
              </Link>
            </li>
          ))}
          {bootstrap.countries.map((country) => (
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
