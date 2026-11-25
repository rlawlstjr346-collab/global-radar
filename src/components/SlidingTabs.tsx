"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { AtlasLayerTab } from "@/lib/atlasTypes";
import styles from "./SlidingTabs.module.css";

export interface SlidingTabItem {
  id: AtlasLayerTab;
  label: string;
  count?: number;
  mintDot?: boolean;
}

interface SlidingTabsProps {
  items: SlidingTabItem[];
  activeId: AtlasLayerTab;
  onChange: (id: AtlasLayerTab) => void;
}

/** Smooth 300ms count-up rolling number with tabular-nums discipline. */
function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = value;
    if (from === value) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }

    const duration = 300;
    const start = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [value]);

  return <span className={`${styles.count} tabular-nums`}>{display.toLocaleString()}</span>;
}

/**
 * KREAM Monochrome 2-segment sliding capsule bar.
 * Solid Ink Black (#111111) active pill for ALL tabs, with restrained breathing Emerald Green (#10B981) dot on Festivals.
 */
export default function SlidingTabs({ items, activeId, onChange }: SlidingTabsProps) {
  return (
    <div className={styles.wrap} role="tablist" aria-label="Dock content filter">
      <div
        className={styles.track}
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-tab={item.id}
              data-testid={`dock-tab-${item.id}`}
              className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
              onClick={() => onChange(item.id)}
            >
              {isActive && (
                <motion.span
                  layoutId="atlas-dock-filter-pill"
                  className={styles.activePill}
                  transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                />
              )}
              {item.mintDot && <span className={styles.mintDot} aria-hidden="true" />}
              <span className={styles.label}>{item.label}</span>
              {typeof item.count === "number" && <AnimatedCount value={item.count} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
