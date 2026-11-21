"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapControls from "./MapControls";
import { COUNTRY_POINTS } from "@/data/countries";
import type { CountryCode } from "@/data/platforms";
import type { LanguageCode } from "@/lib/i18n/locales";
import { getUiStrings } from "@/lib/i18n/uiStrings";
import { createPinIcon } from "@/lib/mapPinIcon";
import styles from "./MapView.module.css";

const ACCENT = "#FF3C5C";
const DESKTOP_SIDEBAR_OFFSET = 420;
const MOBILE_COLLAPSED_HEIGHT = 146;

function computeMapPadding(mobileCollapsed: boolean): mapboxgl.PaddingOptions {
  if (typeof window === "undefined") {
    return { top: 48, bottom: 48, left: DESKTOP_SIDEBAR_OFFSET, right: 64 };
  }
  if (window.innerWidth <= 768) {
    const topOffset = mobileCollapsed
      ? MOBILE_COLLAPSED_HEIGHT + 10
      : Math.round(window.innerHeight * 0.58) + 12;
    return { top: topOffset, bottom: 24, left: 16, right: 56 };
  }
  return { top: 48, bottom: 48, left: DESKTOP_SIDEBAR_OFFSET, right: 64 };
}

function toFeatureCollection(points: typeof COUNTRY_POINTS) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p, index) => ({
      type: "Feature" as const,
      properties: { code: p.code, sortKey: points.length - index },
      geometry: { type: "Point" as const, coordinates: p.coordinates },
    })),
  };
}

function singleFeature(
  point: (typeof COUNTRY_POINTS)[number] | undefined,
  localizedCountryNames: Record<CountryCode, string>,
) {
  return {
    type: "FeatureCollection" as const,
    features: point
      ? [
          {
            type: "Feature" as const,
            properties: {
              code: point.code,
              name: localizedCountryNames[point.code] ?? point.name,
            },
            geometry: { type: "Point" as const, coordinates: point.coordinates },
          },
        ]
      : [],
  };
}

interface MapViewProps {
  focusedCountry: CountryCode | null;
  focusSeq: number;
  onFocusCountry: (code: CountryCode) => void;
  onLocateCountry: (code: CountryCode) => void;
  uiLanguage: LanguageCode;
  localizedCountryNames: Record<CountryCode, string>;
  mobileCollapsed: boolean;
}

