"use client";

import { useEffect, useMemo, useRef } from "react";
import type * as maplibregl from "maplibre-gl";
import type { AtlasCity } from "@/lib/atlasTypes";
import type { LanguageCode } from "@/lib/i18n/locales";
import styles from "./GlobeCallouts.module.css";

const HUB_COUNT = 28;
const MAX_VISIBLE = 13;
const HIDE_COS = 0.12; // at / behind the horizon
const FULL_COS = 0.38; // fully opaque inside this cap
const RAD = Math.PI / 180;

interface GlobeCalloutsProps {
  map: maplibregl.Map | null;
  cities: AtlasCity[];
  eventCitySlugs: Set<string>;
  uiLanguage: LanguageCode;
  onSelectCity: (city: AtlasCity) => void;
  onAimChange: (aiming: boolean) => void;
}

function hubLabel(city: AtlasCity, lang: LanguageCode): string {
  if (lang === "ko") return city.nameKo;
  if (lang === "ja") return city.nameNative || city.nameEn;
  return city.nameEn.toUpperCase();
}

/**
 * Floating "spec" callouts for the top vintage hubs on the macro globe: a ground dot,
 * an outward stem and a frosted capsule. Positions are written straight to the DOM on
 * every map move (no React re-render per frame).
 */
export default function GlobeCallouts({
  map,
  cities,
  eventCitySlugs,
  uiLanguage,
  onSelectCity,
  onAimChange,
}: GlobeCalloutsProps) {
  const hubs = useMemo(
    () =>
      cities
        .filter((c) => !c.nameKo.includes("기타"))
        .sort((a, b) => b.shopCount - a.shopCount)
        .slice(0, HUB_COUNT),
    [cities],
  );
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!map) return;
    let raf = 0;
    let sizes: { w: number; h: number }[] = [];
    const measure = () => {
      sizes = nodes.current.map((n) => {
        const cap = n?.querySelector<HTMLElement>("[data-cap]");
        return cap ? { w: cap.offsetWidth, h: cap.offsetHeight } : { w: 0, h: 0 };
      });
    };
    const hide = (el: HTMLDivElement) => {
      el.style.visibility = "hidden";
      el.style.opacity = "0";
    };

    const update = () => {
      raf = 0;
      const z = map.getZoom();
      if (z >= 6) {
        for (const el of nodes.current) if (el) hide(el);
        return;
      }
      const c = map.getCenter();
      const g = map.project(c); // sphere centre on screen
      const sinC = Math.sin(c.lat * RAD);
      const cosC = Math.cos(c.lat * RAD);
      const shrink = z <= 5 ? 1 : Math.max(0, 6 - z); // stems land by z6
      const zAlpha = z <= 5.6 ? 1 : Math.max(0, (6 - z) / 0.4); // hand over to map badges
      const placed: [number, number, number, number][] = [];
      let shown = 0;

      hubs.forEach((city, i) => {
        const el = nodes.current[i];
        if (!el) return;
        const [lng, lat] = city.center;
        const cosA = sinC * Math.sin(lat * RAD) + cosC * Math.cos(lat * RAD) * Math.cos((lng - c.lng) * RAD);
        if (cosA <= HIDE_COS || shown >= MAX_VISIBLE) return hide(el);

        const p = map.project([lng, lat]);
        // outward radial normal, blended with screen-up for a "lifted" 3D stem
        let nx = p.x - g.x;
        let ny = p.y - g.y;
        const nl = Math.hypot(nx, ny) || 1;
        nx /= nl;
        ny /= nl;
        let dx = nx * 0.6;
        let dy = ny * 0.6 - 0.4;
        const dl = Math.hypot(dx, dy) || 1;
        dx /= dl;
        dy /= dl;

        const t = Math.min(1, (cosA - HIDE_COS) / (FULL_COS - HIDE_COS));
        const scale = 0.82 + 0.18 * t;
        const stem = (22 + 8 * Math.min(1, city.shopCount / 600)) * shrink;
        const { w, h } = sizes[i] ?? { w: 0, h: 0 };
        const sw = w * scale;
        const sh = h * scale;
        const ex = p.x + dx * stem;
        const ey = p.y + dy * stem;
        const off = (Math.abs(dx) * sw) / 2 + (Math.abs(dy) * sh) / 2 + 2;
        const cx = ex + dx * off;
        const cy = ey + dy * off;
        const box: [number, number, number, number] = [cx - sw / 2 - 4, cy - sh / 2 - 3, cx + sw / 2 + 4, cy + sh / 2 + 3];
        if (placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1])) return hide(el);
        placed.push(box);
        shown += 1;

        el.style.visibility = "visible";
        el.style.opacity = String(t * zAlpha);
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        const stemEl = el.children[1] as HTMLElement;
        stemEl.style.width = `${stem}px`;
        stemEl.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
        const capPos = el.children[2] as HTMLElement;
        capPos.style.transform = `translate(${cx - p.x - w / 2}px, ${cy - p.y - h / 2}px) scale(${scale})`;
      });
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    measure();
    void document.fonts?.ready.then(() => {
      measure();
      schedule();
    });
    map.on("move", schedule);
    map.on("resize", schedule);
    schedule();
    return () => {
      map.off("move", schedule);
      map.off("resize", schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [map, hubs, uiLanguage]);

  return (
    <div className={styles.layer} aria-label="Vintage hubs" data-testid="globe-callouts">
      {hubs.map((city, i) => (
        <div
          key={city.slug}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          className={styles.hub}
          data-slug={city.slug}
        >
          <span className={`${styles.dot} ${eventCitySlugs.has(city.slug) ? styles.dotLive : ""}`} />
          <span className={styles.stem} />
          <span className={styles.capPos}>
            <button
              type="button"
              data-cap
              className={styles.cap}
              onClick={() => onSelectCity(city)}
              onMouseEnter={() => onAimChange(true)}
              onMouseLeave={() => onAimChange(false)}
            >
              <span className={styles.capName}>{hubLabel(city, uiLanguage)}</span>
              <span className={`${styles.capCount} tabular-nums`}>· {city.shopCount.toLocaleString()}</span>
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
