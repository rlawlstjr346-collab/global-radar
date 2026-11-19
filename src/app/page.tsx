import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { pickPreferredLanguage } from "@/lib/i18n/detect";
import { getGeoCountry } from "@/lib/i18n/geo";

// Safety net only — proxy.ts already redirects "/" before this ever
// renders in normal operation. Kept in case a request reaches here anyway
// (e.g. a matcher miss), so "/" never 404s.
export const instant = false;

export default async function RootFallback() {
  const hdrs = await headers();
  const language = pickPreferredLanguage({
    acceptLanguageHeader: hdrs.get("accept-language"),
    geoCountry: getGeoCountry({ headers: hdrs }),
  });

  redirect(`/${language}`);
}
