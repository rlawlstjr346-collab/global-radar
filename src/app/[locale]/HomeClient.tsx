"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { PLATFORMS, type CountryCode } from "@/data/platforms";
import type {
  AtlasBootstrap,
  AtlasCity,
  AtlasEvent,
  AtlasLayerTab,
  AtlasShopDetail,
  AtlasShopShard,
  CompactPinTuple,
} from "@/lib/atlasTypes";
import {
  formatCityDisplay,
  formatCountryDisplay,
  formatPlatformDisplay,
  getAtlasCopy,
} from "@/lib/atlasCopy";
import { formatCityLocalClock, resolveAlleyDisplay } from "@/lib/alleyZones";
import {
  instantTranslateToEnglish,
  needsRemoteTranslation,
  resolveQueryForPlatform,
} from "@/lib/translateQuery";
import { trackPlatformClick } from "@/lib/analytics";
import {
  getLanguageDir,
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/lib/i18n/locales";
import {
  LANGUAGE_PREFERENCE_COOKIE,
  LANGUAGE_PREFERENCE_MAX_AGE_SECONDS,
} from "@/lib/i18n/cookies";
import SlidingTabs, { type SlidingTabItem } from "@/components/SlidingTabs";
import SpotDetailView, { type NearbyWalkSpot } from "@/components/SpotDetailView";
import { isMeaningfulNote } from "@/lib/formatHours";
import { isActiveEvent } from "@/lib/activeEvents";
import { safeExternalUrl } from "@/lib/safeUrl";
import CenterReticle, { type ReticleState } from "@/components/CenterReticle";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  BookmarkIcon,
  ChevronRightIcon,
  CloseIcon,
  GlobeResetIcon,
  LocateIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  ShuffleIcon,
} from "@/components/AtlasIcons";
import type { HoveredCountryInfo, MapCameraCommand } from "@/components/MapView";
import { createLiveValue, type LiveValue } from "@/lib/liveValue";
import styles from "./page.module.css";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className={styles.mapSkeleton} />,
});

const PLATFORM_RUNTIME_MAP = new Map(PLATFORMS.map((p) => [p.id, p]));
const SAVED_STORAGE_KEY = "wva_saved_spots_v1";

