import type { LanguageCode } from "./i18n/locales";

export interface AtlasCopy {
  brand: string;
  searchPlaceholder: string;
  savedLabel: string;
  tabs: {
    all: string;
    shops: string;
    apps: string;
    markets: string;
  };
  continents: Record<"ALL" | "Asia" | "Europe" | "Americas" | "Africa" | "Oceania", string>;
  featuredCitiesTitle: string;
  allCountriesTitle: string;
  backToAll: string;
  backToList: string;
  alleysTitle: string;
  allAlleys: string;
  localAppsTitle: string;
  itemSearchPlaceholder: string;
  itemSuggestions: string[];
  translatedLabel: string;
  useOriginal: string;
  useTranslated: string;
  offlineSpotsTitle: string;
  filterAll: string;
  filterCurated: string;
  filterVintage: string;
  filterGujae: string;
  inMapView: string;
  searchThisArea: string;
  loadMore: (remaining: number) => string;
  noResults: string;
  loadingShops: string;
  savedEmpty: string;
  copyAddress: string;
  copiedAddress: string;
  directionsCta: string;
  website: string;
  instagram: string;
  kakaoMap: string;
  naverMap: string;
  naverDirectionsCta: string;
  reviewSearchCta: string;
  googleMapsShort: string;
  sortCurated: string;
  sortNearest: string;
  sortName: string;
  savedCourseTitle: string;
  removeSaved: string;
  walkMin: (m: number) => string;
  shopsUnit: string;
  appsUnit: string;
  alleysUnit: string;
  marketsUnit: string;
  openSchedule: string;
  eventsTitle: string;
  topAlleysTitle: string;
  resetView: string;
  locateMe: string;
  specAddress: string;
  specStation: string;
  specHours: string;
  specCoords: string;
  specCuration: string;
  specNote: string;
  specSources: string;
  nearbyWalkTitle: string;
  viewportSpotsLabel: (n: number) => string;
  viewportFilterAll: string;
  recurringBadge: string;
  upcomingBadge: string;
  onlineOnlyTitle: string;
  onlineOnlyDesc: string;
  nearbyCapitalsLabel: string;
}

