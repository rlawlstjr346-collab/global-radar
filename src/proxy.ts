import { NextResponse, type NextRequest } from "next/server";
import { pickPreferredLanguage } from "@/lib/i18n/detect";
import { getGeoCountry } from "@/lib/i18n/geo";
import { LANGUAGE_PREFERENCE_COOKIE } from "@/lib/i18n/cookies";
import { isSupportedLanguage, SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/i18n/locales";
import { resolveLegacyPath } from "@/lib/legacyRoutes";

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);

/** Matches no route, so Next answers with the ATLAS not-found screen and a real 404 status. */
const NOT_FOUND_REWRITE = "/_atlas/not-found/no/such/page";

/** The visitor's own language: a saved manual choice first, then Accept-Language / geo. */
function preferredLanguage(request: NextRequest): LanguageCode {
  const savedPreference = request.cookies.get(LANGUAGE_PREFERENCE_COOKIE)?.value;
  return savedPreference && isSupportedLanguage(savedPreference)
    ? savedPreference
    : pickPreferredLanguage({
        acceptLanguageHeader: request.headers.get("accept-language"),
        geoCountry: getGeoCountry(request),
      });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // First-time visit to the bare root: redirect to the visitor's own
  // language, preferring a previously-made manual choice (the "use my
  // location" of language) over re-detecting from Accept-Language every
  // time. Every other request already carries an explicit `/<language>`
  // segment, which is what makes each language independently crawlable.
  if (pathname === "/") {
    const language = preferredLanguage(request);
    const target = new URL(`/${language}`, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, { status: 307 });
  }

  // Legacy minimap (/v2/<lang>/<country-name>/<city>/, *.html, /feed ...) and pre-atlas URLs
  // still indexed by search engines: one 308 hop to the live page, or a real 404.
  const legacy = resolveLegacyPath(pathname, preferredLanguage(request));
  if (legacy && "redirect" in legacy) {
    return NextResponse.redirect(new URL(legacy.redirect, request.url), { status: 308 });
  }
  if (legacy && "notFound" in legacy) {
    return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE, request.url));
  }

  // For `/<language>/...` requests, forward the locale as a request header
  // so the root layout (which sits above the `[locale]` segment and can't
  // read its route params directly) can set `<html lang>`/`dir` correctly.
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && SUPPORTED_LANGUAGE_SET.has(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", firstSegment);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  // Files are skipped, except *.html / *.htm: the retired static site's pages live there.
  matcher: ["/((?!_next/|_vercel/|api/|data/|favicon.ico|.*\\.(?!html?$)[^/]+$).*)"],
};
