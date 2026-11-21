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
  // ---- Added for the worldwide expansion; platform data for these is
  // filled in incrementally (see SUPPORTED_COUNTRIES for what's live) ----
  | "CN" // China
  | "TW" // Taiwan
  | "HK" // Hong Kong
  | "SG" // Singapore
  | "MY" // Malaysia
  | "TH" // Thailand
  | "VN" // Vietnam
  | "PH" // Philippines
  | "PK" // Pakistan
  | "BD" // Bangladesh
  | "LK" // Sri Lanka
  | "SA" // Saudi Arabia
  | "TR" // Turkey
  | "IL" // Israel
  | "QA" // Qatar
  | "ES" // Spain
  | "IT" // Italy
  | "NL" // Netherlands
  | "BE" // Belgium
  | "CH" // Switzerland
  | "AT" // Austria
  | "PT" // Portugal
  | "IE" // Ireland
  | "SE" // Sweden
  | "NO" // Norway
  | "DK" // Denmark
  | "FI" // Finland
  | "PL" // Poland
  | "CZ" // Czech Republic
  | "RO" // Romania
  | "GR" // Greece
  | "RU" // Russia
  | "UA" // Ukraine
  | "CA" // Canada
  | "MX" // Mexico
  | "BR" // Brazil
  | "AR" // Argentina
  | "CL" // Chile
  | "CO" // Colombia
  | "PE" // Peru
  | "ZA" // South Africa
  | "NG" // Nigeria
  | "EG" // Egypt
  | "KE" // Kenya
  | "MA" // Morocco
  | "AU" // Australia
  | "NZ" // New Zealand
  // ---- Second expansion round ----
  | "HU" // Hungary
  | "HR" // Croatia
  | "SK" // Slovakia
  | "SI" // Slovenia
  | "BG" // Bulgaria
  | "RS" // Serbia
  | "LT" // Lithuania
  | "LV" // Latvia
  | "EE" // Estonia
  | "IS" // Iceland
  | "LU" // Luxembourg
  | "CY" // Cyprus
  | "JO" // Jordan
  | "LB" // Lebanon
  | "KW" // Kuwait
  | "BH" // Bahrain
  | "OM" // Oman
  | "IQ" // Iraq
  | "KZ" // Kazakhstan
  | "AZ" // Azerbaijan
  | "GE" // Georgia
  | "NP" // Nepal
  | "MM" // Myanmar
  | "KH" // Cambodia
  | "LA" // Laos
  | "MN" // Mongolia
  | "GH" // Ghana
  | "TZ" // Tanzania
  | "UG" // Uganda
  | "ET" // Ethiopia
  | "DZ" // Algeria
  | "TN" // Tunisia
  | "ZW" // Zimbabwe
  | "ZM" // Zambia
  | "SN" // Senegal
  | "CI" // Ivory Coast
  | "CM" // Cameroon
  | "EC" // Ecuador
  | "VE" // Venezuela
  | "UY" // Uruguay
  | "PY" // Paraguay
  | "BO" // Bolivia
  | "GT" // Guatemala
  | "CR" // Costa Rica
  | "PA" // Panama
  | "DO"; // Dominican Republic

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

