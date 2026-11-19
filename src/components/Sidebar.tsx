"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type UIEvent } from "react";
import { COUNTRY_POINTS } from "@/data/countries";
import { platformsForCountry, type CountryCode, type Platform } from "@/data/platforms";
import { trackPlatformClick } from "@/lib/analytics";
import { sortCountriesByProximity } from "@/lib/geo/distance";
import { getLocalizedCountryName } from "@/lib/i18n/countryNames";
import { COUNTRY_TO_DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/i18n/locales";
import { getUiStrings } from "@/lib/i18n/uiStrings";
import { getPlatformAccent } from "@/lib/platformColor";
import { normalizeQueryForPlatform } from "@/lib/translateQuery";
import LogoMark from "./LogoMark";
import styles from "./Sidebar.module.css";

/**
 * When the viewer's UI language matches the platform's own country, its
 * native name is what they'd actually recognize (e.g. a Korean reader
 * looking for "번개장터", not "Bunjang") — so it leads, with the brand's
 * international name as the parenthetical. Otherwise the order flips,
 * since leading with a script the viewer can't read hurts readability.
 */
function platformDisplayName(platform: Platform, uiLanguage: LanguageCode): string {
  if (!platform.nativeName) return platform.name;
  const isHomeLanguage = COUNTRY_TO_DEFAULT_LANGUAGE[platform.country] === uiLanguage;
  return isHomeLanguage
    ? `${platform.nativeName} (${platform.name})`
    : `${platform.name} (${platform.nativeName})`;
}

interface SidebarProps {
  query: string;
  onQueryChange: (value: string) => void;
  homeCountry: CountryCode;
  uiLanguage: LanguageCode;
  focusedCountry: CountryCode | null;
  onFocusCountry: (code: CountryCode) => void;
}

export default function Sidebar({
  query,
  onQueryChange,
  homeCountry,
  uiLanguage,
  focusedCountry,
  onFocusCountry,
}: SidebarProps) {
  const [scrolled, setScrolled] = useState(false);
  const sectionRefs = useRef(new Map<CountryCode, HTMLDivElement>());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // The flash highlight is deliberately decoupled from `focusedCountry`: it
  // only turns on once the scroll animation actually lands, via the
  // `scrollend` event. Flashing immediately on click looked out of sync for
  // countries far down the list — the highlight would finish fading before
  // the smooth scroll (whose duration grows with distance) even arrived.
  const [flashedCountry, setFlashedCountry] = useState<CountryCode | null>(null);

  // Intl.DisplayNames can disagree between the server's and the browser's
  // ICU data for a handful of regions (e.g. Hong Kong), which would cause a
  // hydration mismatch if used directly during the first render. So the
  // server/first-paint HTML always uses the static English name, and only
  // once hydration is actually done (no subscription needed — the snapshot
  // just differs between server and client) do we switch to the localized
  // one. This is React's documented pattern for exactly this case.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const sortedCountries = sortCountriesByProximity(COUNTRY_POINTS, homeCountry);
  const t = getUiStrings(uiLanguage);

  useEffect(() => {
    if (!focusedCountry) return;
    const target = sectionRefs.current.get(focusedCountry);
    const scrollArea = scrollAreaRef.current;
    if (!target || !scrollArea) return;

    const targetRect = target.getBoundingClientRect();
    const areaRect = scrollArea.getBoundingClientRect();
    const alreadyInView = targetRect.top >= areaRect.top && targetRect.bottom <= areaRect.bottom;

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    if (alreadyInView) {
      setFlashedCountry(focusedCountry);
      return;
    }

    let fired = false;
    const triggerFlash = () => {
      if (fired) return;
      fired = true;
      setFlashedCountry(focusedCountry);
    };

    // `scrollend` lands exactly when the native smooth scroll finishes,
    // regardless of distance — the fallback timer only covers browsers that
    // don't support it yet.
    scrollArea.addEventListener("scrollend", triggerFlash, { once: true });
    const fallback = setTimeout(triggerFlash, 1000);

    return () => {
      scrollArea.removeEventListener("scrollend", triggerFlash);
      clearTimeout(fallback);
    };
  }, [focusedCountry]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 4);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <div className={`${styles.scrollFade} ${scrolled ? styles.scrollFadeVisible : ""}`} />
        <div className={styles.scrollArea} ref={scrollAreaRef} onScroll={handleScroll}>
          <div className={styles.header}>
            <button
              type="button"
              className={styles.logoRow}
              onClick={() => {
                window.location.href = `/${uiLanguage}`;
              }}
            >
              <LogoMark className={styles.logoMark} />
              <span className={styles.logoText}>
                {t.brand.before}
                <span className={styles.logoAccent}>{t.brand.accent}</span>
                {t.brand.after}
              </span>
            </button>
            <div className={styles.preTitle}>{t.preTitle}</div>
            <div className={styles.titleDetail}>{t.titleDetail}</div>
            <div className={styles.metaLine}>{t.countriesSupported(sortedCountries.length)}</div>
          </div>

          <div className={styles.search}>
            <div className={styles.searchField}>
              <SearchIcon className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                type="text"
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
              />
            </div>
          </div>

          {sortedCountries.map((country) => {
            const platforms = platformsForCountry(country.code);
            if (platforms.length === 0) return null;

            return (
              <div
                key={country.code}
                ref={(el) => {
                  if (el) sectionRefs.current.set(country.code, el);
                  else sectionRefs.current.delete(country.code);
                }}
                className={`${styles.countrySection} ${
                  flashedCountry === country.code ? styles.countrySectionFlash : ""
                }`}
              >
                <button
                  type="button"
                  className={styles.countryHeading}
                  onClick={() => onFocusCountry(country.code)}
                >
                  <span className={styles.flag} aria-hidden="true">
                    {country.flag}
                  </span>
                  {mounted ? getLocalizedCountryName(country.code, uiLanguage) : country.name}
                </button>
                {platforms.map((platform) => {
                  const normalized = normalizeQueryForPlatform(query, platform.country);
                  const hint = normalized && normalized !== query.trim() ? normalized : null;
                  return (
                    <a
                      key={platform.id}
                      className={`${styles.row} ${styles.rowMarketplace}`}
                      style={{ borderInlineStartColor: getPlatformAccent(platform.id) }}
                      href={platform.buildSearchUrl(normalized || "")}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackPlatformClick({
                          platformId: platform.id,
                          country: platform.country,
                          language: uiLanguage,
                        })
                      }
                    >
                      <span className={styles.marketplaceInfo}>
                        <span>{platformDisplayName(platform, uiLanguage)}</span>
                        {hint && <span className={styles.queryHint}>{t.searchesHint(hint)}</span>}
                      </span>
                    </a>
                  );
                })}
              </div>
            );
          })}

          <div className={styles.footer} />
        </div>
      </div>
      <div className={styles.shadow} />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
