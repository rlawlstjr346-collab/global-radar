"use client";

import { useState, type UIEvent } from "react";
import { COUNTRY_POINTS, type Continent } from "@/data/countries";
import { platformsForCountry, type CountryCode } from "@/data/platforms";
import { normalizeQueryForPlatform } from "@/lib/translateQuery";
import SegmentedControl from "./SegmentedControl";
import styles from "./Sidebar.module.css";

const CONTINENT_ORDER: Continent[] = ["Asia", "Americas", "Europe"];

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
  const [sortMode, setSortMode] = useState<"az" | "region">("az");
  const [scrolled, setScrolled] = useState(false);

  const platforms = selectedCountry ? platformsForCountry(selectedCountry) : [];

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    setScrolled(e.currentTarget.scrollTop > 4);
  };

  const renderRow = (country: (typeof COUNTRY_POINTS)[number]) => (
    <button
      key={country.code}
      className={`${styles.row} ${country.code === selectedCountry ? styles.rowActive : ""}`}
      onClick={() => onSelectCountry(country.code)}
    >
      <span>
        {country.name}
        {country.nativeName ? ` (${country.nativeName})` : ""}
      </span>
    </button>
  );

  return (
    <div className={styles.wrapper}>
      <div className={styles.panel}>
        <div className={`${styles.scrollFade} ${scrolled ? styles.scrollFadeVisible : ""}`} />
        <div className={styles.scrollArea} onScroll={handleScroll}>
          <div className={styles.header}>
            <div className={styles.logoRow}>
              <span className={styles.logoText}>
                Global<span className={styles.logoAccent}>Radar</span>
              </span>
            </div>
            <div className={styles.preTitle}>Worldwide search</div>
            <div className={styles.titleDetail}>
              One search box, every country&apos;s secondhand marketplaces
            </div>
            <div className={styles.metaLine}>{COUNTRY_POINTS.length} regions supported</div>
          </div>

          <div className={styles.search}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Search an item (e.g. Leica M6)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>

          <div className={styles.tabs}>
            <SegmentedControl
              name="sort-mode"
              value={sortMode}
              onChange={setSortMode}
              options={[
                { value: "az", label: "A–Z" },
                { value: "region", label: "By region" },
              ]}
            />
          </div>

          {sortMode === "az" ? (
            <>
              <div className={styles.sectionLabel}>Regions</div>
              {[...COUNTRY_POINTS].sort((a, b) => a.name.localeCompare(b.name)).map(renderRow)}
            </>
          ) : (
            CONTINENT_ORDER.map((continent) => {
              const countries = COUNTRY_POINTS.filter((c) => c.continent === continent);
              if (countries.length === 0) return null;
              return (
                <div key={continent}>
                  <div className={styles.continentHeading}>{continent}</div>
                  {countries.map(renderRow)}
                </div>
              );
            })
          )}

          {selectedCountry && (
            <>
              <div className={styles.sectionLabel}>Marketplaces</div>
              {platforms.map((platform) => {
                const normalized = normalizeQueryForPlatform(query, platform.country);
                const hint = normalized && normalized !== query.trim() ? normalized : null;
                return (
                  <a
                    key={platform.id}
                    className={`${styles.row} ${styles.rowMarketplace}`}
                    href={platform.buildSearchUrl(normalized || "")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className={styles.marketplaceInfo}>
                      <span>{platform.name}</span>
                      {hint && <span className={styles.queryHint}>searches &quot;{hint}&quot;</span>}
                    </span>
                    {!platform.verified && <span className={styles.unverifiedBadge}>needs check</span>}
                  </a>
                );
              })}
            </>
          )}

          <div className={styles.footer} />
        </div>
      </div>
      <div className={styles.shadow} />
    </div>
  );
}
