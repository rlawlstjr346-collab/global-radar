import type { NextRequest } from "next/server";

/**
 * Deployment-agnostic geo-IP country lookup: reads whichever edge/CDN
 * header is already present on the request. Returns null when none is
 * available (e.g. local dev, or a host that doesn't inject one), in which
 * case the caller falls back to the hard default locale.
 */
export function getGeoCountry(request: NextRequest): string | null {
  return (
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    null
  );
}
