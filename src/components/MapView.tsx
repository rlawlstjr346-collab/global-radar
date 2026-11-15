"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { COUNTRY_POINTS } from "@/data/countries";
import type { CountryCode } from "@/data/platforms";
import { createPinIcon } from "@/lib/mapPinIcon";

const ACCENT = "#FF3C5C";

function toFeatureCollection(points: typeof COUNTRY_POINTS) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      properties: { code: p.code, name: p.name },
      geometry: { type: "Point" as const, coordinates: p.coordinates },
    })),
  };
}

function singleFeature(point: (typeof COUNTRY_POINTS)[number] | undefined) {
  return {
    type: "FeatureCollection" as const,
    features: point
      ? [
          {
            type: "Feature" as const,
            properties: { code: point.code, name: point.name },
            geometry: { type: "Point" as const, coordinates: point.coordinates },
          },
        ]
      : [],
  };
}

interface MapViewProps {
  selectedCountry: CountryCode | null;
  onSelectCountry: (code: CountryCode) => void;
}

export default function MapView({ selectedCountry, onSelectCountry }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const onSelectRef = useRef(onSelectCountry);

  useEffect(() => {
    onSelectRef.current = onSelectCountry;
  }, [onSelectCountry]);

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
        if (code) onSelectRef.current(code);
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
    source?.setData(singleFeature(COUNTRY_POINTS.find((p) => p.code === selectedCountry)));
  }, [selectedCountry]);

  return <div ref={containerRef} style={{ position: "absolute", inset: 0 }} />;
}
