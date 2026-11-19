import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
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

  return {
    title: `${brandName} | ${seo.title}`,
    description: seo.description,
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(SUPPORTED_LANGUAGES.map((lang) => [lang, `/${lang}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) notFound();

  return children;
}
