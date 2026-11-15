"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import Sidebar from "@/components/Sidebar";
import type { CountryCode } from "@/data/platforms";
import styles from "./page.module.css";

export default function Home() {
  const [query, setQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<CountryCode | null>(null);

  return (
    <div className={styles.page}>
      <div className={styles.mapArea}>
        <MapView selectedCountry={selectedCountry} onSelectCountry={setSelectedCountry} />
      </div>
      <Sidebar
        query={query}
        onQueryChange={setQuery}
        selectedCountry={selectedCountry}
        onSelectCountry={setSelectedCountry}
      />
    </div>
  );
}
