import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readAtlasBootstrapSync } from "@/lib/atlasData";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { SITE_URL, RSS_ALTERNATE_TYPES } from "@/lib/siteUrl";
import HomeClient from "../../HomeClient";

export const instant = false;

interface ExploreCountryPageProps {
  params: Promise<{ locale: string; country: string }>;
}

function resolveCountry(locale: string, countrySlug: string) {
  if (!isSupportedLanguage(locale)) return null;
  const bootstrap = readAtlasBootstrapSync();
  const code = countrySlug.toUpperCase();
  const country = bootstrap.countries.find((c) => c.code === code);
  if (!country) return null;
  return { locale, country, bootstrap };
}

export async function generateMetadata({ params }: ExploreCountryPageProps): Promise<Metadata> {
  const { locale, country } = await params;
  const resolved = resolveCountry(locale, country);
  if (!resolved) return {};

  const { country: c, bootstrap } = resolved;
  const slug = c.code.toLowerCase();
  const topCities = bootstrap.cities
    .filter((city) => city.country === c.code)
    .slice(0, 3)
    .map((city) => (resolved.locale === "ko" ? city.nameKo : city.nameEn))
    .join("·");
  const apps = bootstrap.platforms
    .filter((p) => p.country === c.code)
    .slice(0, 3)
    .map((p) => p.name)
    .join(", ");

  const title =
    resolved.locale === "ko"
      ? `${c.nameKo} 빈티지샵 지도 (${c.shopCount.toLocaleString()}곳)${topCities ? ` · ${topCities}` : ""}${apps ? ` · ${apps}` : ""} | World Vintage Atlas`
      : `${c.nameEn} Vintage Shops Map (${c.shopCount.toLocaleString()})${topCities ? ` · ${topCities}` : ""} | World Vintage Atlas`;

  const description =
    resolved.locale === "ko"
      ? `${c.nameKo} 오프라인 빈티지·구제샵 ${c.shopCount.toLocaleString()}곳, 핵심 골목 ${c.alleyCount}곳${apps ? `, 현지 중고거래 플랫폼(${apps})` : ""}을 한 번에 탐색하는 글로벌 디깅 아틀라스.`
      : `Discover ${c.shopCount.toLocaleString()} offline vintage shops, ${c.alleyCount} alleys${apps ? `, and local secondhand platforms (${apps})` : ""} across ${c.nameEn}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolved.locale}/explore/${slug}`,
      types: RSS_ALTERNATE_TYPES,
      languages: {
        ...Object.fromEntries(
          SUPPORTED_LANGUAGES.map((lang) => [lang, `/${lang}/explore/${slug}`]),
        ),
        "x-default": `/${DEFAULT_LANGUAGE}/explore/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "World Vintage Atlas",
      locale: resolved.locale,
      url: `/${resolved.locale}/explore/${slug}`,
    },
  };
}

export default async function ExploreCountryPage({ params }: ExploreCountryPageProps) {
  const { locale, country } = await params;
  const resolved = resolveCountry(locale, country);
  if (!resolved) notFound();

  const { country: c, bootstrap } = resolved;
  const countryCities = bootstrap.cities.filter((city) => city.country === c.code).slice(0, 20);
  const countryPlatforms = bootstrap.platforms.filter((p) => p.country === c.code);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: resolved.locale === "ko" ? `${c.nameKo} 빈티지샵 지도 & 로컬 중고앱` : `${c.nameEn} Vintage Shops & Secondhand Apps`,
    url: `${SITE_URL}/${resolved.locale}/explore/${c.code.toLowerCase()}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: countryCities.length + countryPlatforms.length,
      itemListElement: [
        ...countryCities.slice(0, 10).map((city, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: resolved.locale === "ko" ? `${city.nameKo} 빈티지샵 (${city.shopCount})` : `${city.nameEn} Vintage Shops (${city.shopCount})`,
          url: `${SITE_URL}/${resolved.locale}/explore/${city.slug}`,
        })),
        ...countryPlatforms.slice(0, 5).map((p, idx) => ({
          "@type": "ListItem",
          position: Math.min(countryCities.length, 10) + idx + 1,
          name: p.name,
          url: p.homepage,
        })),
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient
        bootstrap={bootstrap}
        uiLanguage={resolved.locale}
        initialCountry={c.code}
      />
      <nav className="sr-only" aria-label={`${c.nameEn} Cities Directory`}>
        <ul>
          {countryCities.map((city) => (
            <li key={city.slug}>
              <Link href={`/${resolved.locale}/explore/${city.slug}`}>
                {resolved.locale === "ko"
                  ? `${city.nameKo} 빈티지샵 지도 (${city.shopCount}곳)`
                  : `${city.nameEn} Vintage Shops Map (${city.shopCount})`}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