const KO_COPY: AtlasCopy = {
  brand: "ATLAS.",
  searchPlaceholder: "국가, 도시(광주·도쿄), 동네, 빈티지샵 이름 찾기",
  savedLabel: "저장",
  tabs: {
    all: "전체",
    shops: "빈티지샵",
    apps: "중고플랫폼",
    markets: "축제·마켓",
  },
  continents: {
    ALL: "전체",
    Asia: "아시아",
    Europe: "유럽",
    Americas: "아메리카",
    Africa: "아프리카",
    Oceania: "오세아니아",
  },
  featuredCitiesTitle: "디깅 성지 도시",
  allCountriesTitle: "137개국 인덱스",
  backToAll: "전체 도시",
  backToList: "목록으로",
  alleysTitle: "성지 골목",
  allAlleys: "전체",
  localAppsTitle: "로컬 중고플랫폼",
  itemSearchPlaceholder: "위 중고앱에 동시 검색할 상품명 (예: 스투시, 리바이스)",
  itemSuggestions: ["스투시", "리바이스", "필름카메라", "칼하트"],
  translatedLabel: "현지 검색어",
  useOriginal: "원문 유지",
  useTranslated: "번역 적용",
  offlineSpotsTitle: "오프라인 스팟",
  filterAll: "전체",
  filterCurated: "CURATED",
  filterVintage: "VINTAGE",
  filterGujae: "ARCHIVE",
  inMapView: "지도 영역 내",
  searchThisArea: "이 지도 영역 내 스팟 보기",
  loadMore: (n) => `더 보기 (${n.toLocaleString()}곳 남음)`,
  noResults: "조건에 맞는 스팟이 없습니다.",
  loadingShops: "매장 상세 불러오는 중...",
  savedEmpty: "저장한 스팟이 없습니다. 마음에 드는 매장의 북마크를 눌러보세요.",
  copyAddress: "주소 복사",
  copiedAddress: "복사됨",
  directionsCta: "Google Maps 길찾기",
  website: "공식 웹사이트",
  instagram: "Instagram",
  kakaoMap: "카카오맵",
  naverMap: "네이버지도",
  naverDirectionsCta: "네이버 지도 길찾기·리뷰",
  reviewSearchCta: "매장 후기 · 인스타 검색",
  googleMapsShort: "Google Maps",
  sortCurated: "성지순",
  sortNearest: "지도 중심순",
  sortName: "이름순",
  savedCourseTitle: "저장한 디깅 코스",
  removeSaved: "저장 해제",
  walkMin: (m) => `도보 ${m}분`,
  shopsUnit: "샵",
  appsUnit: "로컬앱",
  alleysUnit: "골목",
  marketsUnit: "마켓",
  openSchedule: "공식 행사 페이지",
  eventsTitle: "축제 · 플리마켓",
  topAlleysTitle: "글로벌 핵심 골목",
  resetView: "세계 지도 초기화",
  locateMe: "내 위치",
  specAddress: "주소",
  specStation: "가까운 역",
  specHours: "영업시간",
  specCoords: "좌표",
  specCuration: "큐레이션",
  specNote: "메모",
  specSources: "출처",
  nearbyWalkTitle: "함께 돌기 좋은 도보권 스팟",
  viewportSpotsLabel: (n) => `현재 지도 영역 스팟 ${n.toLocaleString()}곳`,
  viewportFilterAll: "전체 보기",
  recurringBadge: "상설 · 정기",
  upcomingBadge: "예정",
  onlineOnlyTitle: "온라인 중고 플랫폼 중심 국가",
  onlineOnlyDesc: "이 국가는 상단 로컬 중고 플랫폼을 통해 희귀 매물을 찾는 것이 가장 빠릅니다.",
  nearbyCapitalsLabel: "주요 글로벌 빈티지 성지 바로가기",
};

