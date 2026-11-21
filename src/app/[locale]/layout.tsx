import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { getSeoStrings } from "@/lib/i18n/seoStrings";
import { getBrandName } from "@/lib/i18n/uiStrings";

export function generateStaticParams() {
  return SUPPORTED_LANGUAGES.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) return {};

  const seo = getSeoStrings(locale);
  const brandName = getBrandName(locale);
  const fullTitle = `${brandName} | ${seo.title}`;

  return {
    title: fullTitle,
    description: seo.description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(SUPPORTED_LANGUAGES.map((lang) => [lang, `/${lang}`])),
        "x-default": `/${DEFAULT_LANGUAGE}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description: seo.description,
      type: "website",
      siteName: brandName,
      locale,
      url: `/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: seo.description,
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) notFound();

  return children;
}
