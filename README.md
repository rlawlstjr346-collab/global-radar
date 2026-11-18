# Global Radar

Map-based integrated search across secondhand marketplaces in multiple countries. A separate project from
radaro.kr (RADAR) — same redirect-only legal model (never scrapes listings, always sends the user to the
platform's own search results page), different scope: world map instead of one country.

## Status

Prototype, not deployed anywhere yet. Runs locally:

```bash
npm install
npm run dev
```

`.env.local` needs `NEXT_PUBLIC_MAPBOX_TOKEN` (not committed — ask for the token).

## What's built

- World map (Mapbox GL, `mapbox://styles/mapbox/streets-v12`) with a pin per supported country. Click a pin
  or a sidebar row to select a country.
- Sidebar: search box, A-Z / by-region country list, and the selected country's marketplace links.
- Layout/visual language cloned from lavintagemap.com's actual rendered CSS (see the "Global Radar — UI/UX
  Spec" doc for the exact values): frosted-glass overlay sidebar, sliding-pill segmented control, 40px hover
  rows, scroll-fade mask. Responsive below 768px (sidebar becomes a top-anchored 60vh sheet).
- Query translation: Korean brand/model names (라이카 → Leica, etc.) auto-translate for non-Korean platforms,
  using the same lexicon `services/translate.py` in the RADAR repo already uses. Dictionary-only, no LLM step
  configured here.
- Locale detection (`src/proxy.ts`): Accept-Language header → geo-IP country header → manual override cookie,
  in that priority order. Not yet wired into any UI copy — currently only sets a cookie/header other code
  could read.

## Supported countries / platforms

See `src/data/platforms.ts`. Korea (Bunjang, Karrot, Joonggonara, Fruits Family), Japan (Mercari, Yahoo!
Auctions), US (eBay, Facebook Marketplace, Craigslist), India (OLX India, Quikr), Indonesia (OLX Indonesia),
UK/Germany/France (eBay, Vinted). Most entries are marked `verified: false` — the URL patterns are
best-effort from public docs/observation and need a manual click-through check before this goes live. `eBay`
and `Craigslist` are marked verified (same pattern RADAR already runs in production).

## Known gaps / open questions

- **Not pushed to GitHub.** This only exists in this container so far — ask for a repo name/location before
  the container gets recycled.
- Unverified platform URLs (see above) — needs a manual pass clicking through each one.
- No real store/listing data of our own; we only redirect to each platform's own search. The
  lavintagemap.com `/store/<slug>` detail-page design (address, hours, description) doesn't apply here for
  that reason — we don't host individual listings.
- Translation is dictionary-only (Korean → English brand names). No handling yet for other
  query/platform-language pairs (e.g. normalizing into Japanese for Yahoo! Auctions).
- No deploy target set up (Vercel, etc.) — still local-only.
