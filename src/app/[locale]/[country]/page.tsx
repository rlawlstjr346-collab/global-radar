import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readAtlasBootstrap } from "@/lib/atlasData";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { SITE_URL, RSS_ALTERNATE_TYPES } from "@/lib/siteUrl";
import AtlasClient from "../AtlasClient";

interface CountryPageProps {
  params: Promise<{ locale: string; country: string }>;
}

async function resolveCountry(locale: string, countrySlug: string) {
  if (!isSupportedLanguage(locale)) return null;
  const bootstrap = await readAtlasBootstrap();
  const code = countrySlug.toUpperCase();
  const country = bootstrap.countries.find((c) => c.code === code);
  if (!country) return null;
  return { locale, country, bootstrap };
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { locale, country } = await params;
  const resolved = await resolveCountry(locale, country);
  if (!resolved) return {};

  const { country: c, bootstrap } = resolved;
  const slug = c.code.toLowerCase();
  const apps = bootstrap.platforms
    .filter((p) => p.country === c.code)
    .slice(0, 3)
    .map((p) => p.name)
    .join(", ");

  const title =
    resolved.locale === "ko"
      ? `${c.nameKo} 빈티지샵 지도 (${c.shopCount.toLocaleString()}곳) · 로컬 중고앱 | World Vintage Atlas`
      : `${c.nameEn} Vintage Shops (${c.shopCount.toLocaleString()}) & Local Secondhand Apps | World Vintage Atlas`;

  const description =
    resolved.locale === "ko"
      ? `${c.nameKo} 오프라인 빈티지샵 ${c.shopCount.toLocaleString()}곳, 골목 ${c.alleyCount}곳${apps ? `, 로컬 중고앱 ${apps}` : ""} 통합 디깅 아틀라스.`
      : `Explore ${c.shopCount.toLocaleString()} offline vintage shops, ${c.alleyCount} alleys${apps ? `, and local secondhand apps (${apps})` : ""} in ${c.nameEn}.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${resolved.locale}/explore/${slug}`,
      types: RSS_ALTERNATE_TYPES,
      languages: {
        ...Object.fromEntries(
          SUPPORTED_LANGUAGES.map((lang) => [lang, `/${lang}/explore/${slug}`]),
        ),
        "x-default": `/${DEFAULT_LANGUAGE}/explore/${slug}`,
      },
    },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { locale, country } = await params;
  const resolved = await resolveCountry(locale, country);
  if (!resolved) notFound();

  return (
    <AtlasClient
      uiLanguage={resolved.locale}
      initialCountry={resolved.country.code}
    />
  );
}
