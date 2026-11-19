import { notFound } from "next/navigation";
import { isSupportedLanguage } from "@/lib/i18n/locales";
import { resolveRequestHomeCountry } from "@/lib/i18n/resolveRequestHomeCountry";
import HomeClient from "./HomeClient";

// The home country must be resolved before first paint (it drives the
// sidebar's sort order), so this route can't be statically prerendered.
export const instant = false;

interface LocalePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;
  if (!isSupportedLanguage(locale)) notFound();

  const homeCountry = await resolveRequestHomeCountry();

  return <HomeClient homeCountry={homeCountry} uiLanguage={locale} />;
}
