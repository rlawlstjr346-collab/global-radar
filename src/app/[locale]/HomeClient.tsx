"use client";

import { useCallback, useEffect, useState } from "react";
import MapView from "@/components/MapView";
import Sidebar from "@/components/Sidebar";
import type { CountryCode } from "@/data/platforms";
import { getLanguageDir, type LanguageCode } from "@/lib/i18n/locales";
import styles from "./page.module.css";

interface HomeClientProps {
  homeCountry: CountryCode;
  uiLanguage: LanguageCode;
  localizedCountryNames: Record<CountryCode, string>;
  /** Pre-focuses (scrolls to + highlights) a country on first render — used by the `/[locale]/[country]` landing pages. */
  initialFocusedCountry?: CountryCode | null;
}

export default function HomeClient({
  homeCountry,
  uiLanguage,
  localizedCountryNames,
  initialFocusedCountry = null,
}: HomeClientProps) {
  const [query, setQuery] = useState("");
  const [focusState, setFocusState] = useState<{ code: CountryCode; seq: number } | null>(() =>
    initialFocusedCountry ? { code: initialFocusedCountry, seq: 0 } : null,
  );
  const [locatedCountry, setLocatedCountry] = useState<CountryCode | null>(null);
  const [mobileCollapsed, setMobileCollapsed] = useState(false);

  const activeHomeCountry = locatedCountry ?? homeCountry;
  const focusedCountry = focusState?.code ?? null;
  const focusSeq = focusState?.seq ?? 0;

  // Keep <html lang> and <html dir> in sync on client-side locale switches
  // (the root layout sits above `[locale]` and does not re-run on param change).
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = getLanguageDir(uiLanguage);
  }, [uiLanguage]);

  const handleFocusCountry = useCallback((code: CountryCode) => {
    setFocusState((prev) => ({ code, seq: (prev?.seq ?? 0) + 1 }));
    setMobileCollapsed(false);
  }, []);

  const handleLocateCountry = useCallback((code: CountryCode) => {
    setLocatedCountry(code);
    setFocusState((prev) => ({ code, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  const handleResetHome = useCallback(() => {
    setQuery("");
    setFocusState(null);
    setMobileCollapsed(false);
  }, []);

  return (
    <div className={`${styles.page} ${mobileCollapsed ? styles.pageMobileCollapsed : ""}`}>
      <div className={styles.mapArea}>
        <MapView
          focusedCountry={focusedCountry}
          focusSeq={focusSeq}
          onFocusCountry={handleFocusCountry}
          onLocateCountry={handleLocateCountry}
          uiLanguage={uiLanguage}
          localizedCountryNames={localizedCountryNames}
          mobileCollapsed={mobileCollapsed}
        />
      </div>
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        homeCountry={activeHomeCountry}
        uiLanguage={uiLanguage}
        localizedCountryNames={localizedCountryNames}
        focusedCountry={focusedCountry}
        focusSeq={focusSeq}
        onFocusCountry={handleFocusCountry}
        onResetHome={handleResetHome}
        mobileCollapsed={mobileCollapsed}
        onToggleMobileCollapsed={() => setMobileCollapsed((prev) => !prev)}
      />
    </div>
  );
}
