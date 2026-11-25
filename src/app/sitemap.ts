import type { MetadataRoute } from "next";
import { readAtlasBootstrapSync } from "@/lib/atlasData";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { SITE_URL as BASE_URL } from "@/lib/siteUrl";

const PRIMARY_SEO_LOCALES = ["ko", "en", "ja"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const bootstrap = readAtlasBootstrapSync();
  const lastModified = new Date(bootstrap.meta.generatedAt || Date.now());

  const homePages: MetadataRoute.Sitemap = SUPPORTED_LANGUAGES.map((locale) => ({
    url: `${BASE_URL}/${locale}`,
    lastModified,
    changeFrequency: "weekly",
    priority: locale === "ko" || locale === "en" ? 1.0 : 0.8,
  }));

  const countryPages: MetadataRoute.Sitemap = PRIMARY_SEO_LOCALES.flatMap((locale) =>
    bootstrap.countries.map((c) => ({
      url: `${BASE_URL}/${locale}/explore/${c.code.toLowerCase()}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    })),
  );

  // Top 120 digging cities by shop density (including all 24 curated sanctuary cities)
  const topCities = bootstrap.cities.slice(0, 120);
  const cityPages: MetadataRoute.Sitemap = PRIMARY_SEO_LOCALES.flatMap((locale) =>
    topCities.map((city) => ({
      url: `${BASE_URL}/${locale}/explore/${city.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: city.curated ? 0.9 : 0.7,
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

  return [...homePages, ...countryPages, ...cityPages, ...privacyPage];
}
