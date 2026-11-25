import { readAtlasBootstrapSync } from "@/lib/atlasData";
import { SITE_URL } from "@/lib/siteUrl";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const bootstrap = readAtlasBootstrapSync();
  const pubDate = new Date(bootstrap.meta.generatedAt || Date.now()).toUTCString();

  const cityItems = bootstrap.featuredCities.map((city) => {
    const alleys = city.topAlleys
      .slice(0, 4)
      .map((a) => a.name)
      .join(" · ");
    const apps = bootstrap.platforms
      .filter((p) => p.country === city.country)
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ");
    const link = `${SITE_URL}/ko/explore/${city.slug}`;
    const title = `${city.nameKo}(${city.nameEn}) 빈티지샵 지도 ${city.shopCount.toLocaleString()}곳${alleys ? ` · ${alleys}` : ""}`;
    const desc = `${city.nameKo} 오프라인 빈티지·구제샵 ${city.shopCount.toLocaleString()}곳, 핵심 골목 ${city.alleyCount}곳${apps ? `, 현지 중고앱(${apps})` : ""} 통합 디깅 아틀라스.`;
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
  });

  const eventItems = bootstrap.events.slice(0, 20).map((ev) => {
    const link = `${SITE_URL}/ko/explore/${ev.citySlug}`;
    const title = `[플리마켓] ${ev.nameKo} · ${ev.cityKo} (${ev.country})`;
    const desc = `${ev.cityKo} ${ev.kindLabel}${ev.recurrence ? ` — ${ev.recurrence}` : ""}${ev.venue ? ` · ${ev.venue}` : ""}`;
    return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">${escapeXml(`${SITE_URL}/events/${ev.id}`)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(desc)}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>World Vintage Atlas — 글로벌 빈티지샵 · 로컬 중고앱 디깅 아틀라스</title>
    <link>${escapeXml(SITE_URL)}</link>
    <atom:link href="${escapeXml(`${SITE_URL}/rss.xml`)}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(`${bootstrap.meta.countries}개국 오프라인 빈티지샵 ${bootstrap.meta.shops.toLocaleString()}곳, 로컬 중고앱 ${bootstrap.meta.platforms}곳, 핵심 골목 ${bootstrap.meta.alleys}곳, 플리마켓 ${bootstrap.events.length}곳.`)}</description>
    <language>ko</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
${[...cityItems, ...eventItems].join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
