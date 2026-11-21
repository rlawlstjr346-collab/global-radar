/**
 * All 27 EU member states (GDPR scope). Uses plain ISO-3166-1 alpha-2 strings
 * (not just our CountryCode union) so countries without dedicated platform
 * entries yet — such as Malta (MT) — still trigger the EU cookie-consent gate.
 */
const EU_COUNTRIES = new Set<string>([
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
  "MT",
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
  return !!code && EU_COUNTRIES.has(code.toUpperCase());
}
