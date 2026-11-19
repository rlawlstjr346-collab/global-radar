import type { CountryCode } from "./platforms";

export type Continent = "Asia" | "Americas" | "Europe" | "Africa" | "Oceania";

export interface CountryPoint {
  code: CountryCode;
  name: string;
  nativeName?: string;
  /** Country flag emoji, shown next to the name in the sidebar. */
  flag: string;
  continent: Continent;
  /** [longitude, latitude] */
  coordinates: [number, number];
}

export const COUNTRY_POINTS: CountryPoint[] = [
  { code: "KR", name: "South Korea", nativeName: "대한민국", flag: "🇰🇷", continent: "Asia", coordinates: [126.978, 37.5665] },
  { code: "JP", name: "Japan", nativeName: "日本", flag: "🇯🇵", continent: "Asia", coordinates: [139.6917, 35.6895] },
  { code: "IN", name: "India", flag: "🇮🇳", continent: "Asia", coordinates: [77.209, 28.6139] },
  { code: "ID", name: "Indonesia", flag: "🇮🇩", continent: "Asia", coordinates: [106.8456, -6.2088] },
  { code: "US", name: "United States", flag: "🇺🇸", continent: "Americas", coordinates: [-98.5833, 39.8333] },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", continent: "Europe", coordinates: [-0.1276, 51.5072] },
  { code: "DE", name: "Germany", flag: "🇩🇪", continent: "Europe", coordinates: [13.405, 52.52] },
  { code: "FR", name: "France", flag: "🇫🇷", continent: "Europe", coordinates: [2.3522, 48.8566] },

  // ---- Worldwide expansion ----
  { code: "CN", name: "China", nativeName: "中国", flag: "🇨🇳", continent: "Asia", coordinates: [104.1954, 35.8617] },
  { code: "TW", name: "Taiwan", nativeName: "台灣", flag: "🇹🇼", continent: "Asia", coordinates: [120.9605, 23.6978] },
  { code: "HK", name: "Hong Kong", nativeName: "香港", flag: "🇭🇰", continent: "Asia", coordinates: [114.1694, 22.3193] },
  { code: "SG", name: "Singapore", flag: "🇸🇬", continent: "Asia", coordinates: [103.8198, 1.3521] },
  { code: "MY", name: "Malaysia", flag: "🇲🇾", continent: "Asia", coordinates: [101.9758, 4.2105] },
  { code: "TH", name: "Thailand", nativeName: "ประเทศไทย", flag: "🇹🇭", continent: "Asia", coordinates: [100.9925, 15.87] },
  { code: "VN", name: "Vietnam", nativeName: "Việt Nam", flag: "🇻🇳", continent: "Asia", coordinates: [108.2772, 14.0583] },
  { code: "PH", name: "Philippines", flag: "🇵🇭", continent: "Asia", coordinates: [121.774, 12.8797] },
  { code: "PK", name: "Pakistan", flag: "🇵🇰", continent: "Asia", coordinates: [69.3451, 30.3753] },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩", continent: "Asia", coordinates: [90.3563, 23.685] },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰", continent: "Asia", coordinates: [80.7718, 7.8731] },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", continent: "Asia", coordinates: [53.8478, 23.4241] },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", continent: "Asia", coordinates: [45.0792, 23.8859] },
  { code: "TR", name: "Turkey", flag: "🇹🇷", continent: "Asia", coordinates: [35.2433, 38.9637] },
  { code: "IL", name: "Israel", flag: "🇮🇱", continent: "Asia", coordinates: [34.8516, 31.0461] },
  { code: "QA", name: "Qatar", flag: "🇶🇦", continent: "Asia", coordinates: [51.1839, 25.3548] },
  { code: "ES", name: "Spain", flag: "🇪🇸", continent: "Europe", coordinates: [-3.7492, 40.4637] },
  { code: "IT", name: "Italy", flag: "🇮🇹", continent: "Europe", coordinates: [12.5674, 41.8719] },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", continent: "Europe", coordinates: [5.2913, 52.1326] },
  { code: "BE", name: "Belgium", flag: "🇧🇪", continent: "Europe", coordinates: [4.4699, 50.5039] },
  { code: "CH", name: "Switzerland", flag: "🇨🇭", continent: "Europe", coordinates: [8.2275, 46.8182] },
  { code: "AT", name: "Austria", flag: "🇦🇹", continent: "Europe", coordinates: [14.5501, 47.5162] },
  { code: "PT", name: "Portugal", flag: "🇵🇹", continent: "Europe", coordinates: [-8.2245, 39.3999] },
  { code: "IE", name: "Ireland", flag: "🇮🇪", continent: "Europe", coordinates: [-8.2439, 53.4129] },
  { code: "SE", name: "Sweden", flag: "🇸🇪", continent: "Europe", coordinates: [18.6435, 60.1282] },
  { code: "NO", name: "Norway", flag: "🇳🇴", continent: "Europe", coordinates: [8.4689, 60.472] },
  { code: "DK", name: "Denmark", flag: "🇩🇰", continent: "Europe", coordinates: [9.5018, 56.2639] },
  { code: "FI", name: "Finland", flag: "🇫🇮", continent: "Europe", coordinates: [25.7482, 61.9241] },
  { code: "PL", name: "Poland", flag: "🇵🇱", continent: "Europe", coordinates: [19.1451, 51.9194] },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿", continent: "Europe", coordinates: [15.473, 49.8175] },
  { code: "RO", name: "Romania", flag: "🇷🇴", continent: "Europe", coordinates: [24.9668, 45.9432] },
  { code: "GR", name: "Greece", flag: "🇬🇷", continent: "Europe", coordinates: [21.8243, 39.0742] },
  { code: "RU", name: "Russia", flag: "🇷🇺", continent: "Europe", coordinates: [37.6173, 55.7558] },
  { code: "UA", name: "Ukraine", flag: "🇺🇦", continent: "Europe", coordinates: [31.1656, 48.3794] },
  { code: "CA", name: "Canada", flag: "🇨🇦", continent: "Americas", coordinates: [-106.3468, 56.1304] },
  { code: "MX", name: "Mexico", flag: "🇲🇽", continent: "Americas", coordinates: [-102.5528, 23.6345] },
  { code: "BR", name: "Brazil", flag: "🇧🇷", continent: "Americas", coordinates: [-51.9253, -14.235] },
  { code: "AR", name: "Argentina", flag: "🇦🇷", continent: "Americas", coordinates: [-63.6167, -38.4161] },
  { code: "CL", name: "Chile", flag: "🇨🇱", continent: "Americas", coordinates: [-71.543, -35.6751] },
  { code: "CO", name: "Colombia", flag: "🇨🇴", continent: "Americas", coordinates: [-74.2973, 4.5709] },
  { code: "PE", name: "Peru", flag: "🇵🇪", continent: "Americas", coordinates: [-75.0152, -9.19] },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", continent: "Africa", coordinates: [22.9375, -30.5595] },
  { code: "NG", name: "Nigeria", flag: "🇳🇬", continent: "Africa", coordinates: [8.6753, 9.082] },
  { code: "EG", name: "Egypt", flag: "🇪🇬", continent: "Africa", coordinates: [30.8025, 26.8206] },
  { code: "KE", name: "Kenya", flag: "🇰🇪", continent: "Africa", coordinates: [37.9062, -0.0236] },
  { code: "MA", name: "Morocco", flag: "🇲🇦", continent: "Africa", coordinates: [-7.0926, 31.7917] },
  { code: "AU", name: "Australia", flag: "🇦🇺", continent: "Oceania", coordinates: [133.7751, -25.2744] },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", continent: "Oceania", coordinates: [174.886, -40.9006] },

  // ---- Second expansion round ----
  { code: "HU", name: "Hungary", flag: "🇭🇺", continent: "Europe", coordinates: [19.5033, 47.1625] },
  { code: "HR", name: "Croatia", flag: "🇭🇷", continent: "Europe", coordinates: [15.2, 45.1] },
  { code: "SK", name: "Slovakia", flag: "🇸🇰", continent: "Europe", coordinates: [19.699, 48.669] },
  { code: "SI", name: "Slovenia", flag: "🇸🇮", continent: "Europe", coordinates: [14.9955, 46.1512] },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬", continent: "Europe", coordinates: [25.4858, 42.7339] },
  { code: "RS", name: "Serbia", flag: "🇷🇸", continent: "Europe", coordinates: [21.0059, 44.0165] },
  { code: "LT", name: "Lithuania", flag: "🇱🇹", continent: "Europe", coordinates: [23.8813, 55.1694] },
  { code: "LV", name: "Latvia", flag: "🇱🇻", continent: "Europe", coordinates: [24.6032, 56.8796] },
  { code: "EE", name: "Estonia", flag: "🇪🇪", continent: "Europe", coordinates: [25.0136, 58.5953] },
  { code: "IS", name: "Iceland", flag: "🇮🇸", continent: "Europe", coordinates: [-19.0208, 64.9631] },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺", continent: "Europe", coordinates: [6.1296, 49.8153] },
  { code: "CY", name: "Cyprus", flag: "🇨🇾", continent: "Europe", coordinates: [33.4299, 35.1264] },
  { code: "JO", name: "Jordan", flag: "🇯🇴", continent: "Asia", coordinates: [36.2384, 30.5852] },
  { code: "LB", name: "Lebanon", flag: "🇱🇧", continent: "Asia", coordinates: [35.8623, 33.8547] },
  { code: "KW", name: "Kuwait", flag: "🇰🇼", continent: "Asia", coordinates: [47.4818, 29.3117] },
  { code: "BH", name: "Bahrain", flag: "🇧🇭", continent: "Asia", coordinates: [50.5577, 26.0667] },
  { code: "OM", name: "Oman", flag: "🇴🇲", continent: "Asia", coordinates: [55.9754, 21.4735] },
  { code: "IQ", name: "Iraq", flag: "🇮🇶", continent: "Asia", coordinates: [43.6793, 33.2232] },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿", continent: "Asia", coordinates: [66.9237, 48.0196] },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿", continent: "Asia", coordinates: [47.5769, 40.1431] },
  { code: "GE", name: "Georgia", flag: "🇬🇪", continent: "Asia", coordinates: [43.3569, 42.3154] },
  { code: "AM", name: "Armenia", flag: "🇦🇲", continent: "Asia", coordinates: [45.0382, 40.0691] },
  { code: "NP", name: "Nepal", flag: "🇳🇵", continent: "Asia", coordinates: [84.124, 28.3949] },
  { code: "MM", name: "Myanmar", flag: "🇲🇲", continent: "Asia", coordinates: [95.9562, 21.9162] },
  { code: "KH", name: "Cambodia", flag: "🇰🇭", continent: "Asia", coordinates: [104.991, 12.5657] },
  { code: "LA", name: "Laos", flag: "🇱🇦", continent: "Asia", coordinates: [102.4955, 19.8563] },
  { code: "MN", name: "Mongolia", flag: "🇲🇳", continent: "Asia", coordinates: [103.8467, 46.8625] },
  { code: "GH", name: "Ghana", flag: "🇬🇭", continent: "Africa", coordinates: [-1.0232, 7.9465] },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿", continent: "Africa", coordinates: [34.8888, -6.369] },
  { code: "UG", name: "Uganda", flag: "🇺🇬", continent: "Africa", coordinates: [32.2903, 1.3733] },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹", continent: "Africa", coordinates: [40.4897, 9.145] },
  { code: "DZ", name: "Algeria", flag: "🇩🇿", continent: "Africa", coordinates: [1.6596, 28.0339] },
  { code: "TN", name: "Tunisia", flag: "🇹🇳", continent: "Africa", coordinates: [9.5375, 33.8869] },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼", continent: "Africa", coordinates: [29.1549, -19.0154] },
  { code: "ZM", name: "Zambia", flag: "🇿🇲", continent: "Africa", coordinates: [27.8493, -13.1339] },
  { code: "SN", name: "Senegal", flag: "🇸🇳", continent: "Africa", coordinates: [-14.4524, 14.4974] },
  { code: "CI", name: "Ivory Coast", flag: "🇨🇮", continent: "Africa", coordinates: [-5.5471, 7.54] },
  { code: "CM", name: "Cameroon", flag: "🇨🇲", continent: "Africa", coordinates: [12.3547, 7.3697] },
  { code: "EC", name: "Ecuador", flag: "🇪🇨", continent: "Americas", coordinates: [-78.1834, -1.8312] },
  { code: "VE", name: "Venezuela", flag: "🇻🇪", continent: "Americas", coordinates: [-66.5897, 6.4238] },
  { code: "UY", name: "Uruguay", flag: "🇺🇾", continent: "Americas", coordinates: [-55.7658, -32.5228] },
  { code: "PY", name: "Paraguay", flag: "🇵🇾", continent: "Americas", coordinates: [-58.4438, -23.4425] },
  { code: "BO", name: "Bolivia", flag: "🇧🇴", continent: "Americas", coordinates: [-63.5887, -16.2902] },
  { code: "GT", name: "Guatemala", flag: "🇬🇹", continent: "Americas", coordinates: [-90.2308, 15.7835] },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷", continent: "Americas", coordinates: [-83.7534, 9.7489] },
  { code: "PA", name: "Panama", flag: "🇵🇦", continent: "Americas", coordinates: [-80.7821, 8.538] },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴", continent: "Americas", coordinates: [-70.1627, 18.7357] },
];

export function countryPoint(code: CountryCode): CountryPoint | undefined {
  return COUNTRY_POINTS.find((c) => c.code === code);
}
