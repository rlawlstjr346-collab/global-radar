"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { getConsentServerSnapshot, getConsentSnapshot, setConsent, subscribeConsent } from "@/lib/consent";
import type { LanguageCode } from "@/lib/i18n/locales";
import { getUiStrings } from "@/lib/i18n/uiStrings";
import GoogleAnalytics from "./GoogleAnalytics";
import styles from "./ConsentManager.module.css";

interface ConsentManagerProps {
  /** Only true for visitors geo-located in an EU country — see euCountries.ts. */
  requiresConsent: boolean;
  uiLanguage: LanguageCode;
}

/**
 * Gates GA4 behind an accept/decline banner for EU visitors only (GDPR
 * scope), matching the sibling "World Vintage Shop Map" site's choice not
 * to show this outside the EU. Everywhere else, GA4 loads exactly like it
 * always has — unconditionally, no banner.
 */
export default function ConsentManager({ requiresConsent, uiLanguage }: ConsentManagerProps) {
  const consent = useSyncExternalStore(subscribeConsent, getConsentSnapshot, getConsentServerSnapshot);
  const t = getUiStrings(uiLanguage).cookieBanner;

  const gaAllowed = !requiresConsent || consent === "accepted";

  return (
    <>
      {gaAllowed && <GoogleAnalytics />}
      {requiresConsent && consent === "pending" && (
        <div className={styles.banner} role="dialog" aria-live="polite">
          <p className={styles.message}>
            {t.message} <Link href="/privacy" className={styles.link}>{t.learnMore}</Link>
          </p>
          <div className={styles.actions}>
            <button type="button" className={styles.decline} onClick={() => setConsent("declined")}>
              {t.decline}
            </button>
            <button type="button" className={styles.accept} onClick={() => setConsent("accepted")}>
              {t.accept}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