function haversineMeters(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatCoordTelemetry([lng, lat]: [number, number]): string {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(1)}°${latDir} ${Math.abs(lng).toFixed(1)}°${lngDir}`;
}

/** Live camera readout: the only subscriber of the per-frame center channel. */
function TelemetryCoordsText({ store, cc }: { store: LiveValue<[number, number]>; cc: string }) {
  const center = useSyncExternalStore(store.subscribe, store.get, store.get);
  return (
    <>
      {cc} · {formatCoordTelemetry(center)}
    </>
  );
}

/** Zoom state only feeds the 10 / 10.5 thresholds, so in-band moves need no re-render. */
const zoomBand = (z: number) => (z < 10 ? 0 : z < 10.5 ? 1 : 2);

interface ShopCardProps {
  shop: AtlasShopDetail;
  idx: number;
  isSaved: boolean;
  hoverStore: LiveValue<string | null>;
  savedLabel: string;
  walkMin: (min: number) => string;
  onSelect: (id: string, cc: string) => void;
  onToggleSave: (id: string) => void;
}

/** One list row. Memoised and hover-subscribed on its own id, so a hover re-renders <= 2 rows. */
const ShopCard = memo(function ShopCard({
  shop,
  idx,
  isSaved,
  hoverStore,
  savedLabel,
  walkMin,
  onSelect,
  onToggleSave,
}: ShopCardProps) {
  const isHovered = useSyncExternalStore(
    hoverStore.subscribe,
    () => hoverStore.get() === shop.id,
    () => false,
  );
  const locBadge = shop.alleyName || shop.gu || shop.cityKo;
  const stationPart = shop.near?.nameKo || shop.near?.name;
  const line2 = [
    shop.address || shop.cityKo,
    stationPart ? `${stationPart}${shop.near?.walkMin ? ` ${walkMin(shop.near.walkMin)}` : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.16,
        delay: Math.min(idx * 0.016, 0.08),
        ease: [0.23, 1, 0.32, 1],
      }}
      className={`${styles.spotCardCompact} ${isHovered ? styles.spotCardHovered : ""}`}
      data-testid="spot-card"
      onMouseEnter={() => hoverStore.set(shop.id)}
      onMouseLeave={() => hoverStore.set(null)}
      onClick={() => onSelect(shop.id, shop.country)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect(shop.id, shop.country);
      }}
    >
      <div className={styles.spotRowMain}>
        <span className={styles.spotNameCompact}>{shop.name}</span>
        <div className={styles.spotRowRight}>
          <span className={styles.locBadge}>{locBadge}</span>
          <button
            type="button"
            className={`${styles.bookmarkBtn} ${isSaved ? styles.bookmarkActive : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(shop.id);
            }}
            aria-label={savedLabel}
            aria-pressed={isSaved}
          >
            <BookmarkIcon size={15} filled={isSaved} />
          </button>
        </div>
      </div>
      <p className={styles.spotLine2}>{line2}</p>
    </motion.div>
  );
});

/** Picks an ideal visual zoom for clicking into a country based on geographic span. */
function countryClickZoom(cc: string): number {
  if (["US", "CA", "BR", "RU", "CN", "AU", "IN"].includes(cc)) return 4.6;
  if (["KR", "NL", "BE", "CH", "TW", "DK", "AT", "CZ", "PT", "IE", "IL"].includes(cc)) return 6.0;
  if (["SG", "HK", "MO", "LU", "MT"].includes(cc)) return 9.5;
  return 5.4;
}

export interface HomeClientProps {
  bootstrap: AtlasBootstrap;
  uiLanguage: LanguageCode;
  initialCountry?: string | null;
  initialCitySlug?: string | null;
}

/** Vertical mouse wheel scrolls a horizontal chip strip (no hidden, unreachable chips). */
function scrollChipsHorizontally(e: React.WheelEvent<HTMLDivElement>) {
  const el = e.currentTarget;
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && el.scrollWidth > el.clientWidth) {
    el.scrollLeft += e.deltaY;
  }
}

export default function HomeClient({
  bootstrap,
  uiLanguage,
  initialCountry = null,
  initialCitySlug = null,
}: HomeClientProps) {
  const router = useRouter();
  const copy = useMemo(() => getAtlasCopy(uiLanguage), [uiLanguage]);

  // Lookup maps
  const countryByCode = useMemo(
    () => new Map(bootstrap.countries.map((c) => [c.code, c])),
    [bootstrap.countries],
  );
  const cityBySlug = useMemo(
    () => new Map(bootstrap.cities.map((c) => [c.slug, c])),
    [bootstrap.cities],
  );
  const alleyById = useMemo(
    () => new Map(bootstrap.alleys.map((a) => [a.id, a])),
    [bootstrap.alleys],
  );
  const platformsByCountry = useMemo(() => {
    const map = new Map<string, typeof bootstrap.platforms>();
    for (const p of bootstrap.platforms) {
      const arr = map.get(p.country) || [];
      arr.push(p);
      map.set(p.country, arr);
    }
    return map;
  }, [bootstrap.platforms]);

  // Initial locked country & optional city (Country view by default; City view if city URL)
  const initialLock = useMemo(() => {
    if (initialCitySlug) {
      const exact = cityBySlug.get(initialCitySlug);
      if (exact) return { cc: exact.country, city: exact };
    }
    if (initialCountry) {
      return { cc: initialCountry.toUpperCase(), city: null };
    }
    const defaultCc = uiLanguage === "ja" ? "JP" : uiLanguage === "ko" ? "KR" : "JP";
    return { cc: defaultCc, city: null };
  }, [initialCitySlug, initialCountry, uiLanguage, cityBySlug]);

  const initialCenter = useMemo<[number, number]>(() => {
    if (initialLock.city) return initialLock.city.center;
    const c = countryByCode.get(initialLock.cc);
    return c ? c.center : [126.9782, 37.5554];
  }, [initialLock, countryByCode]);

  // Async 13,054 pins + lazy per-country shop shards
  const [pins, setPins] = useState<CompactPinTuple[]>([]);
  const shardCacheRef = useRef<Map<string, AtlasShopDetail[]>>(new Map());
  const [shardVersion, setShardVersion] = useState(0);
  const [loadingShardCc, setLoadingShardCc] = useState<string | null>(null);

  // Core Country -> City -> Neighborhood 3-Tier State
  const [lockedCountry, setLockedCountry] = useState<string>(initialLock.cc);
  const [activeCity, setActiveCity] = useState<AtlasCity | null>(initialLock.city);
  const [selectedAlleyId, setSelectedAlleyId] = useState<string | null>(null);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);
  // Hover / camera-center channels: high-frequency, read by leaves only (no page re-render).
  const [hoverStore] = useState(() => createLiveValue<string | null>(null));
  const [hoveredCountry, setHoveredCountry] = useState<HoveredCountryInfo | null>(null);

  // Collapsible Single Unified Left Drawer (Apple Maps Web × Arc)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(true);
  const [dockFilter, setDockFilter] = useState<AtlasLayerTab>("shops");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showGlobalEvents, setShowGlobalEvents] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(40);
  // Progressive list mount: the "load more" row also auto-mounts the next 40 when it scrolls in.
  const loadMoreObserverRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((el: HTMLButtonElement | null) => {
    loadMoreObserverRef.current?.disconnect();
    loadMoreObserverRef.current = null;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) setVisibleCount((c) => c + 40);
      },
      { root: el.closest(`.${styles.drawerScroll}`), rootMargin: "0px 0px 240px 0px" },
    );
    io.observe(el);
    loadMoreObserverRef.current = io;
  }, []);

  // Map telemetry & subtle reticle + live viewport sync
  const [centerStore] = useState(() => createLiveValue<[number, number]>(initialCenter));
  const [zoom, setZoom] = useState<number>(initialCitySlug ? 12.6 : 2.55);
  const handleZoomChange = useCallback(
    (z: number) => setZoom((prev) => (zoomBand(prev) === zoomBand(z) ? prev : z)),
    [],
  );
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null);
  const [filterByViewport, setFilterByViewport] = useState<boolean>(false);
  const [sortMode, setSortMode] = useState<"curated" | "nearest" | "name">("curated");
  const [introCaption, setIntroCaption] = useState(false);

  // Orbital intro caption: decided pre-paint by the root layout gate, gone after 2.2s.
  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-intro")) return;
    const show = window.setTimeout(() => setIntroCaption(true), 0);
    const hide = window.setTimeout(() => setIntroCaption(false), 2200);
    // Entrance animations are one-shot: a re-opened drawer must not replay them.
    const done = window.setTimeout(() => document.documentElement.removeAttribute("data-intro"), 1600);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, []);
  const [reticleState, setReticleState] = useState<ReticleState>("locked");
  const [reticleVisible, setReticleVisible] = useState<boolean>(false);
  const [clockTick, setClockTick] = useState<number>(() => Date.now());

  // Always-visible 1-line auto-translate item launcher
  const [itemQuery, setItemQuery] = useState("");
  const [remoteTranslated, setRemoteTranslated] = useState<string | null>(null);
  const [useOriginalItem, setUseOriginalItem] = useState(false);

  // Top-center unified search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Saved bookmarks
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Map imperative API
  const mapApiRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    resetGlobe: () => void;
    locateMe: () => void;
  } | null>(null);

  const [cameraCommand, setCameraCommand] = useState<MapCameraCommand | null>(() => {
    if (initialCitySlug && initialLock.city) {
      return {
        lng: initialLock.city.center[0],
        lat: initialLock.city.center[1],
        zoom: 12.6,
        kind: "city",
        seq: 1,
      };
    }
    if (initialCountry) {
      return {
        lng: initialCenter[0],
        lat: initialCenter[1],
        zoom: countryClickZoom(initialLock.cc),
        kind: "country",
        seq: 1,
      };
    }
    return null;
  });

  // Sync <html lang> & dir
  useEffect(() => {
    document.documentElement.lang = uiLanguage;
    document.documentElement.dir = getLanguageDir(uiLanguage);
  }, [uiLanguage]);

  // Live clock tick
  useEffect(() => {
    const id = window.setInterval(() => setClockTick(Date.now()), 30000);
    return () => window.clearInterval(id);
  }, []);

  // Load saved spots
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SAVED_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedIds(parsed.filter((v): v is string => typeof v === "string"));
        }
      }
    } catch {}
  }, []);

  // Fetch all 13,054 compact pins
  useEffect(() => {
    let active = true;
    fetch("/data/pins-compact.json")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: CompactPinTuple[]) => {
        if (active && Array.isArray(data)) setPins(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Lazy-load locked country shard (skip online-only 0-shop countries so 0 console 404s ever fire!)
  const ensureCountryShard = useCallback(
    async (cc: string) => {
      const upper = cc.toUpperCase();
      if (shardCacheRef.current.has(upper)) return;
      const countryMeta = countryByCode.get(upper);
      if (countryMeta && countryMeta.shopCount === 0) {
        shardCacheRef.current.set(upper, []);
        return;
      }
      setLoadingShardCc(upper);
      try {
        const res = await fetch(`/data/shops/${upper.toLowerCase()}.json`);
        if (res.ok) {
          const data = (await res.json()) as AtlasShopShard;
          shardCacheRef.current.set(upper, data.shops || []);
          setShardVersion((v) => v + 1);
        } else {
          shardCacheRef.current.set(upper, []);
        }
      } catch {} finally {
        setLoadingShardCc((cur) => (cur === upper ? null : cur));
      }
    },
    [countryByCode],
  );

  useEffect(() => {
    void ensureCountryShard(lockedCountry);
  }, [lockedCountry, ensureCountryShard]);

  // Auto-translate item search
  const trimmedItem = itemQuery.trim();
  const instantItem = useMemo(
    () => instantTranslateToEnglish(trimmedItem, uiLanguage),
    [trimmedItem, uiLanguage],
  );

  useEffect(() => {
    setRemoteTranslated(null);
    if (!trimmedItem || !needsRemoteTranslation(trimmedItem, uiLanguage)) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/translate?q=${encodeURIComponent(trimmedItem)}&sl=${encodeURIComponent(uiLanguage)}`,
          { signal: controller.signal },
        );
        if (!res.ok) return;
        const data = (await res.json()) as { translated?: string };
        if (data.translated?.trim()) setRemoteTranslated(data.translated.trim());
      } catch {}
    }, 240);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedItem, uiLanguage]);

  const effectiveTranslatedItem = remoteTranslated || instantItem.translated;
  const showItemPreview =
    Boolean(trimmedItem) &&
    effectiveTranslatedItem.toLowerCase() !== trimmedItem.toLowerCase();

  // Keyboard shortcuts: Cmd/Ctrl+K or `/` focuses search, `[` toggles left drawer collapse!
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const inInput =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA";

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "/" && !inInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "[" && !inInput) {
        e.preventDefault();
        setDrawerOpen((v) => !v);
      } else if (e.key === "Escape") {
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const toggleSaveSpot = useCallback((id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [id, ...prev];
      try {
        window.localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const flyTo = useCallback((cmd: Omit<MapCameraCommand, "seq">) => {
    setCameraCommand((prev) => ({ ...cmd, seq: (prev?.seq ?? 0) + 1 }));
  }, []);

  // 1-Click Country Selection on Globe/Map (NEVER resets locked country to Seoul!)
  const handleClickCountry = useCallback(
    (cc: string, alreadyLocked: boolean) => {
      const upper = cc.toUpperCase();
      const country = countryByCode.get(upper);
      const topCity = bootstrap.cities.find((c) => c.country === upper) || null;
      setShowSavedOnly(false);
      setSelectedSpotId(null);
      setSelectedEventId(null);
      setSelectedAlleyId(null);
      setSearchFocused(false);
      setDrawerOpen(true);
      void ensureCountryShard(upper);

      // Never jump to Seoul when clicking an already-locked country
      if (alreadyLocked) return;

      setLockedCountry(upper);
      setActiveCity(null);
      setShowGlobalEvents(false);
      setVisibleCount(40);
      const targetCenter = country?.center || topCity?.center;
      if (targetCenter) {
        flyTo({
          lng: targetCenter[0],
          lat: targetCenter[1],
          zoom: countryClickZoom(upper),
          kind: "country",
        });
      }
    },
    [countryByCode, bootstrap.cities, ensureCountryShard, flyTo],
  );

  // Click Cobalt Blue Platform Capsule -> Focus country & open platforms drawer
  const handleClickPlatformCapsule = useCallback(
    (cc: string) => {
      const upper = cc.toUpperCase();
      const country = countryByCode.get(upper);
      setShowSavedOnly(false);
      setSelectedSpotId(null);
      setSelectedEventId(null);
      setSearchFocused(false);
      setDrawerOpen(true);
      void ensureCountryShard(upper);
      if (upper !== lockedCountry) {
        setLockedCountry(upper);
        setActiveCity(null);
        setSelectedAlleyId(null);
        setShowGlobalEvents(false);
        setVisibleCount(40);
        if (country?.center) {
          flyTo({
            lng: country.center[0],
            lat: country.center[1],
            zoom: countryClickZoom(upper),
            kind: "country",
          });
        }
      }
    },
    [countryByCode, lockedCountry, ensureCountryShard, flyTo],
  );

  // Click Admin-1 / Admin-2 Region Polygon (e.g. Gwangju/Jeonnam -> kr/gwangju, NEVER Seoul!)
  const handleSelectRegion = useCallback(
    (cc: string, city: AtlasCity | null) => {
      const upper = cc.toUpperCase();
      setShowSavedOnly(false);
      setSelectedSpotId(null);
      setSelectedEventId(null);
      setSelectedAlleyId(null);
      setSearchFocused(false);
      setLockedCountry(upper);
      setActiveCity(city);
      setDrawerOpen(true);
      setVisibleCount(40);
      void ensureCountryShard(upper);

      if (city) {
        flyTo({
          lng: city.center[0],
          lat: city.center[1],
          zoom: 11.4,
          kind: "city",
        });
      } else {
        const country = countryByCode.get(upper);
        if (country?.center) {
          flyTo({
            lng: country.center[0],
            lat: country.center[1],
            zoom: countryClickZoom(upper),
            kind: "country",
          });
        }
      }
    },
    [countryByCode, ensureCountryShard, flyTo],
  );

  // Subtle passive lock only when user manually drags globe
  const handleReticleLockCountry = useCallback(
    (cc: string) => {
      const upper = cc.toUpperCase();
      setLockedCountry(upper);
      setActiveCity(null);
      setSelectedAlleyId(null);
      setVisibleCount(40);
      void ensureCountryShard(upper);
    },
    [ensureCountryShard],
  );

  // Click City Badge or City Pill -> Dive directly into City (`zoom: 12.2`)
  const handleSelectCity = useCallback(
    (city: AtlasCity) => {
      setShowSavedOnly(false);
      setSelectedSpotId(null);
      setSelectedAlleyId(null);
      setLockedCountry(city.country);
      setActiveCity(city);
      setDockFilter("shops");
      setDrawerOpen(true);
      setVisibleCount(40);
      setSearchFocused(false);
      void ensureCountryShard(city.country);
      flyTo({
        lng: city.center[0],
        lat: city.center[1],
        zoom: 12.2,
        kind: "city",
      });
    },
    [ensureCountryShard, flyTo],
  );

  // Return from City view back up to Country overview
  const handleBackToCountry = useCallback(() => {
    setActiveCity(null);
    setSelectedAlleyId(null);
    setSelectedSpotId(null);
    const country = countryByCode.get(lockedCountry);
    if (country) {
      flyTo({
        lng: country.center[0],
        lat: country.center[1],
        zoom: countryClickZoom(lockedCountry),
        kind: "country",
      });
    }
  }, [countryByCode, lockedCountry, flyTo]);

  // Click Alley Zone or Alley Pill -> Dive to Alley (`zoom: 14.5`) + Filter list
  const handleSelectAlleyById = useCallback(
    (alleyId: string) => {
      const alley = alleyById.get(alleyId);
      if (!alley) return;
      const city = cityBySlug.get(alley.citySlug) || null;
      setShowSavedOnly(false);
      setLockedCountry(alley.country);
      setActiveCity(city);
      setSelectedAlleyId(alley.id);
      setSelectedSpotId(null);
      setDockFilter("shops");
      setDrawerOpen(true);
      setVisibleCount(40);
      void ensureCountryShard(alley.country);
      flyTo({
        lng: alley.center[0],
        lat: alley.center[1],
        zoom: 14.5,
        bbox: alley.bbox,
        kind: "alley",
      });
    },
    [alleyById, cityBySlug, ensureCountryShard, flyTo],
  );

  const handleSelectSpot = useCallback(
    (spotId: string, cc: string) => {
      const upper = cc.toUpperCase();
      setShowSavedOnly(false);
      setLockedCountry(upper);
      setSelectedSpotId(spotId);
      setDrawerOpen(true);
      setSearchFocused(false);
      void ensureCountryShard(upper);
      const pin = pins.find((p) => p[0] === spotId);
      if (pin) {
        const city = cityBySlug.get(pin[3]) || null;
        if (city) setActiveCity(city);
        flyTo({ lng: pin[6], lat: pin[7], zoom: 16.0, kind: "spot" });
      }
    },
    [cityBySlug, ensureCountryShard, flyTo, pins],
  );

  const handleSelectEvent = useCallback(
    (ev: AtlasEvent) => {
      setShowSavedOnly(false);
      setSelectedSpotId(null);
      setSelectedEventId(ev.id);
      setLockedCountry(ev.country);
      const city = cityBySlug.get(ev.citySlug) || null;
      setActiveCity(city);
      setDockFilter("markets");
      setShowGlobalEvents(false);
      setDrawerOpen(true);
      if (ev.center) {
        flyTo({ lng: ev.center[0], lat: ev.center[1], zoom: 13.4, kind: "city" });
      }
    },
    [cityBySlug, flyTo],
  );

  const handleRandomCapital = useCallback(() => {
    const pool = bootstrap.featuredCities.filter((c) => c.country !== lockedCountry);
    const next = pool[Math.floor(Math.random() * pool.length)] || bootstrap.featuredCities[0];
    if (!next) return;
    handleSelectCity(next);
  }, [bootstrap.featuredCities, lockedCountry, handleSelectCity]);

  const handleResetGlobe = useCallback(() => {
    setActiveCity(null);
    setSelectedAlleyId(null);
    setSelectedSpotId(null);
    setShowSavedOnly(false);
    setSelectedEventId(null);
    // Imperative single camera controller: no state round-trip that could re-issue a camera move mid-flight
    mapApiRef.current?.resetGlobe();
  }, []);

  const handleLocaleSwitch = (nextLocale: LanguageCode) => {
    document.cookie = `${LANGUAGE_PREFERENCE_COOKIE}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=${LANGUAGE_PREFERENCE_MAX_AGE_SECONDS}; SameSite=Lax`;
    const suffix = activeCity
      ? `/explore/${activeCity.slug}`
      : `/explore/${lockedCountry.toLowerCase()}`;
    router.push(`/${nextLocale}${suffix}`);
  };

  // Derived data for Locked Country / Active City
  const lockedCountryObj = countryByCode.get(lockedCountry) ?? null;
  const lockedPlatforms = useMemo(
    () => platformsByCountry.get(lockedCountry) || [],
    [platformsByCountry, lockedCountry],
  );
  const countryCities = useMemo(
    () => bootstrap.cities.filter((c) => c.country === lockedCountry).slice(0, 14),
    [bootstrap.cities, lockedCountry],
  );
  const activeCityAlleys = useMemo(() => {
    if (!activeCity) return [];
    return activeCity.topAlleys.map((a) => ({
      ...a,
      display: resolveAlleyDisplay({ id: a.id, name: a.name, gu: a.gu, dong: a.dong }),
    }));
  }, [activeCity]);

  // Runtime guard (second layer after the sync script): recurring markets, or one-offs until their last day.
  const activeEvents = useMemo(() => bootstrap.events.filter((ev) => isActiveEvent(ev)), [bootstrap.events]);

  const cityEvents = useMemo(
    () => (activeCity ? activeEvents.filter((ev) => ev.citySlug === activeCity.slug) : []),
    [activeEvents, activeCity],
  );

  const countryEvents = useMemo(
    () => activeEvents.filter((ev) => ev.country === lockedCountry),
    [activeEvents, lockedCountry],
  );

  const selectedEvent = useMemo(
    () => (selectedEventId ? activeEvents.find((ev) => ev.id === selectedEventId) || null : null),
    [activeEvents, selectedEventId],
  );

  const eventsFallbackMode = useMemo<"city" | "country-fallback" | "global-fallback" | "country" | "global">(() => {
    if (showGlobalEvents) return "global";
    if (activeCity) {
      if (cityEvents.length > 0) return "city";
      if (countryEvents.length > 0) return "country-fallback";
      return "global-fallback";
    }
    if (countryEvents.length > 0) return "country";
    return "global-fallback";
  }, [showGlobalEvents, activeCity, cityEvents.length, countryEvents.length]);

  const displayedEvents = useMemo(() => {
    if (eventsFallbackMode === "city") return cityEvents;
    if (eventsFallbackMode === "country" || eventsFallbackMode === "country-fallback") {
      return countryEvents;
    }
    return activeEvents;
  }, [eventsFallbackMode, cityEvents, countryEvents, activeEvents]);

  const localClockText = useMemo(
    () =>
      formatCityLocalClock(
        activeCity?.slug || null,
        lockedCountry,
        activeCity?.center[0] ?? lockedCountryObj?.center[0] ?? centerStore.get()[0],
        new Date(clockTick),
      ),
    [activeCity, lockedCountry, lockedCountryObj, centerStore, clockTick],
  );

  // One-pass country index over the 13k pins (country switches never re-scan the full list)
  const pinsByCountry = useMemo(() => {
    const m = new Map<string, CompactPinTuple[]>();
    for (const p of pins) {
      const bucket = m.get(p[2]);
      if (bucket) bucket.push(p);
      else m.set(p[2], [p]);
    }
    return m;
  }, [pins]);

  // Shops filtered cleanly by Country -> City -> Alley
  const activeShops = useMemo<AtlasShopDetail[]>(() => {
    void shardVersion;
    const shard = shardCacheRef.current.get(lockedCountry);
    let list: AtlasShopDetail[];

    if (shard) {
      list = shard;
    } else {
      list = (pinsByCountry.get(lockedCountry) ?? []).map((p) => ({
        id: p[0],
        name: p[1],
        country: p[2],
        citySlug: p[3],
        cityKo: p[4],
        cityEn: p[5],
        lng: p[6],
        lat: p[7],
        kind: p[8],
        alley: p[9] || undefined,
        alleyName: p[9] ? alleyById.get(p[9])?.name : undefined,
        featured: p[10] === 1,
      }));
    }

    return list.filter((s) => {
      if (selectedAlleyId && s.alley !== selectedAlleyId) return false;
      if (!selectedAlleyId && activeCity && s.citySlug !== activeCity.slug) return false;
      return true;
    });
  }, [shardVersion, lockedCountry, pinsByCountry, alleyById, selectedAlleyId, activeCity]);

  // Auto-disable viewport filter when zooming back out below street level (< 10.5)
  useEffect(() => {
    if (zoom < 10 && filterByViewport) {
      setFilterByViewport(false);
    }
  }, [zoom, filterByViewport]);

  // Live Map Viewport Sync (zoom >= 11): count & optionally filter shops visible inside current map bounds
  const viewportShops = useMemo<AtlasShopDetail[]>(() => {
    if (zoom < 10 || !mapBounds) return activeShops;
    const [w, s, e, n] = mapBounds;
    return activeShops.filter(
      (shop) => shop.lng >= w && shop.lng <= e && shop.lat >= s && shop.lat <= n,
    );
  }, [activeShops, zoom, mapBounds]);

  const filteredShops = filterByViewport && zoom >= 10 ? viewportShops : activeShops;

  // Smart digging order: curated alley members with rich data first, then the bigger
  // vintage city; "near map center" uses the settled viewport (updated on moveend only).
  const renderedShops = useMemo<AtlasShopDetail[]>(() => {
    const list = [...filteredShops];
    if (sortMode === "name") {
      return list.sort((a, b) => a.name.localeCompare(b.name, uiLanguage));
    }
    if (sortMode === "nearest" && mapBounds) {
      const cx = (mapBounds[0] + mapBounds[2]) / 2;
      const cy = (mapBounds[1] + mapBounds[3]) / 2;
      const k = Math.cos((cy * Math.PI) / 180);
      const d = (s: AtlasShopDetail) => ((s.lng - cx) * k) ** 2 + (s.lat - cy) ** 2;
      return list.sort((a, b) => d(a) - d(b));
    }
    const richness = (s: AtlasShopDetail) =>
      Number(Boolean(s.address)) +
      Number(Boolean(s.near)) +
      Number(Boolean(s.hours)) +
      Number(isMeaningfulNote(s.note)) +
      Math.min(s.sources?.length ?? 0, 3) +
      Math.min(s.curation?.length ?? 0, 2) +
      Number(Boolean(s.channels?.instagram || s.channels?.website));
    const tier = (s: AtlasShopDetail) => (s.alley ? 2 : 0) + (s.featured ? 1 : 0);
    const cityWeight = (s: AtlasShopDetail) => cityBySlug.get(s.citySlug)?.shopCount ?? 0;
    const alleyWeight = (s: AtlasShopDetail) => (s.alley ? alleyById.get(s.alley)?.count ?? 0 : 0);
    return list.sort(
      (a, b) =>
        tier(b) - tier(a) ||
        richness(b) - richness(a) ||
        cityWeight(b) - cityWeight(a) ||
        alleyWeight(b) - alleyWeight(a) ||
        a.name.localeCompare(b.name, uiLanguage),
    );
  }, [filteredShops, sortMode, mapBounds, uiLanguage, cityBySlug, alleyById]);

  const activeSpotDetail = useMemo<AtlasShopDetail | null>(() => {
    void shardVersion;
    if (!selectedSpotId) return null;
    const shard = shardCacheRef.current.get(lockedCountry);
    const hit = shard?.find((s) => s.id === selectedSpotId);
    const resolveCleanAlleyName = (alleyId?: string, fallback?: string) => {
      if (!alleyId) return fallback;
      const alleyObj = alleyById.get(alleyId);
      if (!alleyObj) return fallback;
      const disp = resolveAlleyDisplay(alleyObj);
      return uiLanguage === "ko" ? disp.labelKo : disp.stamp;
    };
    if (hit) {
      return {
        ...hit,
        alleyName: resolveCleanAlleyName(hit.alley, hit.alleyName),
      };
    }
    const pin = pins.find((p) => p[0] === selectedSpotId);
    if (!pin) return null;
    return {
      id: pin[0],
      name: pin[1],
      country: pin[2],
      citySlug: pin[3],
      cityKo: pin[4],
      cityEn: pin[5],
      lng: pin[6],
      lat: pin[7],
      kind: pin[8],
      alley: pin[9] || undefined,
      alleyName: resolveCleanAlleyName(pin[9], undefined),
      featured: pin[10] === 1,
    };
  }, [shardVersion, selectedSpotId, lockedCountry, pins, alleyById, uiLanguage]);

  // Auto-computed 800m walkable digging course (4 nearest vintage shops from selected spot)
  const nearbyWalkSpots = useMemo<NearbyWalkSpot[]>(() => {
    if (!activeSpotDetail) return [];
    const candidates: NearbyWalkSpot[] = [];
    for (const p of pins) {
      if (p[2] !== activeSpotDetail.country || p[0] === activeSpotDetail.id) continue;
      // Quick bounding pre-filter (~0.015 deg ~ 1.5km)
      if (
        Math.abs(p[6] - activeSpotDetail.lng) > 0.02 ||
        Math.abs(p[7] - activeSpotDetail.lat) > 0.02
      ) {
        continue;
      }
      const d = haversineMeters(activeSpotDetail.lng, activeSpotDetail.lat, p[6], p[7]);
      if (d <= 800) {
        candidates.push({
          id: p[0],
          name: p[1],
          cc: p[2],
          distanceM: Math.round(d),
          walkMin: Math.max(1, Math.round(d / 75)),
        });
      }
    }
    candidates.sort((a, b) => a.distanceM - b.distanceM);
    return candidates.slice(0, 4);
  }, [activeSpotDetail, pins]);

  const savedPins = useMemo(() => {
    if (!showSavedOnly || savedIds.length === 0) return [];
    const pinMap = new Map(pins.map((p) => [p[0], p]));
    return savedIds
      .map((id) => pinMap.get(id))
      .filter((p): p is CompactPinTuple => Boolean(p));
  }, [showSavedOnly, savedIds, pins]);

  const savedEvents = useMemo(() => {
    if (!showSavedOnly || savedIds.length === 0) return [];
    const evMap = new Map(bootstrap.events.map((ev) => [ev.id, ev]));
    return savedIds.map((id) => evMap.get(id)).filter((ev): ev is AtlasEvent => Boolean(ev));
  }, [showSavedOnly, savedIds, bootstrap.events]);

  // Unified Map-Jump Search Autocomplete (Countries + Cities + Alleys + Shops + Platforms)
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const searchResults = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    if (!q) return null;

    const countries = bootstrap.countries
      .filter(
        (c) =>
          c.nameKo.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.code.toLowerCase() === q,
      )
      .slice(0, 4);

    const cities = bootstrap.cities
      .filter(
        (c) =>
          c.nameKo.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          c.country.toLowerCase() === q,
      )
      .slice(0, 5);

    const alleys = bootstrap.alleys
      .filter((a) => {
        const disp = resolveAlleyDisplay(a);
        return (
          a.name.toLowerCase().includes(q) ||
          disp.stamp.toLowerCase().includes(q) ||
          disp.labelKo.toLowerCase().includes(q)
        );
      })
      .slice(0, 5);

    const platforms = bootstrap.platforms
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          formatPlatformDisplay(p, uiLanguage).toLowerCase().includes(q) ||
          (p.nativeName && p.nativeName.toLowerCase().includes(q)),
      )
      .slice(0, 4);

    const shops: CompactPinTuple[] = [];
    if (q.length >= 2) {
      for (const p of pins) {
        if (p[1].toLowerCase().includes(q)) {
          shops.push(p);
          if (shops.length >= 5) break;
        }
      }
    }

    return { countries, cities, alleys, platforms, shops };
  }, [deferredSearchQuery, bootstrap.countries, bootstrap.cities, bootstrap.alleys, bootstrap.platforms, pins, uiLanguage]);

  // Exactly 2 core tabs: Vintage Shops (Black) | Festival & Markets (Emerald Green #10B981)
  const filterTabs = useMemo<SlidingTabItem[]>(
    () => [
      {
        id: "shops",
        label: uiLanguage === "ko" ? "빈티지샵" : uiLanguage === "ja" ? "古着屋" : "Shops",
        count: activeCity
          ? activeCity.shopCount
          : lockedCountryObj?.shopCount ?? activeShops.length,
      },
      {
        id: "markets",
        label: uiLanguage === "ko" ? "축제·마켓" : uiLanguage === "ja" ? "イベント" : "Festivals",
        count:
          activeCity && cityEvents.length > 0
            ? cityEvents.length
            : countryEvents.length || activeEvents.length,
        mintDot: true,
      },
    ],
    [
      uiLanguage,
      activeCity,
      lockedCountryObj,
      activeShops.length,
      cityEvents.length,
      countryEvents.length,
      activeEvents.length,
    ],
  );

  const countryPrimaryName = lockedCountryObj
    ? formatCountryDisplay(lockedCountryObj, uiLanguage)
    : lockedCountry;
  const activeCityDisp = activeCity ? formatCityDisplay(activeCity, uiLanguage) : null;

  return (
    <div
      className={styles.viewport}
      onClick={() => {
        if (searchFocused) setSearchFocused(false);
      }}
    >
      {/* Fullscreen 100vw × 100dvh 3D Monochrome Globe */}
      <MapView
        uiLanguage={uiLanguage}
        countries={bootstrap.countries}
        cities={bootstrap.cities}
        alleys={bootstrap.alleys}
        pins={pins}
        platforms={bootstrap.platforms}
        events={activeEvents}
        initialCenter={initialCenter}
        lockedCountry={lockedCountry}
        lockedCitySlug={activeCity?.slug || null}
        selectedAlleyId={selectedAlleyId}
        selectedSpotId={selectedSpotId}
        hoverStore={hoverStore}
        drawerOpen={drawerOpen}
        cameraCommand={cameraCommand}
        onClickCountry={handleClickCountry}
        onClickPlatformCapsule={handleClickPlatformCapsule}
        onSelectRegion={handleSelectRegion}
        onReticleLockCountry={handleReticleLockCountry}
        onHoverCountry={setHoveredCountry}
        onSelectCityBadge={handleSelectCity}
        onSelectAlley={handleSelectAlleyById}
        onSelectSpot={handleSelectSpot}
        onSelectEvent={handleSelectEvent}
        onHoverSpot={hoverStore.set}
        onZoomChange={handleZoomChange}
        onCenterChange={centerStore.set}
        onBoundsChange={setMapBounds}
        onReticleStateChange={(st, vis) => {
          setReticleState(st);
          setReticleVisible(vis);
        }}
        onMapApiReady={(api) => {
          mapApiRef.current = api;
        }}
      />

      <AnimatePresence>
        {introCaption && (
          <motion.div
            key="intro-caption"
            className={styles.introCaption}
            data-testid="intro-caption"
            aria-hidden="true"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            style={{ x: "-50%" }}
          >
            {`ATLAS. — ${bootstrap.meta.countries} COUNTRIES · ${bootstrap.meta.shops.toLocaleString("en-US")} ARCHIVE SPOTS`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subtle Unobtrusive Center Cue (only active while dragging globe) */}
      <CenterReticle state={reticleState} zoom={zoom} visible={reticleVisible} />

      {/* Floating Country Hover Preview Pill (below top search bar) */}
      <AnimatePresence>
        {hoveredCountry && hoveredCountry.code !== lockedCountry && (
          <motion.div
            key={hoveredCountry.code}
            className={styles.hoverPreviewPill}
            data-testid="country-hover-preview"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.14 }}
          >
            <span className={styles.hoverCc}>{hoveredCountry.code}</span>
            <span className={styles.hoverName}>
              {uiLanguage === "ko" ? hoveredCountry.nameKo : hoveredCountry.nameEn}
            </span>
            <span className={styles.dot}>·</span>
            <span className="tabular-nums">
              {uiLanguage === "ko" ? "빈티지샵" : "Shops"}{" "}
              {hoveredCountry.shopCount.toLocaleString()}
            </span>
            <span className={styles.dot}>·</span>
            <span className="tabular-nums">
              {uiLanguage === "ko" ? "플랫폼" : "Apps"} {hoveredCountry.platformCount}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD 1: Top-Left ATLAS. + Live Coordinates Telemetry + Center Search Capsule + Locale */}
      <header className={styles.topHud}>
        <button
          type="button"
          className={styles.brandTelemetry}
          data-testid="brand-telemetry"
          onClick={handleResetGlobe}
          aria-label="ATLAS Home and Global Reset"
        >
          <span className={styles.brandWordmark}>ATLAS.</span>
          <span className={styles.brandHairline} aria-hidden="true" />
          <span className={`${styles.telemetryCoords} tabular-nums`} data-testid="telemetry-coords">
            <TelemetryCoordsText store={centerStore} cc={lockedCountry} />
          </span>
        </button>

        <div className={styles.searchPillWrap} onClick={(e) => e.stopPropagation()}>
          <div className={styles.searchPill}>
            <span className={styles.mapSearchBadge} data-testid="map-search-badge">
              {uiLanguage === "ko" ? "지도 이동" : uiLanguage === "ja" ? "地図移動" : "MAP JUMP"}
            </span>
            <SearchIcon size={17} strokeWidth={1.9} className={styles.searchIcon} />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder={copy.searchPlaceholder}
              className={styles.searchInput}
              aria-label={copy.searchPlaceholder}
            />
            {searchQuery ? (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <CloseIcon size={13} />
              </button>
            ) : (
              <kbd className={styles.kbd}>⌘K</kbd>
            )}
          </div>

          {searchFocused && searchResults && (
            <div className={styles.searchDropdown} role="listbox">
              {searchResults.countries.length === 0 &&
              searchResults.cities.length === 0 &&
              searchResults.alleys.length === 0 &&
              searchResults.platforms.length === 0 &&
              searchResults.shops.length === 0 ? (
                <div className={styles.searchEmpty}>{copy.noResults}</div>
              ) : (
                <>
                  {searchResults.countries.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchGroupLabel}>COUNTRIES</div>
                      {searchResults.countries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          className={styles.searchRow}
                          onClick={() => {
                            handleClickCountry(c.code, false);
                            setSearchQuery("");
                          }}
                        >
                          <span className={styles.ccTag}>{c.code}</span>
                          <span className={styles.searchRowTitle}>
                            {formatCountryDisplay(c, uiLanguage)}
                          </span>
                          <span className={`${styles.searchRowMeta} tabular-nums`}>
                            {c.shopCount.toLocaleString()} {copy.shopsUnit}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.cities.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchGroupLabel}>CITIES</div>
                      {searchResults.cities.map((city) => {
                        const disp = formatCityDisplay(city, uiLanguage);
                        return (
                          <button
                            key={city.slug}
                            type="button"
                            className={styles.searchRow}
                            onClick={() => {
                              handleSelectCity(city);
                              setSearchQuery("");
                            }}
                          >
                            <span className={styles.ccTag}>{city.country}</span>
                            <span className={styles.searchRowTitle}>
                              {disp.primary}
                              {disp.secondary ? ` ${disp.secondary}` : ""}
                            </span>
                            <span className={`${styles.searchRowMeta} tabular-nums`}>
                              {city.shopCount.toLocaleString()} {copy.shopsUnit}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {searchResults.alleys.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchGroupLabel}>ALLEYS</div>
                      {searchResults.alleys.map((alley) => {
                        const disp = resolveAlleyDisplay(alley);
                        return (
                          <button
                            key={alley.id}
                            type="button"
                            className={styles.searchRow}
                            onClick={() => {
                              handleSelectAlleyById(alley.id);
                              setSearchQuery("");
                            }}
                          >
                            <span className={styles.ccTag}>{alley.country}</span>
                            <span className={styles.searchRowTitle}>
                              {disp.labelKo} · {disp.stamp}
                            </span>
                            <span className={`${styles.searchRowMeta} tabular-nums`}>
                              {alley.count} {copy.shopsUnit}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {searchResults.shops.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchGroupLabel}>SHOPS</div>
                      {searchResults.shops.map((pin) => (
                        <button
                          key={pin[0]}
                          type="button"
                          className={styles.searchRow}
                          onClick={() => {
                            handleSelectSpot(pin[0], pin[2]);
                            setSearchQuery("");
                          }}
                        >
                          <span className={styles.ccTag}>{pin[2]}</span>
                          <span className={styles.searchRowTitle}>{pin[1]}</span>
                          <span className={styles.searchRowMeta}>{pin[4]}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.platforms.length > 0 && (
                    <div className={styles.searchGroup}>
                      <div className={styles.searchGroupLabel}>LOCAL PLATFORMS</div>
                      {searchResults.platforms.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={styles.searchRow}
                          onClick={() => {
                            handleClickPlatformCapsule(p.country);
                            setSearchQuery("");
                          }}
                        >
                          <span className={styles.ccTag}>{p.country}</span>
                          <span className={styles.searchRowTitle}>
                            {formatPlatformDisplay(p, uiLanguage)}
                          </span>
                          <span className={styles.searchRowMeta}>{p.spectrum}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <div className={styles.topRightGroup}>
          <div
            className={styles.semanticLegend}
            data-testid="semantic-legend"
            aria-label="Map color legend"
          >
            <span className={styles.legendItem}>
              <span className={styles.legendDotBlack} aria-hidden="true" />
              <span>{uiLanguage === "ko" ? "빈티지샵" : "Shops"}</span>
            </span>
            <span className={styles.legendSep}>·</span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotBlue} aria-hidden="true" />
              <span>{uiLanguage === "ko" ? "중고플랫폼" : "Platforms"}</span>
            </span>
            <span className={styles.legendSep}>·</span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotGreen} aria-hidden="true" />
              <span>{uiLanguage === "ko" ? "축제·마켓" : "Festivals"}</span>
            </span>
          </div>

          <select
            value={uiLanguage}
            onChange={(e) => handleLocaleSwitch(e.target.value as LanguageCode)}
            className={styles.localePill}
            aria-label="Language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()} · {LANGUAGE_NATIVE_NAMES[lang]}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* HUD 2A: Compact Floating Re-Open Pill when Left Drawer is Completely Collapsed */}
      <AnimatePresence>
        {!drawerOpen && (
          <motion.button
            key="reopen-pill"
            type="button"
            className={styles.reopenPill}
            data-testid="drawer-reopen-btn"
            onClick={() => setDrawerOpen(true)}
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          >
            <ChevronRightIcon size={16} strokeWidth={2.1} />
            <span className={styles.reopenCc}>{lockedCountry}</span>
            <span className={styles.reopenName}>
              {activeCityDisp ? activeCityDisp.primary : countryPrimaryName}
            </span>
            <span className={styles.dot}>·</span>
            <span className="tabular-nums">
              {uiLanguage === "ko" ? "샵" : "Shops"}{" "}
              {(activeCity ? activeCity.shopCount : lockedCountryObj?.shopCount ?? 0).toLocaleString()}
            </span>
            <span className={styles.dot}>·</span>
            <span className="tabular-nums">
              {uiLanguage === "ko" ? "앱" : "Apps"} {lockedPlatforms.length}
            </span>
            <span className={styles.reopenAction}>
              {uiLanguage === "ko" ? "펼치기" : "Open"}
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* HUD 2B: Apple Maps Web × Arc Single Unified Large Collapsible Left Drawer */}
      <AnimatePresence initial={false}>
        {drawerOpen && (
          <motion.aside
            key="unified-left-drawer"
            className={styles.unifiedDrawer}
            data-testid="unified-left-drawer"
            aria-label="Country and Vintage Explorer Drawer"
            initial={{ x: "calc(-100% - 48px)", opacity: 0.85 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "calc(-100% - 48px)", opacity: 0.85 }}
            transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
          >
            <motion.div
              key={activeSpotDetail ? `spot-${activeSpotDetail.id}` : showSavedOnly ? "saved" : "list"}
              className={styles.viewSwap}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
            {activeSpotDetail ? (
              <SpotDetailView
                shop={activeSpotDetail}
                copy={copy}
                lang={uiLanguage}
                isSaved={savedSet.has(activeSpotDetail.id)}
                nearbySpots={nearbyWalkSpots}
                onToggleSave={toggleSaveSpot}
                onBack={() => setSelectedSpotId(null)}
                onSelectAlley={handleSelectAlleyById}
                onSelectNearbySpot={handleSelectSpot}
              />
            ) : showSavedOnly ? (
              <div className={styles.drawerColumn}>
                <div className={styles.drawerTopSection}>
                  <div className={styles.headerRow}>
                    <button
                      type="button"
                      className={styles.backPill}
                      onClick={() => setShowSavedOnly(false)}
                    >
                      <ArrowLeftIcon size={15} />
                      <span>{copy.backToList}</span>
                    </button>
                    <button
                      type="button"
                      className={styles.collapseDrawerBtn}
                      data-testid="drawer-collapse-btn"
                      onClick={() => setDrawerOpen(false)}
                      title="드로어 접기 ([)"
                      aria-label="Collapse drawer"
                    >
                      <ArrowLeftIcon size={16} strokeWidth={2} />
                      <span>{uiLanguage === "ko" ? "접기" : "Hide"}</span>
                    </button>
                  </div>
                  <h1 className={styles.mainTitle} data-testid="saved-course-title">
                    {copy.savedCourseTitle}{" "}
                    <span className={`${styles.titleSub} tabular-nums`}>({savedIds.length})</span>
                  </h1>
                </div>

                <div className={styles.drawerScroll}>
                  {savedPins.length === 0 && savedEvents.length === 0 ? (
                    <p className={styles.emptyState}>{copy.savedEmpty}</p>
                  ) : (
                    <div className={styles.bodyPad}>
                      <div className={styles.spotList}>
                        {savedEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={styles.spotCard}
                            onMouseEnter={() => hoverStore.set(ev.id)}
                            onMouseLeave={() => hoverStore.set(null)}
                            onClick={() => handleSelectEvent(ev)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSelectEvent(ev);
                            }}
                          >
                            <div className={styles.spotTop}>
                              <span className={styles.mintDotInline} aria-hidden="true" />
                              <span className={styles.ccTag}>{ev.country}</span>
                              <span className={styles.spotSub}>{ev.cityKo}</span>
                              <button
                                type="button"
                                className={`${styles.bookmarkBtn} ${styles.bookmarkActive}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveSpot(ev.id);
                                }}
                                aria-label={copy.removeSaved}
                                title={copy.removeSaved}
                              >
                                <BookmarkIcon size={15} filled />
                              </button>
                            </div>
                            <div className={styles.spotName}>{ev.nameKo}</div>
                          </div>
                        ))}
                        {savedPins.map((pin) => (
                          <div
                            key={pin[0]}
                            className={styles.spotCard}
                            onMouseEnter={() => hoverStore.set(pin[0])}
                            onMouseLeave={() => hoverStore.set(null)}
                            onClick={() => handleSelectSpot(pin[0], pin[2])}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSelectSpot(pin[0], pin[2]);
                            }}
                          >
                            <div className={styles.spotTop}>
                              <span className={styles.ccTag}>{pin[2]}</span>
                              <span className={styles.spotSub}>{pin[4]}</span>
                              <button
                                type="button"
                                className={`${styles.bookmarkBtn} ${styles.bookmarkActive}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSaveSpot(pin[0]);
                                }}
                                aria-label={copy.removeSaved}
                                title={copy.removeSaved}
                              >
                                <BookmarkIcon size={15} filled />
                              </button>
                            </div>
                            <div className={styles.spotName}>{pin[1]}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.drawerColumn}>
                {/* TIER 1: Country/City Title Header + Collapse Button + Always-Visible Platforms */}
                <div className={styles.drawerTopSection} data-testid="country-platform-hub">
                  <div className={styles.headerRow}>
                    <div className={styles.breadcrumbLeft}>
                      {activeCity ? (
                        <button
                          type="button"
                          className={styles.backPill}
                          onClick={handleBackToCountry}
                        >
                          <ArrowLeftIcon size={14} />
                          <span>
                            {countryPrimaryName} {uiLanguage === "ko" ? "전체" : "All"}
                          </span>
                        </button>
                      ) : (
                        <span className={styles.lockedCc}>{lockedCountry}</span>
                      )}
                      <span className={`${styles.localClock} tabular-nums`} data-testid="local-clock">
                        {localClockText}
                      </span>
                    </div>

                    <div className={styles.headerRightBtns}>
                      <button
                        type="button"
                        className={styles.randomMiniBtn}
                        data-testid="random-capital-btn"
                        onClick={handleRandomCapital}
                        title={uiLanguage === "ko" ? "랜덤 성지 비행" : "Random sanctuary"}
                        aria-label="Random sanctuary"
                      >
                        <ShuffleIcon size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.collapseDrawerBtn}
                        data-testid="drawer-collapse-btn"
                        onClick={() => setDrawerOpen(false)}
                        title={uiLanguage === "ko" ? "패널 접기 ([)" : "Hide panel ([)"}
                        aria-label="Collapse drawer"
                      >
                        <ArrowLeftIcon size={16} strokeWidth={2} />
                        <span>{uiLanguage === "ko" ? "접기" : "Hide"}</span>
                      </button>
                    </div>
                  </div>

                  <div className={styles.titleBlock}>
                    <h1 className={styles.mainTitle} data-testid="drawer-title">
                      {activeCityDisp ? activeCityDisp.primary : countryPrimaryName}
                    </h1>
                  </div>

                  {/* Always-Visible KREAM Monochrome Secondhand Platform Strip (Cobalt Blue Dot Accent) */}
                  <div className={styles.platformsBox} data-testid="always-visible-platforms">
                    {lockedPlatforms.length > 0 ? (
                      <>
                        <div className={styles.platformPills}>
                          {lockedPlatforms.map((meta) => {
                            const runtime = PLATFORM_RUNTIME_MAP.get(meta.id);
                            const resolved = trimmedItem
                              ? resolveQueryForPlatform({
                                  query: trimmedItem,
                                  uiLanguage,
                                  platformCountry: meta.country as CountryCode,
                                  translatedEnglish: effectiveTranslatedItem,
                                  useOriginal: useOriginalItem,
                                })
                              : "";
                            const href = safeExternalUrl(
                              runtime ? runtime.buildSearchUrl(resolved) : meta.homepage,
                            );
                            const label = formatPlatformDisplay(meta, uiLanguage);

                            return (
                              <a
                                key={meta.id}
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.platformPill}
                                data-testid="platform-pill"
                                onClick={() =>
                                  trackPlatformClick({
                                    platformId: meta.id,
                                    country: meta.country,
                                    language: uiLanguage,
                                  })
                                }
                              >
                                <span className={styles.platformBlueDot} aria-hidden="true" />
                                <span>{label}</span>
                                <ArrowUpRightIcon size={13} className={styles.platformArrow} />
                              </a>
                            );
                          })}
                        </div>

                        <div className={styles.itemLauncherRow}>
                          <span className={styles.itemSearchBadge} data-testid="item-search-badge">
                            <span className={styles.platformBlueDot} aria-hidden="true" />
                            <span>
                              {uiLanguage === "ko"
                                ? "매물 검색"
                                : uiLanguage === "ja"
                                  ? "商品検索"
                                  : "ITEM"}
                            </span>
                          </span>
                          <input
                            type="search"
                            value={itemQuery}
                            onChange={(e) => setItemQuery(e.target.value)}
                            placeholder={copy.itemSearchPlaceholder}
                            className={styles.itemInput}
                            aria-label="Search item across local platforms"
                          />
                          {showItemPreview && (
                            <button
                              type="button"
                              className={styles.translatedTag}
                              onClick={() => setUseOriginalItem((v) => !v)}
                            >
                              → {useOriginalItem ? trimmedItem : effectiveTranslatedItem}
                            </button>
                          )}
                          {itemQuery && (
                            <button
                              type="button"
                              className={styles.itemClear}
                              onClick={() => setItemQuery("")}
                              aria-label="Clear item search"
                            >
                              <CloseIcon size={12} />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className={styles.noPlatformHint}>
                        {uiLanguage === "ko"
                          ? "오프라인 빈티지샵 중심 국가입니다."
                          : "Offline vintage shops indexed for this country."}
                      </div>
                    )}
                  </div>
                </div>

                {/* TIER 2: Single-Line Clean City / Neighborhood Chip Strip (Zero Noise Labels) */}
                {(countryCities.length > 0 || (activeCity && activeCityAlleys.length > 0)) && (
                  <div className={styles.tierStrip} data-testid="geo-drill-strip">
                    {!activeCity && countryCities.length > 0 ? (
                      <div className={styles.pillScroll} onWheel={scrollChipsHorizontally}>
                        <button
                          type="button"
                          className={`${styles.geoPill} ${styles.geoPillActive}`}
                          onClick={handleBackToCountry}
                        >
                          {uiLanguage === "ko" ? "전체" : "All"}
                        </button>
                        {countryCities.map((ct) => {
                          const disp = formatCityDisplay(ct, uiLanguage);
                          return (
                            <button
                              key={ct.slug}
                              type="button"
                              className={styles.geoPill}
                              onClick={() => handleSelectCity(ct)}
                            >
                              <span>{disp.primary}</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : activeCity && activeCityAlleys.length > 0 ? (
                      <div className={styles.pillScroll} onWheel={scrollChipsHorizontally} data-testid="alley-pills">
                        <button
                          type="button"
                          className={`${styles.geoPill} ${
                            selectedAlleyId === null ? styles.geoPillActive : ""
                          }`}
                          onClick={() => {
                            setSelectedAlleyId(null);
                            setVisibleCount(40);
                            flyTo({
                              lng: activeCity.center[0],
                              lat: activeCity.center[1],
                              zoom: 12.2,
                              kind: "city",
                            });
                          }}
                        >
                          {copy.allAlleys}
                        </button>
                        {activeCityAlleys.map((a) => {
                          const active = selectedAlleyId === a.id;
                          return (
                            <button
                              key={a.id}
                              type="button"
                              className={`${styles.geoPill} ${
                                active ? styles.geoPillActive : ""
                              }`}
                              onClick={() => handleSelectAlleyById(a.id)}
                            >
                              <span>
                                {uiLanguage === "ko" ? a.display.labelKo : a.display.stamp}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                )}

                {/* TIER 3: 2 Core Tabs (빈티지샵 | ● 축제·마켓) */}
                <SlidingTabs
                  items={filterTabs}
                  activeId={dockFilter}
                  onChange={(tab) => {
                    setDockFilter(tab);
                    if (tab === "shops") setSelectedEventId(null);
                  }}
                />

                <div className={styles.drawerScroll}>
                  {dockFilter === "markets" ? (
                    /* 축제 · 플리마켓 전용 (KREAM 모노톤 + 에메랄드 도트 포인트 · 과거 행사 0건) */
                    <div className={styles.bodyPad} data-testid="events-section">
                      {selectedEvent && (
                        <div className={styles.selectedEventCard} data-testid="selected-event-detail">
                          <div className={styles.eventTop}>
                            <span className={styles.eventMicroBadge}>
                              <span className={styles.mintDotInline} aria-hidden="true" />
                              <span>
                                {selectedEvent.isRecurring
                                  ? copy.recurringBadge
                                  : selectedEvent.source === "luma"
                                    ? "LIVE"
                                    : selectedEvent.nextDate
                                      ? `${copy.upcomingBadge} · ${selectedEvent.nextDate.slice(5).replace("-", ".")}`
                                      : copy.upcomingBadge}
                              </span>
                            </span>
                            <span className={styles.eventCity}>{selectedEvent.cityKo}</span>
                            <button
                              type="button"
                              className={`${styles.bookmarkBtn} ${
                                savedSet.has(selectedEvent.id) ? styles.bookmarkActive : ""
                              }`}
                              onClick={() => toggleSaveSpot(selectedEvent.id)}
                              aria-pressed={savedSet.has(selectedEvent.id)}
                              aria-label={copy.savedLabel}
                              data-testid="event-save-btn"
                            >
                              <BookmarkIcon size={15} filled={savedSet.has(selectedEvent.id)} />
                            </button>
                            <button
                              type="button"
                              className={styles.eventCloseBtn}
                              onClick={() => setSelectedEventId(null)}
                              aria-label="Close event detail"
                            >
                              <CloseIcon size={13} />
                            </button>
                          </div>
                          <div className={styles.selectedEventTitle}>{selectedEvent.nameKo}</div>
                          {(selectedEvent.nextDate || selectedEvent.recurrence || selectedEvent.hours) && (
                            <div className={`${styles.eventDetailLine} tabular-nums`}>
                              {[selectedEvent.nextDate, selectedEvent.hours, selectedEvent.recurrence]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          )}
                          {(selectedEvent.venue || selectedEvent.address) && (
                            <div className={styles.eventDetailLine}>
                              {[selectedEvent.venue, selectedEvent.address].filter(Boolean).join(" · ")}
                            </div>
                          )}
                          {safeExternalUrl(selectedEvent.scheduleUrl || selectedEvent.homepage || selectedEvent.instagram) && (
                            <a
                              href={safeExternalUrl(
                                selectedEvent.scheduleUrl || selectedEvent.homepage || selectedEvent.instagram,
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.eventPrimaryCta}
                            >
                              <span>{copy.openSchedule}</span>
                              <ArrowUpRightIcon size={14} />
                            </a>
                          )}
                          <div className={styles.eventMapLinks}>
                            {(selectedEvent.country === "KR"
                              ? [
                                  {
                                    label: copy.naverMap,
                                    href: `https://map.naver.com/p/search/${encodeURIComponent(
                                      `${selectedEvent.cityKo} ${selectedEvent.venue || selectedEvent.nameKo}`,
                                    )}`,
                                  },
                                  {
                                    label: copy.kakaoMap,
                                    href: `https://map.kakao.com/link/search/${encodeURIComponent(
                                      selectedEvent.venue || selectedEvent.nameKo,
                                    )}`,
                                  },
                                ]
                              : [
                                  {
                                    label: copy.googleMapsShort,
                                    href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                      selectedEvent.center
                                        ? `${selectedEvent.center[1]},${selectedEvent.center[0]}`
                                        : `${selectedEvent.name} ${selectedEvent.cityEn}`,
                                    )}`,
                                  },
                                ]
                            ).map((l) => (
                              <a
                                key={l.label}
                                href={l.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.eventMapLink}
                              >
                                <span>{l.label}</span>
                                <ArrowUpRightIcon size={13} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {eventsFallbackMode === "country-fallback" && (
                        <div className={styles.eventFallbackNotice} data-testid="event-fallback-notice">
                          {uiLanguage === "ko"
                            ? `이 도시에는 등록된 축제가 없어 ${countryPrimaryName} 전체 축제를 표시합니다.`
                            : `No festivals indexed in this city — showing all ${countryPrimaryName} festivals.`}
                        </div>
                      )}

                      {eventsFallbackMode === "global-fallback" && (
                        <div className={styles.eventFallbackNotice} data-testid="event-fallback-notice">
                          {uiLanguage === "ko"
                            ? "이 지역에 등록된 축제가 없어 글로벌 대표 마켓을 표시합니다."
                            : "No local festivals indexed — showing global vintage markets."}
                        </div>
                      )}

                      <div className={styles.pillScroll} onWheel={scrollChipsHorizontally}>
                        <button
                          type="button"
                          className={`${styles.geoPill} ${
                            !showGlobalEvents ? styles.geoPillActive : ""
                          }`}
                          onClick={() => setShowGlobalEvents(false)}
                        >
                          <span>{countryPrimaryName}</span>
                          <span className="tabular-nums">{countryEvents.length}</span>
                        </button>
                        <button
                          type="button"
                          className={`${styles.geoPill} ${
                            showGlobalEvents ? styles.geoPillActive : ""
                          }`}
                          onClick={() => setShowGlobalEvents(true)}
                        >
                          <span>{uiLanguage === "ko" ? "글로벌 전체" : "Global"}</span>
                          <span className="tabular-nums">{activeEvents.length}</span>
                        </button>
                      </div>

                      <div className={styles.eventList}>
                        {displayedEvents.map((ev) => {
                          const isSelected = ev.id === selectedEventId;
                          const extUrl = safeExternalUrl(ev.scheduleUrl || ev.homepage || ev.instagram);
                          const badgeText = ev.isRecurring
                            ? copy.recurringBadge
                            : ev.source === "luma"
                              ? ev.nextDate
                                ? `LIVE · ${ev.nextDate.slice(5).replace("-", ".")}`
                                : "LIVE"
                              : ev.nextDate
                                ? `${copy.upcomingBadge} · ${ev.nextDate.slice(5).replace("-", ".")}`
                                : copy.upcomingBadge;
                          return (
                            <div
                              key={ev.id}
                              className={`${styles.eventCard} ${
                                isSelected ? styles.eventCardSelected : ""
                              }`}
                              data-testid="mint-event-card"
                              onMouseEnter={() => hoverStore.set(ev.id)}
                              onMouseLeave={() => hoverStore.set(null)}
                              onClick={() => handleSelectEvent(ev)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSelectEvent(ev);
                              }}
                            >
                              <div className={styles.eventTop}>
                                <span className={styles.eventMicroBadge}>
                                  <span className={styles.mintDotInline} aria-hidden="true" />
                                  <span className="tabular-nums">{badgeText}</span>
                                </span>
                                <span className={styles.eventCity}>{ev.cityKo}</span>
                              </div>
                              <div className={styles.eventName}>{ev.nameKo}</div>
                              {(ev.venue || ev.recurrence) && (
                                <div className={styles.eventMeta}>
                                  {ev.recurrence || ev.venue}
                                </div>
                              )}
                              {extUrl && (
                                <a
                                  href={extUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.eventExtLink}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span>{copy.openSchedule}</span>
                                  <ArrowUpRightIcon size={13} />
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* 빈티지샵 1~2줄 심플 리스트 + 뷰포트 연동 + 온라인 전용 국가 가이드 */
                    <div className={styles.bodyPad} data-testid="offline-spots-section">
                      {activeShops.length > 0 && (
                        <div className={styles.viewportSyncBar} data-testid="viewport-sync-bar">
                          {zoom >= 10 ? (
                          <button
                            type="button"
                            className={`${styles.viewportToggleBtn} ${
                              filterByViewport ? styles.viewportToggleActive : ""
                            }`}
                            onClick={() => {
                              setFilterByViewport((v) => !v);
                              setVisibleCount(40);
                            }}
                          >
                            <span className="tabular-nums">
                              {copy.viewportSpotsLabel(viewportShops.length)}
                            </span>
                          </button>
                          ) : (
                            <span />
                          )}
                          <div className={styles.sortToggle} role="group" data-testid="sort-toggle">
                            {(
                              [
                                ["curated", copy.sortCurated],
                                ["nearest", copy.sortNearest],
                                ["name", copy.sortName],
                              ] as const
                            ).map(([mode, label]) => (
                              <button
                                key={mode}
                                type="button"
                                className={`${styles.sortBtn} ${sortMode === mode ? styles.sortBtnActive : ""}`}
                                aria-pressed={sortMode === mode}
                                onClick={() => {
                                  setSortMode(mode);
                                  setVisibleCount(40);
                                }}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {loadingShardCc === lockedCountry && renderedShops.length === 0 ? (
                        <p className={styles.emptyState}>{copy.loadingShops}</p>
                      ) : renderedShops.length === 0 && !activeCity && lockedPlatforms.length > 0 ? (
                        <div className={styles.onlineOnlyCard} data-testid="online-only-guide">
                          <div className={styles.onlineOnlyHead}>
                            <span className={styles.platformBlueDot} aria-hidden="true" />
                            <h2 className={styles.onlineOnlyTitle}>{copy.onlineOnlyTitle}</h2>
                          </div>
                          <p className={styles.onlineOnlyDesc}>{copy.onlineOnlyDesc}</p>
                          <div className={styles.onlineOnlySub}>{copy.nearbyCapitalsLabel}</div>
                          <div className={styles.onlineOnlyCapitals}>
                            {bootstrap.featuredCities.slice(0, 6).map((city) => {
                              const disp = formatCityDisplay(city, uiLanguage);
                              return (
                                <button
                                  key={city.slug}
                                  type="button"
                                  className={styles.geoPill}
                                  onClick={() => handleSelectCity(city)}
                                >
                                  <span>{disp.primary}</span>
                                  <span className={`${styles.chipNum} tabular-nums`}>
                                    {city.shopCount}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : renderedShops.length === 0 ? (
                        <p className={styles.emptyState}>{copy.noResults}</p>
                      ) : (
                        <>
                          <div className={styles.spotList}>
                            {renderedShops.slice(0, visibleCount).map((shop, idx) => (
                              <ShopCard
                                key={shop.id}
                                shop={shop}
                                idx={idx}
                                isSaved={savedSet.has(shop.id)}
                                hoverStore={hoverStore}
                                savedLabel={copy.savedLabel}
                                walkMin={copy.walkMin}
                                onSelect={handleSelectSpot}
                                onToggleSave={toggleSaveSpot}
                              />
                            ))}
                          </div>

                          {renderedShops.length > visibleCount && (
                            <button
                              type="button"
                              ref={loadMoreRef}
                              className={styles.loadMoreBtn}
                              onClick={() => setVisibleCount((c) => c + 40)}
                            >
                              {copy.loadMore(renderedShops.length - visibleCount)}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            </motion.div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* HUD 3: Oversized 4K-Ready Bottom-Right Monochrome Controls */}
      <nav className={styles.rightHud} aria-label="Globe controls" data-testid="right-controls">
        <button
          type="button"
          className={styles.hudBtn}
          data-testid="ctrl-reset"
          onClick={handleResetGlobe}
          aria-label={copy.resetView}
          title={copy.resetView}
        >
          <GlobeResetIcon className={styles.hudIcon} strokeWidth={2} />
        </button>

        <div className={styles.hudZoomGroup}>
          <button
            type="button"
            className={styles.hudZoomBtn}
            data-testid="ctrl-zoom-in"
            onClick={() => mapApiRef.current?.zoomIn()}
            aria-label="Zoom in"
          >
            <PlusIcon className={styles.hudIcon} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={styles.hudZoomBtn}
            data-testid="ctrl-zoom-out"
            onClick={() => mapApiRef.current?.zoomOut()}
            aria-label="Zoom out"
          >
            <MinusIcon className={styles.hudIcon} strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          className={styles.hudBtn}
          data-testid="ctrl-gps"
          onClick={() => mapApiRef.current?.locateMe()}
          aria-label={copy.locateMe}
          title={copy.locateMe}
        >
          <LocateIcon className={styles.hudIcon} strokeWidth={2} />
        </button>

        <button
          type="button"
          className={`${styles.hudBtn} ${showSavedOnly ? styles.hudBtnActive : ""}`}
          data-testid="ctrl-saved"
          onClick={() => {
            setShowSavedOnly((prev) => !prev);
            setSelectedSpotId(null);
            setDrawerOpen(true);
          }}
          aria-label={copy.savedLabel}
          title={copy.savedLabel}
        >
          <BookmarkIcon
            className={styles.hudIcon}
            filled={showSavedOnly || savedIds.length > 0}
            strokeWidth={2}
          />
          {savedIds.length > 0 && (
            <span className={`${styles.hudSavedBadge} tabular-nums`}>{savedIds.length}</span>
          )}
        </button>
      </nav>
    </div>
  );
}
