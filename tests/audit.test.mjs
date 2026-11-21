import test from "node:test";
import assert from "node:assert/strict";

import { COUNTRY_POINTS } from "../src/data/countries.ts";
import { PLATFORMS, SUPPORTED_COUNTRIES, platformsForCountry } from "../src/data/platforms.ts";
import {
  COUNTRY_TO_DEFAULT_LANGUAGE,
  LANGUAGE_NATIVE_NAMES,
  SUPPORTED_LANGUAGES,
  getLanguageDir,
} from "../src/lib/i18n/locales.ts";
import { UI_STRINGS } from "../src/lib/i18n/uiStrings.ts";
import { SEO_STRINGS } from "../src/lib/i18n/seoStrings.ts";
import { COUNTRY_PAGE_SEO } from "../src/lib/i18n/countryPageSeo.ts";
import { isEuCountry } from "../src/lib/i18n/euCountries.ts";
import {
  instantTranslateToEnglish,
  isSameLanguagePlatform,
  resolveQueryForPlatform,
} from "../src/lib/translateQuery.ts";

test("1. Empty or whitespace query returns exact homepage for all 136 platforms", () => {
  assert.equal(PLATFORMS.length, 136);
  for (const platform of PLATFORMS) {
    assert.equal(
      platform.buildSearchUrl(""),
      platform.homepage,
      `${platform.id} must return homepage on empty string`,
    );
    assert.equal(
      platform.buildSearchUrl("   "),
      platform.homepage,
      `${platform.id} must return homepage on whitespace-only query`,
    );
  }
});

test("2. Multi-word and special-char queries produce 0 double-slashes or malformed URLs across all 136 platforms", () => {
  const sampleQueries = [
    "iPhone 17 Pro",
    "C++ / A&B",
    "24/7 #1 ?test=a&b",
    "///",
    "라이카 M6",
    "スニーカー 27cm",
  ];

  for (const query of sampleQueries) {
    for (const platform of PLATFORMS) {
      const url = platform.buildSearchUrl(query);
      assert.ok(url.startsWith("https://"), `${platform.id} (${query}) must be https: ${url}`);

      let parsed;
      assert.doesNotThrow(() => {
        parsed = new URL(url);
      }, `${platform.id} (${query}) produced invalid URL: ${url}`);

      const afterProtocol = url.slice("https://".length);
      assert.ok(
        !afterProtocol.includes("//"),
        `${platform.id} (${query}) must not contain double slash: ${url}`,
      );
      assert.ok(
        !/\/(q-|s-|@)\/?$/.test(parsed.pathname),
        `${platform.id} (${query}) produced empty path token: ${url}`,
      );
      assert.ok(
        !parsed.search.endsWith("keyword."),
        `${platform.id} (${query}) produced empty keyword param: ${url}`,
      );
    }
  }

  // Verify every single platform produces a real search URL (not falsely falling back to homepage) for normal queries.
  for (const platform of PLATFORMS) {
    const url = platform.buildSearchUrl("iPhone 17 Pro");
    assert.notEqual(
      url,
      platform.homepage,
      `${platform.id} falsely fell back to homepage for "iPhone 17 Pro"`,
    );
    assert.ok(
      url.toLowerCase().includes("iphone"),
      `${platform.id} search URL missing query term: ${url}`,
    );
  }

  // Spot-check multi-word slug / plus encoding rules.
  const olxPl = PLATFORMS.find((p) => p.id === "olx-pl");
  assert.equal(olxPl?.buildSearchUrl("iPhone 17 Pro"), "https://www.olx.pl/oferty/q-iPhone-17-Pro/");

  const gumtreeAu = PLATFORMS.find((p) => p.id === "gumtree-au");
  assert.equal(
    gumtreeAu?.buildSearchUrl("iPhone 17 Pro"),
    "https://www.gumtree.com.au/s-iPhone-17-Pro/k0",
  );

  const mercadoUy = PLATFORMS.find((p) => p.id === "mercadolibre-uy");
  assert.equal(
    mercadoUy?.buildSearchUrl("iPhone 17 Pro"),
    "https://listado.mercadolibre.com.uy/iPhone-17-Pro",
  );

  const marktplaats = PLATFORMS.find((p) => p.id === "marktplaats-nl");
  assert.equal(
    marktplaats?.buildSearchUrl("iPhone 17 Pro"),
    "https://www.marktplaats.nl/q/iPhone+17+Pro/",
  );

  const fbUs = PLATFORMS.find((p) => p.id === "facebook-marketplace-us");
  assert.equal(
    fbUs?.buildSearchUrl("iPhone 17 Pro"),
    "https://www.facebook.com/marketplace/search?query=iPhone%2017%20Pro",
  );
});

