import { NextResponse, type NextRequest } from "next/server";
import { pickPreferredLanguage } from "@/lib/i18n/detect";
import { getGeoCountry } from "@/lib/i18n/geo";
import { LANGUAGE_PREFERENCE_COOKIE } from "@/lib/i18n/cookies";
import { isSupportedLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/locales";

const SUPPORTED_LANGUAGE_SET = new Set<string>(SUPPORTED_LANGUAGES);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // First-time visit to the bare root: redirect to the visitor's own
  // language, preferring a previously-made manual choice (the "use my
  // location" of language) over re-detecting from Accept-Language every
  // time. Every other request already carries an explicit `/<language>`
  // segment, which is what makes each language independently crawlable.
  if (pathname === "/") {
    const savedPreference = request.cookies.get(LANGUAGE_PREFERENCE_COOKIE)?.value;
    const language =
      savedPreference && isSupportedLanguage(savedPreference)
        ? savedPreference
        : pickPreferredLanguage({
            acceptLanguageHeader: request.headers.get("accept-language"),
            geoCountry: getGeoCountry(request),
          });
    const target = new URL(`/${language}`, request.url);
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, { status: 307 });
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
  matcher: ["/((?!_next/|api/|favicon.ico|.*\\.[^/]+$).*)"],
};
