"use client";

import { useEffect, useState } from "react";
import MapView from "@/components/MapView";
import Sidebar from "@/components/Sidebar";
import type { CountryCode } from "@/data/platforms";
import type { LanguageCode } from "@/lib/i18n/locales";
import styles from "./page.module.css";

interface HomeClientProps {
  homeCountry: CountryCode;
  uiLanguage: LanguageCode;
  /** Pre-focuses (scrolls to + highlights) a country on first render — used by the `/[locale]/[country]` landing pages. */
  initialFocusedCountry?: CountryCode | null;
}

export default function HomeClient({
  homeCountry,
  uiLanguage,
  initialFocusedCountry = null,
}: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [focusedCountry, setFocusedCountry] = useState<CountryCode | null>(initialFocusedCountry);

  // The root layout sets <html lang> on the server, but switching languages
  // via the picker is a client-side navigation — the root layout sits above
  // this whole route and doesn't re-run just because the [locale] segment's
  // params changed, so the server-rendered value can be stuck from whichever
  // language the page first loaded with. Keep it in sync here too. The
  // layout itself is always ltr — only the text direction of RTL scripts
  // (Arabic, Hebrew, Urdu) flows right-to-left, not the page structure.
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
  }, [uiLanguage]);

  return (
    <div className={styles.page}>
      <div className={styles.mapArea}>
        <MapView
          focusedCountry={focusedCountry}
          onFocusCountry={setFocusedCountry}
          uiLanguage={uiLanguage}
        />
      </div>
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        homeCountry={homeCountry}
        uiLanguage={uiLanguage}
        focusedCountry={focusedCountry}
        onFocusCountry={setFocusedCountry}
      />
    </div>
  );
}
