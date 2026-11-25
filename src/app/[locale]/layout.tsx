import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { getSeoStrings } from "@/lib/i18n/seoStrings";

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
  const fullTitle =
    locale === "ko"
      ? "World Vintage Atlas | 137개국 빈티지샵 13,054곳 · 로컬 중고앱 136곳 글로벌 디깅 아틀라스"
      : locale === "ja"
        ? "World Vintage Atlas | 世界137か国 古着屋13,054店・中古アプリ136選 グローバルディギングマップ"
        : `World Vintage Atlas | 137 Countries · 13,054 Vintage Shops & Local Secondhand Apps`;

  const description =
    locale === "ko"
      ? "도쿄 시모키타자와, 서울 성수·광장시장·동묘, 파리 마레지구 등 137개국 오프라인 빈티지샵 13,054곳, 핵심 골목 664곳, 플리마켓 88곳과 메루카리·빈티드 등 로컬 중고앱 136곳을 한 번에 탐색하세요."
      : locale === "ja"
        ? "東京・下北沢、ソウル・聖水、パリ・マレ地区など137か国のヴィンテージ古着屋13,054店舗、664エリア、88マーケットと136の現地中古アプリを横断検索。"
        : seo.description;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ...Object.fromEntries(SUPPORTED_LANGUAGES.map((lang) => [lang, `/${lang}`])),
        "x-default": `/${DEFAULT_LANGUAGE}`,
      },
    },
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      siteName: "World Vintage Atlas",
      locale,
      url: `/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) notFound();

  return children;
}
