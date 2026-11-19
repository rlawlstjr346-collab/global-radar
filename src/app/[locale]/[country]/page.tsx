import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COUNTRY_POINTS } from "@/data/countries";
import { platformsForCountry, type CountryCode } from "@/data/platforms";
import { getCountryPageSeo } from "@/lib/i18n/countryPageSeo";
import { getLocalizedCountryName } from "@/lib/i18n/countryNames";
import { isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { getBrandName } from "@/lib/i18n/uiStrings";
import HomeClient from "../HomeClient";

// Only countries that actually have at least one platform get a landing
// page — matches the sidebar's own filter, so no page links to an empty
// section.
const LANDABLE_COUNTRIES = COUNTRY_POINTS.filter((c) => platformsForCountry(c.code).length > 0);

// Reads route params directly (needed to resolve the country before first
// paint), so this route can't be statically prerendered — same reasoning
// as src/app/[locale]/page.tsx.
export const instant = false;

export function generateStaticParams() {
  return LANDABLE_COUNTRIES.map((c) => ({ country: c.code.toLowerCase() }));
}

interface CountryPageProps {
  params: Promise<{ locale: string; country: string }>;
}

function resolveParams(locale: string, countrySlug: string) {
  if (!isSupportedLanguage(locale)) return null;
  const code = countrySlug.toUpperCase() as CountryCode;
  const point = LANDABLE_COUNTRIES.find((c) => c.code === code);
  if (!point) return null;
  return { locale, point };
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { locale, country } = await params;
  const resolved = resolveParams(locale, country);
  if (!resolved) return {};

  const countryName = getLocalizedCountryName(resolved.point.code, resolved.locale);
  const platformNames = platformsForCountry(resolved.point.code)
    .slice(0, 3)
    .map((p) => p.name)
    .join(", ");
  const seo = getCountryPageSeo(resolved.locale);
  const brandName = getBrandName(resolved.locale);
  const countrySlug = resolved.point.code.toLowerCase();

  return {
    title: `${seo.title(countryName)} | ${brandName}`,
    description: seo.description(countryName, platformNames),
    alternates: {
      canonical: `/${resolved.locale}/${countrySlug}`,
      languages: Object.fromEntries(
        SUPPORTED_LANGUAGES.map((lang) => [lang, `/${lang}/${countrySlug}`]),
      ),
    },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { locale, country } = await params;
  const resolved = resolveParams(locale, country);
  if (!resolved) notFound();

  return (
    <HomeClient
      homeCountry={resolved.point.code}
      uiLanguage={resolved.locale}
      initialFocusedCountry={resolved.point.code}
    />
  );
}
