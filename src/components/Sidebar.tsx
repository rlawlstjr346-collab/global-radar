"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type UIEvent } from "react";
import { COUNTRY_POINTS, type CountryPoint } from "@/data/countries";
import { PLATFORMS, platformsForCountry, type CountryCode, type Platform } from "@/data/platforms";
import { trackPlatformClick } from "@/lib/analytics";
import { sortCountriesByProximity } from "@/lib/geo/distance";
import { COUNTRY_SEARCH_ALIASES } from "@/lib/i18n/countryNames";
import { COUNTRY_TO_DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/i18n/locales";
import { getUiStrings } from "@/lib/i18n/uiStrings";
import { getPlatformAccent } from "@/lib/platformColor";
import {
  instantTranslateToEnglish,
  needsRemoteTranslation,
  resolveQueryForPlatform,
} from "@/lib/translateQuery";
import LogoMark from "./LogoMark";
import styles from "./Sidebar.module.css";

const TRANSLATE_STORAGE_KEY = "grl_tr_v1";
const CLIENT_TRANSLATE_CACHE = new Map<string, string>();
const QUICK_TRY_KEYWORDS = ["iPhone", "Leica", "Nike", "Vintage"] as const;

function readCachedTranslation(key: string): string | null {
  const mem = CLIENT_TRANSLATE_CACHE.get(key);
  if (mem !== undefined) return mem;
  try {
    const raw = localStorage.getItem(TRANSLATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (typeof parsed[key] === "string") {
      CLIENT_TRANSLATE_CACHE.set(key, parsed[key]);
      return parsed[key];
    }
  } catch {
    // Private browsing or corrupted storage — ignore cleanly.
  }
  return null;
}

function writeCachedTranslation(key: string, value: string) {
  CLIENT_TRANSLATE_CACHE.set(key, value);
  try {
    const raw = localStorage.getItem(TRANSLATE_STORAGE_KEY);
    const parsed: Record<string, string> = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const keys = Object.keys(parsed);
    if (keys.length >= 200) {
      delete parsed[keys[0]];
    }
    parsed[key] = value;
    localStorage.setItem(TRANSLATE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore quota / storage errors.
  }
}

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

function getCountryMatchTier(
  country: CountryPoint,
  localizedName: string,
  platforms: Platform[],
  needle: string,
): { tier: 0 | 1 | 2; exactName: boolean } {
  const names = [
    localizedName.toLowerCase(),
    country.name.toLowerCase(),
    ...(country.nativeName ? [country.nativeName.toLowerCase()] : []),
    ...(COUNTRY_SEARCH_ALIASES[country.code]?.map((a) => a.toLowerCase()) ?? []),
  ];

  if (names.includes(needle)) {
    return { tier: 0, exactName: true };
  }
  if (country.code.toLowerCase() === needle) {
    return { tier: 0, exactName: false };
  }

  for (const name of names) {
    if (name.includes(needle)) return { tier: 1, exactName: false };
  }
  for (const platform of platforms) {
    if (
      platform.name.toLowerCase().includes(needle) ||
      (platform.nativeName && platform.nativeName.toLowerCase().includes(needle))
    ) {
      return { tier: 1, exactName: false };
    }
  }
  return { tier: 2, exactName: false };
}

interface SidebarProps {
  query: string;
  onQueryChange: (value: string) => void;
  homeCountry: CountryCode;
  uiLanguage: LanguageCode;
  localizedCountryNames: Record<CountryCode, string>;
  focusedCountry: CountryCode | null;
  focusSeq: number;
  onFocusCountry: (code: CountryCode) => void;
  onResetHome: () => void;
  mobileCollapsed: boolean;
  onToggleMobileCollapsed: () => void;
}

export default function Sidebar({
  query,
  onQueryChange,
  homeCountry,
  uiLanguage,
  localizedCountryNames,
  focusedCountry,
  focusSeq,
  onFocusCountry,
  onResetHome,
  mobileCollapsed,
  onToggleMobileCollapsed,
}: SidebarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [flashedCountry, setFlashedCountry] = useState<CountryCode | null>(null);
  const [useOriginalQuery, setUseOriginalQuery] = useState(false);
  const [remoteResult, setRemoteResult] = useState<{ key: string; translated: string } | null>(null);

  const sectionRefs = useRef(new Map<CountryCode, HTMLDivElement>());
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = getUiStrings(uiLanguage);
  const trimmedQuery = query.trim();

  const proximityCountries = useMemo(
    () => sortCountriesByProximity(COUNTRY_POINTS, homeCountry),
    [homeCountry],
  );

  // Dual-intent matching: floats countries matching by country name, code, or
  // platform name to the top of the list without adding extra filter UI.
  const { orderedCountries, topMatchedCountry, isExactCountryQuery } = useMemo(() => {
    const needle = trimmedQuery.toLowerCase();
    if (!needle) {
      return {
        orderedCountries: proximityCountries,
        topMatchedCountry: null as CountryCode | null,
        isExactCountryQuery: false,
      };
    }

    const tier0: CountryPoint[] = [];
    const tier1: CountryPoint[] = [];
    const tier2: CountryPoint[] = [];
    let exactNameHit = false;

    for (const country of proximityCountries) {
      const platforms = platformsForCountry(country.code);
      if (platforms.length === 0) continue;
      const localizedName = localizedCountryNames[country.code] ?? country.name;
      const match = getCountryMatchTier(country, localizedName, platforms, needle);
      if (match.exactName) exactNameHit = true;
      if (match.tier === 0) tier0.push(country);
      else if (match.tier === 1) tier1.push(country);
      else tier2.push(country);
    }

    const topMatched = tier0[0]?.code ?? tier1[0]?.code ?? null;
    return {
      orderedCountries: [...tier0, ...tier1, ...tier2],
      topMatchedCountry: topMatched,
      isExactCountryQuery: exactNameHit,
    };
  }, [proximityCountries, trimmedQuery, localizedCountryNames]);

  const instantTranslation = useMemo(
    () => instantTranslateToEnglish(trimmedQuery, uiLanguage),
    [trimmedQuery, uiLanguage],
  );

  const cacheKey = `${uiLanguage}:${trimmedQuery.toLowerCase()}`;
  const isItemSearchActive = Boolean(trimmedQuery) && !isExactCountryQuery;
  const shouldFetchRemote = isItemSearchActive && needsRemoteTranslation(trimmedQuery, uiLanguage);

  useEffect(() => {
    if (!shouldFetchRemote) return;

    const cached = readCachedTranslation(cacheKey);
    if (cached !== null) {
      const frame = requestAnimationFrame(() => {
        setRemoteResult({ key: cacheKey, translated: cached });
      });
      return () => cancelAnimationFrame(frame);
    }

    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounceId = setTimeout(() => {
      timeoutId = setTimeout(() => controller.abort(), 2000);
      fetch(`/api/translate?q=${encodeURIComponent(trimmedQuery)}&sl=${encodeURIComponent(uiLanguage)}`, {
        signal: controller.signal,
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { translated?: string; fallback?: boolean } | null) => {
          if (!data || typeof data.translated !== "string") return;
          const cleaned = data.translated.trim();
          if (cleaned) {
            if (!data.fallback) writeCachedTranslation(cacheKey, cleaned);
            setRemoteResult({ key: cacheKey, translated: cleaned });
          }
        })
        .catch(() => {
          // Safe fallback: leave instant dictionary / original query active.
        })
        .finally(() => {
          if (timeoutId) clearTimeout(timeoutId);
        });
    }, 250);

    return () => {
      clearTimeout(debounceId);
      if (timeoutId) clearTimeout(timeoutId);
      controller.abort();
    };
  }, [shouldFetchRemote, cacheKey, trimmedQuery, uiLanguage]);

  const remoteTranslated = remoteResult?.key === cacheKey ? remoteResult.translated : null;
  const globalEnglishTerm =
    remoteTranslated || (instantTranslation.changed ? instantTranslation.translated : null);
  const showTranslationNotice =
    isItemSearchActive &&
    Boolean(globalEnglishTerm) &&
    globalEnglishTerm!.toLowerCase() !== trimmedQuery.toLowerCase();

  useEffect(() => {
    if (!focusedCountry) return;
    const target = sectionRefs.current.get(focusedCountry);
    const scrollArea = scrollAreaRef.current;
    if (!target || !scrollArea) return;

    const targetRect = target.getBoundingClientRect();
    const areaRect = scrollArea.getBoundingClientRect();
    const alreadyInView = targetRect.top >= areaRect.top && targetRect.bottom <= areaRect.bottom;

    target.scrollIntoView({ behavior: "smooth", block: "center" });

    let fired = false;
    let rafInner = 0;
    const triggerFlash = () => {
      if (fired) return;
      fired = true;
      // Clear then re-apply on next frame so re-clicking the same country replays the animation.
      setFlashedCountry(null);
      rafInner = requestAnimationFrame(() => setFlashedCountry(focusedCountry));
    };

    if (alreadyInView) {
      const raf = requestAnimationFrame(triggerFlash);
      return () => {
        cancelAnimationFrame(raf);
        cancelAnimationFrame(rafInner);
      };
    }

    scrollArea.addEventListener("scrollend", triggerFlash, { once: true });
    const fallback = setTimeout(triggerFlash, 900);

    return () => {
      scrollArea.removeEventListener("scrollend", triggerFlash);
      clearTimeout(fallback);
      cancelAnimationFrame(rafInner);
    };
  }, [focusedCountry, focusSeq]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 4);
  };

  const handleInputChange = (value: string) => {
    setUseOriginalQuery(false);
    onQueryChange(value);
    if (mobileCollapsed && value.trim()) {
      onToggleMobileCollapsed();
    }
  };

  const handleQuickTry = (keyword: string) => {
    handleInputChange(keyword);
    inputRef.current?.focus();
  };

  const handleClearSearch = () => {
    setUseOriginalQuery(false);
    onQueryChange("");
    inputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && topMatchedCountry) {
      e.preventDefault();
      onFocusCountry(topMatchedCountry);
    }
  };

  return (
    <div className={`${styles.wrapper} ${mobileCollapsed ? styles.wrapperCollapsed : ""}`}>
      <div className={styles.panel}>
        <div className={`${styles.scrollFade} ${scrolled ? styles.scrollFadeVisible : ""}`} />
        <div className={styles.scrollArea} ref={scrollAreaRef} onScroll={handleScroll}>
          <div className={styles.header}>
            <h1 className={styles.logoHeading}>
              <Link href={`/${uiLanguage}`} className={styles.logoRow} onClick={onResetHome}>
                <LogoMark className={styles.logoMark} />
                <span className={styles.logoText}>
                  {t.brand.before}
                  <span className={styles.logoAccent}>{t.brand.accent}</span>
                  {t.brand.after}
                </span>
              </Link>
            </h1>
            <div className={styles.headerMeta}>
              <div className={styles.preTitle}>{t.preTitle}</div>
              <div className={styles.titleDetail}>{t.titleDetail}</div>
              <div className={styles.metaLine}>{t.countriesSupported(proximityCountries.length)}</div>
            </div>
          </div>

          <div className={styles.search}>
            <div className={styles.searchField}>
              <SearchIcon className={styles.searchIcon} />
              <input
                ref={inputRef}
                className={styles.searchInput}
                type="text"
                placeholder={t.searchPlaceholder}
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {query.length > 0 && (
                <button
                  type="button"
                  className={styles.clearButton}
                  aria-label={t.clearSearch}
                  onClick={handleClearSearch}
                >
                  <ClearIcon />
                </button>
              )}
            </div>

            {!trimmedQuery && (
              <div className={styles.exampleChips}>
                {QUICK_TRY_KEYWORDS.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    className={styles.exampleChip}
                    onClick={() => handleQuickTry(keyword)}
                  >
                    {keyword}
                  </button>
                ))}
              </div>
            )}

            {isItemSearchActive && (
              <div className={styles.activeStatusBar} role="status" aria-live="polite">
                <span className={styles.activeStatusDot} aria-hidden="true" />
                <span className={styles.activeStatusText}>
                  {t.activeSearchStatus(trimmedQuery, proximityCountries.length, PLATFORMS.length)}
                </span>
              </div>
            )}

            {showTranslationNotice && (
              <div className={styles.translationBar}>
                <span className={styles.translationText}>
                  {useOriginalQuery
                    ? t.usingOriginalQuery
                    : t.translatedNotice(globalEnglishTerm!)}
                </span>
                <button
                  type="button"
                  className={styles.translationToggle}
                  onClick={() => setUseOriginalQuery((prev) => !prev)}
                >
                  {useOriginalQuery ? t.useTranslatedQuery : t.useOriginalQuery}
                </button>
              </div>
            )}
          </div>

          <div className={styles.listBody}>
            {orderedCountries.map((country) => {
              const platforms = platformsForCountry(country.code);
              if (platforms.length === 0) return null;

              const countryLabel = localizedCountryNames[country.code] ?? country.name;

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
                    {countryLabel}
                  </button>
                  {platforms.map((platform) => {
                    const shouldOpenHomepage = !isItemSearchActive;
                    const resolved = shouldOpenHomepage
                      ? ""
                      : resolveQueryForPlatform({
                          query: trimmedQuery,
                          uiLanguage,
                          platformCountry: platform.country,
                          translatedEnglish: globalEnglishTerm,
                          useOriginal: useOriginalQuery,
                        });
                    const href = shouldOpenHomepage
                      ? platform.homepage
                      : platform.buildSearchUrl(resolved);
                    const hint =
                      !shouldOpenHomepage &&
                      resolved &&
                      resolved.toLowerCase() !== trimmedQuery.toLowerCase()
                        ? resolved
                        : null;

                    return (
                      <a
                        key={platform.id}
                        className={`${styles.row} ${styles.rowMarketplace}`}
                        style={{ borderInlineStartColor: getPlatformAccent(platform.id) }}
                        href={href}
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
                        {shouldOpenHomepage ? (
                          <span className={styles.rowArrow} aria-hidden="true">
                            ↗
                          </span>
                        ) : (
                          <span className={styles.rowSearchIndicator} aria-hidden="true">
                            {t.searchAction} ↗
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              );
            })}

            <div className={styles.footer}>
              <Link href="/privacy" className={styles.privacyLink}>
                {t.privacyPolicy}
              </Link>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={styles.mobileToggle}
          onClick={onToggleMobileCollapsed}
          aria-expanded={!mobileCollapsed}
        >
          <span>{mobileCollapsed ? t.showMoreList : t.showMoreMap}</span>
          <span className={styles.mobileToggleChevron} aria-hidden="true">
            {mobileCollapsed ? "▼" : "▲"}
          </span>
        </button>
      </div>
      <div className={styles.shadow} />
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
