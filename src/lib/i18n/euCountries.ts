import type { CountryCode } from "@/data/platforms";

/**
 * EU member states (GDPR scope) that exist in our CountryCode union. Used to
 * gate the cookie-consent banner to EU visitors only — everywhere else, GA4
 * loads the same way it always has.
 */
const EU_COUNTRIES = new Set<CountryCode>([
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
]);

export function isEuCountry(code: string | null | undefined): boolean {
  return !!code && EU_COUNTRIES.has(code.toUpperCase() as CountryCode);
}
