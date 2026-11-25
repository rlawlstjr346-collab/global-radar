#!/usr/bin/env node
/**
 * Submits core World Vintage Atlas canonical URLs to IndexNow (Bing / Naver / Yandex).
 * Usage: node scripts/ping-indexnow.mjs [--dry-run]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://worldvintagemap.com").replace(/\/+$/, "");
const INDEXNOW_KEY = "a9d9b58ea7453d2f536fdc21f97c77ed";
const KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

const bootstrap = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public", "data", "atlas-bootstrap.json"), "utf8"),
);

const urlList = [
  `${SITE_URL}/ko`,
  `${SITE_URL}/en`,
  `${SITE_URL}/ja`,
  ...bootstrap.featuredCities.flatMap((c) => [
    `${SITE_URL}/ko/explore/${c.slug}`,
    `${SITE_URL}/en/explore/${c.slug}`,
  ]),
  ...bootstrap.countries.slice(0, 30).map((c) => `${SITE_URL}/ko/explore/${c.code.toLowerCase()}`),
];

const payload = {
  host: new URL(SITE_URL).host,
  key: INDEXNOW_KEY,
  keyLocation: KEY_LOCATION,
  urlList,
};

if (process.argv.includes("--dry-run")) {
  console.log(`[indexnow] Dry run ready: ${urlList.length} URLs for ${payload.host} (key=${INDEXNOW_KEY})`);
  process.exit(0);
}

const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(payload),
});

console.log(`[indexnow] HTTP ${res.status} — submitted ${urlList.length} URLs to ${payload.host}`);
if (!res.ok) process.exit(1);
