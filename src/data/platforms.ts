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
    notes:
      "curl check (2026-11-18): URL resolves (200) but it's a client-rendered SPA shell (~7KB, no listings in the HTML) — couldn't confirm the actual search results without a real browser.",
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
      "curl check (2026-11-18): URL resolves (200, ~850KB). Still unconfirmed whether it returns real results without a neighborhood/location context set — needs a real-browser check.",
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
      "curl check (2026-11-18): URL resolves (200, ~876KB) but no search-result markers found in the HTML — the iframe_url param looks like a legacy client-side pattern that doesn't actually filter server-side. Likely just lands on the cafe home page. Needs a different approach, not just a manual re-check.",
  },
  {
    id: "fruitsfamily",
    name: "Fruits Family",
    nativeName: "후르츠패밀리",
    country: "KR",
    homepage: "https://www.fruitsfamily.com",
    buildSearchUrl: (q) => `https://www.fruitsfamily.com/goods/search?keyword=${enc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): this exact path 404s. Homepage (200) didn't reveal the real search path via a quick scan — needs a manual look at the site to find the correct URL.",
  },

  // ---- Japan ----
  {
    id: "mercari-jp",
    name: "Mercari",
    country: "JP",
    homepage: "https://jp.mercari.com",
    buildSearchUrl: (q) => `https://jp.mercari.com/search?keyword=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~555KB of real listing content for the query.",
  },
  {
    id: "yahoo-auctions-jp",
    name: "Yahoo! Auctions",
    nativeName: "ヤフオク!",
    country: "JP",
    homepage: "https://auctions.yahoo.co.jp",
    buildSearchUrl: (q) => `https://auctions.yahoo.co.jp/search/search?p=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~483KB of real listing content for the query.",
  },

  // ---- United States ----
  {
    id: "ebay-us",
    name: "eBay",
    country: "US",
    homepage: "https://www.ebay.com",
    buildSearchUrl: (q) => `https://www.ebay.com/sch/i.html?_nkw=${enc(q)}`,
    verified: true,
    notes:
      "Same pattern RADAR already uses in production. curl check (2026-11-18) got 403 here, but that's eBay's bot protection blocking a scripted/datacenter request, not the URL pattern being wrong — real browser traffic (RADAR) already confirms it works.",
  },
  {
    id: "facebook-marketplace-us",
    name: "Facebook Marketplace",
    country: "US",
    homepage: "https://www.facebook.com/marketplace",
    buildSearchUrl: (q) => `https://www.facebook.com/marketplace/search/?query=${enc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): 400 Bad Request. Marketplace search generally requires a logged-in Facebook session too — needs a real logged-in-browser check, not just a URL fix.",
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
      "Craigslist is subdomain-per-city; `opts.city` must be resolved from the user's selected region before building the link. Defaults to newyork. curl check (2026-11-18): 200, ~138KB of real listing content.",
  },

  // ---- India ----
  {
    id: "olx-in",
    name: "OLX India",
    country: "IN",
    homepage: "https://www.olx.in",
    buildSearchUrl: (q) => `https://www.olx.in/items/q-${enc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): connection to olx.in timed out repeatedly from this environment (proxy tunnel opened fine, origin never responded) — likely blocks this network's egress IP range. Needs checking from a different network/real browser.",
  },
  {
    id: "quikr-in",
    name: "Quikr",
    country: "IN",
    homepage: "https://www.quikr.com",
    buildSearchUrl: (q) => `https://www.quikr.com/${enc(q)}`,
    verified: false,
    notes:
      "Quikr's URL shape varies by category; generic query path needs manual confirmation. curl check (2026-11-18): 403 (bot-blocked or wrong path, can't tell which from this signal alone).",
  },

  // ---- Indonesia ----
  {
    id: "olx-id",
    name: "OLX Indonesia",
    country: "ID",
    homepage: "https://www.olx.co.id",
    buildSearchUrl: (q) => `https://www.olx.co.id/search?q=${enc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): same timeout behavior as olx.in — likely the same network-level block, not necessarily a wrong URL pattern.",
  },

  // ---- Europe (per-market domains; see notes) ----
  {
    id: "ebay-gb",
    name: "eBay UK",
    country: "GB",
    homepage: "https://www.ebay.co.uk",
    buildSearchUrl: (q) => `https://www.ebay.co.uk/sch/i.html?_nkw=${enc(q)}`,
    verified: true,
    notes:
      "Same tested eBay pattern, UK domain. curl check (2026-11-18): 403, same bot-protection signal as the US domain — not a sign the pattern is wrong.",
  },
  {
    id: "ebay-de",
    name: "eBay Germany",
    country: "DE",
    homepage: "https://www.ebay.de",
    buildSearchUrl: (q) => `https://www.ebay.de/sch/i.html?_nkw=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 403, same bot-protection signal as the other eBay domains.",
  },
  {
    id: "vinted-fr",
    name: "Vinted (France)",
    country: "FR",
    homepage: "https://www.vinted.fr",
    buildSearchUrl: (q) => `https://www.vinted.fr/catalog?search_text=${enc(q)}`,
    verified: true,
    notes:
      "Vinted runs one domain per country with no cross-domain search; needs a domain per target market. curl check (2026-11-18): 200, ~3.76MB of real listing content for the query.",
  },
  {
    id: "vinted-de",
    name: "Vinted (Germany)",
    country: "DE",
    homepage: "https://www.vinted.de",
    buildSearchUrl: (q) => `https://www.vinted.de/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.73MB of real listing content for the query.",
  },
];

export function platformsForCountry(country: CountryCode): Platform[] {
  return PLATFORMS.filter((p) => p.country === country);
}

/** Country codes that currently have at least one platform entry. */
export const SUPPORTED_COUNTRIES: CountryCode[] = Array.from(
  new Set(PLATFORMS.map((p) => p.country)),
);
