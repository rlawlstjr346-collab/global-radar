import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readAtlasBootstrapSync, readCountryShardSync } from "@/lib/atlasData";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { SITE_URL, RSS_ALTERNATE_TYPES } from "@/lib/siteUrl";
import HomeClient from "../../../HomeClient";

export const instant = false;

interface ExploreCityPageProps {
  params: Promise<{ locale: string; country: string; city: string }>;
}

function resolveCity(locale: string, countrySlug: string, citySlug: string) {
  if (!isSupportedLanguage(locale)) return null;
  const bootstrap = readAtlasBootstrapSync();
  const fullSlug = `${countrySlug.toLowerCase()}/${citySlug.toLowerCase()}`;
  const city = bootstrap.cities.find((c) => c.slug === fullSlug);
  if (!city) return null;
  const country = bootstrap.countries.find((c) => c.code === city.country);
  if (!country) return null;
  return { locale, city, country, bootstrap };
}

export async function generateMetadata({ params }: ExploreCityPageProps): Promise<Metadata> {
  const { locale, country, city } = await params;
  const resolved = resolveCity(locale, country, city);
  if (!resolved) return {};

  const { city: cityObj, country: countryObj, bootstrap } = resolved;
  const alleyNames = cityObj.topAlleys
    .slice(0, 3)
    .map((a) => a.name)
    .join("·");
  const appNames = bootstrap.platforms
    .filter((p) => p.country === cityObj.country)
    .slice(0, 3)
    .map((p) => p.name)
    .join(", ");

  const title =
    resolved.locale === "ko"
      ? `${cityObj.nameKo} 빈티지샵 지도 (${cityObj.shopCount.toLocaleString()}곳)${alleyNames ? ` · ${alleyNames} 구제샵 동선` : ""} | World Vintage Atlas`
      : `${cityObj.nameEn} Vintage Shops Map (${cityObj.shopCount.toLocaleString()})${alleyNames ? ` · ${alleyNames}` : ""} | World Vintage Atlas`;

  const description =
    resolved.locale === "ko"
      ? `${countryObj.nameKo} ${cityObj.nameKo} 오프라인 빈티지·구제샵 ${cityObj.shopCount.toLocaleString()}곳${alleyNames ? ` (${alleyNames})` : ""}${appNames ? ` 및 로컬 중고앱 ${appNames}` : ""} 통합 디깅 지도.`
      : `Explore ${cityObj.shopCount.toLocaleString()} vintage & secondhand clothing shops in ${cityObj.nameEn}, ${countryObj.nameEn}${alleyNames ? ` (${alleyNames})` : ""}${appNames ? ` plus local apps: ${appNames}` : ""}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolved.locale}/explore/${cityObj.slug}`,
      types: RSS_ALTERNATE_TYPES,
      languages: {
        ...Object.fromEntries(
          SUPPORTED_LANGUAGES.map((lang) => [lang, `/${lang}/explore/${cityObj.slug}`]),
        ),
        "x-default": `/${DEFAULT_LANGUAGE}/explore/${cityObj.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "World Vintage Atlas",
      locale: resolved.locale,
      url: `/${resolved.locale}/explore/${cityObj.slug}`,
    },
  };
}

export default async function ExploreCityPage({ params }: ExploreCityPageProps) {
  const { locale, country, city } = await params;
  const resolved = resolveCity(locale, country, city);
  if (!resolved) notFound();

  const { city: cityObj, country: countryObj, bootstrap } = resolved;
  const shard = readCountryShardSync(cityObj.country);
  const cityShops = (shard?.shops || [])
    .filter((s) => s.citySlug === cityObj.slug)
    .slice(0, 15);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name:
      resolved.locale === "ko"
        ? `${cityObj.nameKo} 빈티지샵 지도 (${cityObj.shopCount}곳)`
        : `${cityObj.nameEn} Vintage Shops Map (${cityObj.shopCount})`,
    url: `${SITE_URL}/${resolved.locale}/explore/${cityObj.slug}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: cityObj.shopCount,
      itemListElement: cityShops.map((shop, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "ClothingStore",
          name: shop.name,
          address: shop.address || `${cityObj.nameEn}, ${countryObj.nameEn}`,
          geo: {
            "@type": "GeoCoordinates",
            latitude: shop.lat,
            longitude: shop.lng,
          },
        },
      })),
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
        initialCountry={cityObj.country}
        initialCitySlug={cityObj.slug}
      />
      <nav className="sr-only" aria-label={`${cityObj.nameEn} Related Links`}>
        <ul>
          <li>
            <Link href={`/${resolved.locale}/explore/${countryObj.code.toLowerCase()}`}>
              {resolved.locale === "ko"
                ? `${countryObj.nameKo} 전체 빈티지샵 & 로컬 중고앱`
                : `All ${countryObj.nameEn} Vintage Shops & Local Apps`}
            </Link>
          </li>
          {bootstrap.featuredCities.slice(0, 12).map((other) => (
            <li key={other.slug}>
              <Link href={`/${resolved.locale}/explore/${other.slug}`}>
                {resolved.locale === "ko"
                  ? `${other.nameKo} 빈티지샵 지도`
                  : `${other.nameEn} Vintage Shops`}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
