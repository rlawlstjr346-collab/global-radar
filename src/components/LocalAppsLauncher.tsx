"use client";

import { useEffect, useMemo, useState } from "react";
import { safeExternalUrl } from "@/lib/safeUrl";
import { PLATFORMS, type CountryCode } from "@/data/platforms";
import type { AtlasPlatformMeta, PlatformSpectrum } from "@/lib/atlasTypes";
import type { AtlasCopy } from "@/lib/atlasCopy";
import type { LanguageCode } from "@/lib/i18n/locales";
import {
  instantTranslateToEnglish,
  needsRemoteTranslation,
  resolveQueryForPlatform,
} from "@/lib/translateQuery";
import { trackPlatformClick } from "@/lib/analytics";
import { ArrowUpRightIcon, CloseIcon, SearchIcon } from "./AtlasIcons";
import styles from "./LocalAppsLauncher.module.css";

const PLATFORM_BY_ID = new Map(PLATFORMS.map((p) => [p.id, p]));

const SPECTRUMS: Array<"ALL" | PlatformSpectrum> = [
  "ALL",
  "FASHION",
  "TECH/ARCHIVE",
  "GENERAL",
  "LUXURY",
];

interface LocalAppsLauncherProps {
  platforms: AtlasPlatformMeta[];
  uiLanguage: LanguageCode;
  copy: AtlasCopy;
  compact?: boolean;
  countryFilter?: string | null;
  onSelectCountry?: (cc: string) => void;
  countryNameResolver?: (cc: string) => string;
}

