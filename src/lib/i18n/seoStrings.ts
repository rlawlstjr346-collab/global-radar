import type { LanguageCode } from "./locales";

export interface SeoStrings {
  title: string;
  description: string;
}

/**
 * Per-language search-engine metadata. Written to match what people
 * actually type into Google when looking for a secondhand marketplace in
 * their own language (not just the brand name) — this is the whole point
 * of giving each language its own crawlable `/[locale]` URL.
 */
export const SEO_STRINGS: Record<LanguageCode, SeoStrings> = {
  en: {
    title: "Search eBay, Facebook Marketplace & Local Sites by Country",
    description:
      "Find used-goods marketplaces in any country with one search — eBay, Facebook Marketplace, Craigslist, Vinted, OLX, Carousell and local secondhand sites worldwide.",
  },
  ko: {
    title: "중고나라, 당근마켓부터 전세계 중고거래 사이트 한번에 검색",
    description:
      "중고나라, 당근마켓, 번개장터부터 전세계 각국 중고거래 사이트까지 한번에 검색하는 세계 중고마켓 지도. 해외 중고 거래, 빈티지 제품 검색에 활용하세요.",
  },
  ja: {
    title: "メルカリ、ヤフオクから海外中古マーケットまで一括検索",
    description:
      "メルカリ、ヤフオク!から世界各国の中古売買プラットフォームまで一括検索。海外の中古品・フリマサイトをまとめて探せる世界中古マーケットマップ。",
  },
  hi: {
    title: "OLX, eBay जैसी साइटों से हर देश के सेकंड हैंड बाज़ार खोजें",
    description:
      "हर देश के सेकंड हैंड और पुराने सामान के बाज़ार एक जगह खोजें — OLX, eBay, Facebook Marketplace और स्थानीय साइटें।",
  },
  id: {
    title: "OLX, Facebook Marketplace & Situs Lokal Tiap Negara",
    description:
      "Temukan pasar barang bekas tiap negara dalam satu pencarian — OLX, Facebook Marketplace, Carousell, dan situs jual beli bekas lokal lainnya.",
  },
  de: {
    title: "eBay, Vinted & lokale Flohmärkte jedes Landes",
    description:
      "Finde Gebrauchtmarktplätze in jedem Land mit einer Suche — eBay, Vinted, Willhaben und lokale Secondhand-Plattformen weltweit.",
  },
  fr: {
    title: "Vinted, Leboncoin, eBay de chaque pays",
    description:
      "Recherchez les marketplaces de seconde main de chaque pays en une fois — Vinted, eBay, Facebook Marketplace et sites locaux d'occasion.",
  },
  zh: {
    title: "闲鱼、eBay、跳蚤市场一键搜索全球各国",
    description:
      "一键搜索全球各国二手交易平台——闲鱼、eBay、Facebook Marketplace及各地本土二手网站，轻松找到你要的二手商品。",
  },
  ms: {
    title: "Carousell, OLX & Laman Tempatan Setiap Negara",
    description:
      "Cari pasaran barang terpakai setiap negara dalam satu carian — Carousell, OLX, Facebook Marketplace dan laman tempatan lain.",
  },
  th: {
    title: "eBay, Carousell และเว็บไซต์ท้องถิ่นทุกประเทศ",
    description:
      "ค้นหาตลาดสินค้ามือสองของแต่ละประเทศในที่เดียว — eBay, Carousell, Facebook Marketplace และเว็บไซต์ท้องถิ่น",
  },
  vi: {
    title: "Chợ Tốt, eBay, Facebook Marketplace mọi quốc gia",
    description:
      "Tìm kiếm chợ đồ cũ của mọi quốc gia trong một lần tìm — Chợ Tốt, eBay, Facebook Marketplace và các trang rao vặt địa phương.",
  },
  ur: {
    title: "OLX، eBay اور ہر ملک کی مقامی ویب سائٹس",
    description:
      "ہر ملک کے سیکنڈ ہینڈ بازار ایک ہی جگہ تلاش کریں — OLX، eBay، Facebook Marketplace اور مقامی ویب سائٹس۔",
  },
  bn: {
    title: "OLX, eBay ও প্রতিটি দেশের স্থানীয় সাইট",
    description:
      "প্রতিটি দেশের সেকেন্ড হ্যান্ড মার্কেটপ্লেস এক জায়গায় খুঁজুন — OLX, eBay, Facebook Marketplace এবং স্থানীয় সাইট।",
  },
  si: {
    title: "OLX, eBay සහ සෑම රටකම දේශීය වෙබ් අඩවි",
    description:
      "සෑම රටකම දෙවන අත් වෙළඳපොළවල් එක තැනකින් සොයන්න — OLX, eBay, Facebook Marketplace සහ දේශීය වෙබ් අඩවි.",
  },
  ar: {
    title: "OLX، eBay، Dubizzle وكل دولة",
    description: "ابحث عن أسواق السلع المستعملة في كل دولة بحث واحد — OLX، eBay، Dubizzle، OpenSooq والمواقع المحلية.",
  },
  tr: {
    title: "Sahibinden, eBay ve her ülkenin yerel siteleri",
    description: "Her ülkenin ikinci el pazar yerlerini tek aramada bulun — Sahibinden, eBay, Facebook Marketplace ve yerel siteler.",
  },
  he: {
    title: "יד2, eBay וכל מדינה",
    description: "חפשו שווקי יד שנייה בכל מדינה בחיפוש אחד — יד2, eBay, Facebook Marketplace ואתרים מקומיים.",
  },
  es: {
    title: "Wallapop, eBay, Vinted de cada país",
    description:
      "Busca mercados de segunda mano de cada país en una sola búsqueda — Wallapop, eBay, Vinted, Mercado Libre y sitios locales.",
  },
  it: {
    title: "Subito, eBay, Vinted di ogni paese",
    description: "Cerca i mercatini dell'usato di ogni paese in un'unica ricerca — Subito, eBay, Vinted e siti locali di seconda mano.",
  },
  nl: {
    title: "Marktplaats, eBay, Vinted van elk land",
    description: "Zoek tweedehands marktplaatsen van elk land in één keer — Marktplaats, eBay, Vinted en lokale tweedehands sites.",
  },
  pt: {
    title: "OLX, eBay, Vinted de cada país",
    description: "Busque mercados de segunda mão de cada país em uma única busca — OLX, eBay, Vinted, Mercado Livre e sites locais.",
  },
  sv: {
    title: "Blocket, eBay, Vinted i varje land",
    description: "Sök andrahandsmarknader i varje land med en sökning — Blocket, eBay, Vinted och lokala säljsajter.",
  },
  no: {
    title: "FINN.no, eBay, Vinted i hvert land",
    description: "Søk bruktmarkeder i hvert land med ett søk — FINN.no, eBay, Vinted og lokale bruktsider.",
  },
  da: {
    title: "DBA, eBay, Vinted i hvert land",
    description: "Søg brugtmarkeder i hvert land med én søgning — DBA, eBay, Vinted og lokale brugtsider.",
  },
  fi: {
    title: "Tori, eBay, Vinted jokaisessa maassa",
    description: "Hae jokaisen maan käytettyjen tavaroiden markkinat yhdellä haulla — Tori.fi, eBay, Vinted ja paikalliset sivustot.",
  },
  pl: {
    title: "OLX, eBay, Vinted w każdym kraju",
    description: "Wyszukaj rynki rzeczy używanych w każdym kraju jednym wyszukiwaniem — OLX, eBay, Vinted i lokalne serwisy ogłoszeniowe.",
  },
  cs: {
    title: "Bazoš, Sbazar, eBay v každé zemi",
    description: "Vyhledejte bazary a tržiště s použitým zbožím v každé zemi jedním hledáním — Bazoš, Sbazar, eBay a Vinted.",
  },
  ro: {
    title: "OLX, eBay, Vinted din fiecare țară",
    description: "Caută piețele de second hand din fiecare țară într-o singură căutare — OLX, eBay, Vinted și site-uri locale.",
  },
  el: {
    title: "Vendora, eBay, Vinted κάθε χώρας",
    description: "Αναζητήστε αγορές μεταχειρισμένων κάθε χώρας με μία αναζήτηση — Vendora, eBay, Vinted και τοπικές ιστοσελίδες.",
  },
  ru: {
    title: "Авито, eBay, OLX каждой страны",
    description: "Ищите рынки секонд-хенда каждой страны одним поиском — Авито, eBay, OLX и локальные сайты объявлений.",
  },
  uk: {
    title: "OLX, eBay, Vinted кожної країни",
    description: "Шукайте ринки секонд-хенду кожної країни одним пошуком — OLX, eBay, Vinted та локальні сайти оголошень.",
  },
  hu: {
    title: "Jófogás, eBay, Vinted minden országban",
    description: "Keresse meg minden ország használtcikk piacát egyetlen kereséssel — Jófogás, eBay, Vinted és helyi hirdetési oldalak.",
  },
  hr: {
    title: "Njuškalo, eBay, Vinted svake zemlje",
    description: "Pretražite tržišta rabljene robe svake zemlje jednom pretragom — Njuškalo, eBay, Vinted i lokalne oglasne stranice.",
  },
  bg: {
    title: "OLX, eBay, Vinted на всяка страна",
    description: "Търсете пазари за стоки втора употреба на всяка страна с едно търсене — OLX, eBay, Vinted и локални обяви.",
  },
  lt: {
    title: "Vinted, eBay, OLX kiekvienoje šalyje",
    description: "Ieškokite naudotų prekių rinkų kiekvienoje šalyje viena paieška — Vinted, eBay, OLX ir vietiniai skelbimų puslapiai.",
  },
};

export function getSeoStrings(lang: LanguageCode): SeoStrings {
  return SEO_STRINGS[lang] ?? SEO_STRINGS.en;
}