const JA_COPY: AtlasCopy = {
  brand: "ATLAS.",
  searchPlaceholder: "都市・エリア（下北沢・聖水）・古着屋・アプリを検索",
  savedLabel: "保存",
  tabs: {
    all: "探索",
    shops: "古着屋",
    apps: "中古アプリ",
    markets: "エリア・市場",
  },
  continents: {
    ALL: "すべて",
    Asia: "アジア",
    Europe: "ヨーロッパ",
    Americas: "アメリカ",
    Africa: "アフリカ",
    Oceania: "オセアニア",
  },
  featuredCitiesTitle: "主要ディギング都市",
  allCountriesTitle: "137か国インデックス",
  backToAll: "すべての都市",
  backToList: "一覧へ戻る",
  alleysTitle: "ヴィンテージエリア",
  allAlleys: "全エリア",
  localAppsTitle: "現地フリマ・中古アプリ",
  itemSearchPlaceholder: "アイテム検索 (例: Stussy, Levi's, Film Camera)",
  itemSuggestions: ["Stussy", "Levi's", "Carhartt", "Leica"],
  translatedLabel: "翻訳キーワード",
  useOriginal: "原文で検索",
  useTranslated: "翻訳を使う",
  offlineSpotsTitle: "オフライン店舗",
  filterAll: "すべて",
  filterCurated: "CURATED",
  filterVintage: "VINTAGE",
  filterGujae: "ARCHIVE",
  inMapView: "地図エリア内",
  searchThisArea: "この地図エリア内を表示",
  loadMore: (n) => `さらに表示 (残り ${n.toLocaleString()})`,
  noResults: "該当するスポットがありません。",
  loadingShops: "店舗データを読み込み中...",
  savedEmpty: "保存したスポットはまだありません。",
  copyAddress: "住所をコピー",
  copiedAddress: "コピー済み",
  directionsCta: "Google Maps でルート案内",
  website: "公式サイト",
  instagram: "Instagram",
  kakaoMap: "Kakao Map",
  naverMap: "Naver Map",
  naverDirectionsCta: "Naver Map ルート・口コミ",
  reviewSearchCta: "口コミ・Instagram を検索",
  googleMapsShort: "Google Maps",
  sortCurated: "聖地順",
  sortNearest: "地図中心順",
  sortName: "名前順",
  savedCourseTitle: "保存したディギングコース",
  removeSaved: "保存を解除",
  walkMin: (m) => `徒歩 ${m}分`,
  shopsUnit: "店舗",
  appsUnit: "アプリ",
  alleysUnit: "エリア",
  marketsUnit: "市場",
  openSchedule: "公式スケジュール",
  eventsTitle: "ヴィンテージ・フリマ日程",
  topAlleysTitle: "世界の主要エリア",
  resetView: "世界地図に戻る",
  locateMe: "現在地",
  specAddress: "住所",
  specStation: "最寄り駅",
  specHours: "営業時間",
  specCoords: "座標",
  specCuration: "キュレーション",
  specNote: "メモ",
  specSources: "参照",
  nearbyWalkTitle: "徒歩圏内のおすすめスポット",
  viewportSpotsLabel: (n) => `表示エリア内の店舗 ${n.toLocaleString()}件`,
  viewportFilterAll: "すべて表示",
  recurringBadge: "定期開催",
  upcomingBadge: "開催予定",
  onlineOnlyTitle: "オンライン中古アプリ中心の国",
  onlineOnlyDesc: "この国では上部の現地フリマ・中古アプリから直接検索するのが最適です。",
  nearbyCapitalsLabel: "世界の主要ヴィンテージ都市へ移動",
};

const EN_COPY: AtlasCopy = {
  brand: "ATLAS.",
  searchPlaceholder: "Search city, alley (Shimokitazawa, Marais), shop, or app",
  savedLabel: "Saved",
  tabs: {
    all: "Explore",
    shops: "Shops",
    apps: "Local Apps",
    markets: "Alleys · Markets",
  },
  continents: {
    ALL: "All",
    Asia: "Asia",
    Europe: "Europe",
    Americas: "Americas",
    Africa: "Africa",
    Oceania: "Oceania",
  },
  featuredCitiesTitle: "Digging Sanctuary Cities",
  allCountriesTitle: "137 Countries Index",
  backToAll: "All Cities",
  backToList: "Back to list",
  alleysTitle: "Vintage Alleys",
  allAlleys: "All Alleys",
  localAppsTitle: "Local Secondhand Apps",
  itemSearchPlaceholder: "Search item across local apps (e.g. Stussy, Levi's, Leica)",
  itemSuggestions: ["Stussy", "Levi's 501", "Carhartt", "Film Camera"],
  translatedLabel: "Search term",
  useOriginal: "Keep original",
  useTranslated: "Use translated",
  offlineSpotsTitle: "Offline Spots",
  filterAll: "All",
  filterCurated: "CURATED",
  filterVintage: "VINTAGE",
  filterGujae: "ARCHIVE",
  inMapView: "In map view",
  searchThisArea: "Search this map area",
  loadMore: (n) => `Show more (${n.toLocaleString()} left)`,
  noResults: "No matching spots found.",
  loadingShops: "Loading shop details...",
  savedEmpty: "No saved spots yet. Bookmark any shop to build your route.",
  copyAddress: "Copy address",
  copiedAddress: "Copied",
  directionsCta: "Open in Google Maps",
  website: "Website",
  instagram: "Instagram",
  kakaoMap: "Kakao Map",
  naverMap: "Naver Map",
  naverDirectionsCta: "Naver Map directions & reviews",
  reviewSearchCta: "Reviews · Instagram search",
  googleMapsShort: "Google Maps",
  sortCurated: "Curated",
  sortNearest: "Near map center",
  sortName: "A–Z",
  savedCourseTitle: "Saved digging course",
  removeSaved: "Remove",
  walkMin: (m) => `${m} min walk`,
  shopsUnit: "SHOPS",
  appsUnit: "APPS",
  alleysUnit: "ALLEYS",
  marketsUnit: "MARKETS",
  openSchedule: "Official Schedule",
  eventsTitle: "Vintage Flea Markets & Events",
  topAlleysTitle: "Top Global Alleys",
  resetView: "Reset world view",
  locateMe: "My location",
  specAddress: "Address",
  specStation: "Station",
  specHours: "Hours",
  specCoords: "Coords",
  specCuration: "Curation",
  specNote: "Note",
  specSources: "Sources",
  nearbyWalkTitle: "Walkable Nearby Spots",
  viewportSpotsLabel: (n) => `${n.toLocaleString()} spots in map view`,
  viewportFilterAll: "Show all",
  recurringBadge: "Recurring",
  upcomingBadge: "Upcoming",
  onlineOnlyTitle: "Online Resale-First Market",
  onlineOnlyDesc: "Use the local secondhand apps above to search live listings across this country.",
  nearbyCapitalsLabel: "Jump to major vintage capitals",
};

