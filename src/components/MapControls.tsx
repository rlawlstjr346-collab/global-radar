"use client";

import { useRouter } from "next/navigation";
import { useState, type RefObject } from "react";
import mapboxgl from "mapbox-gl";
import { COUNTRY_POINTS } from "@/data/countries";
import type { CountryCode } from "@/data/platforms";
import { LANGUAGE_TO_FALLBACK_COUNTRY } from "@/lib/i18n/detect";
import { nearestCountry } from "@/lib/geo/distance";
import {
  COUNTRY_OVERRIDE_COOKIE,
  COUNTRY_OVERRIDE_MAX_AGE_SECONDS,
  LANGUAGE_PREFERENCE_COOKIE,
  LANGUAGE_PREFERENCE_MAX_AGE_SECONDS,
} from "@/lib/i18n/cookies";
import { LANGUAGE_NATIVE_NAMES, SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n/locales";
import { getUiStrings } from "@/lib/i18n/uiStrings";
import styles from "./MapControls.module.css";

function setCountryOverride(country: CountryCode) {
  document.cookie = `${COUNTRY_OVERRIDE_COOKIE}=${country}; path=/; max-age=${COUNTRY_OVERRIDE_MAX_AGE_SECONDS}`;
}

function setLanguagePreference(language: LanguageCode) {
  document.cookie = `${LANGUAGE_PREFERENCE_COOKIE}=${language}; path=/; max-age=${LANGUAGE_PREFERENCE_MAX_AGE_SECONDS}`;
}

interface MapControlsProps {
  mapRef: RefObject<mapboxgl.Map | null>;
  uiLanguage: LanguageCode;
}

export default function MapControls({ mapRef, uiLanguage }: MapControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const t = getUiStrings(uiLanguage);

  const handleSelectLanguage = (language: LanguageCode) => {
    setMenuOpen(false);
    setLanguagePreference(language);

    const fallbackCountry = LANGUAGE_TO_FALLBACK_COUNTRY[language];
    if (fallbackCountry) setCountryOverride(fallbackCountry);

    router.push(`/${language}`);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        const nearest = nearestCountry(COUNTRY_POINTS, coords);
        if (!nearest) return;

        setCountryOverride(nearest.code);
        mapRef.current?.flyTo({ center: nearest.coordinates, zoom: 4, duration: 1200 });
        router.refresh();
      },
      () => {
        // Permission denied or unavailable — leave the current country as-is.
      },
      { timeout: 8000 },
    );
  };

  return (
    <>
      <div className={styles.langSlot}>
        <div className={styles.langWrapper}>
          <button
            type="button"
            className={styles.langButton}
            aria-label={t.languageLabel}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <GlobeIcon className={styles.icon} />
            {LANGUAGE_NATIVE_NAMES[uiLanguage]}
          </button>
          {menuOpen && (
            <ul className={styles.langMenu}>
              {SUPPORTED_LANGUAGES.map((language) => (
                <li key={language}>
                  <button
                    type="button"
                    className={language === uiLanguage ? styles.langOptionActive : styles.langOption}
                    onClick={() => handleSelectLanguage(language)}
                  >
                    {LANGUAGE_NATIVE_NAMES[language]}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className={styles.locateSlot}>
        <button type="button" className={styles.locateButton} aria-label={t.locateMe} onClick={handleLocate}>
          <LocateIcon />
        </button>
      </div>
    </>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className={className}
    >
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </svg>
  );
}

function LocateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
    </svg>
  );
}