export default function MapView({
  focusedCountry,
  focusSeq,
  onFocusCountry,
  onLocateCountry,
  uiLanguage,
  localizedCountryNames,
  mobileCollapsed,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const styleLoadedRef = useRef(false);
  const onFocusRef = useRef(onFocusCountry);
  const focusedCountryRef = useRef(focusedCountry);
  const localizedNamesRef = useRef(localizedCountryNames);
  const mobileCollapsedRef = useRef(mobileCollapsed);
  const [mapError, setMapError] = useState(() => !process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  useEffect(() => {
    onFocusRef.current = onFocusCountry;
  }, [onFocusCountry]);

  useEffect(() => {
    focusedCountryRef.current = focusedCountry;
  }, [focusedCountry]);

  useEffect(() => {
    localizedNamesRef.current = localizedCountryNames;
  }, [localizedCountryNames]);

  useEffect(() => {
    mobileCollapsedRef.current = mobileCollapsed;
  }, [mobileCollapsed]);

  const getPadding = useCallback(() => computeMapPadding(mobileCollapsedRef.current), []);

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
    if (!token || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        projection: "mercator",
        center: [15, 22],
        zoom: 1.2,
        logoPosition: "bottom-right",
      });
    } catch {
      queueMicrotask(() => setMapError(true));
      return;
    }

    mapRef.current = map;
    styleLoadedRef.current = false;

    // Grouped with the language/locate controls in MapControls at top-right;
    // MapControls.module.css pushes this below them and re-offsets the
    // whole stack under the sidebar sheet on mobile.
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("error", () => {
      if (!styleLoadedRef.current) {
        setMapError(true);
      }
    });

    map.on("load", () => {
      styleLoadedRef.current = true;
      setMapError(false);

      const padding = computeMapPadding(mobileCollapsedRef.current);
      const bounds = COUNTRY_POINTS.reduce(
        (b, p) => b.extend(p.coordinates),
        new mapboxgl.LngLatBounds(COUNTRY_POINTS[0].coordinates, COUNTRY_POINTS[0].coordinates),
      );
      map.fitBounds(bounds, { padding, duration: 0 });

      map.addImage("pin", createPinIcon(ACCENT));
      map.addImage("pin-active", createPinIcon("#ffffff", { strokeColor: ACCENT, strokeWidth: 3 }));

      const initialPoint = COUNTRY_POINTS.find((p) => p.code === focusedCountryRef.current);

      map.addSource("countries", { type: "geojson", data: toFeatureCollection(COUNTRY_POINTS) });
      map.addSource("countries-hover", {
        type: "geojson",
        data: singleFeature(undefined, localizedNamesRef.current),
      });
      // Seed immediately with any pre-focused country (e.g. `/[locale]/[country]` landing pages).
      map.addSource("countries-active", {
        type: "geojson",
        data: singleFeature(initialPoint, localizedNamesRef.current),
      });

      map.addLayer({
        id: "countries",
        source: "countries",
        type: "symbol",
        layout: {
          "icon-image": "pin",
          "icon-anchor": "bottom",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 1, 0.5, 6, 0.9],
          "icon-allow-overlap": true,
          "symbol-sort-key": ["get", "sortKey"],
        },
      });

      map.addLayer({
        id: "countries-hover",
        source: "countries-hover",
        type: "symbol",
        layout: {
          "icon-image": "pin",
          "icon-anchor": "bottom",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 1, 0.65, 6, 1.1],
          "icon-allow-overlap": true,
          "symbol-sort-key": 200,
        },
      });

      map.addLayer({
        id: "countries-active",
        source: "countries-active",
        type: "symbol",
        layout: {
          "icon-image": "pin-active",
          "icon-anchor": "bottom",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 1, 0.7, 6, 1.2],
          "icon-allow-overlap": true,
          "symbol-sort-key": 300,
        },
      });

      map.addLayer({
        id: "countries-active-label",
        source: "countries-active",
        type: "symbol",
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
          "text-size": 13,
          "text-offset": [0, -2.6],
          "text-anchor": "bottom",
          "text-optional": true,
          "text-allow-overlap": false,
          "text-padding": 4,
          "symbol-sort-key": 400,
        },
        paint: {
          "text-color": "#171717",
          "text-halo-color": "#ffffff",
          "text-halo-width": 2,
        },
      });

      map.on("mouseenter", "countries", (e) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = e.features?.[0];
        if (feature) {
          (map.getSource("countries-hover") as mapboxgl.GeoJSONSource).setData(
            singleFeature(
              COUNTRY_POINTS.find((p) => p.code === feature.properties?.code),
              localizedNamesRef.current,
            ),
          );
        }
      });

      map.on("mouseleave", "countries", () => {
        map.getCanvas().style.cursor = "";
        (map.getSource("countries-hover") as mapboxgl.GeoJSONSource).setData(
          singleFeature(undefined, localizedNamesRef.current),
        );
      });

      map.on("click", "countries", (e) => {
        const code = e.features?.[0]?.properties?.code as CountryCode | undefined;
        if (code) onFocusRef.current(code);
      });

      // On `/[locale]/[country]` initial arrival, smoothly move to that country
      // within the unobstructed viewport area.
      if (initialPoint) {
        map.flyTo({
          center: initialPoint.coordinates,
          zoom: 4,
          padding,
          duration: 900,
        });
      }
    });

    return () => {
      styleLoadedRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;
    const point = COUNTRY_POINTS.find((p) => p.code === focusedCountry);
    const source = map.getSource("countries-active") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(singleFeature(point, localizedCountryNames));

    if (point && focusSeq > 0) {
      map.flyTo({
        center: point.coordinates,
        zoom: Math.max(map.getZoom(), 3.4),
        padding: computeMapPadding(mobileCollapsedRef.current),
        duration: 800,
      });
    }
  }, [focusedCountry, focusSeq, localizedCountryNames]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleLoadedRef.current) return;
    map.easeTo({ padding: computeMapPadding(mobileCollapsed), duration: 250 });
  }, [mobileCollapsed]);

  const t = getUiStrings(uiLanguage);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      {mapError && (
        <div role="status" className={styles.fallback}>
          <div className={styles.fallbackCard}>
            <div className={styles.fallbackTitle}>{t.mapErrorTitle}</div>
            <div className={styles.fallbackBody}>{t.mapErrorBody}</div>
          </div>
        </div>
      )}
      <MapControls
        mapRef={mapRef}
        uiLanguage={uiLanguage}
        onLocateCountry={onLocateCountry}
        getPadding={getPadding}
        mobileCollapsed={mobileCollapsed}
      />
    </div>
  );
}