export default function LocalAppsLauncher({
  platforms,
  uiLanguage,
  copy,
  compact = false,
  countryFilter = null,
  onSelectCountry,
  countryNameResolver,
}: LocalAppsLauncherProps) {
  const [itemQuery, setItemQuery] = useState("");
  const [remoteTranslated, setRemoteTranslated] = useState<string | null>(null);
  const [useOriginal, setUseOriginal] = useState(false);
  const [spectrum, setSpectrum] = useState<"ALL" | PlatformSpectrum>("ALL");

  const trimmed = itemQuery.trim();
  const instant = useMemo(
    () => instantTranslateToEnglish(trimmed, uiLanguage),
    [trimmed, uiLanguage],
  );

  // Debounced /api/translate fallback when dictionary has remaining non-ASCII tokens
  useEffect(() => {
    setRemoteTranslated(null);
    if (!trimmed || !needsRemoteTranslation(trimmed, uiLanguage)) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/translate?q=${encodeURIComponent(trimmed)}&sl=${encodeURIComponent(uiLanguage)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { translated?: string };
        if (data.translated && data.translated.trim()) {
          setRemoteTranslated(data.translated.trim());
        }
      } catch {
        // Ignore abort / offline error — instant dictionary fallback remains active
      }
    }, 240);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed, uiLanguage]);

  const effectiveTranslated = remoteTranslated || instant.translated;
  const showTranslationPreview =
    Boolean(trimmed) &&
    effectiveTranslated.toLowerCase() !== trimmed.toLowerCase();

  const filtered = useMemo(() => {
    return platforms.filter((p) => {
      if (countryFilter && p.country !== countryFilter) return false;
      if (spectrum !== "ALL" && p.spectrum !== spectrum) return false;
      return true;
    });
  }, [platforms, countryFilter, spectrum]);

  // Group by country when showing global list (non-compact, no countryFilter)
  const groupedByCountry = useMemo(() => {
    if (compact || countryFilter) return null;
    const map = new Map<string, AtlasPlatformMeta[]>();
    for (const p of filtered) {
      const arr = map.get(p.country) || [];
      arr.push(p);
      map.set(p.country, arr);
    }
    return Array.from(map.entries());
  }, [filtered, compact, countryFilter]);

  const renderPlatformCard = (meta: AtlasPlatformMeta) => {
    const runtime = PLATFORM_BY_ID.get(meta.id);
    const resolvedQuery = trimmed
      ? resolveQueryForPlatform({
          query: trimmed,
          uiLanguage,
          platformCountry: meta.country as CountryCode,
          translatedEnglish: effectiveTranslated,
          useOriginal,
        })
      : "";

    const href = safeExternalUrl(runtime ? runtime.buildSearchUrl(resolvedQuery) : meta.homepage);

    return (
      <a
        key={meta.id}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.card}
        onClick={() =>
          trackPlatformClick({
            platformId: meta.id,
            country: meta.country,
            language: uiLanguage,
          })
        }
      >
        <div className={styles.cardTop}>
          <span className={styles.cardName}>{meta.name}</span>
          <ArrowUpRightIcon size={13} className={styles.arrow} />
        </div>
        <div className={styles.cardBottom}>
          <span className={styles.spectrumTag}>{meta.spectrum}</span>
          {resolvedQuery ? (
            <span className={styles.queryPreview} title={resolvedQuery}>
              {resolvedQuery}
            </span>
          ) : (
            meta.nativeName && <span className={styles.native}>{meta.nativeName}</span>
          )}
        </div>
      </a>
    );
  };

  return (
    <section className={`${styles.section} ${compact ? styles.compact : ""}`}>
      <div className={styles.headerRow}>
        <div className={styles.titleGroup}>
          <h3 className={styles.heading}>{copy.localAppsTitle}</h3>
          <span className={`${styles.badgeCount} tabular-nums`}>{filtered.length}</span>
        </div>
      </div>

      {/* 1-Line Auto-Translating Item Launcher Bar */}
      <div className={styles.launcherBox}>
        <div className={styles.inputRow}>
          <SearchIcon size={14} className={styles.searchIcon} />
          <input
            type="search"
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
            placeholder={copy.itemSearchPlaceholder}
            className={styles.input}
            aria-label={copy.localAppsTitle}
          />
          {itemQuery && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={() => setItemQuery("")}
              aria-label="Clear"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        {!trimmed && (
          <div className={styles.suggestions}>
            {copy.itemSuggestions.map((term) => (
              <button
                key={term}
                type="button"
                className={styles.suggestChip}
                onClick={() => setItemQuery(term)}
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {showTranslationPreview && (
          <div className={styles.translationBar}>
            <span className={styles.translationText}>
              <span className={styles.translationKey}>{copy.translatedLabel}</span>
              <strong>{useOriginal ? trimmed : effectiveTranslated}</strong>
            </span>
            <button
              type="button"
              className={styles.toggleOriginal}
              onClick={() => setUseOriginal((prev) => !prev)}
            >
              {useOriginal ? copy.useTranslated : copy.useOriginal}
            </button>
          </div>
        )}
      </div>

      {/* Spectrum Filter Chips (when global or > 3 apps) */}
      {(!compact || platforms.length > 3) && (
        <div className={styles.chipRow}>
          {SPECTRUMS.map((sp) => {
            const active = spectrum === sp;
            return (
              <button
                key={sp}
                type="button"
                className={`${styles.chip} ${active ? styles.chipActive : ""}`}
                onClick={() => setSpectrum(sp)}
              >
                {sp}
              </button>
            );
          })}
        </div>
      )}

      {groupedByCountry ? (
        <div className={styles.countryGroups}>
          {groupedByCountry.map(([cc, list]) => (
            <div key={cc} className={styles.countryGroup}>
              <div className={styles.countryGroupHeader}>
                <button
                  type="button"
                  className={styles.countryJump}
                  onClick={() => onSelectCountry?.(cc)}
                >
                  <span className={styles.ccCode}>{cc}</span>
                  <span className={styles.countryName}>
                    {countryNameResolver ? countryNameResolver(cc) : cc}
                  </span>
                </button>
                <span className={`${styles.groupCount} tabular-nums`}>
                  {list.length} {copy.appsUnit}
                </span>
              </div>
              <div className={styles.grid}>{list.map(renderPlatformCard)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.grid}>{filtered.map(renderPlatformCard)}</div>
      )}
    </section>
  );
}
