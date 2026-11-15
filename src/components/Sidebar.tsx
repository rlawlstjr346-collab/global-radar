"use client";

import { COUNTRY_POINTS } from "@/data/countries";
import { platformsForCountry, type CountryCode } from "@/data/platforms";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  query: string;
  onQueryChange: (value: string) => void;
  selectedCountry: CountryCode | null;
  onSelectCountry: (code: CountryCode) => void;
}

export default function Sidebar({
  query,
  onQueryChange,
  selectedCountry,
  onSelectCountry,
}: SidebarProps) {
  const platforms = selectedCountry ? platformsForCountry(selectedCountry) : [];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        Global<span>Radar</span>
      </div>

      <input
        className={styles.searchInput}
        type="text"
        placeholder="Search an item (e.g. Leica M6)"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />

      <div className={styles.sectionLabel}>Regions</div>
      <div className={styles.countryList}>
        {COUNTRY_POINTS.map((country) => (
          <button
            key={country.code}
            className={
              country.code === selectedCountry
                ? styles.countryButtonActive
                : styles.countryButton
            }
            onClick={() => onSelectCountry(country.code)}
          >
            {country.name}
            {country.nativeName ? ` (${country.nativeName})` : ""}
          </button>
        ))}
      </div>

      {selectedCountry && (
        <>
          <div className={styles.sectionLabel}>Marketplaces</div>
          <div className={styles.platformList}>
            {platforms.map((platform) => (
              <a
                key={platform.id}
                className={styles.platformLink}
                href={platform.buildSearchUrl(query || "")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>{platform.name}</span>
                {!platform.verified && <span className={styles.unverifiedBadge}>needs check</span>}
              </a>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
