import type { CountryCode } from "./platforms";

export type Continent = "Asia" | "Americas" | "Europe";

export interface CountryPoint {
  code: CountryCode;
  name: string;
  nativeName?: string;
  continent: Continent;
  /** [longitude, latitude] */
  coordinates: [number, number];
}

export const COUNTRY_POINTS: CountryPoint[] = [
  { code: "KR", name: "South Korea", nativeName: "대한민국", continent: "Asia", coordinates: [126.978, 37.5665] },
  { code: "JP", name: "Japan", nativeName: "日本", continent: "Asia", coordinates: [139.6917, 35.6895] },
  { code: "IN", name: "India", continent: "Asia", coordinates: [77.209, 28.6139] },
  { code: "ID", name: "Indonesia", continent: "Asia", coordinates: [106.8456, -6.2088] },
  { code: "US", name: "United States", continent: "Americas", coordinates: [-98.5833, 39.8333] },
  { code: "GB", name: "United Kingdom", continent: "Europe", coordinates: [-0.1276, 51.5072] },
  { code: "DE", name: "Germany", continent: "Europe", coordinates: [13.405, 52.52] },
  { code: "FR", name: "France", continent: "Europe", coordinates: [2.3522, 48.8566] },
];

export function countryPoint(code: CountryCode): CountryPoint | undefined {
  return COUNTRY_POINTS.find((c) => c.code === code);
}