test("3. All 35 locales have complete non-empty UI, SEO, Country SEO, and native name entries", () => {
  assert.equal(SUPPORTED_LANGUAGES.length, 35);

  for (const lang of SUPPORTED_LANGUAGES) {
    assert.ok(LANGUAGE_NATIVE_NAMES[lang]?.trim(), `Missing native name for ${lang}`);

    const ui = UI_STRINGS[lang];
    assert.ok(ui, `Missing UI_STRINGS for ${lang}`);
    assert.ok(ui.brand.accent.trim(), `Missing brand.accent for ${lang}`);
    assert.ok(ui.preTitle.trim(), `Missing preTitle for ${lang}`);
    assert.ok(ui.titleDetail.trim(), `Missing titleDetail for ${lang}`);
    assert.ok(ui.countriesSupported(101).includes("101"), `Bad countriesSupported for ${lang}`);
    assert.ok(ui.searchPlaceholder.trim(), `Missing searchPlaceholder for ${lang}`);
    assert.ok(ui.clearSearch.trim(), `Missing clearSearch for ${lang}`);
    assert.ok(ui.searchesHint("test").includes("test"), `Bad searchesHint for ${lang}`);
    assert.ok(
      ui.activeSearchStatus("iPhone", 101, 136).includes("101") &&
        ui.activeSearchStatus("iPhone", 101, 136).includes("136"),
      `Bad activeSearchStatus for ${lang}`,
    );
    assert.ok(ui.searchAction.trim(), `Missing searchAction for ${lang}`);
    assert.ok(ui.translatedNotice("test").includes("test"), `Bad translatedNotice for ${lang}`);
    assert.ok(ui.useOriginalQuery.trim(), `Missing useOriginalQuery for ${lang}`);
    assert.ok(ui.usingOriginalQuery.trim(), `Missing usingOriginalQuery for ${lang}`);
    assert.ok(ui.useTranslatedQuery.trim(), `Missing useTranslatedQuery for ${lang}`);
    assert.ok(ui.showMoreMap.trim(), `Missing showMoreMap for ${lang}`);
    assert.ok(ui.showMoreList.trim(), `Missing showMoreList for ${lang}`);
    assert.ok(ui.languageLabel.trim(), `Missing languageLabel for ${lang}`);
    assert.ok(ui.locateMe.trim(), `Missing locateMe for ${lang}`);
    assert.ok(ui.locateError.trim(), `Missing locateError for ${lang}`);
    assert.ok(ui.mapErrorTitle.trim(), `Missing mapErrorTitle for ${lang}`);
    assert.ok(ui.mapErrorBody.trim(), `Missing mapErrorBody for ${lang}`);
    assert.ok(ui.privacyPolicy.trim(), `Missing privacyPolicy for ${lang}`);
    assert.ok(ui.cookieBanner.message.trim(), `Missing cookieBanner.message for ${lang}`);
    assert.ok(ui.cookieBanner.accept.trim(), `Missing cookieBanner.accept for ${lang}`);
    assert.ok(ui.cookieBanner.decline.trim(), `Missing cookieBanner.decline for ${lang}`);
    assert.ok(ui.cookieBanner.learnMore.trim(), `Missing cookieBanner.learnMore for ${lang}`);

    const seo = SEO_STRINGS[lang];
    assert.ok(seo?.title.trim(), `Missing SEO_STRINGS.title for ${lang}`);
    assert.ok(seo?.description.trim(), `Missing SEO_STRINGS.description for ${lang}`);

    const countrySeo = COUNTRY_PAGE_SEO[lang];
    assert.ok(countrySeo?.title("Japan").includes("Japan"), `Bad COUNTRY_PAGE_SEO.title for ${lang}`);
    assert.ok(
      countrySeo?.description("Japan", "Mercari").includes("Mercari"),
      `Bad COUNTRY_PAGE_SEO.description for ${lang}`,
    );
  }

  assert.equal(getLanguageDir("ar"), "rtl");
  assert.equal(getLanguageDir("he"), "rtl");
  assert.equal(getLanguageDir("ur"), "rtl");
  assert.equal(getLanguageDir("ko"), "ltr");
  assert.equal(getLanguageDir("en"), "ltr");
});

test("4. Data integrity: 101 countries, EU-27 includes MT, no dead country codes, smart same-language translation", () => {
  assert.equal(COUNTRY_POINTS.length, 101);
  assert.equal(SUPPORTED_COUNTRIES.length, 101);

  for (const country of COUNTRY_POINTS) {
    assert.ok(platformsForCountry(country.code).length > 0, `${country.code} has 0 platforms`);
    assert.ok(country.code in COUNTRY_TO_DEFAULT_LANGUAGE, `${country.code} missing language mapping`);
  }

  for (const dead of ["AE", "AM", "EU"]) {
    assert.equal(dead in COUNTRY_TO_DEFAULT_LANGUAGE, false, `Dead country code ${dead} still present`);
  }

  const EU27 = [
    "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU",
    "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  ];
  for (const code of EU27) {
    assert.equal(isEuCountry(code), true, `EU member ${code} missing from euCountries.ts`);
  }

  // Same-language stays original; cross-language translates cleanly.
  assert.equal(isSameLanguagePlatform("아이폰 17 프로", "ko", "KR"), true);
  assert.equal(isSameLanguagePlatform("아이폰 17 프로", "ko", "US"), false);
  assert.equal(instantTranslateToEnglish("아이폰 17 프로", "ko").translated, "iPhone 17 Pro");
  assert.equal(
    resolveQueryForPlatform({ query: "아이폰 17 프로", uiLanguage: "ko", platformCountry: "KR" }),
    "아이폰 17 프로",
  );
  assert.equal(
    resolveQueryForPlatform({ query: "아이폰 17 프로", uiLanguage: "ko", platformCountry: "US" }),
    "iPhone 17 Pro",
  );
  assert.equal(
    resolveQueryForPlatform({
      query: "아이폰 17 프로",
      uiLanguage: "ko",
      platformCountry: "US",
      useOriginal: true,
    }),
    "아이폰 17 프로",
  );
});
