import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | World Vintage Atlas",
};

export default function PrivacyPage() {
  return (
    <div className={styles.wrapper}>
      <Link href="/" className={styles.back}>
        ← Back
      </Link>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: November 2026</p>

      <div className={styles.section}>
        <h2 className={styles.heading}>What this site does</h2>
        <p>
          World Vintage Atlas is a global directory of offline vintage clothing shops, flea markets,
          and local secondhand marketplaces across 137 countries. For online searches, it builds a
          direct link to each platform&apos;s own search-results page without scraping or mirroring
          external listing data.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Local storage &amp; cookies</h2>
        <p>
          <strong>Functional storage.</strong> Saved spots are stored locally in your browser
          (localStorage). Language preference is stored in a functional cookie.
        </p>
        <p>
          <strong>Analytics cookies.</strong> When enabled (with explicit consent for EU visitors),
          Google Analytics 4 measures aggregate page views and outbound link clicks without storing
          personal information.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Contact</h2>
        <p>
          Questions about this policy can be sent to{" "}
          <a href="mailto:rlawlstjr346@gmail.com">rlawlstjr346@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
