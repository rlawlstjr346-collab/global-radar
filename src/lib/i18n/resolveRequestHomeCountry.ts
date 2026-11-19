import { cookies, headers } from "next/headers";
import type { CountryCode } from "@/data/platforms";
import { COUNTRY_OVERRIDE_COOKIE } from "./cookies";
import { parseCountryOverride, resolveHomeCountry } from "./detect";
import { getGeoCountry } from "./geo";

/**
 * Resolves which country's platforms should sort first for the current
 * request — independent of UI language, which comes from the URL's locale
 * segment. Priority: manual "use my location" cookie > Accept-Language
 * region subtag > geo-IP > hard default.
 */
export async function resolveRequestHomeCountry(): Promise<CountryCode> {
  const [hdrs, cookieStore] = await Promise.all([headers(), cookies()]);

  return resolveHomeCountry({
    acceptLanguageHeader: hdrs.get("accept-language"),
    geoCountry: getGeoCountry({ headers: hdrs }),
    countryOverride: parseCountryOverride(cookieStore.get(COUNTRY_OVERRIDE_COOKIE)?.value),
  }).country;
}
