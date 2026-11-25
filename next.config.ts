import type { NextConfig } from "next";

const LOCALE_PATTERN =
  "ko|en|ja|zh|fr|de|es|it|nl|pt|th|vi|id|ms|ru|uk|ar|tr|pl|sv|no|da|fi|cs|ro|el|hu|hr|bg|lt|hi|ur|bn|si|he";

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
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [
      {
        source: "/v2",
        destination: "/",
        statusCode: 308,
      },
      {
        source: `/v2/:locale(${LOCALE_PATTERN})`,
        destination: "/:locale",
        statusCode: 308,
      },
      {
        source: `/v2/:locale(${LOCALE_PATTERN})/:path*`,
        destination: "/:locale/explore/:path*",
        statusCode: 308,
      },
      {
        source: "/v2/:path*",
        destination: "/ko/explore/:path*",
        statusCode: 308,
      },
    ];
  },
};

export default nextConfig;