const cleanQuery = (q: string) => q.trim().replace(/\s+/g, " ");
const enc = (q: string) => encodeURIComponent(cleanQuery(q));
/** Path-segment encoder: strips slashes/fragments so special chars never emit // or %2F 400s. */
const pathEnc = (q: string) =>
  encodeURIComponent(
    cleanQuery(q)
      .replace(/[/\\?#]+/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
/** Hyphen-slug encoder for OLX, Gumtree, Kijiji, MercadoLibre, and Dubizzle path URLs. */
const slugEnc = (q: string) =>
  encodeURIComponent(
    cleanQuery(q)
      .replace(/[/\\?#]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[\s-]+/g, "-"),
  );
/** Plus-joined encoder for Marktplaats, 2dehands, and Encuentra24 multi-word URLs. */
const plusEnc = (q: string) =>
  cleanQuery(q)
    .replace(/[/\\?#]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("+");

function wrapSearchUrl(
  homepage: string,
  builder: (q: string, opts?: Record<string, string>) => string,
): (q: string, opts?: Record<string, string>) => string {
  return (q, opts) => {
    const trimmed = cleanQuery(q);
    if (!trimmed) return homepage;
    const built = builder(trimmed, opts);
    const afterProto = built.slice(built.indexOf("://") + 3);
    const [pathPart, queryPart] = afterProto.split("?");
    if (
      afterProto.includes("//") ||
      /\/s-\/k0$/.test(pathPart) ||
      /\/b-canada\/\/k0l0$/.test(pathPart) ||
      (queryPart === undefined &&
        (/\/(q-|s-|@|search|hledej|k|s|q)\/?$/.test(pathPart) ||
          /^(listado|lista)\.mercadoli[bv]re\.[^/]+\/$/.test(pathPart))) ||
      (queryPart !== undefined &&
        (/(?:^|&)[^=]+=(?:&|$)/.test(queryPart) || /(?:^|&)q=keyword\.(?:&|$)/.test(queryPart)))
    ) {
      return homepage;
    }
    return built;
  };
}

const RAW_PLATFORMS: Platform[] = [
  // ---- Korea ----
  {
    id: "bunjang",
    name: "Bunjang",
    nativeName: "번개장터",
    country: "KR",
    homepage: "https://m.bunjang.co.kr",
    buildSearchUrl: (q) =>
      `https://m.bunjang.co.kr/search/products?order=date&q=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): real listings with prices (e.g. 닥터마틴 로니 힐 첼시 부츠, 49,000원).",
  },
  {
    id: "daangn",
    name: "Karrot (Danggeun Market)",
    nativeName: "당근마켓",
    country: "KR",
    homepage: "https://www.daangn.com",
    buildSearchUrl: (q) => `https://www.daangn.com/search/${pathEnc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-19): confirmed working — title and listing cards (titles + prices, e.g. \"나이키 운동화 새제품\" / \"10,000원\") are rendered server-side for the query, with no location context needed.",
  },
  {
    id: "joonggonara",
    name: "Joonggonara",
    nativeName: "중고나라",
    country: "KR",
    homepage: "https://web.joongna.com",
    buildSearchUrl: (q) => `https://web.joongna.com/search/${pathEnc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-19): switched from the old Naver Cafe (cafe.naver.com/joonggonara, confirmed non-functional — fully client-rendered, no server-side search) to Joonggonara's own standalone web app at web.joongna.com. The /search/{query} path is confirmed working: query-specific <title> and real listing prices (e.g. \"74,013원\") present in the server-rendered payload.",
  },
  {
    id: "fruitsfamily",
    name: "Fruits Family",
    nativeName: "후르츠패밀리",
    country: "KR",
    homepage: "https://www.fruitsfamily.com",
    buildSearchUrl: (q) => `https://www.fruitsfamily.com/search/${pathEnc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): used the site's own search box and read window.location after it navigated — the actual pattern is path-based (/search/{query}), not the ?keyword= guess from the earlier curl-only pass. Confirmed real shoe listings render for \"신발\".",
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
    buildSearchUrl: (q) => `https://www.facebook.com/marketplace/search?query=${enc(q)}`,
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
    buildSearchUrl: (q) => `https://www.olx.in/items/q-${slugEnc(q)}`,
    verified: false,
    notes:
      "Likely foreign-access restricted, not a URL problem: real-browser check (2026-11-19) got \"Access Denied\" (Akamai edge block, reference #18.a6023517...) on the bare homepage itself — confirmed independently from two different networks/countries, not just this automation. OLX India appears to reject non-Indian traffic at the edge. May work fine for users actually browsing from India.",
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

  // ======== Worldwide expansion (researched 2026-11-18) ========

  // ---- China ----
  {
    id: "xianyu-cn",
    name: "Xianyu (Goofish)",
    nativeName: "闲鱼",
    country: "CN",
    homepage: "https://www.goofish.com",
    buildSearchUrl: (q) => `https://www.goofish.com/search?q=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): the URL pattern is correct and renders results (confirmed with a Chinese query, title \"鞋子_闲鱼\" / results loading). The earlier \"no results\" read was just an English test query on a Chinese-only platform, not a broken URL — this one only returns results for Chinese-language search terms, same as any other non-English-market site.",
  },

  // ---- Taiwan ----
  {
    id: "ruten-tw",
    name: "Ruten",
    nativeName: "露天拍賣",
    country: "TW",
    homepage: "https://www.ruten.com.tw",
    buildSearchUrl: (q) => `https://www.ruten.com.tw/search/${pathEnc(q)}/`,
    verified: false,
    notes:
      "curl + WebFetch check (2026-11-18): 403 with cf-mitigated: challenge (Cloudflare bot-protection), not evidence the URL pattern is wrong. Ruten (PChome/eBay joint venture) is Taiwan's largest general C2C auction/secondhand site.",
  },
  {
    id: "carousell-tw",
    name: "Carousell",
    country: "TW",
    homepage: "https://tw.carousell.com",
    buildSearchUrl: (q) => `https://tw.carousell.com/search/${pathEnc(q)}/`,
    verified: false,
    notes: "curl check (2026-11-18): 403, Cloudflare challenge — not a wrong URL.",
  },

  // ---- Hong Kong ----
  {
    id: "carousell-hk",
    name: "Carousell",
    country: "HK",
    homepage: "https://www.carousell.com.hk",
    buildSearchUrl: (q) => `https://www.carousell.com.hk/search/${pathEnc(q)}/`,
    verified: false,
    notes:
      "curl + WebFetch check (2026-11-18): 403, cf-mitigated: challenge — Cloudflare bot-protection, not evidence the pattern is wrong. Carousell is the dominant general secondhand marketplace in Hong Kong.",
  },

  // ---- Singapore ----
  {
    id: "carousell-sg",
    name: "Carousell",
    country: "SG",
    homepage: "https://www.carousell.sg",
    buildSearchUrl: (q) => `https://www.carousell.sg/search/${pathEnc(q)}/`,
    verified: false,
    notes: "curl check (2026-11-18): 403, Cloudflare challenge. Carousell is Singapore-founded and the clear market leader there.",
  },

  // ---- Malaysia ----
  {
    id: "mudah-my",
    name: "Mudah.my",
    country: "MY",
    homepage: "https://www.mudah.my",
    buildSearchUrl: (q) => `https://www.mudah.my/malaysia/for-sale?q=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~526KB, 547 occurrences of 'iphone' in server-rendered HTML — confirmed real search-result listings.",
  },
  {
    id: "carousell-my",
    name: "Carousell",
    country: "MY",
    homepage: "https://www.carousell.com.my",
    buildSearchUrl: (q) => `https://www.carousell.com.my/search/${pathEnc(q)}/`,
    verified: false,
    notes: "curl check (2026-11-18): 403, same Cloudflare challenge signal as other Carousell domains.",
  },

  // ---- Thailand ----
  {
    id: "kaidee-th",
    name: "Kaidee",
    country: "TH",
    homepage: "https://www.kaidee.com",
    buildSearchUrl: (q) => `https://www.kaidee.com/search?q=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): real listings render with prices (e.g. Adidas Running Shoes, ฿143).",
  },

  // ---- Vietnam ----
  {
    id: "chotot-vn",
    name: "Cho Tot",
    nativeName: "Chợ Tốt",
    country: "VN",
    homepage: "https://www.chotot.com",
    buildSearchUrl: (q) => `https://www.chotot.com/mua-ban?q=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~601KB, 290 occurrences of 'iphone' in server-rendered HTML — confirmed real listings. Now part of Carousell Group.",
  },

  // ---- Philippines ----
  {
    id: "carousell-ph",
    name: "Carousell",
    country: "PH",
    homepage: "https://www.carousell.ph",
    buildSearchUrl: (q) => `https://www.carousell.ph/search/${pathEnc(q)}/`,
    verified: false,
    notes:
      "curl check (2026-11-18): 403, Cloudflare challenge. Carousell acquired OLX Philippines in 2019 and is now the dominant general secondhand marketplace there.",
  },

  // ---- Pakistan ----
  {
    id: "olx-pk",
    name: "OLX Pakistan",
    country: "PK",
    homepage: "https://www.olx.com.pk",
    buildSearchUrl: (q) => `https://www.olx.com.pk/items/q-${slugEnc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): 503 'Security check | OLX' — OLX's own anti-bot challenge page, not a wrong-URL signal. Same /items/q- pattern already used for olx-in and olx-id.",
  },

  // ---- Bangladesh ----
  {
    id: "bikroy-bd",
    name: "Bikroy",
    country: "BD",
    homepage: "https://bikroy.com",
    buildSearchUrl: (q) => `https://bikroy.com/en/ads?q=${enc(q)}`,
    verified: false,
    notes:
      "Bikroy is Bangladesh's dominant classifieds marketplace (absorbed OLX's BD operations years ago). curl check (2026-11-18): 403, Cloudflare JS challenge — bot-blocked, not a URL-pattern problem.",
  },

  // ---- Sri Lanka ----
  {
    id: "ikman-lk",
    name: "ikman.lk",
    country: "LK",
    homepage: "https://ikman.lk",
    buildSearchUrl: (q) => `https://ikman.lk/en/ads?query=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~808KB, confirmed real search-result markup — multiple price fields and 269 occurrences of the query term.",
  },

  // ---- Saudi Arabia ----
  {
    id: "haraj-sa",
    name: "Haraj",
    nativeName: "حراج",
    country: "SA",
    homepage: "https://haraj.com.sa",
    buildSearchUrl: (q) => `https://haraj.com.sa/search/${pathEnc(q)}/`,
    verified: true,
    notes:
      "Haraj is one of Saudi Arabia's biggest general classifieds sites. curl check (2026-11-18): 200, ~271KB, confirmed real results — real post titles and SAR-currency markup. URL needs the trailing slash (site 302-redirects /search/{q} to /search/{q}/).",
  },

  // ---- Turkey ----
  {
    id: "sahibinden-tr",
    name: "Sahibinden",
    country: "TR",
    homepage: "https://www.sahibinden.com",
    buildSearchUrl: (q) => `https://www.sahibinden.com/kelime-ile-arama?query_text=${enc(q)}`,
    verified: false,
    notes:
      "Sahibinden is Turkey's dominant classifieds/marketplace platform (general keyword-search path confirmed via public docs). Confirmed foreign-access restricted, not a URL problem: real-browser check (2026-11-19) showed an explicit message — \"You need to sign in to access sahibinden.com from outside Turkey.\" This is the clearest confirmed case of the pattern: works fine for users actually in Turkey, geo-gated behind login everywhere else.",
  },

  // ---- Israel ----
  {
    id: "yad2-il",
    name: "Yad2",
    nativeName: "יד2",
    country: "IL",
    homepage: "https://www.yad2.co.il",
    buildSearchUrl: (q) => `https://www.yad2.co.il/products/all?txt=${enc(q)}`,
    verified: false,
    notes:
      "Yad2 is Israel's dominant classifieds site; its secondhand-goods vertical is under /products/{category} with a free-text 'txt' param. Likely foreign-access restricted, not a URL problem: real-browser check (2026-11-19) got a plain \"403 Forbidden\" (Akamai-style, with a transaction ID) on the bare homepage itself — confirmed independently from two different networks/countries. Yad2 appears to reject non-Israeli traffic at the edge. May work fine for users actually browsing from Israel.",
  },

  // ---- Qatar ----
  {
    id: "opensooq-qa",
    name: "OpenSooq Qatar",
    country: "QA",
    homepage: "https://qa.opensooq.com",
    buildSearchUrl: (q) => `https://qa.opensooq.com/en/find?term=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~1.0MB, confirmed real results — serp-listing markup present, 364 occurrences of the query, real listing titles. The naive /en/search?search= path returns 410 Gone — correct path is /en/find?term=.",
  },

  // ---- Spain ----
  {
    id: "vinted-es",
    name: "Vinted (Spain)",
    country: "ES",
    homepage: "https://www.vinted.es",
    buildSearchUrl: (q) => `https://www.vinted.es/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.70MB, hundreds of real listing matches — same confirmed pattern as vinted-fr/vinted-de.",
  },
  {
    id: "wallapop-es",
    name: "Wallapop",
    country: "ES",
    homepage: "https://es.wallapop.com",
    buildSearchUrl: (q) => `https://es.wallapop.com/search?keywords=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): real listings with titles/prices, e.g. \"Zapatillas Nike Air TN...\" 60€.",
  },

  // ---- Italy ----
  {
    id: "vinted-it",
    name: "Vinted (Italy)",
    country: "IT",
    homepage: "https://www.vinted.it",
    buildSearchUrl: (q) => `https://www.vinted.it/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.71MB of real listing content for the query.",
  },
  {
    id: "subito-it",
    name: "Subito",
    country: "IT",
    homepage: "https://www.subito.it",
    buildSearchUrl: (q) => `https://www.subito.it/annunci-italia/vendita/usato/?q=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-19): confirmed working — 33 real listing cards for the query, with city tags (e.g. \"Roma (RM)\"). The earlier 403 was Akamai blocking that specific request's UA string, not the URL pattern; real browser traffic isn't affected.",
  },

  // ---- Netherlands ----
  {
    id: "marktplaats-nl",
    name: "Marktplaats",
    country: "NL",
    homepage: "https://www.marktplaats.nl",
    buildSearchUrl: (q) => `https://www.marktplaats.nl/q/${plusEnc(q)}/`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~942KB, 1664 occurrences of 'iphone' — clearly real server-rendered search results.",
  },
  {
    id: "vinted-nl",
    name: "Vinted (Netherlands)",
    country: "NL",
    homepage: "https://www.vinted.nl",
    buildSearchUrl: (q) => `https://www.vinted.nl/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.75MB, 969 occurrences of 'iphone' — real listing content.",
  },

  // ---- Belgium ----
  {
    id: "2dehands-be",
    name: "2dehands",
    nativeName: "2dehands / 2ememain",
    country: "BE",
    homepage: "https://www.2dehands.be",
    buildSearchUrl: (q) => `https://www.2dehands.be/q/${plusEnc(q)}/`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~812KB, 1209 occurrences of 'iphone' — real listing content. Same company (Adevinta) also runs the French-language mirror site 2ememain.be.",
  },
  {
    id: "vinted-be",
    name: "Vinted (Belgium)",
    country: "BE",
    homepage: "https://www.vinted.be",
    buildSearchUrl: (q) => `https://www.vinted.be/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.82MB, 930 occurrences of 'iphone' — real listing content.",
  },

  // ---- Switzerland ----
  {
    id: "tutti-ch",
    name: "Tutti",
    country: "CH",
    homepage: "https://www.tutti.ch",
    buildSearchUrl: (q) => `https://www.tutti.ch/de/q/${pathEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 403, response body explicitly contains CAPTCHA/BOT text — confirmed bot-protection challenge.",
  },
  {
    id: "ricardo-ch",
    name: "Ricardo",
    country: "CH",
    homepage: "https://www.ricardo.ch",
    buildSearchUrl: (q) => `https://www.ricardo.ch/de/s/${pathEnc(q)}`,
    verified: true,
    notes: "Real-browser check (2026-11-19): 158,672 results for the query; real listings with prices, e.g. \"Nike Air Force 1 MID 44\" CHF 99.",
  },

  // ---- Austria ----
  {
    id: "vinted-at",
    name: "Vinted (Austria)",
    country: "AT",
    homepage: "https://www.vinted.at",
    buildSearchUrl: (q) => `https://www.vinted.at/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.71MB, 1017 occurrences of 'iphone' — real listing content.",
  },
  {
    id: "willhaben-at",
    name: "willhaben",
    country: "AT",
    homepage: "https://www.willhaben.at",
    buildSearchUrl: (q) =>
      `https://www.willhaben.at/iad/kaufen-und-verkaufen/marktplatz?keyword=${enc(q)}`,
    verified: true,
    notes: "Real-browser check (2026-11-19): 4,687 Anzeigen with shoe-specific filters (Schuhgröße); real listings e.g. \"Damen Stiefletten Gr.41\" €25.",
  },

  // ---- Portugal ----
  {
    id: "olx-pt",
    name: "OLX Portugal",
    country: "PT",
    homepage: "https://www.olx.pt",
    buildSearchUrl: (q) => `https://www.olx.pt/ads/q-${slugEnc(q)}/`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~2.3MB, 1040 occurrences of 'iphone' — confirmed real listing content.",
  },
  {
    id: "vinted-pt",
    name: "Vinted (Portugal)",
    country: "PT",
    homepage: "https://www.vinted.pt",
    buildSearchUrl: (q) => `https://www.vinted.pt/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.72MB, 1000 occurrences of 'iphone' — real listing content.",
  },

  // ---- Ireland ----
  {
    id: "donedeal-ie",
    name: "DoneDeal",
    country: "IE",
    homepage: "https://www.donedeal.ie",
    buildSearchUrl: (q) => `https://www.donedeal.ie/all?words=${enc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 403 on search path and homepage, title 'Page Unavailable' — whole-site bot protection.",
  },
  {
    id: "adverts-ie",
    name: "Adverts.ie",
    country: "IE",
    homepage: "https://www.adverts.ie",
    buildSearchUrl: (q) => `https://www.adverts.ie/find?searchtext=${enc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): same signature as DoneDeal — 403, whole-site bot protection.",
  },

  // ---- Poland ----
  {
    id: "olx-pl",
    name: "OLX Poland",
    country: "PL",
    homepage: "https://www.olx.pl",
    buildSearchUrl: (q) => `https://www.olx.pl/oferty/q-${slugEnc(q)}/`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~4.2MB, 1,143 occurrences of 'iphone' — real server-rendered listings.",
  },
  {
    id: "allegro-lokalnie-pl",
    name: "Allegro Lokalnie",
    country: "PL",
    homepage: "https://allegrolokalnie.pl",
    buildSearchUrl: (q) => `https://allegrolokalnie.pl/oferty/q/${pathEnc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~1.2MB, 385 occurrences of 'iphone' — real listing content. Allegro's local-classifieds spinoff.",
  },

  // ---- Czech Republic ----
  {
    id: "bazos-cz",
    name: "Bazoš",
    nativeName: "Bazoš.cz",
    country: "CZ",
    homepage: "https://www.bazos.cz",
    buildSearchUrl: (q) => `https://www.bazos.cz/search.php?hledat=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~80KB, 197 occurrences of 'iphone' — real results on this long-standing site.",
  },
  {
    id: "sbazar-cz",
    name: "Sbazar",
    nativeName: "Sbazar.cz",
    country: "CZ",
    homepage: "https://www.sbazar.cz",
    buildSearchUrl: (q) => `https://www.sbazar.cz/hledej/${pathEnc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~1.0MB, 563 occurrences of 'iphone', live result-count in meta description — confirmed real.",
  },

  // ---- Romania ----
  {
    id: "olx-ro",
    name: "OLX Romania",
    country: "RO",
    homepage: "https://www.olx.ro",
    buildSearchUrl: (q) => `https://www.olx.ro/oferte/q-${slugEnc(q)}/`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~4.1MB, 1,178 occurrences of 'iphone' — real listing content.",
  },
  {
    id: "publi24-ro",
    name: "Publi24",
    country: "RO",
    homepage: "https://www.publi24.ro",
    buildSearchUrl: (q) => `https://www.publi24.ro/anunturi/?cuv=${enc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 403 Forbidden bot-protection block, not confirmed as a wrong URL pattern.",
  },

  // ---- Greece ----
  {
    id: "vendora-gr",
    name: "Vendora",
    country: "GR",
    homepage: "https://www.vendora.gr",
    buildSearchUrl: (q) => `https://vendora.gr/items?q=${enc(q)}`,
    verified: true,
    notes:
      "Greece has no OLX presence; Vendora.gr is described as Greece's largest general secondhand marketplace (500k+ listings). curl check (2026-11-18): 200, ~216KB, 306 occurrences of 'iphone' — real results.",
  },

  // ---- Sweden ----
  {
    id: "blocket-se",
    name: "Blocket",
    country: "SE",
    homepage: "https://www.blocket.se",
    buildSearchUrl: (q) => `https://www.blocket.se/annonser/hela_sverige?q=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~894KB, 194 occurrences of 'iphone' — real results on Sweden's dominant classifieds site.",
  },

  // ---- Norway ----
  {
    id: "finn-no",
    name: "FINN.no",
    country: "NO",
    homepage: "https://www.finn.no",
    buildSearchUrl: (q) => `https://www.finn.no/bap/forsale/search.html?q=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~922KB, real search-ad-card markup confirmed in the HTML.",
  },

  // ---- Denmark ----
  {
    id: "dba-dk",
    name: "DBA",
    nativeName: "Den Blå Avis",
    country: "DK",
    homepage: "https://www.dba.dk",
    buildSearchUrl: (q) => `https://www.dba.dk/recommerce/forsale/search?q=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~1.0MB, 220 occurrences of 'iphone' — confirmed real results.",
  },

  // ---- Finland ----
  {
    id: "tori-fi",
    name: "Tori",
    nativeName: "Tori.fi",
    country: "FI",
    homepage: "https://www.tori.fi",
    buildSearchUrl: (q) => `https://www.tori.fi/recommerce/forsale/search?q=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~1.4MB, 197 occurrences of 'iphone' — real results (Adevinta/Schibsted-owned, same shape as FINN.no/DBA).",
  },

  // ---- Russia ----
  {
    id: "avito-ru",
    name: "Avito",
    nativeName: "Авито",
    country: "RU",
    homepage: "https://www.avito.ru",
    buildSearchUrl: (q) => `https://www.avito.ru/rossiya?q=${enc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): 429 with an explicit 'Доступ ограничен: проблема с IP' (access restricted — IP issue) block page, reproduced on retry. Hard bot/IP block from this network, not a URL-pattern problem.",
  },

  // ---- Ukraine ----
  {
    id: "olx-ua",
    name: "OLX Ukraine",
    nativeName: "OLX Україна",
    country: "UA",
    homepage: "https://www.olx.ua",
    buildSearchUrl: (q) => `https://www.olx.ua/list/q-${slugEnc(q)}/`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.4MB, 52 real listing cards and 272+ 'iPhone' mentions in the result body.",
  },

  // ---- Canada ----
  {
    id: "kijiji-ca",
    name: "Kijiji",
    country: "CA",
    homepage: "https://www.kijiji.ca",
    buildSearchUrl: (q) => `https://www.kijiji.ca/b-canada/${slugEnc(q)}/k0l0`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~417KB. Page title reads '15,245 ads for iphone in All Categories in Canada | Kijiji Marketplaces', real listing-card markup.",
  },

  // ---- Mexico ----
  {
    id: "mercadolibre-mx",
    name: "Mercado Libre",
    country: "MX",
    homepage: "https://www.mercadolibre.com.mx",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.mx/${slugEnc(q)}`,
    verified: false,
    notes:
      "URL shape is MercadoLibre's documented public search pattern. curl check (2026-11-18): 200, ~24-26KB, but the HTML is MercadoLibre's 'suspicious-traffic-frontend' soft-block shell, not real search results — needs a real browser session.",
  },

  // ---- Brazil ----
  {
    id: "mercadolivre-br",
    name: "Mercado Livre",
    country: "BR",
    homepage: "https://www.mercadolivre.com.br",
    buildSearchUrl: (q) => `https://lista.mercadolivre.com.br/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~42KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },

  // ---- Argentina ----
  {
    id: "mercadolibre-ar",
    name: "Mercado Libre Argentina",
    country: "AR",
    homepage: "https://www.mercadolibre.com.ar",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.ar/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~42KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },

  // ---- Chile ----
  {
    id: "mercadolibre-cl",
    name: "Mercado Libre Chile",
    country: "CL",
    homepage: "https://www.mercadolibre.cl",
    buildSearchUrl: (q) => `https://listado.mercadolibre.cl/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },

  // ---- Colombia ----
  {
    id: "mercadolibre-co",
    name: "Mercado Libre Colombia",
    country: "CO",
    homepage: "https://www.mercadolibre.com.co",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.co/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },

  // ---- Peru ----
  {
    id: "mercadolibre-pe",
    name: "Mercado Libre",
    country: "PE",
    homepage: "https://www.mercadolibre.com.pe",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.pe/${slugEnc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): homepage fine (200, ~390KB), but the listado subdomain redirects to an account-verification bot-check page, same signature as eBay elsewhere in this file. URL shape itself is MercadoLibre's documented convention.",
  },

  // ---- South Africa ----
  {
    id: "gumtree-za",
    name: "Gumtree South Africa",
    country: "ZA",
    homepage: "https://www.gumtree.co.za",
    buildSearchUrl: (q) => `https://www.gumtree.co.za/s-${slugEnc(q)}/k0`,
    verified: false,
    notes:
      "OLX South Africa was permanently shut down by Naspers in Feb 2022 (confirmed: olx.co.za now serves a static shutdown notice). Gumtree South Africa is the long-standing dominant general classifieds site instead. curl check (2026-11-18): 403, Cloudflare challenge — bot-blocked.",
  },

  // ---- Nigeria ----
  {
    id: "jiji-ng",
    name: "Jiji Nigeria",
    country: "NG",
    homepage: "https://jiji.ng",
    buildSearchUrl: (q) => `https://jiji.ng/search?query=${enc(q)}`,
    verified: false,
    notes:
      "OLX Nigeria shut down Feb 2018 and sold its business to Jiji, now the dominant general classifieds marketplace there. curl check (2026-11-18): 403, Cloudflare challenge — bot-blocked.",
  },

  // ---- Egypt ----
  {
    id: "dubizzle-eg",
    name: "Dubizzle Egypt",
    country: "EG",
    homepage: "https://www.dubizzle.com.eg/en/",
    buildSearchUrl: (q) => `https://www.dubizzle.com.eg/en/cairo/q-${slugEnc(q)}/`,
    verified: false,
    notes:
      "OLX Egypt was rebranded to Dubizzle Egypt; the OLX brand no longer represents the live site. curl check (2026-11-18): 503 'Security check | Dubizzle' JS-challenge on every path tried — bot-blocked. Search is location-scoped by design; 'cairo' used as a default.",
  },

  // ---- Kenya ----
  {
    id: "jiji-ke",
    name: "Jiji Kenya",
    country: "KE",
    homepage: "https://jiji.co.ke",
    buildSearchUrl: (q) => `https://jiji.co.ke/search?query=${enc(q)}`,
    verified: false,
    notes:
      "OLX Kenya shut down Feb 2018; its business was acquired by Jiji, now the dominant general classifieds marketplace there. curl check (2026-11-18): 403, Cloudflare challenge — bot-blocked.",
  },

  // ---- Morocco ----
  {
    id: "avito-ma",
    name: "Avito",
    country: "MA",
    homepage: "https://www.avito.ma",
    buildSearchUrl: (q) => `https://www.avito.ma/fr/maroc?q=${enc(q)}`,
    verified: false,
    notes:
      "Avito.ma is Morocco's dominant classifieds/secondhand site by far. curl check (2026-11-18): 403, Cloudflare challenge on homepage and search URL — bot-blocked.",
  },

  // ---- Australia ----
  {
    id: "gumtree-au",
    name: "Gumtree Australia",
    country: "AU",
    homepage: "https://www.gumtree.com.au",
    buildSearchUrl: (q) => `https://www.gumtree.com.au/s-${slugEnc(q)}/k0`,
    verified: true,
    notes: "Real-browser check (2026-11-19): real listings with prices, e.g. \"Nike, Adidas, ASIC sports shoes new\" $85.",
  },

  // ---- New Zealand ----
  {
    id: "trademe-nz",
    name: "Trade Me",
    country: "NZ",
    homepage: "https://www.trademe.co.nz",
    buildSearchUrl: (q) => `https://www.trademe.co.nz/a/marketplace/search?search_string=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): 83,536 results for the query with a category breakdown.",
  },

  // ======== Second expansion round (researched 2026-11-18) ========

  // ---- Hungary ----
  {
    id: "jofogas-hu",
    name: "Jófogás",
    country: "HU",
    homepage: "https://www.jofogas.hu",
    buildSearchUrl: (q) => `https://www.jofogas.hu/magyarorszag?q=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~893KB, 828 occurrences of 'iphone' — confirmed real listings.",
  },
  {
    id: "vinted-hu",
    name: "Vinted (Hungary)",
    country: "HU",
    homepage: "https://www.vinted.hu",
    buildSearchUrl: (q) => `https://www.vinted.hu/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.71MB, 1026 occurrences of 'iphone' — real listing content.",
  },

  // ---- Croatia ----
  {
    id: "njuskalo-hr",
    name: "Njuškalo",
    country: "HR",
    homepage: "https://www.njuskalo.hr",
    buildSearchUrl: (q) => `https://www.njuskalo.hr/search/?keywords=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): 874 oglasa (results) with real titles/prices.",
  },
  {
    id: "vinted-hr",
    name: "Vinted (Croatia)",
    country: "HR",
    homepage: "https://www.vinted.hr",
    buildSearchUrl: (q) => `https://www.vinted.hr/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.69MB, 1037 occurrences of 'iphone' — real listing content.",
  },

  // ---- Slovakia ----
  {
    id: "bazos-sk",
    name: "Bazoš",
    nativeName: "Bazoš.sk",
    country: "SK",
    homepage: "https://www.bazos.sk",
    buildSearchUrl: (q) => `https://www.bazos.sk/search.php?hledat=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~81KB, 201 occurrences of 'iphone' — same confirmed pattern as the Czech Bazoš entry.",
  },
  {
    id: "vinted-sk",
    name: "Vinted (Slovakia)",
    country: "SK",
    homepage: "https://www.vinted.sk",
    buildSearchUrl: (q) => `https://www.vinted.sk/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.71MB, 1039 occurrences of 'iphone' — real listing content.",
  },

  // ---- Slovenia ----
  {
    id: "bolha-si",
    name: "Bolha",
    nativeName: "Bolha.com",
    country: "SI",
    homepage: "https://www.bolha.com",
    buildSearchUrl: (q) => `https://www.bolha.com/search/?keywords=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~184KB, 344 occurrences of 'iphone' — Slovenia's dominant general classifieds site.",
  },
  {
    id: "vinted-si",
    name: "Vinted (Slovenia)",
    country: "SI",
    homepage: "https://www.vinted.si",
    buildSearchUrl: (q) => `https://www.vinted.si/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.69MB, 1023 occurrences of 'iphone' — real listing content.",
  },

  // ---- Bulgaria ----
  {
    id: "olx-bg",
    name: "OLX Bulgaria",
    country: "BG",
    homepage: "https://www.olx.bg",
    buildSearchUrl: (q) => `https://www.olx.bg/ads/q-${slugEnc(q)}/`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~2.2MB, 990 occurrences of 'iphone' — confirmed real listing content.",
  },
  {
    id: "vinted-bg",
    name: "Vinted (Bulgaria)",
    country: "BG",
    homepage: "https://www.vinted.bg",
    buildSearchUrl: (q) => `https://www.vinted.bg/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.74MB, 966 occurrences of 'iphone' — real listing content.",
  },

  // ---- Serbia ----
  {
    id: "olx-rs",
    name: "OLX Serbia",
    country: "RS",
    homepage: "https://www.olx.rs",
    buildSearchUrl: (q) => `https://www.olx.rs/artikli/q-${slugEnc(q)}/`,
    verified: false,
    notes:
      "curl check (2026-11-18): persistent 503 'Service Temporarily Unavailable' on repeated attempts — not evidence the pattern is wrong. No Vinted domain exists for Serbia.",
  },

  // ---- Lithuania ----
  {
    id: "vinted-lt",
    name: "Vinted (Lithuania)",
    country: "LT",
    homepage: "https://www.vinted.lt",
    buildSearchUrl: (q) => `https://www.vinted.lt/catalog?search_text=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~3.78MB, 1059 occurrences of 'iphone'. Vinted itself was founded in Vilnius, Lithuania in 2008.",
  },
  {
    id: "skelbiu-lt",
    name: "Skelbiu",
    nativeName: "Skelbiu.lt",
    country: "LT",
    homepage: "https://www.skelbiu.lt",
    buildSearchUrl: (q) => `https://www.skelbiu.lt/skelbimai/?q=${enc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 403 on homepage and search path — bot-blocked, couldn't confirm.",
  },

  // ---- Latvia ----
  {
    id: "vinted-lv",
    name: "Vinted (Latvia)",
    country: "LV",
    homepage: "https://www.vinted.lv",
    buildSearchUrl: (q) => `https://www.vinted.lv/catalog?search_text=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.73MB, 1081 occurrences of 'iphone' — real listing content.",
  },

  // ---- Estonia ----
  {
    id: "soov-ee",
    name: "Soov",
    nativeName: "Soov.ee",
    country: "EE",
    homepage: "https://www.soov.ee",
    buildSearchUrl: (q) => `https://soov.ee/listings.php?qs_keyword=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-19): confirmed working — the GET param does filter (e.g. \"shoes\" → 0 results, \"auto\" → results capped at 1000), contradicting the 2026-11-18 note that claimed it was POST-only.",
  },
  {
    id: "osta-ee",
    name: "Osta.ee",
    country: "EE",
    homepage: "https://www.osta.ee",
    buildSearchUrl: (q) => `https://www.osta.ee/?fuseaction=search.search&q%5Bq%5D=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): inspected the actual search form (name=\"q[q]\", GET, action=/?fuseaction=search.search) — the old /otsing?q= guess was wrong. Confirmed working: query-specific title and real listings.",
  },

  // ---- Iceland ----
  {
    id: "bland-is",
    name: "Bland.is",
    country: "IS",
    homepage: "https://bland.is",
    buildSearchUrl: (q) => `https://bland.is/classified/default.aspx?q=${enc(q)}&categoryId=0`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~291KB, 322 occurrences of 'iphone' — confirmed real results. Iceland's dominant general secondhand classifieds site since 2000.",
  },

  // ---- Luxembourg ----
  {
    id: "olux-lu",
    name: "Olux",
    country: "LU",
    homepage: "https://olux.lu/en",
    buildSearchUrl: (q) => `https://olux.lu/en/search?term=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~363KB, 255 occurrences of 'iphone' — confirmed real results.",
  },

  // ---- Cyprus ----
  {
    id: "bazaraki-cy",
    name: "Bazaraki",
    country: "CY",
    homepage: "https://www.bazaraki.com",
    buildSearchUrl: (q) => `https://www.bazaraki.com/search/?q=${enc(q)}`,
    verified: false,
    notes:
      "Cyprus's clear #1 general classifieds site. curl check (2026-11-18): Cloudflare challenge on every request — pattern confirmed real via a Wayback Machine snapshot of the actual search form, but live site blocked.",
  },

  // ---- Jordan ----
  {
    id: "opensooq-jo",
    name: "OpenSooq",
    country: "JO",
    homepage: "https://jo.opensooq.com/en",
    buildSearchUrl: (q) => `https://jo.opensooq.com/en/find?term=${enc(q)}`,
    verified: true,
    notes:
      "OpenSooq was founded in Amman in 2008 and is Jordan's largest classifieds marketplace. curl check (2026-11-18): 200, ~1.1MB, 525 occurrences of 'iphone' — confirmed real listings.",
  },

  // ---- Lebanon ----
  {
    id: "opensooq-lb",
    name: "OpenSooq",
    country: "LB",
    homepage: "https://lb.opensooq.com/en",
    buildSearchUrl: (q) => `https://lb.opensooq.com/en/find?term=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~692KB, 211 occurrences of 'iphone' — confirmed real results.",
  },
  {
    id: "olx-lb",
    name: "OLX Lebanon",
    country: "LB",
    homepage: "https://www.olx.com.lb/en/",
    buildSearchUrl: (q) => `https://www.olx.com.lb/en/ads/q-${slugEnc(q)}/`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): real listing present (Birkenstock Sandals, USD 250).",
  },

  // ---- Kuwait ----
  {
    id: "opensooq-kw",
    name: "OpenSooq",
    country: "KW",
    homepage: "https://kw.opensooq.com/en",
    buildSearchUrl: (q) => `https://kw.opensooq.com/en/find?term=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~1.07MB, 337 occurrences of 'iphone' — reported as Kuwait's #1 classifieds site.",
  },
  {
    id: "dubizzle-kw",
    name: "Dubizzle Kuwait",
    country: "KW",
    homepage: "https://www.dubizzle.com.kw/en/",
    buildSearchUrl: (q) => `https://www.dubizzle.com.kw/en/search/?q=${enc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 503, 'Security check | Dubizzle' bot-challenge — same signature as dubizzle-ae.",
  },

  // ---- Bahrain ----
  {
    id: "opensooq-bh",
    name: "OpenSooq",
    country: "BH",
    homepage: "https://bh.opensooq.com/en",
    buildSearchUrl: (q) => `https://bh.opensooq.com/en/find?term=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~1.0MB, 393 occurrences of 'iphone' — confirmed real results.",
  },
  {
    id: "dubizzle-bh",
    name: "Dubizzle Bahrain",
    country: "BH",
    homepage: "https://www.dubizzle.com.bh/en/",
    buildSearchUrl: (q) => `https://www.dubizzle.com.bh/en/search/?q=${enc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 503, same 'Security check | Dubizzle' bot-challenge signature as dubizzle-kw.",
  },

  // ---- Oman ----
  {
    id: "opensooq-om",
    name: "OpenSooq Oman",
    country: "OM",
    homepage: "https://om.opensooq.com",
    buildSearchUrl: (q) => `https://om.opensooq.com/en/find?term=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~1.1MB, 468 occurrences of 'iphone'. Dubizzle Oman was tried first but 503-blocked, so OpenSooq was used instead.",
  },

  // ---- Iraq ----
  {
    id: "opensooq-iq",
    name: "OpenSooq Iraq",
    country: "IQ",
    homepage: "https://iq.opensooq.com",
    buildSearchUrl: (q) => `https://iq.opensooq.com/en/find?term=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~993KB, 363 occurrences of 'iphone', real IQD-currency listing prices — confirmed real.",
  },

  // ---- Kazakhstan ----
  {
    id: "olx-kz",
    name: "OLX Kazakhstan",
    country: "KZ",
    homepage: "https://www.olx.kz",
    buildSearchUrl: (q) => `https://www.olx.kz/list/q-${slugEnc(q)}/`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~3.4MB, 565 occurrences of 'iphone', 52 real listing cards — confirmed real results.",
  },

  // ---- Azerbaijan ----
  {
    id: "tap-az",
    name: "Tap.az",
    country: "AZ",
    homepage: "https://tap.az",
    buildSearchUrl: (q) => `https://tap.az/elanlar?q%5Bkeywords%5D=${enc(q)}`,
    verified: false,
    notes:
      "Azerbaijan's #1 general classifieds site; param confirmed from the site's own internal links. curl check (2026-11-18): 403 Cloudflare challenge on homepage and search URL alike.",
  },

  // ---- Georgia ----
  {
    id: "mymarket-ge",
    name: "MyMarket.ge",
    country: "GE",
    homepage: "https://www.mymarket.ge",
    buildSearchUrl: (q) => `https://www.mymarket.ge/en/search/?seachValue=${enc(q)}`,
    verified: true,
    notes:
      "Georgia's largest general new/secondhand marketplace (ss.ge has drifted toward mainly real-estate/cars). curl check (2026-11-18): 200, ~207KB, embedded JSON confirms a real product match for 'iphone'.",
  },

  // ---- Nepal ----
  {
    id: "hamrobazaar-np",
    name: "Hamrobazaar",
    country: "NP",
    homepage: "https://hamrobazaar.com",
    buildSearchUrl: (q) => `https://hamrobazaar.com/search/product?q=${enc(q)}`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): 218 results with real listings (e.g. Adidas Swift Run, ₨15,000) once client-side rendering finished.",
  },

  // ---- Myanmar ----
  {
    id: "imyanmarmarket-mm",
    name: "iMyanmarMarket",
    country: "MM",
    homepage: "https://www.imyanmarmarket.com",
    buildSearchUrl: (q) => `https://www.imyanmarmarket.com/en/search?q=${enc(q)}`,
    verified: true,
    notes:
      "Myanmar's largest general C2C marketplace (OneKyat, the other major app, was shut down by Carousell Group in Dec 2022). curl check (2026-11-18): 200, ~239KB, 35 occurrences of 'iphone' — confirmed real results.",
  },

  // ---- Cambodia ----
  {
    id: "khmer24-kh",
    name: "Khmer24",
    country: "KH",
    homepage: "https://www.khmer24.com/en",
    buildSearchUrl: (q) => `https://www.khmer24.com/en/search?q=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~624KB, real server-rendered listing cards with price markers — Cambodia's leading general C2C secondhand marketplace.",
  },

  // ---- Laos ----
  {
    id: "facebook-marketplace-la",
    name: "Facebook Marketplace",
    country: "LA",
    homepage: "https://www.facebook.com/marketplace",
    buildSearchUrl: (q) => `https://www.facebook.com/marketplace/search?query=${enc(q)}`,
    verified: false,
    notes:
      "Laos has no confirmed major dedicated secondhand classifieds site; Facebook is the de facto dominant channel there (same reasoning as facebook-marketplace-us). Several candidate domains were investigated and rejected as too small, defunct, or hijacked.",
  },

  // ---- Mongolia ----
  {
    id: "unegui-mn",
    name: "Unegui.mn",
    country: "MN",
    homepage: "https://www.unegui.mn",
    buildSearchUrl: (q) => `https://www.unegui.mn/search/?query=${enc(q)}`,
    verified: true,
    notes:
      "curl check (2026-11-18): 200, ~867KB, confirmed real server-rendered listings with tugrik-currency markers. Mongolia's #1 classifieds/secondhand marketplace.",
  },

  // ---- Ghana ----
  {
    id: "jiji-gh",
    name: "Jiji Ghana",
    country: "GH",
    homepage: "https://jiji.com.gh",
    buildSearchUrl: (q) => `https://jiji.com.gh/search?query=${enc(q)}`,
    verified: false,
    notes: "Ghana's dominant general classifieds/secondhand marketplace. curl check (2026-11-18): 403, Cloudflare challenge.",
  },

  // ---- Tanzania ----
  {
    id: "jiji-tz",
    name: "Jiji Tanzania",
    country: "TZ",
    homepage: "https://jiji.co.tz",
    buildSearchUrl: (q) => `https://jiji.co.tz/search?query=${enc(q)}`,
    verified: false,
    notes: "Tanzania's dominant general classifieds/secondhand marketplace. curl check (2026-11-18): 403, same Cloudflare challenge.",
  },

  // ---- Uganda ----
  {
    id: "jiji-ug",
    name: "Jiji Uganda",
    country: "UG",
    homepage: "https://jiji.ug",
    buildSearchUrl: (q) => `https://jiji.ug/search?query=${enc(q)}`,
    verified: false,
    notes: "Uganda's biggest classifieds marketplace (formerly OLX Uganda). curl check (2026-11-18): 403, Cloudflare challenge.",
  },

  // ---- Ethiopia ----
  {
    id: "jiji-et",
    name: "Jiji Ethiopia",
    country: "ET",
    homepage: "https://jiji.com.et",
    buildSearchUrl: (q) => `https://jiji.com.et/search?query=${enc(q)}`,
    verified: false,
    notes: "One of Ethiopia's major classifieds marketplaces. curl check (2026-11-18): 403, Cloudflare challenge.",
  },

  // ---- Algeria ----
  {
    id: "ouedkniss-dz",
    name: "Ouedkniss",
    nativeName: "واد كنيس",
    country: "DZ",
    homepage: "https://www.ouedkniss.com",
    buildSearchUrl: (q) => `https://www.ouedkniss.com/s/?keywords=${enc(q)}&lang=en`,
    verified: true,
    notes:
      "Real-browser check (2026-11-19): real listing cards with photos/store names (216 products in the matched category facet).",
  },

  // ---- Tunisia ----
  {
    id: "tayara-tn",
    name: "Tayara",
    country: "TN",
    homepage: "https://www.tayara.tn",
    buildSearchUrl: (q) => `https://www.tayara.tn/ads/k/${pathEnc(q)}`,
    verified: true,
    notes:
      "Avito does NOT operate in Tunisia (avito.tn doesn't resolve); Tayara.tn is Tunisia's actual dominant classifieds site. curl check (2026-11-18): 200, ~171KB, 152 occurrences of 'iphone' — confirmed real listings.",
  },

  // ---- Zimbabwe ----
  {
    id: "classifieds-zw",
    name: "Zimbabwe Classifieds",
    country: "ZW",
    homepage: "https://www.classifieds.co.zw",
    buildSearchUrl: (q) => `https://www.classifieds.co.zw/listings?query=${enc(q)}`,
    verified: true,
    notes:
      "Jiji does not operate in Zimbabwe. Classifieds.co.zw is Zimbabwe's most popular classifieds site. curl check (2026-11-18): 200, ~450KB, 434 occurrences of 'iphone' — confirmed real listings.",
  },

  // ---- Zambia ----
  {
    id: "bne-zm",
    name: "B-ne Zambia",
    country: "ZM",
    homepage: "https://b-ne.co.zm",
    buildSearchUrl: (q) => `https://b-ne.co.zm/search?q=${enc(q)}`,
    verified: false,
    notes:
      "Jiji does not operate in Zambia; no single obviously-dominant general secondhand site exists there. Homepage is real and active, but the dedicated /search route is a client-rendered shell regardless of query param tried.",
  },

  // ---- Senegal ----
  {
    id: "coinafrique-sn",
    name: "CoinAfrique Sénégal",
    country: "SN",
    homepage: "https://sn.coinafrique.com",
    buildSearchUrl: (q) => `https://sn.coinafrique.com/search?keyword=${enc(q)}`,
    verified: true,
    notes: "curl check (2026-11-18): 200, ~576KB, 766 occurrences of 'iphone' — confirmed real listings.",
  },

  // ---- Ivory Coast ----
  {
    id: "coinafrique-ci",
    name: "CoinAfrique Côte d'Ivoire",
    country: "CI",
    homepage: "https://ci.coinafrique.com",
    buildSearchUrl: (q) => `https://ci.coinafrique.com/search?keyword=${enc(q)}`,
    verified: true,
    notes: "Same CoinAfrique network as Senegal. curl check (2026-11-18): 200, ~598KB, 902 occurrences of 'iphone' — confirmed real.",
  },

  // ---- Cameroon ----
  {
    id: "coinafrique-cm",
    name: "CoinAfrique Cameroun",
    country: "CM",
    homepage: "https://cm.coinafrique.com",
    buildSearchUrl: (q) => `https://cm.coinafrique.com/search?keyword=${enc(q)}`,
    verified: true,
    notes: "Same CoinAfrique network. curl check (2026-11-18): 200, ~516KB, 808 occurrences of 'iphone' — confirmed real.",
  },

  // ---- Ecuador ----
  {
    id: "mercadolibre-ec",
    name: "Mercado Libre Ecuador",
    country: "EC",
    homepage: "https://www.mercadolibre.com.ec",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.ec/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },

  // ---- Venezuela ----
  {
    id: "mercadolibre-ve",
    name: "Mercado Libre Venezuela",
    country: "VE",
    homepage: "https://www.mercadolibre.com.ve",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.ve/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },

  // ---- Uruguay ----
  {
    id: "mercadolibre-uy",
    name: "Mercado Libre Uruguay",
    country: "UY",
    homepage: "https://www.mercadolibre.com.uy",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.uy/${slugEnc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): same 'suspicious-traffic-frontend' bot-check shell; confirmed again in a real browser (login wall). No comparably major general-secondhand local alternative found.",
  },

  // ---- Paraguay ----
  {
    id: "mercadolibre-py",
    name: "Mercado Libre Paraguay",
    country: "PY",
    homepage: "https://www.mercadolibre.com.py",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.py/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },
  {
    id: "clasipar-py",
    name: "Clasipar",
    country: "PY",
    homepage: "https://clasipar.paraguay.com",
    buildSearchUrl: (q) => `https://clasipar.paraguay.com/@${pathEnc(q)}`,
    verified: true,
    notes:
      "Paraguay's most-visited classifieds portal per their own traffic claims. Browser check (2026-11-18): searching 'iphone' returned a real listing (iPhone 17 Pro Max, Asunción).",
  },

  // ---- Bolivia ----
  {
    id: "mercadolibre-bo",
    name: "Mercado Libre Bolivia",
    country: "BO",
    homepage: "https://www.mercadolibre.com.bo",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.bo/${slugEnc(q)}`,
    verified: false,
    notes:
      "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell. No genuinely major general-secondhand local alternative found.",
  },

  // ---- Guatemala ----
  {
    id: "mercadolibre-gt",
    name: "Mercado Libre Guatemala",
    country: "GT",
    homepage: "https://www.mercadolibre.com.gt",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.gt/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },
  {
    id: "encuentra24-gt",
    name: "Encuentra24 Guatemala",
    country: "GT",
    homepage: "https://www.encuentra24.com/guatemala-es/",
    buildSearchUrl: (q) =>
      `https://www.encuentra24.com/guatemala-es/searchresult/marketplace?q=keyword.${plusEnc(q)}`,
    verified: true,
    notes:
      "Major Central American classifieds platform (9 countries). Verified live in a real browser (2026-11-18): searching 'iphone' returned 26 real listings.",
  },

  // ---- Costa Rica ----
  {
    id: "mercadolibre-cr",
    name: "Mercado Libre Costa Rica",
    country: "CR",
    homepage: "https://www.mercadolibre.co.cr",
    buildSearchUrl: (q) => `https://listado.mercadolibre.co.cr/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },
  {
    id: "encuentra24-cr",
    name: "Encuentra24 Costa Rica",
    country: "CR",
    homepage: "https://www.encuentra24.com/costa-rica-es/",
    buildSearchUrl: (q) =>
      `https://www.encuentra24.com/costa-rica-es/searchresult/marketplace?q=keyword.${plusEnc(q)}`,
    verified: true,
    notes:
      "Encuentra24's second-deepest market (~20k+ listings). Verified live in a real browser (2026-11-18): searching 'iphone' returned real listings (iPhone 17 Pro, 16 Pro Max, etc).",
  },

  // ---- Panama ----
  {
    id: "mercadolibre-pa",
    name: "Mercado Libre Panama",
    country: "PA",
    homepage: "https://www.mercadolibre.com.pa",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.pa/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },
  {
    id: "encuentra24-pa",
    name: "Encuentra24 Panama",
    country: "PA",
    homepage: "https://www.encuentra24.com/panama-es/",
    buildSearchUrl: (q) =>
      `https://www.encuentra24.com/panama-es/searchresult/marketplace?q=keyword.${plusEnc(q)}`,
    verified: true,
    notes:
      "Encuentra24's deepest market (~95k+ listings) and headquartered there. Verified live in a real browser (2026-11-18): searching 'iphone' returned 50+ real listings.",
  },

  // ---- Dominican Republic ----
  {
    id: "mercadolibre-do",
    name: "Mercado Libre República Dominicana",
    country: "DO",
    homepage: "https://www.mercadolibre.com.do",
    buildSearchUrl: (q) => `https://listado.mercadolibre.com.do/${slugEnc(q)}`,
    verified: false,
    notes: "curl check (2026-11-18): 200, ~26KB, same 'suspicious-traffic-frontend' bot-check shell as other MercadoLibre domains.",
  },
  {
    id: "encuentra24-do",
    name: "Encuentra24 República Dominicana",
    country: "DO",
    homepage: "https://www.encuentra24.com/dominicana-es/",
    buildSearchUrl: (q) =>
      `https://www.encuentra24.com/dominicana-es/searchresult/marketplace?q=keyword.${plusEnc(q)}`,
    verified: true,
    notes:
      "Verified live in a real browser (2026-11-18): searching 'iphone' returned 13 real listings. Corotos.com.do (DR's historical #1) was down for maintenance when checked — worth a retry later.",
  },
];

export const PLATFORMS: Platform[] = RAW_PLATFORMS.map((platform) => ({
  ...platform,
  buildSearchUrl: wrapSearchUrl(platform.homepage, platform.buildSearchUrl),
}));

const PLATFORMS_BY_COUNTRY = new Map<CountryCode, Platform[]>();
for (const platform of PLATFORMS) {
  const list = PLATFORMS_BY_COUNTRY.get(platform.country);
  if (list) list.push(platform);
  else PLATFORMS_BY_COUNTRY.set(platform.country, [platform]);
}

export function platformsForCountry(country: CountryCode): Platform[] {
  return PLATFORMS_BY_COUNTRY.get(country) ?? [];
}

/** Country codes that currently have at least one platform entry. */
export const SUPPORTED_COUNTRIES: CountryCode[] = Array.from(PLATFORMS_BY_COUNTRY.keys());
