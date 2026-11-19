import type { CountryCode } from "@/data/platforms";

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two [lon, lat] points, in kilometers. */
export function haversineDistanceKm(a: [number, number], b: [number, number]): number {
  const EARTH_RADIUS_KM = 6371;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Sorts countries by proximity to `homeCountry`: the home country first,
 * then the rest nearest-first. Falls back to the list's first entry if
 * `homeCountry` isn't in `points` (e.g. a generic geo-IP region code with
 * no coordinates of its own).
 */
export function sortCountriesByProximity<
  T extends { code: CountryCode; coordinates: [number, number] },
>(points: T[], homeCountry: CountryCode): T[] {
  const home = points.find((p) => p.code === homeCountry) ?? points[0];
  if (!home) return points;

  return [...points].sort((a, b) => {
    if (a.code === home.code) return -1;
    if (b.code === home.code) return 1;
    return (
      haversineDistanceKm(home.coordinates, a.coordinates) -
      haversineDistanceKm(home.coordinates, b.coordinates)
    );
  });
}

/** The entry in `points` whose coordinates are closest to `coords`. */
export function nearestCountry<T extends { coordinates: [number, number] }>(
  points: T[],
  coords: [number, number],
): T | undefined {
  return points.reduce<T | undefined>((closest, point) => {
    if (!closest) return point;
    return haversineDistanceKm(coords, point.coordinates) < haversineDistanceKm(coords, closest.coordinates)
      ? point
      : closest;
  }, undefined);
}
