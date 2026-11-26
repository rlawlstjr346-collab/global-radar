"use client";

import { useEffect, useSyncExternalStore } from "react";
import LogoMark from "./LogoMark";
import { LANGUAGE_PREFERENCE_COOKIE } from "@/lib/i18n/cookies";
import { isSupportedLanguage, type LanguageCode } from "@/lib/i18n/locales";
import styles from "./AtlasNotFound.module.css";

const AUTO_MS = 5000;
const noSubscribe = () => () => {};

/** Saved manual choice, else the first browser language ATLAS speaks, else English. */
function detectLanguage(): LanguageCode {
  const saved = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${LANGUAGE_PREFERENCE_COOKIE}=`))
    ?.split("=")[1];
  if (saved && isSupportedLanguage(saved)) return saved;
  for (const tag of navigator.languages ?? [navigator.language]) {
    const base = tag.toLowerCase().split("-")[0];
    const code = base === "nb" || base === "nn" ? "no" : base;
    if (isSupportedLanguage(code)) return code;
  }
  return "en";
}

/** Broken / retired URL screen: points straight back to the globe, then goes there on its own. */
export default function AtlasNotFound() {
  // Server render has no language (null); the client resolves it once on hydration.
  const lang = useSyncExternalStore(noSubscribe, detectLanguage, () => null);

  useEffect(() => {
    if (!lang) return;
    const t = window.setTimeout(() => window.location.replace(`/${lang}`), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [lang]);

  const ko = lang === "ko";
  const home = `/${lang ?? "en"}`;
  const alt = ko ? "/en" : "/ko";

  return (
    <main className={styles.root}>
      <div className={styles.column}>
        <a href={home} className={styles.brand} aria-label="ATLAS home">
          <LogoMark className={styles.mark} />
          <span>ATLAS.</span>
        </a>
        <p className={`${styles.code} tabular-nums`}>404 · NOT FOUND</p>
        <h1 className={styles.title}>
          {ko ? "이 주소의 페이지는 더 이상 없습니다" : "This page has moved or no longer exists"}
        </h1>
        <p className={styles.body}>
          {ko
            ? "137개국 빈티지샵 13,054곳은 모두 3D 지구본 아틀라스로 옮겨졌습니다. 잠시 후 자동으로 이동합니다."
            : "All 13,054 vintage spots across 137 countries now live on the 3D globe atlas. Taking you there in a moment."}
        </p>
        <div className={styles.actions}>
          <a href={home} className={styles.primary}>
            {ko ? "3D 지구본으로 이동" : "Open the 3D globe"}
          </a>
          <a href={alt} className={styles.secondary}>
            {ko ? "English" : "한국어"}
          </a>
        </div>
        <span className={styles.progress} aria-hidden="true" data-run={lang ? "" : undefined} />
      </div>
    </main>
  );
}
