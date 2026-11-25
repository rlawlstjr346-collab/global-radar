/**
 * Canonical origin used by sitemap, RSS, robots.txt, IndexNow, and OG/metadata links.
 * Falls back to the live production domain so missing env vars never emit
 * localhost URLs in production crawls.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://worldvintagemap.com"
).replace(/\/+$/, "");
