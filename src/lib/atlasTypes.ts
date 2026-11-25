export type Continent = "Asia" | "Europe" | "Americas" | "Africa" | "Oceania";

export type PlatformSpectrum = "FASHION" | "GENERAL" | "TECH/ARCHIVE" | "LUXURY";

export type AtlasLayerTab = "all" | "shops" | "apps" | "markets";

/**
 * Ultra-lightweight pin tuple for all 13,054 offline vintage spots.
 * [id, name, cc, citySlug, cityLabelKo, cityLabelEn, lng, lat, kind, alleyId, featured]
 */
export type CompactPinTuple = [
  id: string,
  name: string,
  cc: string,
  citySlug: string,
  cityLabelKo: string,
  cityLabelEn: string,
  lng: number,
  lat: number,
  kind: string,
  alleyId: string,
  featured: 0 | 1,
];

export interface AtlasCountry {
  code: string;
  nameEn: string;
  nameKo: string;
  names: Record<string, string>;
  continent: Continent;
  center: [number, number];
  shopCount: number;
  featuredCount: number;
  platformCount: number;
  alleyCount: number;
  eventCount: number;
  topCities: string[];
}

export interface AtlasAlleySummary {
  id: string;
  name: string;
  dong?: string;
  gu?: string;
  count: number;
  featured: number;
  center: [number, number];
  bbox?: [number, number, number, number];
  walkMin?: number;
  walkM?: number;
  startStation?: string;
}

export interface AtlasAlley extends AtlasAlleySummary {
  citySlug: string;
  cityKo: string;
  cityEn: string;
  country: string;
}

export interface AtlasCity {
  slug: string;       // e.g. "jp/tokyo"
  citySlug: string;   // e.g. "tokyo"
  country: string;    // e.g. "JP"
  rawCity: string;    // e.g. "도쿄"
  nameKo: string;     // e.g. "도쿄"
  nameEn: string;     // e.g. "Tokyo"
  nameNative?: string;
  center: [number, number];
  bbox?: [number, number, number, number];
  shopCount: number;
  featuredCount: number;
  alleyCount: number;
  topAlleys: AtlasAlleySummary[];
  curated: boolean;
}

export interface AtlasPlatformMeta {
  id: string;
  name: string;
  nativeName?: string;
  country: string;
  homepage: string;
  verified: boolean;
  spectrum: PlatformSpectrum;
  tags: string[];
}

export interface AtlasEvent {
  id: string;
  name: string;
  nameKo: string;
  country: string;
  citySlug: string;
  cityKo: string;
  cityEn: string;
  kind: string;
  kindLabel: string;
  tags: string[];
  venue?: string;
  address?: string;
  recurrence?: string;
  isRecurring?: boolean;
  nextDate?: string;
  endDate?: string;
  lastDate?: string;
  hours?: string;
  scheduleUrl?: string;
  instagram?: string;
  homepage?: string;
  center: [number, number] | null;
  source?: "curated" | "luma";
  near?: {
    name: string;
    nameKo?: string;
    m?: number;
    walkMin?: number;
  };
}

export interface LiveEventsPayload {
  generatedAt: string;
  curatedCount: number;
  lumaCount: number;
  totalCount: number;
  events: AtlasEvent[];
}

export interface AtlasBootstrap {
  meta: {
    generatedAt: string;
    countries: number;
    shops: number;
    platforms: number;
    alleys: number;
    events: number;
    cities: number;
    shards: number;
  };
  countries: AtlasCountry[];
  featuredCities: AtlasCity[];
  cities: AtlasCity[];
  alleys: AtlasAlley[];
  platforms: AtlasPlatformMeta[];
  events: AtlasEvent[];
}

export interface AtlasShopDetail {
  id: string;
  name: string;
  nameEn?: string;
  country: string;
  citySlug: string;
  cityKo: string;
  cityEn: string;
  gu?: string;
  address?: string;
  floor?: string;
  hours?: string;
  lng: number;
  lat: number;
  kind: string;
  featured: boolean;
  alley?: string;
  alleyName?: string;
  near?: {
    name: string;
    nameKo?: string;
    m?: number;
    walkMin?: number;
  };
  format?: string[];
  style?: string[];
  curation?: string[];
  note?: string;
  channels?: {
    website?: string;
    instagram?: string;
    kakao?: string;
    naver?: string;
    osm?: string;
  };
  sources?: {
    title: string;
    publisher?: string;
    url: string;
    type?: string;
  }[];
}

export interface AtlasShopShard {
  country: string;
  count: number;
  shops: AtlasShopDetail[];
}
