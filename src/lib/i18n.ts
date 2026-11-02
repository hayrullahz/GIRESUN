export type Lang = "tr" | "en";

type Dict = Record<string, { tr: string; en: string }>;

const DICT: Dict = {
  title: { tr: "isometric giresun", en: "isometric giresun" },
  tagline: {
    tr: "Giresun'un sokakları ve binaları, izometrik bir haritada.",
    en: "The streets and buildings of Giresun, on an isometric map.",
  },
  searchPlaceholder: { tr: "Yer ara…", en: "Search a place…" },
  searchNoResult: { tr: "Sonuç bulunamadı", en: "No results" },
  searchNearby: { tr: "Yakınımda ara", en: "Search nearby" },
  share: { tr: "Bağlantıyı kopyala", en: "Copy link" },
  copied: { tr: "Bağlantı kopyalandı", en: "Link copied" },
  dashboard: { tr: "Veri Panosu", en: "Dashboard" },
  landmarks: { tr: "Landmark'lar", en: "Landmarks" },
  districts: { tr: "İlçeler", en: "Districts" },
  layers: { tr: "Katmanlar", en: "Layers" },
  buildings3d: { tr: "3B Binalar", en: "3D Buildings" },
  terrain: { tr: "Arazi Kabartması", en: "Terrain Relief" },
  aerial: { tr: "Hava Fotoğrafı", en: "Aerial Imagery" },
  waves: { tr: "Animasyonlu Deniz", en: "Animated Sea" },
  giresunFocus: { tr: "Giresun Odağı", en: "Giresun Focus" },
  traffic: { tr: "Trafik & Tekneler", en: "Traffic & Boats" },
  maskTooltip: { tr: "İl sınırları dışını karart / aydınlat", en: "Darken / lighten outside province boundary" },
  weather: { tr: "Hava Durumu", en: "Weather" },
  rain: { tr: "Yağmur", en: "Rain" },
  snow: { tr: "Kar", en: "Snow" },
  clear: { tr: "Açık", en: "Clear" },
  dayNight: { tr: "Gündüz / Gece", en: "Day / Night" },
  followSun: { tr: "Güneşi takip et", en: "Follow sun" },
  timeOfDay: { tr: "Saat", en: "Time" },
  resetView: { tr: "Başlangıç görünümü", en: "Reset view" },
  help: { tr: "Yardım", en: "Help" },
  about: { tr: "Hakkında", en: "About" },
  elevation: { tr: "Rakım", en: "Elevation" },
  population: { tr: "Nüfus", en: "Population" },
  area: { tr: "Alan", en: "Area" },
  category: { tr: "Kategori", en: "Category" },
  goTo: { tr: "Haritada göster", en: "Show on map" },
  close: { tr: "Kapat", en: "Close" },
  live: { tr: "canlı", en: "live" },
  visitors: { tr: "ziyaretçi", en: "visitors" },
  loading: { tr: "Harita yükleniyor…", en: "Loading map…" },
  // Pano
  dashTitle: { tr: "Giresun Veri Panosu", en: "Giresun Data Dashboard" },
  dashIntro: {
    tr: "İl genelinde temel göstergeler ve katman kontrolleri. Sınır ve adlar OpenStreetMap'ten canlıdır.",
    en: "Key indicators and layer controls across the province. Borders and names are live from OpenStreetMap.",
  },
  statPopulation: { tr: "İl Nüfusu", en: "Province Population" },
  statArea: { tr: "İl Alanı", en: "Province Area" },
  statCoast: { tr: "Kıyı Uzunluğu", en: "Coastline" },
  statDistricts: { tr: "İlçe Sayısı", en: "Districts" },
  statHazelnut: { tr: "Dünya Fındık Payı", en: "World Hazelnut Share" },
  statHighest: { tr: "En Yüksek Nokta", en: "Highest Point" },
  topDistricts: { tr: "Nüfusa Göre İlçeler", en: "Districts by Population" },
  density: { tr: "Yoğunluk (kişi/km²)", en: "Density (people/km²)" },
  sourceOsm: { tr: "Veri: OpenStreetMap katkıda bulunanları", en: "Data: OpenStreetMap contributors" },
  attribution: {
    tr: "Veri kaynakları: OpenStreetMap (ODbL) · OpenFreeMap karoları · AWS Terrain Tiles · Esri hava fotoğrafı",
    en: "Data sources: OpenStreetMap (ODbL) · OpenFreeMap tiles · AWS Terrain Tiles · Esri imagery",
  },
  landmarksCount: { tr: "Öne çıkan yerler", en: "Featured places" },
  backToMap: { tr: "Haritaya dön", en: "Back to map" },
  elevationProfile: { tr: "Rakım profili (merkez çevresi)", en: "Elevation profile (around centre)" },
  seaLevel: { tr: "Deniz seviyesi", en: "Sea level" },
  northUp: { tr: "Kuzey yukarı", en: "North up" },
  isoView: { tr: "İzometrik görünüm", en: "Isometric view" },
  rotateLeft: { tr: "Sola döndür (45°)", en: "Rotate left (45°)" },
  rotateRight: { tr: "Sağa döndür (45°)", en: "Rotate right (45°)" },
  tiltUp: { tr: "Yukarı çevir / 3B Eğim", en: "Tilt up / 3D Horizon" },
  tiltDown: { tr: "Aşağı çevir / Kuşbakışı", en: "Tilt down / Top-down" },
  toggle3d: { tr: "2B / 3B Görünüm", en: "Toggle 2D / 3D" },
  zoomIn: { tr: "Yakınlaş (+)", en: "Zoom in (+)" },
  zoomOut: { tr: "Uzaklaş (−)", en: "Zoom out (−)" },
  compassTooltip: { tr: "Pusula (Tıkla: İzometriğe sıfırla)", en: "Compass (Click: Reset to isometric)" },
};

let current: Lang = "tr";

export function setLang(l: Lang) {
  current = l;
  document.documentElement.lang = l;
}

export function getLang(): Lang {
  return current;
}

export function t(key: keyof typeof DICT | string): string {
  const e = DICT[key];
  if (!e) return key;
  return e[current];
}

export function toggleLang(): Lang {
  setLang(current === "tr" ? "en" : "tr");
  return current;
}
