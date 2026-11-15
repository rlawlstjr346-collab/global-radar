import { NextResponse, type NextRequest } from "next/server";
import type { CountryCode } from "@/data/platforms";
import { MANUAL_OVERRIDE_COOKIE, RESOLVED_LOCALE_COOKIE } from "@/lib/i18n/cookies";
import { resolveLocaleContext, type ManualLocaleOverride } from "@/lib/i18n/detect";
import { getGeoCountry } from "@/lib/i18n/geo";
import { isSupportedLanguage } from "@/lib/i18n/locales";

function parseManualOverride(raw: string | undefined): ManualLocaleOverride | null {
  if (!raw) return null;
  const [language, country] = raw.split("-");
  if (!language || !country || !isSupportedLanguage(language)) return null;
  return { language, country: country as CountryCode };
}

export function middleware(request: NextRequest) {
  const manualOverride = parseManualOverride(
    request.cookies.get(MANUAL_OVERRIDE_COOKIE)?.value,
  );

  const context = resolveLocaleContext({
    acceptLanguageHeader: request.headers.get("accept-language"),
    geoCountry: getGeoCountry(request),
    manualOverride,
  });

  const resolvedValue = `${context.language}-${context.country}`;

  const response = NextResponse.next();
  response.cookies.set(RESOLVED_LOCALE_COOKIE, resolvedValue, { path: "/", sameSite: "lax" });
  response.headers.set("x-grl-locale", resolvedValue);
  response.headers.set("x-grl-locale-source", context.source);
  return response;
}

export const config = {
  matcher: "/:path*",
};
