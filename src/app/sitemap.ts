import type { MetadataRoute } from "next";
import { COUNTRY_POINTS } from "@/data/countries";
import { platformsForCountry } from "@/data/platforms";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { SITE_URL as BASE_URL } from "@/lib/siteUrl";

const LANDABLE_COUNTRY_SLUGS = COUNTRY_POINTS.filter((c) => platformsForCountry(c.code).length > 0).map(
  (c) => c.code.toLowerCase(),
);

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const homePages: MetadataRoute.Sitemap = SUPPORTED_LANGUAGES.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified,
    changeFrequency: "weekly",
    priority: locale === "en" ? 1 : 0.8,
  }));

  const countryPages: MetadataRoute.Sitemap = SUPPORTED_LANGUAGES.flatMap((locale) =>
    LANDABLE_COUNTRY_SLUGS.map((countrySlug) => ({
      url: `${BASE_URL}/${locale}/${countrySlug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  );

  const privacyPage: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/privacy`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  return [...homePages, ...countryPages, ...privacyPage];
}
