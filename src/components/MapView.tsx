"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type {
  AtlasAlley,
  AtlasCity,
  AtlasCountry,
  AtlasEvent,
  AtlasPlatformMeta,
  CompactPinTuple,
} from "@/lib/atlasTypes";
import { resolveAlleyDisplay } from "@/lib/alleyZones";
import type { LanguageCode } from "@/lib/i18n/locales";
import type { ReticleState } from "./CenterReticle";
import styles from "./MapView.module.css";

// CARTO Positron GL public basemap; its OpenStreetMap + CARTO attribution is kept by the attribution control
const POSITRON_STYLE_URL = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

export interface MapCameraCommand {
  lng: number;
  lat: number;
  zoom: number;
  bbox?: [number, number, number, number];
  kind?: "globe" | "country" | "city" | "alley" | "spot";
  seq: number;
}

export interface HoveredCountryInfo {
  code: string;
  nameKo: string;
  nameEn: string;
  shopCount: number;
  platformCount: number;
}

interface MapViewProps {
  uiLanguage: LanguageCode;
  countries: AtlasCountry[];
  cities: AtlasCity[];
  alleys: AtlasAlley[];
  pins: CompactPinTuple[];
  platforms: AtlasPlatformMeta[];
  events: AtlasEvent[];
  initialCenter: [number, number];
  lockedCountry: string;
  lockedCitySlug: string | null;
  selectedAlleyId: string | null;
  selectedSpotId: string | null;
  hoveredSpotId: string | null;
  drawerOpen: boolean;
  cameraCommand: MapCameraCommand | null;
  onClickCountry: (cc: string, alreadyLocked: boolean) => void;
  onClickPlatformCapsule: (cc: string) => void;
  onSelectRegion: (cc: string, city: AtlasCity | null, regionName?: string) => void;
  onReticleLockCountry: (cc: string, city?: AtlasCity | null) => void;
  onHoverCountry: (info: HoveredCountryInfo | null) => void;
  onSelectCityBadge: (city: AtlasCity) => void;
  onSelectAlley: (alleyId: string) => void;
  onSelectSpot: (id: string, cc: string) => void;
  onSelectEvent: (ev: AtlasEvent) => void;
  onHoverSpot: (id: string | null) => void;
  onZoomChange: (zoom: number) => void;
  onCenterChange: (center: [number, number]) => void;
  onBoundsChange?: (bounds: [number, number, number, number]) => void;
  onReticleStateChange: (state: ReticleState, active: boolean) => void;
  onMapApiReady?: (api: {
    zoomIn: () => void;
    zoomOut: () => void;
    resetGlobe: () => void;
    locateMe: () => void;
  }) => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Single source of camera physics. Every move is `essential` so the OS reduced-motion
 * flag can never silently degrade a glide into a 0 ms teleport. */
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const GLOBE_RESET_CENTER: [number, number] = [128, 34];

/** Distance-proportional flight time: short hops ~1100 ms, cross-world flights cap at 1450 ms. */
function flightDuration(from: maplibregl.LngLat, to: [number, number], fromZoom: number, toZoom: number): number {
  const km = from.distanceTo(new maplibregl.LngLat(to[0], to[1])) / 1000;
  const span = Math.min(1, Math.log10(1 + km) / 4 + Math.abs(toZoom - fromZoom) / 40);
  return Math.round(1100 + 350 * span);
}

function computeInitialGlobeZoom(): number {
  if (typeof window === "undefined") return 2.55;
  const h = window.innerHeight;
  const byHeight = h >= 1800 ? 3.15 : h >= 1150 ? 2.8 : h < 760 ? 2.15 : 2.55;
  // Globe diameter = 512 * 2^z / PI px; never let it exceed ~1.05x the viewport width (phones)
  const byWidth = Math.log2((Math.PI * 1.05 * window.innerWidth) / 512);
  return Math.max(1.4, Math.min(byHeight, byWidth));
}

/** Phones: the drawer is a bottom sheet, so lift the globe into the visible upper band. */
function computeMobileSheetPadding(): number {
  if (typeof window === "undefined" || window.innerWidth >= 768) return 0;
  return Math.round(window.innerHeight * 0.42);
}

function computeDrawerLeftPadding(drawerOpen: boolean): number {
  if (!drawerOpen || typeof window === "undefined") return 0;
  const vw = window.innerWidth;
  if (vw < 768) return 0;
  const drawerW = Math.min(680, Math.max(400, vw * 0.27));
  const inset = Math.min(32, Math.max(16, vw * 0.014));
  return Math.round(drawerW + inset + 24);
}

function createSanctuaryPillImage(): {
  width: number;
  height: number;
  data: Uint8Array;
} | null {
  if (typeof document === "undefined") return null;
  const width = 76;
  const height = 34;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const r = h / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.lineTo(pad + w - r, pad);
  ctx.arcTo(pad + w, pad, pad + w, pad + r, r);
  ctx.arcTo(pad + w, pad + h, pad + w - r, pad + h, r);
  ctx.lineTo(pad + r, pad + h);
  ctx.arcTo(pad, pad + h, pad, pad + h - r, r);
  ctx.arcTo(pad, pad, pad + r, pad, r);
  ctx.closePath();

  ctx.fillStyle = "#111111";
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
  ctx.stroke();

  const img = ctx.getImageData(0, 0, width, height);
  return { width, height, data: new Uint8Array(img.data.buffer) };
}

function findNearestCityInCountry(
  cc: string,
  lng: number,
  lat: number,
  cities: AtlasCity[],
): AtlasCity | null {
  const upper = cc.toUpperCase();
  let best: AtlasCity | null = null;
  let bestDist = Infinity;
  for (const c of cities) {
    if (c.country !== upper) continue;
    const dx = (c.center[0] - lng) * Math.cos((lat * Math.PI) / 180);
    const dy = c.center[1] - lat;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

/** High-contrast cartography palette (sea vs land RGB distance ~ 60 on every monitor). */
const CARTO = {
  oceanGlobe: "#111318",
  water: "#C8CFD8",
  land: "#F8F8F6",
  green: "#E4E8E5",
  border2: "#334155",
  border4: "#64748B",
  border6: "#94A3B8",
  roadCase: "#CBD5E1",
  roadMajor: "#FFFFFF",
  roadMinor: "#E2E8F0",
  building: "#E7E5DE",
  buildingEdge: "#D1CFC7",
} as const;

/** 시·군·구 / wards bloom in gradually instead of popping in at a fixed zoom. */
const COUNTY_FADE: maplibregl.ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 7.5, 0.35, 9.5, 1];

function safePaint(
  map: maplibregl.Map,
  id: string,
  prop: Parameters<maplibregl.Map["setPaintProperty"]>[1],
  value: Parameters<maplibregl.Map["setPaintProperty"]>[2],
) {
  try {
    map.setPaintProperty(id, prop, value);
  } catch {
    // property not applicable to this layer type
  }
}

/**
 * Restyles the CARTO Positron GL style in place. Every one of its layers is kept
 * (nothing hidden, nothing re-filtered); only colours/widths are raised to a
 * high-contrast palette. Base-map symbols fade in from z5.5 so the
 * macro globe keeps its own country labels.
 */
function applyUnifiedVectorMonochromeSkin(map: maplibregl.Map): {
  textFont: string[];
  firstSymbolId: string | undefined;
} {
  const layers = map.getStyle()?.layers ?? [];
  let textFont: string[] = ["Montserrat Medium", "Open Sans Regular", "Noto Sans Regular"];

  // CARTO's first symbol layer (waterway_label) sits *below* its roads, buildings and
  // country lines, so anchor overlays to the first label that follows the last line/fill layer.
  const lastGeometryIndex = layers.reduce((acc, l, i) => (l.type === "symbol" ? acc : i), -1);
  const firstSymbolId = layers.find((l, i) => i > lastGeometryIndex && l.type === "symbol")?.id;

  for (const layer of layers) {
    const id = layer.id;
    if (layer.type === "symbol") {
      const tf = (layer.layout as Record<string, unknown> | undefined)?.["text-font"];
      if (id === "place_suburbs" && Array.isArray(tf)) textFont = tf as string[];
      const fadeIn: maplibregl.ExpressionSpecification = ["interpolate", ["linear"], ["zoom"], 5.5, 0, 6.0, 1];
      safePaint(map, id, "text-opacity", fadeIn);
      safePaint(map, id, "icon-opacity", fadeIn);
      continue;
    }

    if (layer.type === "background") {
      // Globe zooms: the floor under not-yet-loaded tiles is the ocean, never a white square.
      safePaint(map, id, "background-color", [
        "interpolate", ["linear"], ["zoom"], 5.0, CARTO.oceanGlobe, 5.6, CARTO.land,
      ]);
    } else if (id === "water") {
      safePaint(map, id, "fill-color", [
        "interpolate", ["linear"], ["zoom"], 4.8, CARTO.oceanGlobe, 5.5, CARTO.water,
      ]);
    } else if (id === "waterway") {
      safePaint(map, id, "line-color", CARTO.water);
      safePaint(map, id, "line-width", ["interpolate", ["linear"], ["zoom"], 8, 0.8, 12, 1.6, 16, 3.5]);
    } else if (id === "landcover" || id.startsWith("park_")) {
      safePaint(map, id, "fill-color", CARTO.green);
      safePaint(map, id, "fill-opacity", 0.55);
    } else if (id === "landuse") {
      safePaint(map, id, "fill-color", CARTO.green);
    } else if (id === "boundary_country_inner" || id === "boundary_country_outline") {
      // The globe draws its own hairline borders; CARTO's take over as that overlay fades (z5.2).
      safePaint(map, id, "line-opacity", ["interpolate", ["linear"], ["zoom"], 5.0, 0, 5.3, id === "boundary_country_outline" ? 0.5 : 1]);
      if (id === "boundary_country_inner") {
        safePaint(map, id, "line-color", CARTO.border2);
        safePaint(map, id, "line-width", 1.8);
      }
    } else if (id === "boundary_state") {
      safePaint(map, id, "line-color", CARTO.border4);
      safePaint(map, id, "line-width", 1.3);
      safePaint(map, id, "line-dasharray", [1, 0]);
    } else if (id === "boundary_county") {
      map.setLayerZoomRange(id, 7.5, 24);
      safePaint(map, id, "line-color", CARTO.border6);
      safePaint(map, id, "line-width", 1.0);
      safePaint(map, id, "line-dasharray", [1, 0]);
      safePaint(map, id, "line-opacity", COUNTY_FADE);
    } else if (layer.type === "line" && /^(road|tunnel|bridge)_/.test(id) && !id.includes("path")) {
      if (id.includes("_case")) {
        safePaint(map, id, "line-color", CARTO.roadCase);
      } else if (/_(mot|trunk|pri|sec)_/.test(id)) {
        safePaint(map, id, "line-color", CARTO.roadMajor);
      } else {
        safePaint(map, id, "line-color", CARTO.roadMinor);
      }
    } else if (id === "building" || id === "building-top") {
      safePaint(map, id, "fill-color", id === "building" ? CARTO.buildingEdge : CARTO.building);
      safePaint(map, id, "fill-outline-color", CARTO.buildingEdge);
      safePaint(map, id, "fill-opacity", ["interpolate", ["linear"], ["zoom"], 13.5, 0, 14, 1]);
    }
  }

  // Carto paints admin lines beneath water and roads, so any border running along a
  // road or river (most 구 lines in Seoul) vanished. Lift them above the road network.
  for (const id of ["boundary_state", "boundary_county"]) {
    if (map.getLayer(id)) map.moveLayer(id, firstSymbolId);
  }
  // Carto ships no layer for kind_detail 7 (Tokyo's 23 wards, Japanese/Korean cities).
  const boundarySource = layers.find((l) => l.id === "boundary_county") as { source?: string } | undefined;
  if (boundarySource?.source && !map.getLayer("atlas-boundary-ward")) {
    map.addLayer(
      {
        id: "atlas-boundary-ward",
        type: "line",
        source: boundarySource.source,
        "source-layer": "boundaries",
        minzoom: 7.5,
        filter: ["==", ["get", "kind_detail"], 7],
        layout: { "line-join": "round" },
        paint: { "line-color": CARTO.border6, "line-width": 1.0, "line-opacity": COUNTY_FADE },
      },
      firstSymbolId,
    );
  }

  return { textFont, firstSymbolId };
}

/**
 * Macro globe land: one warm alabaster #ECEBE6 for every country; only the hovered
 * or selected country lifts to pure #FFFFFF (with a #18181B outline layer).
 */
function buildGlobeChoroplethFillExpression(
  locked: string,
  hovered: string | null,
): maplibregl.ExpressionSpecification {
  return [
    "case",
    ["in", ["get", "ISO_A2"], ["literal", [locked, hovered || "__NONE__"]]],
    "#FFFFFF",
    "#ECEBE6",
  ];
}

export default function MapView({
  uiLanguage,
  countries,
  cities,
  alleys,
  pins,
  events,
  initialCenter,
  lockedCountry,
  lockedCitySlug,
  selectedAlleyId,
  selectedSpotId,
  hoveredSpotId,
  drawerOpen,
  cameraCommand,
  onClickCountry,
  onClickPlatformCapsule,
  onSelectRegion,
  onReticleLockCountry,
  onHoverCountry,
  onSelectCityBadge,
  onSelectAlley,
  onSelectSpot,
  onSelectEvent,
  onHoverSpot,
  onZoomChange,
  onCenterChange,
  onBoundsChange,
  onReticleStateChange,
  onMapApiReady,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const hoveredCountryRef = useRef<string | null>(null);

  const selectionModeRef = useRef<"click" | "reticle">("click");
  const interactionRef = useRef<"idle" | "dragging">("idle");
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const draggedDistanceRef = useRef(0);
  const flightRef = useRef<"idle" | "snap" | "direct">("idle");
  const idleSpinActiveRef = useRef(true);
  const idleSpinRafRef = useRef<number | null>(null);
  const highlightMarkerRef = useRef<maplibregl.Marker | null>(null);
  const sonarMarkersRef = useRef<maplibregl.Marker[]>([]);

  const countryByCode = useMemo(
    () => new Map(countries.map((c) => [c.code, c])),
    [countries],
  );

  const latestRef = useRef({
    uiLanguage,
    countries,
    countryByCode,
    cities,
    events,
    lockedCountry,
    lockedCitySlug,
    selectedAlleyId,
    selectedSpotId,
    drawerOpen,
    onClickCountry,
    onClickPlatformCapsule,
    onSelectRegion,
    onReticleLockCountry,
    onHoverCountry,
    onSelectCityBadge,
    onSelectAlley,
    onSelectSpot,
    onSelectEvent,
    onHoverSpot,
    onZoomChange,
    onCenterChange,
    onBoundsChange,
    onReticleStateChange,
  });
  latestRef.current = {
    uiLanguage,
    countries,
    countryByCode,
    cities,
    events,
    lockedCountry,
    lockedCitySlug,
    selectedAlleyId,
    selectedSpotId,
    drawerOpen,
    onClickCountry,
    onClickPlatformCapsule,
    onSelectRegion,
    onReticleLockCountry,
    onHoverCountry,
    onSelectCityBadge,
    onSelectAlley,
    onSelectSpot,
    onSelectEvent,
    onHoverSpot,
    onZoomChange,
    onCenterChange,
    onBoundsChange,
    onReticleStateChange,
  };

  // Tier 2: Clickable Monochrome City Dots & Pills (zoom 4.8 ~ 11.2)
  const citySeedsGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: cities.map((c) => ({
        type: "Feature",
        id: c.slug,
        geometry: { type: "Point", coordinates: c.center },
        properties: {
          slug: c.slug,
          country: c.country,
          shopCount: c.shopCount,
          badgeLabel: `${uiLanguage === "ko" ? c.nameKo : c.nameEn} · ${c.shopCount.toLocaleString()}`,
          priority: c.shopCount + (c.curated ? 300 : 0),
          locked: c.slug === lockedCitySlug ? 1 : 0,
        },
      })),
    }),
    [cities, uiLanguage, lockedCitySlug],
  );

