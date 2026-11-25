#!/usr/bin/env node
/**
 * Submits every public URL in the live sitemap to IndexNow on three endpoints
 * (Naver Search Advisor, the global IndexNow hub and Microsoft Bing).
 *
 * Usage: node scripts/ping-indexnow.mjs [--dry-run]
 * Env:   PROD_URL (default https://worldvintagemap.com)
 *
 * Refuses to submit unless ${PROD_URL}/<KEY>.txt is live (HTTP 200, exact key),
 * because every engine rejects the whole batch when ownership cannot be verified.
 */

const PROD_URL = (process.env.PROD_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://worldvintagemap.com").replace(/\/+$/, "");
const INDEXNOW_KEY = "a9d9b58ea7453d2f536fdc21f97c77ed";
const KEY_LOCATION = `${PROD_URL}/${INDEXNOW_KEY}.txt`;
const ENDPOINTS = [
  ["Naver Search Advisor", "https://searchadvisor.naver.com/indexnow"],
  ["IndexNow hub", "https://api.indexnow.org/indexnow"],
  ["Microsoft Bing", "https://www.bing.com/indexnow"],
];
const MAX_URLS_PER_REQUEST = 10000;

async function main() {
  const keyRes = await fetch(KEY_LOCATION, { signal: AbortSignal.timeout(15000) });
  const keyBody = keyRes.ok ? (await keyRes.text()).trim() : "";
  console.log(`[indexnow] key file ${KEY_LOCATION} -> HTTP ${keyRes.status}${keyRes.ok ? ` (${keyBody === INDEXNOW_KEY ? "matches" : "MISMATCH"})` : ""}`);
  if (!keyRes.ok || keyBody !== INDEXNOW_KEY) {
    console.error("[indexnow] Key file is not live on the production domain - nothing submitted.");
    process.exit(1);
  }

  const smRes = await fetch(`${PROD_URL}/sitemap.xml`, { signal: AbortSignal.timeout(20000) });
  if (!smRes.ok) throw new Error(`sitemap.xml -> HTTP ${smRes.status}`);
  const host = new URL(PROD_URL).host;
  const urlList = [...new Set([...(await smRes.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim()))]
    .filter((u) => new URL(u).host === host)
    .slice(0, MAX_URLS_PER_REQUEST);
  console.log(`[indexnow] ${urlList.length} URLs from ${PROD_URL}/sitemap.xml`);
  if (urlList.length === 0) throw new Error("sitemap has no URLs for this host");

  if (process.argv.includes("--dry-run")) {
    console.log(`[indexnow] dry run - would POST ${urlList.length} URLs to ${ENDPOINTS.length} endpoints`);
    return;
  }

  const payload = JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: KEY_LOCATION, urlList });
  let failures = 0;
  for (const [name, endpoint] of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: payload,
        signal: AbortSignal.timeout(30000),
      });
      const ok = res.status === 200 || res.status === 202;
      if (!ok) failures += 1;
      console.log(`[indexnow] ${name.padEnd(21)} ${endpoint} -> HTTP ${res.status}${ok ? "" : ` ${(await res.text()).slice(0, 160)}`}`);
    } catch (err) {
      failures += 1;
      console.log(`[indexnow] ${name.padEnd(21)} ${endpoint} -> request failed: ${err.message}`);
    }
  }
  if (failures) process.exit(1);
}

main().catch((err) => {
  console.error(`[indexnow] ${err.message}`);
  process.exit(1);
});
