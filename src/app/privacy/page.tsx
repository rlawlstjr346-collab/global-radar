import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | World Secondhand Market Map",
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
          World Secondhand Market Map is a directory. For every search you enter, it builds a link to
          that item&apos;s search-results page on secondhand marketplaces around the world, and sends you
          there. This site never stores, scrapes, or mirrors any listing data — the results you see always
          come directly from the marketplace you&apos;re redirected to.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Cookies we use</h2>
        <p>
          <strong>Functional cookies.</strong> This site uses a small number of cookies to remember your
          selected language and home country (e.g. from the &quot;use my location&quot; button), so the
          marketplace list is sorted the way you left it. These are required for the site to work and are
          not subject to a consent prompt.
        </p>
        <p>
          <strong>Analytics cookies.</strong> This site uses Google Analytics 4 to understand overall usage
          — which pages are viewed and which marketplace links are clicked — so we can improve the site and
          fix broken links. If you are visiting from the EU, this site asks for your consent before loading
          Google Analytics; declining disables it entirely for your visit. Outside the EU, Google Analytics
          loads automatically, the same way most sites operate.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>What Google Analytics collects</h2>
        <p>
          When enabled, Google Analytics records page views and which marketplace links you click
          (platform, country, and language — no personal information such as your name, email, or search
          history is collected or stored by this site). This data is processed by Google under its own{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          .
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.heading}>Your choices</h2>
        <p>
          You can withdraw analytics consent at any time by clearing your browser&apos;s site data for this
          domain — the consent banner will then ask again on your next visit. You can also use your
          browser&apos;s privacy settings to block cookies entirely.
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
