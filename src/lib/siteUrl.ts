/**
 * Set NEXT_PUBLIC_SITE_URL once a real domain is live — this placeholder is
 * the one thing to update at deploy time (sitemap, robots, and OG/metadata
 * links all read from here).
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
