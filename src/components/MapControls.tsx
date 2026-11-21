"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type RefObject } from "react";
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
  onLocateCountry: (code: CountryCode) => void;
  getPadding: () => mapboxgl.PaddingOptions;
  mobileCollapsed: boolean;
}

export default function MapControls({
  mapRef,
  uiLanguage,
  onLocateCountry,
  getPadding,
  mobileCollapsed,
}: MapControlsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locateToast, setLocateToast] = useState<string | null>(null);
  const langWrapperRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const t = getUiStrings(uiLanguage);

  const showLocateToast = (message: string) => {
    setLocateToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setLocateToast(null), 3500);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (langWrapperRef.current && !langWrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const handleSelectLanguage = (language: LanguageCode) => {
    setMenuOpen(false);
    setLanguagePreference(language);

    const fallbackCountry = LANGUAGE_TO_FALLBACK_COUNTRY[language];
    if (fallbackCountry) setCountryOverride(fallbackCountry);

    router.push(`/${language}`);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      showLocateToast(t.locateError);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        const nearest = nearestCountry(COUNTRY_POINTS, coords);
        if (!nearest) {
          showLocateToast(t.locateError);
          return;
        }

        setCountryOverride(nearest.code);
        onLocateCountry(nearest.code);
        mapRef.current?.flyTo({
          center: nearest.coordinates,
          zoom: 4,
          padding: getPadding(),
          duration: 1000,
        });
      },
      () => {
        showLocateToast(t.locateError);
      },
      { timeout: 8000 },
    );
  };

  return (
    <>
      <div className={styles.langSlot}>
        <div className={styles.langWrapper} ref={langWrapperRef}>
          <button
            type="button"
            className={styles.langButton}
            aria-label={t.languageLabel}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <GlobeIcon className={styles.icon} />
            {LANGUAGE_NATIVE_NAMES[uiLanguage]}
          </button>
          {menuOpen && (
            <ul
              className={`${styles.langMenu} ${mobileCollapsed ? styles.langMenuMobileDown : ""}`}
              role="menu"
            >
              {SUPPORTED_LANGUAGES.map((language) => (
                <li key={language}>
                  <button
                    type="button"
                    role="menuitem"
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
        <button
          type="button"
          className={styles.locateButton}
          aria-label={t.locateMe}
          title={t.locateMe}
          onClick={handleLocate}
        >
          <LocateIcon />
        </button>
      </div>
      {locateToast && (
        <div className={styles.locateToast} role="status" aria-live="polite">
          {locateToast}
        </div>
      )}
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
