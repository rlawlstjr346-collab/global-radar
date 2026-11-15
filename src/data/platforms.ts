/**
 * Regional secondhand-marketplace redirect targets.
 *
 * Legal model: this app never scrapes or mirrors listing data. Every entry
 * here only builds a URL to that platform's own search-results page; the
 * user is redirected there to see real, live results (same pattern already
 * verified against SearchTempest / craigslist). `verified` reflects whether
 * that URL pattern has been manually confirmed to land on real results;
 * unverified ones are best-effort guesses from public documentation and
 * need a manual check before shipping.
 */

export type CountryCode =
  | "KR" // Korea
  | "JP" // Japan
  | "US" // United States
  | "IN" // India
  | "ID" // Indonesia
  | "GB" // United Kingdom
  | "DE" // Germany
  | "FR" // France
  | "EU"; // Generic/unspecified EU fallback

export interface Platform {
  id: string;
  name: string;
  /** Native-language display name, if different from `name`. */
  nativeName?: string;
  country: CountryCode;
  homepage: string;
  /** Builds the URL to that platform's own search-results page for `query`. */
  buildSearchUrl: (query: string, opts?: Record<string, string>) => string;
  verified: boolean;
  notes?: string;
}

const enc = (q: string) => encodeURIComponent(q.trim());

export const PLATFORMS: Platform[] = [
  // ---- Korea ----
  {
    id: "bunjang",
    name: "Bunjang",
    nativeName: "번개장터",
    country: "KR",
    homepage: "https://m.bunjang.co.kr",
    buildSearchUrl: (q) =>
      `https://m.bunjang.co.kr/search/products?order=date&q=${enc(q)}`,
    verified: false,
    notes: "Pattern from public docs/observation; confirm result page still matches after any site redesign.",
  },
  {
    id: "daangn",
    name: "Karrot (Danggeun Market)",
    nativeName: "당근마켓",
    country: "KR",
    homepage: "https://www.daangn.com",
    buildSearchUrl: (q) => `https://www.daangn.com/search/${enc(q)}`,
    verified: false,
    notes:
      "Danggeun's web search is location-scoped and may require a neighborhood context to return results — needs manual verification.",
  },
  {
    id: "joonggonara",
    name: "Joonggonara",
    nativeName: "중고나라",
    country: "KR",
    homepage: "https://cafe.naver.com/joonggonara",
    buildSearchUrl: (q) =>
      `https://cafe.naver.com/joonggonara?iframe_url=%2FArticleSearchList.nhn%3Fsearch.clubid%3D10050146%26search.query%3D${enc(
        q,
      )}`,
    verified: false,
    notes:
      "Hosted on a Naver Cafe; URL shape is fragile and should be re-derived by hand before launch.",
  },
  {
    id: "fruitsfamily",
    name: "Fruits Family",
    nativeName: "후르츠패밀리",
    country: "KR",
    homepage: "https://www.fruitsfamily.com",
    buildSearchUrl: (q) => `https://www.fruitsfamily.com/goods/search?keyword=${enc(q)}`,
    verified: false,
    notes: "Camera/lens-focused marketplace; search URL unconfirmed — TODO manual check.",
  },

  // ---- Japan ----
  {
    id: "mercari-jp",
    name: "Mercari",
    country: "JP",
    homepage: "https://jp.mercari.com",
    buildSearchUrl: (q) => `https://jp.mercari.com/search?keyword=${enc(q)}`,
    verified: false,
    notes: "Standard Mercari search param; low risk but not yet manually re-confirmed in this project.",
  },
  {
    id: "yahoo-auctions-jp",
    name: "Yahoo! Auctions",
    nativeName: "ヤフオク!",
    country: "JP",
    homepage: "https://auctions.yahoo.co.jp",
    buildSearchUrl: (q) => `https://auctions.yahoo.co.jp/search/search?p=${enc(q)}`,
    verified: false,
  },

  // ---- United States ----
  {
    id: "ebay-us",
    name: "eBay",
    country: "US",
    homepage: "https://www.ebay.com",
    buildSearchUrl: (q) => `https://www.ebay.com/sch/i.html?_nkw=${enc(q)}`,
    verified: true,
    notes: "Same pattern RADAR already uses in production.",
  },
  {
    id: "facebook-marketplace-us",
    name: "Facebook Marketplace",
    country: "US",
    homepage: "https://www.facebook.com/marketplace",
    buildSearchUrl: (q) => `https://www.facebook.com/marketplace/search/?query=${enc(q)}`,
    verified: false,
    notes: "Marketplace search generally requires a logged-in Facebook session — confirm logged-out behavior.",
  },
  {
    id: "craigslist-us",
    name: "Craigslist",
    country: "US",
    homepage: "https://www.craigslist.org",
    buildSearchUrl: (q, opts) => {
      const city = opts?.city ?? "newyork";
      return `https://${city}.craigslist.org/search/sss?query=${enc(q)}`;
    },
    verified: true,
    notes:
      "Craigslist is subdomain-per-city; `opts.city` must be resolved from the user's selected region before building the link. Defaults to newyork.",
  },

  // ---- India ----
  {
    id: "olx-in",
    name: "OLX India",
    country: "IN",
    homepage: "https://www.olx.in",
    buildSearchUrl: (q) => `https://www.olx.in/items/q-${enc(q)}`,
    verified: false,
  },
  {
    id: "quikr-in",
    name: "Quikr",
    country: "IN",
    homepage: "https://www.quikr.com",
    buildSearchUrl: (q) => `https://www.quikr.com/${enc(q)}`,
    verified: false,
    notes: "Quikr's URL shape varies by category; generic query path needs manual confirmation.",
  },

  // ---- Indonesia ----
  {
    id: "olx-id",
    name: "OLX Indonesia",
    country: "ID",
    homepage: "https://www.olx.co.id",
    buildSearchUrl: (q) => `https://www.olx.co.id/search?q=${enc(q)}`,
    verified: false,
  },

  // ---- Europe (per-market domains; see notes) ----
  {
    id: "ebay-gb",
    name: "eBay UK",
    country: "GB",
    homepage: "https://www.ebay.co.uk",
    buildSearchUrl: (q) => `https://www.ebay.co.uk/sch/i.html?_nkw=${enc(q)}`,
    verified: true,
    notes: "Same tested eBay pattern, UK domain.",
  },
  {
    id: "ebay-de",
    name: "eBay Germany",
    country: "DE",
    homepage: "https://www.ebay.de",
    buildSearchUrl: (q) => `https://www.ebay.de/sch/i.html?_nkw=${enc(q)}`,
    verified: true,
  },
  {
    id: "vinted-fr",
    name: "Vinted (France)",
    country: "FR",
    homepage: "https://www.vinted.fr",
    buildSearchUrl: (q) => `https://www.vinted.fr/catalog?search_text=${enc(q)}`,
    verified: false,
    notes: "Vinted runs one domain per country with no cross-domain search; needs a domain per target market.",
  },
  {
    id: "vinted-de",
    name: "Vinted (Germany)",
    country: "DE",
    homepage: "https://www.vinted.de",
    buildSearchUrl: (q) => `https://www.vinted.de/catalog?search_text=${enc(q)}`,
    verified: false,
  },
];

export function platformsForCountry(country: CountryCode): Platform[] {
  return PLATFORMS.filter((p) => p.country === country);
}

/** Country codes that currently have at least one platform entry. */
export const SUPPORTED_COUNTRIES: CountryCode[] = Array.from(
  new Set(PLATFORMS.map((p) => p.country)),
);
