import type { Metadata } from "next";
import { RSS_ALTERNATE_TYPES } from "@/lib/siteUrl";
import { notFound } from "next/navigation";
import { DEFAULT_LANGUAGE, isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";
import { getSeoStrings } from "@/lib/i18n/seoStrings";
import { readAtlasBootstrap } from "@/lib/atlasData";
import { localeOgImage } from "@/lib/ogImages";

/** Phrases people search before they know the brand (non-branded discovery queries). */
const DISCOVERY_KEYWORDS: Partial<Record<string, string[]>> = {
  ko: [
    "도쿄 빈티지샵 지도", "시모키타자와 구제샵 코스", "고엔지 빈티지샵", "하라주쿠 구제샵",
    "성수 빈티지샵 골목", "동묘 구제시장", "광장시장 구제상가", "홍대 빈티지샵",
    "오사카 빈티지샵", "아메리카무라 구제샵", "파리 마레지구 플리마켓", "파리 빈티지샵",
    "런던 빈티지샵", "뉴욕 빈티지샵", "방콕 빈티지 마켓", "해외 중고거래 사이트 메루카리",
    "해외 중고거래 앱", "빈티지샵 지도", "구제샵 지도", "플리마켓 일정",
  ],
  ja: [
    "東京 古着屋 マップ", "下北沢 古着屋", "高円寺 古着屋", "原宿 古着屋", "大阪 アメ村 古着屋",
    "ソウル 聖水 古着", "パリ マレ地区 蚤の市", "海外 古着屋 地図", "フリマ 日程", "ヴィンテージショップ 地図",
  ],
  en: [
    "vintage shop map", "tokyo vintage shops", "shimokitazawa thrift stores", "koenji vintage",
    "seoul seongsu vintage", "osaka amemura vintage", "paris le marais flea market",
    "london vintage shops", "new york vintage stores", "secondhand apps abroad", "mercari japan",
    "flea market calendar", "thrift store map",
  ],
};

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

  // Only the markets actually shown (recurring or not yet ended), never the raw dataset count.
  const marketCount = (await readAtlasBootstrap()).events.length;
  const description =
    locale === "ko"
      ? `도쿄 시모키타자와, 서울 성수·광장시장·동묘, 파리 마레지구 등 137개국 오프라인 빈티지샵 13,054곳, 핵심 골목 664곳, 플리마켓 ${marketCount}곳과 메루카리·빈티드 등 로컬 중고앱 136곳을 한 번에 탐색하세요.`
      : locale === "ja"
        ? `東京・下北沢、ソウル・聖水、パリ・マレ地区など137か国のヴィンテージ古着屋13,054店舗、664エリア、${marketCount}マーケットと136の現地中古アプリを横断検索。`
        : seo.description;

  return {
    title: fullTitle,
    description,
    keywords: DISCOVERY_KEYWORDS[locale] ?? DISCOVERY_KEYWORDS.en,
    alternates: {
      canonical: `/${locale}`,
      types: RSS_ALTERNATE_TYPES,
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
      images: [localeOgImage(locale)],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [localeOgImage(locale)],
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) notFound();

  return children;
}
