import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import { resolveLegacyPath } from "../src/lib/legacyRoutes.ts";
import { CITY_SLUGS, COUNTRY_CODES } from "../src/lib/legacyRoutes.data.ts";

const bootstrap = JSON.parse(fs.readFileSync(new URL("../public/data/atlas-bootstrap.json", import.meta.url), "utf8"));
const go = (p, lang = "en") => resolveLegacyPath(p, lang);

test("1. Generated legacy table matches the live atlas dataset (rerun scripts/build-legacy-routes.mjs)", () => {
  assert.deepEqual(COUNTRY_CODES.split(" ").sort(), bootstrap.countries.map((c) => c.code.toLowerCase()).sort());
  assert.deepEqual(CITY_SLUGS.split(" ").sort(), bootstrap.cities.map((c) => c.slug).sort());
});

test("2. Retired minimap /v2 URLs land on the live page in one 308 hop", () => {
  const cases = {
    "/v2": "/en",
    "/v2/": "/en",
    "/v2/index.html": "/en",
    "/v2/ko/": "/ko",
    "/v2/zh-Hans/": "/zh",
    "/v2/zh-Hant/japan/tokyo/": "/zh/explore/jp/tokyo",
    "/v2/nb/norway/": "/no/explore/no",
    "/v2/en/south-korea/": "/en/explore/kr",
    "/v2/ko/south-korea/seoul/": "/ko/explore/kr/seoul",
    "/v2/ko/south-korea/seoul/index.html": "/ko/explore/kr/seoul",
    "/v2/ja/japan/tokyo/": "/ja/explore/jp/tokyo",
    "/v2/es/united-states/seattle/": "/es/explore/us/seattle",
    "/v2/en/kingdom-of-the-netherlands/amsterdam/": "/en/explore/nl/amsterdam",
    "/v2/ko/south-korea/jeju/": "/ko/explore/kr/jeju-province",
    "/v2/en/vietnam/dong-nai/": "/en/explore/vn",
    "/v2/en/atlantis/": "/en",
    "/v2/south-korea/": "/en/explore/kr",
  };
  for (const [from, to] of Object.entries(cases)) assert.deepEqual(go(from), { redirect: to }, from);
});

test("3. Old static pages, case and suffix variants are absorbed", () => {
  const cases = {
    "/index.html": "/ko",
    "/home": "/ko",
    "/feed": "/ko",
    "/shop/123": "/ko",
    "/web/": "/ko",
    "/terms.html": "/ko",
    "/app-map.html": "/ko",
    "/privacy.html": "/privacy",
    "/privacy/": "/privacy",
    "/ko.html": "/ko",
    "/ko/": "/ko",
    "/KO/KR": "/ko/kr",
    "/ko/KR": "/ko/kr",
    "/en/jp/": "/en/jp",
    "/ko/explore/KR/Seoul": "/ko/explore/kr/seoul",
    "/ko/explore": "/ko",
    "/ko/kr/seoul": "/ko/explore/kr/seoul",
    "/rss.xml/": "/rss.xml",
  };
  for (const [from, to] of Object.entries(cases)) assert.deepEqual(go(from, "ko"), { redirect: to }, from);
});

test("4. Canonical live URLs and protected files pass through untouched", () => {
  for (const p of [
    "/",
    "/ko",
    "/en/jp",
    "/ko/explore/kr",
    "/ko/explore/kr/seoul",
    "/privacy",
    "/icon",
    "/apple-icon",
    "/opengraph-image",
    "/ko/opengraph-image",
    "/google9ae0e13efc369bc9.html",
    "/navera06b483a2c8a598883a6b86657b88a14.html",
  ]) {
    assert.equal(go(p), null, p);
  }
});

test("5. Unknown paths resolve to a real 404 instead of a soft 200", () => {
  for (const p of ["/totally-broken-url", "/ko/explore/zz", "/ko/zz", "/ko/explore/kr/seoul/extra", "/%E0%A4%A"]) {
    assert.deepEqual(go(p), { notFound: true }, p);
  }
});
