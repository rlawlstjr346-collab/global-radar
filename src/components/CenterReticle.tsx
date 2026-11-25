"use client";

import styles from "./CenterReticle.module.css";

export type ReticleState = "idle" | "snapping" | "locked";

interface CenterReticleProps {
  state: ReticleState;
  zoom: number;
  visible: boolean;
}

/**
 * Refined, unobtrusive optical center cue (pointer-events: none).
 * Only emphasizes softly during free globe dragging — never obstructs direct mouse clicks.
 */
export default function CenterReticle({ state, zoom, visible }: CenterReticleProps) {
  if (!visible || zoom >= 10.5) return null;

  return (
    <div
      className={`${styles.root} ${state === "snapping" ? styles.snapping : ""}`}
      data-testid="center-reticle"
      data-reticle-state={state}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 36" className={styles.svg}>
        <circle cx="18" cy="18" r="15" className={styles.haloCircle} />
        <circle
          cx="18"
          cy="18"
          r="15"
          className={`${styles.mainCircle} ${state === "snapping" ? styles.dashed : ""}`}
        />
        <line x1="18" y1="12" x2="18" y2="24" className={styles.cross} />
        <line x1="12" y1="18" x2="24" y2="18" className={styles.cross} />
      </svg>
    </div>
  );
}
