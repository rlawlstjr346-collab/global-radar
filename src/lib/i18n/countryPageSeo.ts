import type { LanguageCode } from "./locales";

export interface CountryPageSeoTemplate {
  title: (countryName: string) => string;
  description: (countryName: string, platformList: string) => string;
}

/**
 * Per-language templates for country landing pages (`/[locale]/[country]`).
 * Filled in with the live, localized country name and that country's
 * actual platform names at request time — so unlike a hand-written page
 * per combination, these stay accurate automatically as PLATFORMS grows.
 */
export const COUNTRY_PAGE_SEO: Record<LanguageCode, CountryPageSeoTemplate> = {
  en: {
    title: (c) => `${c} Secondhand Marketplaces`,
    description: (c, p) => `Find secondhand marketplaces in ${c} — search ${p} and more, all in one place.`,
  },
  ko: {
    title: (c) => `${c} 중고거래 사이트 모음`,
    description: (c, p) => `${c}의 중고거래 플랫폼 ${p}을(를) 한 번에 검색하세요.`,
  },
  ja: {
    title: (c) => `${c}の中古売買サイトまとめ`,
    description: (c, p) => `${c}の中古売買プラットフォーム${p}を一括検索。`,
  },
  hi: {
    title: (c) => `${c} के सेकंड हैंड बाज़ार`,
    description: (c, p) => `${c} के सेकंड हैंड प्लेटफ़ॉर्म ${p} को एक साथ खोजें।`,
  },
  id: {
    title: (c) => `Pasar Barang Bekas di ${c}`,
    description: (c, p) => `Temukan pasar barang bekas di ${c} — cari ${p} sekaligus.`,
  },
  de: {
    title: (c) => `Gebrauchtmarktplätze in ${c}`,
    description: (c, p) => `Finde Gebrauchtmarktplätze in ${c} — durchsuche ${p} gleichzeitig.`,
  },
  fr: {
    title: (c) => `Marketplaces d'occasion en ${c}`,
    description: (c, p) => `Trouvez les marketplaces d'occasion en ${c} — recherchez ${p} en une fois.`,
  },
  zh: {
    title: (c) => `${c}二手交易平台大全`,
    description: (c, p) => `一键搜索${c}的二手交易平台${p}。`,
  },
  ms: {
    title: (c) => `Pasar Barang Terpakai di ${c}`,
    description: (c, p) => `Cari pasaran barang terpakai di ${c} — ${p} sekali gus.`,
  },
  th: {
    title: (c) => `ตลาดของมือสองใน${c}`,
    description: (c, p) => `ค้นหาตลาดของมือสองใน${c} — ${p} พร้อมกัน`,
  },
  vi: {
    title: (c) => `Chợ Đồ Cũ tại ${c}`,
    description: (c, p) => `Tìm chợ đồ cũ tại ${c} — tìm ${p} cùng lúc.`,
  },
  ur: {
    title: (c) => `${c} میں سیکنڈ ہینڈ مارکیٹس`,
    description: (c, p) => `${c} کے سیکنڈ ہینڈ پلیٹ فارمز ${p} ایک ساتھ تلاش کریں۔`,
  },
  bn: {
    title: (c) => `${c}-এ সেকেন্ড হ্যান্ড মার্কেটপ্লেস`,
    description: (c, p) => `${c}-এর সেকেন্ড হ্যান্ড প্ল্যাটফর্ম ${p} একসাথে খুঁজুন।`,
  },
  si: {
    title: (c) => `${c} හි දෙවන අත් වෙළඳපොළවල්`,
    description: (c, p) => `${c} හි දෙවන අත් වේදිකා ${p} එකවර සොයන්න.`,
  },
  ar: {
    title: (c) => `أسواق السلع المستعملة في ${c}`,
    description: (c, p) => `ابحث عن أسواق السلع المستعملة في ${c} — ${p} دفعة واحدة.`,
  },
  tr: {
    title: (c) => `${c}'de İkinci El Pazar Yerleri`,
    description: (c, p) => `${c}'deki ikinci el platformları ${p} tek seferde arayın.`,
  },
  he: {
    title: (c) => `שווקי יד שנייה ב${c}`,
    description: (c, p) => `חפשו שווקי יד שנייה ב${c} — ${p} בבת אחת.`,
  },
  es: {
    title: (c) => `Mercados de Segunda Mano en ${c}`,
    description: (c, p) => `Encuentra mercados de segunda mano en ${c} — busca ${p} a la vez.`,
  },
  it: {
    title: (c) => `Mercatini dell'Usato in ${c}`,
    description: (c, p) => `Trova mercatini dell'usato in ${c} — cerca ${p} insieme.`,
  },
  nl: {
    title: (c) => `Tweedehands Marktplaatsen in ${c}`,
    description: (c, p) => `Vind tweedehands marktplaatsen in ${c} — doorzoek ${p} tegelijk.`,
  },
  pt: {
    title: (c) => `Mercados de Segunda Mão em ${c}`,
    description: (c, p) => `Encontre mercados de segunda mão em ${c} — busque ${p} de uma vez.`,
  },
  sv: {
    title: (c) => `Andrahandsmarknader i ${c}`,
    description: (c, p) => `Hitta andrahandsmarknader i ${c} — sök ${p} samtidigt.`,
  },
  no: {
    title: (c) => `Bruktmarkeder i ${c}`,
    description: (c, p) => `Finn bruktmarkeder i ${c} — søk ${p} samtidig.`,
  },
  da: {
    title: (c) => `Brugtmarkeder i ${c}`,
    description: (c, p) => `Find brugtmarkeder i ${c} — søg ${p} samtidig.`,
  },
  fi: {
    title: (c) => `Käytettyjen Tavaroiden Markkinat ${c}ssa`,
    description: (c, p) => `Löydä käytettyjen tavaroiden markkinat ${c}ssa — hae ${p} kerralla.`,
  },
  pl: {
    title: (c) => `Rynki Rzeczy Używanych w ${c}`,
    description: (c, p) => `Znajdź rynki rzeczy używanych w ${c} — przeszukaj ${p} naraz.`,
  },
  cs: {
    title: (c) => `Bazary v ${c}`,
    description: (c, p) => `Najděte bazary v ${c} — prohledejte ${p} najednou.`,
  },
  ro: {
    title: (c) => `Piețe de Second Hand în ${c}`,
    description: (c, p) => `Găsește piețe de second hand în ${c} — caută ${p} deodată.`,
  },
  el: {
    title: (c) => `Αγορές Μεταχειρισμένων στην ${c}`,
    description: (c, p) => `Βρείτε αγορές μεταχειρισμένων στην ${c} — αναζητήστε ${p} ταυτόχρονα.`,
  },
  ru: {
    title: (c) => `Рынки Секонд-Хенда в ${c}`,
    description: (c, p) => `Найдите рынки секонд-хенда в ${c} — ищите ${p} одновременно.`,
  },
  uk: {
    title: (c) => `Ринки Секонд-Хенду в ${c}`,
    description: (c, p) => `Знайдіть ринки секонд-хенду в ${c} — шукайте ${p} одночасно.`,
  },
  hu: {
    title: (c) => `Használtcikk Piacok itt: ${c}`,
    description: (c, p) => `Találj használtcikk piacokat itt: ${c} — keresd a ${p} oldalakat egyszerre.`,
  },
  hr: {
    title: (c) => `Tržnice Rabljene Robe u ${c}`,
    description: (c, p) => `Pronađite tržnice rabljene robe u ${c} — pretražite ${p} odjednom.`,
  },
  bg: {
    title: (c) => `Пазари за Втора Употреба в ${c}`,
    description: (c, p) => `Намерете пазари за втора употреба в ${c} — търсете ${p} едновременно.`,
  },
  lt: {
    title: (c) => `Naudotų Prekių Rinkos ${c}`,
    description: (c, p) => `Raskite naudotų prekių rinkas ${c} — ieškokite ${p} vienu metu.`,
  },
};

export function getCountryPageSeo(lang: LanguageCode): CountryPageSeoTemplate {
  return COUNTRY_PAGE_SEO[lang] ?? COUNTRY_PAGE_SEO.en;
}
