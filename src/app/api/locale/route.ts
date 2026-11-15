import { NextResponse, type NextRequest } from "next/server";
import { PLATFORMS, type CountryCode } from "@/data/platforms";
import { MANUAL_OVERRIDE_COOKIE, MANUAL_OVERRIDE_MAX_AGE_SECONDS } from "@/lib/i18n/cookies";
import { isSupportedLanguage } from "@/lib/i18n/locales";

const KNOWN_COUNTRIES = new Set<string>(PLATFORMS.map((p) => p.country));

/** Manual language/region override, set by the (future) locale switcher UI. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const language = body?.language;
  const country = body?.country;

  if (typeof language !== "string" || !isSupportedLanguage(language)) {
    return NextResponse.json({ error: "invalid language" }, { status: 400 });
  }
  if (typeof country !== "string" || !KNOWN_COUNTRIES.has(country)) {
    return NextResponse.json({ error: "invalid country" }, { status: 400 });
  }

  const response = NextResponse.json({ language, country });
  response.cookies.set(MANUAL_OVERRIDE_COOKIE, `${language}-${country as CountryCode}`, {
    path: "/",
    maxAge: MANUAL_OVERRIDE_MAX_AGE_SECONDS,
    sameSite: "lax",
  });
  return response;
}

/** Clears the manual override, reverting to Accept-Language / geo-IP detection. */
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(MANUAL_OVERRIDE_COOKIE);
  return response;
}