  // Tier 3: Core Vintage Sanctuary "Soft Aura" + Editorial Capsules (ONLY >= 5 shops! Zero 1~4 shop clutter!)
  const sanctuaryGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => {
    const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
    for (const a of alleys) {
      if (a.count < 5) continue;
      const { stamp, labelKo } = resolveAlleyDisplay(a);
      features.push({
        type: "Feature",
        id: a.id,
        geometry: { type: "Point", coordinates: a.center },
        properties: {
          id: a.id,
          count: a.count,
          stampLabel: `${stamp} · ${a.count}`,
          stampLabelKo: `${labelKo} · ${a.count}`,
          selected: a.id === selectedAlleyId ? 1 : 0,
        },
      });
    }
    features.sort((a, b) => Number(b.properties?.count || 0) - Number(a.properties?.count || 0));
    return { type: "FeatureCollection", features };
  }, [alleys, selectedAlleyId]);

  // Tier 4: Street Spots (13,054 offline vintage shops, monochrome ink black)
  const streetSpotsGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: pins.map((p) => ({
        type: "Feature",
        id: p[0],
        geometry: { type: "Point", coordinates: [p[6], p[7]] },
        properties: {
          id: p[0],
          name: p[1],
          cc: p[2],
          citySlug: p[3],
          alley: p[9],
          featured: p[10],
        },
      })),
    }),
    [pins],
  );

  // Tier 5: Verified Recurring & Upcoming Live Events (Emerald Green #10B981 + Sonar Pulse)
  const eventsGeoJson = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(
    () => ({
      type: "FeatureCollection",
      features: events
        .filter((ev) => Array.isArray(ev.center) && ev.center.length === 2)
        .map((ev) => ({
          type: "Feature",
          id: ev.id,
          geometry: { type: "Point", coordinates: ev.center! },
          properties: {
            id: ev.id,
            nameKo: ev.nameKo,
            country: ev.country,
            citySlug: ev.citySlug,
          },
        })),
    }),
    [events],
  );

  const pinById = useMemo(() => {
    const map = new Map<string, CompactPinTuple>();
    for (const p of pins) map.set(p[0], p);
    return map;
  }, [pins]);

  const syncCountryPaint = (map: maplibregl.Map, locked: string, hovered: string | null) => {
    if (map.getLayer("atlas-countries-fill")) {
      map.setPaintProperty(
        "atlas-countries-fill",
        "fill-color",
        buildGlobeChoroplethFillExpression(locked, hovered),
      );
    }
    if (map.getLayer("atlas-country-hover-border")) {
      map.setFilter("atlas-country-hover-border", [
        "all",
        ["==", ["get", "ISO_A2"], hovered || "__NONE__"],
        ["!=", ["get", "ISO_A2"], locked],
      ]);
    }
    if (map.getLayer("atlas-country-locked-border")) {
      map.setFilter("atlas-country-locked-border", ["==", ["get", "ISO_A2"], locked]);
    }
  };

  // Helper to start/resume gentle 0.15 deg/s globe breathing rotation
  const startIdleSpinRef = useRef<() => void>(() => {});

  // 1. Initialize Fullscreen MapLibre 3D Monochrome Globe + Single 5-Tier Vector Map
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialZoom = computeInitialGlobeZoom();
    // Set pre-paint by the root layout script: first global visit this session, motion allowed.
    const playIntro =
      typeof document !== "undefined" && document.documentElement.hasAttribute("data-intro");
    let map: maplibregl.Map;
    try {
      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
      map = new maplibregl.Map({
        container,
        style: POSITRON_STYLE_URL,
        center: playIntro ? [initialCenter[0] - 18, initialCenter[1]] : initialCenter,
        zoom: playIntro ? initialZoom - 0.55 : initialZoom,
        minZoom: 1.4,
        maxZoom: 18,
        maxPitch: 45,
        attributionControl: { compact: true },
        canvasContextAttributes: { preserveDrawingBuffer: true },
      });
    } catch {
      setMapError(true);
      return;
    }

    mapRef.current = map;
    const mobileSheetPad = computeMobileSheetPadding();
    if (mobileSheetPad > 0) map.setPadding({ top: 0, right: 0, bottom: mobileSheetPad, left: 0 });

    const stopIdleSpin = () => {
      idleSpinActiveRef.current = false;
      if (idleSpinRafRef.current !== null) {
        cancelAnimationFrame(idleSpinRafRef.current);
        idleSpinRafRef.current = null;
      }
    };

    const startIdleSpin = () => {
      if (prefersReducedMotion()) return;
      idleSpinActiveRef.current = true;
      if (idleSpinRafRef.current !== null) return;
      let lastTs = performance.now();
      const spin = (ts: number) => {
        if (!idleSpinActiveRef.current || !mapRef.current) {
          idleSpinRafRef.current = null;
          return;
        }
        const dt = Math.min(ts - lastTs, 50);
        lastTs = ts;
        // Gentle 0.15 deg/sec breathing rotation at macro globe zoom (< 4.2)
        if (
          map.getZoom() < 4.0 &&
          !latestRef.current.selectedSpotId &&
          flightRef.current === "idle" &&
          interactionRef.current === "idle"
        ) {
          const c = map.getCenter();
          map.jumpTo({ center: [c.lng + dt * 0.00012, c.lat] });
        }
        idleSpinRafRef.current = requestAnimationFrame(spin);
      };
      idleSpinRafRef.current = requestAnimationFrame(spin);
    };
    startIdleSpinRef.current = startIdleSpin;

    const onPointerDown = (e: PointerEvent) => {
      stopIdleSpin();
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      draggedDistanceRef.current = 0;
      interactionRef.current = "dragging";
      if (flightRef.current === "snap") {
        map.stop();
        flightRef.current = "idle";
      }
    };

    const onPointerMoveWindow = (e: PointerEvent) => {
      if (!pointerDownPosRef.current) return;
      draggedDistanceRef.current = Math.hypot(
        e.clientX - pointerDownPosRef.current.x,
        e.clientY - pointerDownPosRef.current.y,
      );
      if (draggedDistanceRef.current > 14) {
        selectionModeRef.current = "reticle";
        latestRef.current.onReticleStateChange("idle", true);
      }
    };

    const onPointerUp = () => {
      pointerDownPosRef.current = null;
      interactionRef.current = "idle";
    };

    const onWheel = () => {
      stopIdleSpin();
      if (flightRef.current === "snap") {
        map.stop();
        flightRef.current = "idle";
      }
    };

    // Any hover over the globe pauses the ambient spin; it resumes after a globe reset settles.
    const onHoverPause = () => stopIdleSpin();
    container.addEventListener("mousemove", onHoverPause, { passive: true });
    container.addEventListener("pointerdown", onPointerDown, { passive: true });
    container.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("pointermove", onPointerMoveWindow, { passive: true });
    window.addEventListener("pointerup", onPointerUp, { passive: true });

    const emitBounds = () => {
      const b = map.getBounds();
      if (b) {
        latestRef.current.onBoundsChange?.([
          b.getWest(),
          b.getSouth(),
          b.getEast(),
          b.getNorth(),
        ]);
      }
    };

    const onMoveEnd = () => {
      const z = map.getZoom();
      const c = map.getCenter();
      latestRef.current.onZoomChange(z);
      latestRef.current.onCenterChange([c.lng, c.lat]);
      emitBounds();

      // Auto-restore pitch to 0 when zooming back out below 11
      if (z < 10.8 && map.getPitch() > 1 && flightRef.current === "idle") {
        map.easeTo({ pitch: 0, duration: 280, easing: easeOutCubic, essential: true });
      }

      if (flightRef.current === "direct" || flightRef.current === "snap") {
        flightRef.current = "idle";
        latestRef.current.onReticleStateChange("locked", false);
        return;
      }

      if (selectionModeRef.current !== "reticle" || interactionRef.current !== "idle" || z >= 6.0) {
        return;
      }

      // Gently lock country beneath center cue after manual globe drag
      const centerPx = map.project(c);
      if (map.getLayer("atlas-countries-fill")) {
        const hits = map.queryRenderedFeatures([centerPx.x, centerPx.y], {
          layers: ["atlas-countries-fill"],
        });
        const iso = hits[0]?.properties?.ISO_A2 as string | undefined;
        if (iso && iso !== latestRef.current.lockedCountry) {
          const topCity = latestRef.current.cities.find((ct) => ct.country === iso) || null;
          latestRef.current.onReticleLockCountry(iso, topCity);
          latestRef.current.onReticleStateChange("locked", false);
        }
      }
    };

    map.on("style.load", async () => {
      map.setProjection({ type: "globe" });
      map.setSky({
        "sky-color": "#08090D",
        "horizon-color": "#2C313D",
        "fog-color": "#08090D",
        "atmosphere-blend": 0.85,
      });

      const skin = applyUnifiedVectorMonochromeSkin(map);

      if (!map.hasImage("sanctuary-pill")) {
        const sancImg = createSanctuaryPillImage();
        if (sancImg) {
          map.addImage("sanctuary-pill", sancImg, {
            pixelRatio: 2,
            stretchX: [[18, 58]],
            stretchY: [[10, 24]],
            content: [12, 6, 64, 28],
          });
        }
      }

      // Load ONLY macro 3D globe country choropleth polygons (zero external admin1/adm2 overlays!)
      let countriesData: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
      try {
        const res = await fetch("/data/world-countries.geojson");
        if (res.ok) {
          countriesData = (await res.json()) as GeoJSON.FeatureCollection;
        }
      } catch {}

      if (!mapRef.current) return;

      if (!map.getSource("atlas-world-countries")) {
        map.addSource("atlas-world-countries", {
          type: "geojson",
          data: countriesData,
        });

        // Macro 3D Globe Density Choropleth: completely fades out 5.2 -> 6.2 (zero double coastlines!)
        map.addLayer(
          {
            id: "atlas-countries-fill",
            type: "fill",
            source: "atlas-world-countries",
            maxzoom: 6.4,
            paint: {
              "fill-color": buildGlobeChoroplethFillExpression(latestRef.current.lockedCountry, null),
              "fill-opacity": ["interpolate", ["linear"], ["zoom"], 4.6, 1, 5.2, 0],
            },
          },
          skin.firstSymbolId,
        );

        // Subtle Globe Country Frontiers (fades to 0 at zoom 6.2 so Positron vector boundary owns zoom >= 6)
        map.addLayer(
          {
            id: "atlas-countries-border",
            type: "line",
            source: "atlas-world-countries",
            maxzoom: 6.4,
            paint: {
              "line-color": "#B8B7B0",
              "line-width": 0.8,
              "line-opacity": ["interpolate", ["linear"], ["zoom"], 4.6, 0.85, 5.2, 0],
            },
          },
          skin.firstSymbolId,
        );

        // Hovered Globe Country Outline (#111111, fades out by 6.2)
        map.addLayer(
          {
            id: "atlas-country-hover-border",
            type: "line",
            source: "atlas-world-countries",
            maxzoom: 6.4,
            filter: ["==", ["get", "ISO_A2"], "__NONE__"],
            paint: {
              "line-color": "#18181B",
              "line-width": 1.8,
              "line-opacity": ["interpolate", ["linear"], ["zoom"], 4.6, 0.95, 5.2, 0],
            },
          },
          skin.firstSymbolId,
        );

        // Locked Globe Country Outline (#111111, fades cleanly to 0 at 6.2 -> zero Incheon double lines!)
        map.addLayer(
          {
            id: "atlas-country-locked-border",
            type: "line",
            source: "atlas-world-countries",
            maxzoom: 6.4,
            filter: ["==", ["get", "ISO_A2"], latestRef.current.lockedCountry],
            paint: {
              "line-color": "#18181B",
              "line-width": 1.8,
              "line-opacity": ["interpolate", ["linear"], ["zoom"], 4.6, 1, 5.2, 0],
            },
          },
          skin.firstSymbolId,
        );
      }

      // Tier 3A: Core Vintage Sanctuary "Soft Aura" (count >= 5 ONLY — sits cleanly below shop dots!)
      if (!map.getSource("atlas-sanctuaries")) {
        map.addSource("atlas-sanctuaries", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "atlas-sanctuary-aura",
          type: "circle",
          source: "atlas-sanctuaries",
          minzoom: 10.4,
          paint: {
            "circle-color": "rgba(0, 0, 0, 0)",
            "circle-blur": 0,
            "circle-pitch-alignment": "map",
            "circle-stroke-color": [
              "case",
              ["==", ["get", "selected"], 1],
              "rgba(17, 17, 17, 0.75)",
              "rgba(17, 17, 17, 0.28)",
            ],
            "circle-stroke-width": ["case", ["==", ["get", "selected"], 1], 1.5, 1],
            "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 10.4, 0, 11.0, 1],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10.5,
              ["interpolate", ["linear"], ["get", "count"], 5, 18, 25, 28, 70, 40],
              13.5,
              ["interpolate", ["linear"], ["get", "count"], 5, 36, 25, 54, 70, 76],
              16.0,
              ["interpolate", ["linear"], ["get", "count"], 5, 58, 25, 86, 70, 118],
            ],
            "circle-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10.4,
              0,
              11.0,
              1,
              15.5,
              0.7,
            ],
          },
        });
      }

      // Tier 4: Street Spots (13,054 offline vintage shops, monochrome ink black)
      if (!map.getSource("atlas-street-spots")) {
        map.addSource("atlas-street-spots", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "atlas-street-spots-circle",
          type: "circle",
          source: "atlas-street-spots",
          minzoom: 11.4,
          paint: {
            "circle-color": ["case", ["==", ["get", "featured"], 1], "#111111", "#27272A"],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              11.4,
              3.6,
              13.5,
              5.6,
              16,
              7.8,
            ],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 1.6,
            "circle-opacity": ["interpolate", ["linear"], ["zoom"], 11.4, 0, 12.0, 1],
            "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 11.4, 0, 12.0, 1],
          },
        });
        map.addLayer({
          id: "atlas-spot-selected",
          type: "circle",
          source: "atlas-street-spots",
          minzoom: 11.4,
          filter: ["==", ["get", "id"], latestRef.current.selectedSpotId ?? "__NONE__"],
          paint: {
            "circle-color": "#FFFFFF",
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 11.4, 3.6, 13.5, 5.6, 16, 7.8],
            "circle-stroke-color": "#111111",
            "circle-stroke-width": 2.6,
          },
        });
      }

      // Tier 3B: Sanctuary Editorial Capsule Stamps (rendered ABOVE shop dots so text is NEVER occluded!)
      if (!map.getLayer("atlas-alley-stamps") && map.getSource("atlas-sanctuaries")) {
        map.addLayer({
          id: "atlas-alley-stamps",
          type: "symbol",
          source: "atlas-sanctuaries",
          minzoom: 10.5,
          layout: {
            "icon-image": "sanctuary-pill",
            "icon-text-fit": "both",
            "icon-text-fit-padding": [4, 11, 4, 11],
            "text-field":
              latestRef.current.uiLanguage === "ko"
                ? ["get", "stampLabelKo"]
                : ["get", "stampLabel"],
            "text-font": skin.textFont,
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              10.5,
              11.5,
              13.0,
              13,
              15.5,
              14,
            ],
            "text-letter-spacing": 0.02,
            "text-allow-overlap": false,
            "text-padding": 10,
            "symbol-sort-key": ["-", 0, ["get", "count"]],
          },
          paint: {
            "text-color": "#FFFFFF",
            "text-opacity": ["interpolate", ["linear"], ["zoom"], 10.5, 0, 11.1, 1],
            "icon-opacity": ["interpolate", ["linear"], ["zoom"], 10.5, 0, 11.1, 0.96],
          },
        });
      }

      // Tier 2: Clickable Monochrome City Dots & Pills (zoom 4.8 ~ 11.2)
      if (!map.getSource("atlas-city-seeds")) {
        map.addSource("atlas-city-seeds", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "atlas-city-seeds-dot",
          type: "circle",
          source: "atlas-city-seeds",
          maxzoom: 11.4,
          paint: {
            "circle-color": "#18181B",
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "shopCount"],
              1,
              2.4,
              30,
              3.8,
              120,
              5.0,
              300,
              6.2,
              550,
              7.2,
            ],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 1,
            "circle-opacity": ["interpolate", ["linear"], ["zoom"], 10.4, 0.92, 11.3, 0],
            "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 10.4, 0.92, 11.3, 0],
          },
        });

        map.addLayer({
          id: "atlas-city-badges",
          type: "symbol",
          source: "atlas-city-seeds",
          minzoom: 5.5,
          maxzoom: 11.4,
          layout: {
            "text-field": ["get", "badgeLabel"],
            "text-font": skin.textFont,
            "text-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              4.8,
              12.5,
              7.5,
              14.5,
              10.2,
              16,
            ],
            "text-offset": [0, 1.15],
            "text-anchor": "top",
            "text-padding": 10,
            "symbol-sort-key": ["-", 0, ["get", "priority"]],
          },
          paint: {
            "text-color": "#111111",
            "text-halo-color": "#FFFFFF",
            "text-halo-width": 2.2,
            "text-opacity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5.5,
              0,
              6.0,
              1,
              10.5,
              1,
              11.3,
              0,
            ],
          },
        });
      }

      // Tier 5: Live & Verified Recurring Events — Emerald Green (#10B981); the 2.6s sonar ring is DOM/CSS
      if (!map.getSource("atlas-live-events")) {
        map.addSource("atlas-live-events", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        map.addLayer({
          id: "atlas-events-dot",
          type: "circle",
          source: "atlas-live-events",
          paint: {
            "circle-color": "#10B981",
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 4.4, 10, 6.0, 15, 7.6],
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 1.8,
          },
        });
      }

      // List-row hover resonance: the hovered shop / festival pin grows 1.45x with a crisp ring.
      if (!map.getLayer("atlas-hover-ring")) {
        const none: maplibregl.FilterSpecification = ["==", ["get", "id"], "__NONE__"];
        map.addLayer({
          id: "atlas-hover-ring",
          type: "circle",
          source: "atlas-street-spots",
          filter: none,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 9, 11.4, 10.2, 13.5, 13.1, 16, 16.3],
            "circle-color": "rgba(0, 0, 0, 0)",
            "circle-stroke-color": "#111111",
            "circle-stroke-width": 2,
          },
        });
        map.addLayer({
          id: "atlas-hover-dot",
          type: "circle",
          source: "atlas-street-spots",
          filter: none,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 5.2, 11.4, 5.2, 13.5, 8.1, 16, 11.3],
            "circle-color": "#111111",
            "circle-stroke-color": "#FFFFFF",
            "circle-stroke-width": 2,
          },
        });
        map.addLayer({
          id: "atlas-event-hover",
          type: "circle",
          source: "atlas-live-events",
          filter: none,
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 2, 6.4, 10, 8.7, 15, 11],
            "circle-color": "#10B981",
            "circle-stroke-color": "#111111",
            "circle-stroke-width": 2.2,
          },
        });
      }

      // Mousemove hover highlights on macro globe countries (< 6.2)
      map.on("mousemove", (e: maplibregl.MapMouseEvent) => {
        const z = map.getZoom();
        if (z < 6.2 && map.getLayer("atlas-countries-fill")) {
          const chits = map.queryRenderedFeatures(e.point, { layers: ["atlas-countries-fill"] });
          const props = chits[0]?.properties as
            | {
                ISO_A2?: string;
                nameKo?: string;
                nameEn?: string;
                shopCount?: number;
                platformCount?: number;
              }
            | undefined;
          const iso = props?.ISO_A2 || null;
          map.getCanvas().style.cursor = iso ? "pointer" : "";

          if (iso !== hoveredCountryRef.current) {
            hoveredCountryRef.current = iso;
            syncCountryPaint(map, latestRef.current.lockedCountry, iso);
            if (iso && iso !== latestRef.current.lockedCountry) {
              const meta = latestRef.current.countryByCode.get(iso);
              latestRef.current.onHoverCountry({
                code: iso,
                nameKo: meta?.nameKo || props?.nameKo || iso,
                nameEn: meta?.nameEn || props?.nameEn || iso,
                shopCount: meta?.shopCount ?? Number(props?.shopCount || 0),
                platformCount: meta?.platformCount ?? Number(props?.platformCount || 0),
              });
            } else {
              latestRef.current.onHoverCountry(null);
            }
          }
        } else if (hoveredCountryRef.current !== null) {
          hoveredCountryRef.current = null;
          syncCountryPaint(map, latestRef.current.lockedCountry, null);
          latestRef.current.onHoverCountry(null);
        }
      });

      map.on("mouseleave", "atlas-countries-fill", () => {
        if (hoveredCountryRef.current !== null) {
          hoveredCountryRef.current = null;
          syncCountryPaint(map, latestRef.current.lockedCountry, null);
          latestRef.current.onHoverCountry(null);
        }
        map.getCanvas().style.cursor = "";
      });

      // Strict Smart Hit-Test (10px Tolerance Box + Zero-Reset Coordinate Nearest-City Snap):
      // 1) Festival Pin (#10B981) -> 2) Individual Shop Pin -> 3) Platform Capsule
      // -> 4) Sanctuary Stamp / City Badge -> 5) Locked Country Nearest-City Snap (NEVER jump to Seoul!)
      // -> 6) Other Country Switch
      map.on("click", (e: maplibregl.MapMouseEvent) => {
        if (draggedDistanceRef.current > 10) return;
        stopIdleSpin();
        selectionModeRef.current = "click";
        latestRef.current.onReticleStateChange("locked", false);

        const hitBox: [maplibregl.PointLike, maplibregl.PointLike] = [
          [e.point.x - 10, e.point.y - 10],
          [e.point.x + 10, e.point.y + 10],
        ];

        const queryBoxOne = (layers: string[]) => {
          const valid = layers.filter((id) => Boolean(map.getLayer(id)));
          if (valid.length === 0) return undefined;
          return map.queryRenderedFeatures(hitBox, { layers: valid })[0];
        };

        const queryPointOne = (layers: string[]) => {
          const valid = layers.filter((id) => Boolean(map.getLayer(id)));
          if (valid.length === 0) return undefined;
          return map.queryRenderedFeatures(e.point, { layers: valid })[0];
        };

        const z = map.getZoom();
        const curLocked = latestRef.current.lockedCountry;

        // 1) Festival / Market Green Pin (#10B981) — responds at EVERY zoom
        const evHit = queryBoxOne(["atlas-events-dot"]);
        if (evHit?.properties?.id) {
          const ev = latestRef.current.events.find((x) => x.id === evHit.properties.id);
          if (ev) {
            latestRef.current.onSelectEvent(ev);
            return;
          }
        }

        // 2) Street-level individual vintage shop pin
        const spotHit = queryBoxOne(["atlas-street-spots-circle"]);
        if (spotHit?.properties?.id && spotHit?.properties?.cc) {
          latestRef.current.onSelectSpot(
            String(spotHit.properties.id),
            String(spotHit.properties.cc),
          );
          return;
        }

        // 4) Core Vintage Sanctuary Stamp or City Badge/Dot
        const sancHit = queryBoxOne(["atlas-alley-stamps"]);
        if (sancHit?.properties?.id) {
          latestRef.current.onSelectAlley(String(sancHit.properties.id));
          return;
        }

        if (z >= 4.5) {
          const cityHit = queryBoxOne(["atlas-city-badges", "atlas-city-seeds-dot"]);
          if (cityHit?.properties?.slug) {
            const city = latestRef.current.cities.find((c) => c.slug === cityHit.properties.slug);
            if (city) {
              latestRef.current.onSelectCityBadge(city);
              return;
            }
          }
        }

        // 5) Country Label or Country Polygon (globe view < 6.2)
        const countryHit = queryPointOne(["atlas-countries-fill"]);
        const iso = (countryHit?.properties?.cc || countryHit?.properties?.ISO_A2) as
          | string
          | undefined;
        if (iso) {
          const upperIso = iso.toUpperCase();
          if (upperIso !== curLocked) {
            latestRef.current.onClickCountry(upperIso, false);
            return;
          }
          if (z < 4.5) {
            latestRef.current.onClickCountry(upperIso, false);
            return;
          }
          // Already viewing this country -> snap to nearest city to click coordinate (NEVER reset to Seoul!)
          const nearest = findNearestCityInCountry(
            upperIso,
            e.lngLat.lng,
            e.lngLat.lat,
            latestRef.current.cities,
          );
          latestRef.current.onSelectRegion(upperIso, nearest);
          return;
        }

        // 6) Regional zoom (>= 5.5) click on empty land inside locked country -> nearest city snap
        if (z >= 5.5 && z < 11.5) {
          const nearest = findNearestCityInCountry(
            curLocked,
            e.lngLat.lng,
            e.lngLat.lat,
            latestRef.current.cities,
          );
          if (nearest) {
            latestRef.current.onSelectRegion(curLocked, nearest);
          }
        }
      });

      for (const layerId of [
        "atlas-events-dot",
        "atlas-street-spots-circle",
        "atlas-alley-stamps",
        "atlas-city-badges",
        "atlas-city-seeds-dot",
      ]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      map.on("mouseenter", "atlas-street-spots-circle", (e: maplibregl.MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) latestRef.current.onHoverSpot(id);
      });
      map.on("mouseleave", "atlas-street-spots-circle", () => {
        latestRef.current.onHoverSpot(null);
      });

      setMapReady(true);
      if (playIntro) {
        // Non-blocking, interruptible: "snap" flights are stopped by the first pointer/wheel input.
        requestAnimationFrame(() => {
          if (!mapRef.current || interactionRef.current !== "idle") return;
          flightRef.current = "snap";
          map.easeTo({
            center: initialCenter,
            zoom: initialZoom,
            duration: 1250,
            easing: easeOutQuart,
            essential: true,
          });
        });
      }
      emitBounds();
      startIdleSpin();
    });

    let moveRaf: number | null = null;
    map.on("move", () => {
      if (moveRaf !== null) return;
      moveRaf = requestAnimationFrame(() => {
        moveRaf = null;
        if (!mapRef.current) return;
        const c = mapRef.current.getCenter();
        latestRef.current.onCenterChange([c.lng, c.lat]);
        latestRef.current.onZoomChange(mapRef.current.getZoom());
      });
    });

    map.on("moveend", onMoveEnd);

    const zoomBy = (delta: number) => {
      stopIdleSpin();
      const next = Math.min(18, Math.max(1.4, map.getZoom() + delta));
      const pitch = next >= 13.5 ? 24 : next < 11 ? 0 : map.getPitch();
      map.easeTo({ zoom: next, pitch, duration: 300, easing: easeOutCubic, essential: true });
    };
    const resetGlobe = () => {
      stopIdleSpin();
      selectionModeRef.current = "click";
      flightRef.current = "direct";
      map.flyTo({
        center: GLOBE_RESET_CENTER,
        zoom: computeInitialGlobeZoom(),
        pitch: 0,
        bearing: 0,
        padding: { left: 0, top: 0, right: 0, bottom: computeMobileSheetPadding() },
        duration: 1500,
        curve: 1.45,
        easing: easeOutQuart,
        essential: true,
      });
      map.once("moveend", () => startIdleSpinRef.current());
    };

    onMapApiReady?.({
      zoomIn: () => zoomBy(1.5),
      zoomOut: () => zoomBy(-1.5),
      resetGlobe,
      locateMe: () => {
        stopIdleSpin();
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            selectionModeRef.current = "click";
            flightRef.current = "direct";
            map.flyTo({
              center: [pos.coords.longitude, pos.coords.latitude],
              zoom: 13.8,
              pitch: 24,
              padding: {
                left: computeDrawerLeftPadding(latestRef.current.drawerOpen),
                top: 60,
                right: 60,
                bottom: 40,
              },
              duration: 1100,
              curve: 1.38,
              essential: true,
              easing: easeOutCubic,
            });
          },
          () => {},
          { enableHighAccuracy: false, timeout: 6000 },
        );
      },
    });

    return () => {
      stopIdleSpin();
      if (moveRaf !== null) cancelAnimationFrame(moveRaf);
      container.removeEventListener("mousemove", onHoverPause);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointermove", onPointerMoveWindow);
      window.removeEventListener("pointerup", onPointerUp);
      highlightMarkerRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Sync Locked Country Choropleth Highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    syncCountryPaint(map, lockedCountry, hoveredCountryRef.current);
  }, [mapReady, lockedCountry]);

  // 3. Sync Native WebGL GeoJSON Sources
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("atlas-city-seeds") as maplibregl.GeoJSONSource | undefined)?.setData(
      citySeedsGeoJson,
    );
  }, [mapReady, citySeedsGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("atlas-sanctuaries") as maplibregl.GeoJSONSource | undefined)?.setData(
      sanctuaryGeoJson,
    );
  }, [mapReady, sanctuaryGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("atlas-street-spots") as maplibregl.GeoJSONSource | undefined)?.setData(
      streetSpotsGeoJson,
    );
  }, [mapReady, streetSpotsGeoJson]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    (map.getSource("atlas-live-events") as maplibregl.GeoJSONSource | undefined)?.setData(
      eventsGeoJson,
    );
  }, [mapReady, eventsGeoJson]);

  // 4c. Selected pin: filter swap instead of rebuilding / re-uploading all 13k features
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("atlas-spot-selected")) return;
    map.setFilter("atlas-spot-selected", ["==", ["get", "id"], selectedSpotId ?? "__NONE__"]);
  }, [mapReady, selectedSpotId]);

  // 4a. List hover -> map pin resonance (filter swap only; no repaint loop)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const filter: maplibregl.FilterSpecification = ["==", ["get", "id"], hoveredSpotId ?? "__NONE__"];
    for (const id of ["atlas-hover-ring", "atlas-hover-dot", "atlas-event-hover"]) {
      if (map.getLayer(id)) map.setFilter(id, filter);
    }
  }, [mapReady, hoveredSpotId]);

  // 4b. Emerald sonar: CSS keyframe rings on DOM markers -> GPU-composited, zero map repaints
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    for (const m of sonarMarkersRef.current) m.remove();
    sonarMarkersRef.current = eventsGeoJson.features.map((f, i) => {
      const el = document.createElement("div");
      el.className = styles.eventSonar;
      el.style.setProperty("--sonar-delay", `${-((i * 0.37) % 2.6).toFixed(2)}s`);
      el.setAttribute("aria-hidden", "true");
      return new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(f.geometry.coordinates as [number, number])
        .addTo(map);
    });
    // Globe projection draws far-side DOM markers through the sphere; hide rings past the horizon.
    const rad = Math.PI / 180;
    const occlude = () => {
      const c = map.getCenter();
      const sinC = Math.sin(c.lat * rad);
      const cosC = Math.cos(c.lat * rad);
      for (const m of sonarMarkersRef.current) {
        const p = m.getLngLat();
        const cosD =
          sinC * Math.sin(p.lat * rad) + cosC * Math.cos(p.lat * rad) * Math.cos((p.lng - c.lng) * rad);
        m.getElement().style.visibility = cosD > 0.08 ? "" : "hidden";
      }
    };
    occlude();
    map.on("move", occlude);
    return () => {
      map.off("move", occlude);
      for (const m of sonarMarkersRef.current) m.remove();
      sonarMarkersRef.current = [];
    };
  }, [mapReady, eventsGeoJson]);

  // 4. Single Hover/Selected Spot Capsule Tooltip
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    highlightMarkerRef.current?.remove();
    highlightMarkerRef.current = null;

    const targetId = hoveredSpotId || selectedSpotId;
    if (!targetId) return;
    const pin = pinById.get(targetId);
    if (!pin) return;

    const el = document.createElement("button");
    el.type = "button";
    el.className = `${styles.spotCapsule} ${
      selectedSpotId === targetId ? styles.spotCapsuleSelected : ""
    }`;
    const label = pin[1].length > 24 ? `${pin[1].slice(0, 23)}…` : pin[1];
    el.textContent = label;
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      latestRef.current.onSelectSpot(pin[0], pin[2]);
    });

    highlightMarkerRef.current = new maplibregl.Marker({
      element: el,
      anchor: "bottom",
      offset: [0, -10],
    })
      .setLngLat([pin[6], pin[7]])
      .addTo(map);
  }, [mapReady, hoveredSpotId, selectedSpotId, pinById]);

  // 5. Cinematic Camera Commands with Architectural Pitch & Quartic Glide
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !cameraCommand) return;

    const isGlobeReset = cameraCommand.kind === "globe";
    if (!isGlobeReset) {
      idleSpinActiveRef.current = false;
      if (idleSpinRafRef.current !== null) {
        cancelAnimationFrame(idleSpinRafRef.current);
        idleSpinRafRef.current = null;
      }
    }

    selectionModeRef.current = "click";
    flightRef.current = "direct";
    const padLeft = isGlobeReset ? 0 : computeDrawerLeftPadding(latestRef.current.drawerOpen);
    const pad = { left: padLeft, top: 72, right: 72, bottom: 48 };
    const targetPitch = cameraCommand.zoom >= 13.5 ? 24 : 0;

    if (cameraCommand.bbox && cameraCommand.kind === "alley") {
      const [w, s, e, n] = cameraCommand.bbox;
      map.fitBounds(
        [
          [w, s],
          [e, n],
        ],
        { padding: pad, maxZoom: 15.0, pitch: 24, duration: 1100, essential: true, easing: easeOutCubic },
      );
      return;
    }

    const target: [number, number] = [cameraCommand.lng, cameraCommand.lat];
    map.flyTo({
      center: target,
      zoom: cameraCommand.zoom,
      pitch: isGlobeReset ? 0 : targetPitch,
      bearing: 0,
      padding: pad,
      duration: isGlobeReset
        ? 1500
        : flightDuration(map.getCenter(), target, map.getZoom(), cameraCommand.zoom),
      curve: isGlobeReset ? 1.45 : 1.38,
      easing: isGlobeReset ? easeOutQuart : easeOutCubic,
      essential: true,
    });
    if (isGlobeReset) map.once("moveend", () => startIdleSpinRef.current());
  }, [mapReady, cameraCommand]);

  return (
    <div className={styles.mapShell}>
      <div ref={containerRef} className={styles.canvas} />
      {mapError && (
        <div className={styles.errorState} role="status">
          <p className={styles.errorTitle}>3D Globe unavailable</p>
          <p className={styles.errorBody}>Browse all 137 countries and 13,054 spots from the drawer.</p>
        </div>
      )}
    </div>
  );
}
