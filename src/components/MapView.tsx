"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapControls from "./MapControls";
import { COUNTRY_POINTS } from "@/data/countries";
import type { CountryCode } from "@/data/platforms";
import { getLocalizedCountryName } from "@/lib/i18n/countryNames";
import { DEFAULT_LANGUAGE, type LanguageCode } from "@/lib/i18n/locales";
import { createPinIcon } from "@/lib/mapPinIcon";

const ACCENT = "#FF3C5C";

function toFeatureCollection(points: typeof COUNTRY_POINTS) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      properties: { code: p.code },
      geometry: { type: "Point" as const, coordinates: p.coordinates },
    })),
  };
}

function singleFeature(
  point: (typeof COUNTRY_POINTS)[number] | undefined,
  lang: LanguageCode = DEFAULT_LANGUAGE,
) {
  return {
    type: "FeatureCollection" as const,
    features: point
      ? [
          {
            type: "Feature" as const,
            properties: { code: point.code, name: getLocalizedCountryName(point.code, lang) },
            geometry: { type: "Point" as const, coordinates: point.coordinates },
          },
        ]
      : [],
  };
}

interface MapViewProps {
  focusedCountry: CountryCode | null;
  onFocusCountry: (code: CountryCode) => void;
  uiLanguage: LanguageCode;
}

export default function MapView({ focusedCountry, onFocusCountry, uiLanguage }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onFocusRef = useRef(onFocusCountry);

  useEffect(() => {
    onFocusRef.current = onFocusCountry;
  }, [onFocusCountry]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      projection: "mercator",
      center: [20, 25],
      zoom: 1.4,
      logoPosition: "bottom-right",
    });
    mapRef.current = map;

    // Grouped with the language/locate controls in MapControls at top-right;
    // MapControls.module.css pushes this below them and re-offsets the
    // whole stack under the sidebar sheet on mobile.
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      const bounds = COUNTRY_POINTS.reduce(
        (b, p) => b.extend(p.coordinates),
        new mapboxgl.LngLatBounds(COUNTRY_POINTS[0].coordinates, COUNTRY_POINTS[0].coordinates),
      );
      map.fitBounds(bounds, { padding: 60, duration: 0 });

      map.addImage("pin", createPinIcon(ACCENT));
      map.addImage("pin-active", createPinIcon("#ffffff", { strokeColor: ACCENT, strokeWidth: 3 }));

      map.addSource("countries", { type: "geojson", data: toFeatureCollection(COUNTRY_POINTS) });
      map.addSource("countries-hover", { type: "geojson", data: singleFeature(undefined) });
      // Seeded once at mount; the focused-country effect below keeps this
      // source's label text in sync with the current uiLanguage afterwards.
      map.addSource("countries-active", { type: "geojson", data: singleFeature(undefined) });

      map.addLayer({
        id: "countries",
        source: "countries",
        type: "symbol",
        layout: {
          "icon-image": "pin",
          "icon-anchor": "bottom",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 1, 0.5, 6, 0.9],
          "icon-allow-overlap": true,
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
            singleFeature(COUNTRY_POINTS.find((p) => p.code === feature.properties?.code)),
          );
        }
      });

      map.on("mouseleave", "countries", () => {
        map.getCanvas().style.cursor = "";
        (map.getSource("countries-hover") as mapboxgl.GeoJSONSource).setData(singleFeature(undefined));
      });

      map.on("click", "countries", (e) => {
        const code = e.features?.[0]?.properties?.code as CountryCode | undefined;
        if (code) onFocusRef.current(code);
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource("countries-active") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(singleFeature(COUNTRY_POINTS.find((p) => p.code === focusedCountry), uiLanguage));
  }, [focusedCountry, uiLanguage]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />
      <MapControls mapRef={mapRef} uiLanguage={uiLanguage} />
    </div>
  );
}