export function getAtlasCopy(lang: LanguageCode): AtlasCopy {
  if (lang === "ko") return KO_COPY;
  if (lang === "ja") return JA_COPY;
  return EN_COPY;
}

export function formatCityDisplay(
  city: { nameKo: string; nameEn: string },
  lang: LanguageCode,
): { primary: string; secondary?: string } {
  if (lang === "ko") {
    return {
      primary: city.nameKo,
      secondary: city.nameEn.toUpperCase() !== city.nameKo.toUpperCase() ? city.nameEn.toUpperCase() : undefined,
    };
  }
  return {
    primary: city.nameEn,
    secondary: undefined,
  };
}

export function formatCountryDisplay(
  country: { code: string; nameEn: string; nameKo: string; names?: Record<string, string> },
  lang: LanguageCode,
): string {
  if (lang === "ko") return country.nameKo;
  return country.names?.[lang] || country.nameEn || country.code;
}

const KO_PLATFORM_NAMES: Record<string, string> = {
  bunjang: "번개장터",
  daangn: "당근",
  joonggonara: "중고나라",
  fruitsfamily: "후르츠패밀리",
  "mercari-jp": "메루카리 JP",
  "yahoo-auctions-jp": "야후옥션",
  "rakuma-jp": "라쿠마",
  "2ndstreet-jp": "세컨드스트리트",
  "ebay-us": "이베이 US",
  "facebook-marketplace-us": "페이스북 마켓",
  "craigslist-us": "크레이그리스트",
  "ebay-gb": "이베이 UK",
  "ebay-de": "이베이 DE",
  "vinted-fr": "빈티드 FR",
  "vinted-de": "빈티드 DE",
  "vinted-es": "빈티드 ES",
  "vinted-it": "빈티드 IT",
  "vinted-pl": "빈티드 PL",
  "vinted-nl": "빈티드 NL",
  "vinted-gb": "빈티드 UK",
  "vinted-be": "빈티드 BE",
  "vinted-pt": "빈티드 PT",
  "vinted-at": "빈티드 AT",
  "vinted-cz": "빈티드 CZ",
  "vinted-se": "빈티드 SE",
  "vinted-dk": "빈티드 DK",
  "vinted-lt": "빈티드 LT",
  "xianyu-cn": "시엔위(闲鱼)",
  "ruten-tw": "루텐(露天)",
  "carousell-tw": "캐러셀 TW",
  "carousell-hk": "캐러셀 HK",
  "carousell-sg": "캐러셀 SG",
  "carousell-my": "캐러셀 MY",
  "carousell-ph": "캐러셀 PH",
  "kaidee-th": "카이디",
  "leboncoin-fr": "르봉쿠앙",
  "kleinanzeigen-de": "클라이난차이겐",
  "wallapop-es": "왈라팝",
  "subito-it": "수비토",
  "marktplaats-nl": "마르크트플라츠",
  "gumtree-au": "검트리 AU",
  "gumtree-gb": "검트리 UK",
  "gumtree-za": "검트리 ZA",
  "kijiji-ca": "키지지",
  "trademe-nz": "트레이드미",
  "blocket-se": "블로켓",
  "finn-no": "핀(FINN)",
  "dba-dk": "DBA",
  "willhaben-at": "빌하벤",
  "ricardo-ch": "리카르도",
  "avito-ru": "아비토",
  "haraj-sa": "Haraj",
};

