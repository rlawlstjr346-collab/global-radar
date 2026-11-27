import type { NextConfig } from "next";

// Production security headers. Geolocation stays allowed for our own origin (GPS "locate me").
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=()" },
];

const nextConfig: NextConfig = {
  // Always defined so the test-only camera hook is constant-folded out of normal builds.
  env: { NEXT_PUBLIC_ATLAS_E2E: process.env.NEXT_PUBLIC_ATLAS_E2E === "1" ? "1" : "0" },
  // cacheComponents / partialPrefetching are off: @opennextjs/cloudflare does not support
  // Cache Components yet (page renders hang in workerd). See opennextjs-cloudflare#1318.
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // Static atlas data (bootstrap, pins, shards, countries): edge-cacheable, revalidated in the background.
      {
        source: "/data/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
    ];
  },
  // Legacy URLs (/v2/*, *.html, retired minimap pages, case / trailing-slash variants) are
  // resolved in src/proxy.ts in a single 308 hop, so Next's own trailing-slash redirect is off.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