const KO_PLATFORM_GLOBE_SHORT: Record<string, string> = {
  bunjang: "번개장터",
  daangn: "당근",
  joonggonara: "중고나라",
  fruitsfamily: "후르츠패밀리",
  "mercari-jp": "메루카리",
  "yahoo-auctions-jp": "야후옥션",
  "ebay-us": "이베이",
  "ebay-gb": "이베이",
  "ebay-de": "이베이",
  "vinted-fr": "빈티드",
  "vinted-de": "빈티드",
  "vinted-es": "빈티드",
  "vinted-it": "빈티드",
  "xianyu-cn": "시엔위",
  "ruten-tw": "루텐",
  "carousell-tw": "캐러셀",
  "carousell-hk": "캐러셀",
  "carousell-sg": "캐러셀",
  "kaidee-th": "카이디",
  "leboncoin-fr": "르봉쿠앙",
  "kleinanzeigen-de": "클라이난차이겐",
  "wallapop-es": "왈라팝",
  "subito-it": "수비토",
  "marktplaats-nl": "마르크트플라츠",
  "gumtree-au": "검트리",
  "kijiji-ca": "키지지",
  "haraj-sa": "Haraj",
};

function cleanShortPlatform(name: string): string {
  return name
    .replace(/\s*\([^)]*\)/g, "")
    .replace(
      /\s+(Japan|Korea|USA|US|UK|France|Germany|Spain|Italy|Brazil|Canada|Australia|Poland|India|Indonesia)$/i,
      "",
    )
    .trim();
}

export function formatPlatformDisplay(
  platform: { id: string; name: string; nativeName?: string },
  lang: LanguageCode,
): string {
  if (lang === "ko") {
    if (KO_PLATFORM_NAMES[platform.id]) return KO_PLATFORM_NAMES[platform.id];
    const base = cleanShortPlatform(platform.name);
    if (/^vinted$/i.test(base)) return "빈티드";
    if (/^ebay$/i.test(base)) return "이베이";
    if (/^carousell$/i.test(base)) return "캐러셀";
    if (/^depop$/i.test(base)) return "디팝";
    if (/^grailed$/i.test(base)) return "그레일드";
    if (/^mercadoli[bv]re/i.test(base)) return "메르카도리브레";
    return base;
  }
  if (lang === "ja") {
    if (platform.id === "mercari-jp") return "メルカリ";
    if (platform.id === "yahoo-auctions-jp") return "ヤフオク!";
    return platform.nativeName || cleanShortPlatform(platform.name);
  }
  return cleanShortPlatform(platform.name);
}

export function formatPlatformGlobeShort(
  platform: { id: string; name: string; nativeName?: string },
  lang: LanguageCode,
): string {
  if (lang === "ko") {
    if (KO_PLATFORM_GLOBE_SHORT[platform.id]) return KO_PLATFORM_GLOBE_SHORT[platform.id];
    return formatPlatformDisplay(platform, lang);
  }
  return cleanShortPlatform(platform.name);
}
