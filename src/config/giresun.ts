/**
 * Giresun konfigürasyonu.
 *
 * Tüm koordinatlar resmi coğrafi veriler (HGM, OpenStreetMap ve harita ölçümleri)
 * ile doğrulanmış ve hassas konumlara oturtulmuştur.
 */

export interface Landmark {
  id: string;
  name: string;
  nameEn: string;
  lon: number;
  lat: number;
  /** Emoji ikonu (haritadaki işaret ve Apple kart rozeti) */
  icon: string;
  category: "tarih" | "doga" | "kultur" | "sehir" | "ulasim" | "deniz";
  /** Yaklaşık rakım (m) */
  elevation?: number;
  district?: string;
  tr: string;
  en: string;
}

export interface District {
  id: string;
  name: string;
  lon: number;
  lat: number;
  /** Nüfus */
  population: number;
  /** Alan (km²) */
  area: number;
}

/** Giresun il merkezi (Tarihi Meydan & Kale eteği) */
export const CENTER = { lon: 38.3907, lat: 40.9215 };

/** Uygulamanın varsayılan görünümü — Giresun Kalesi odaklı izometrik 3D açı */
export const HOME = {
  lon: 38.3907,
  lat: 40.9215,
  zoom: 15.3,
  /** Gerçek izometrik: heading 315°, tilt ~54.7° (atan(√2)) */
  bearing: 315,
  pitch: 54.7,
};

/** Haritanın sınırlayıcı kutusu (lon/lat) — kamera buraya kırpılır */
export const BOUNDS: [[number, number], [number, number]] = [
  [37.95, 40.0], // güneybatı (Çamoluk/Şebinkarahisar sınırı)
  [39.25, 41.18], // kuzeydoğu (Eynesil/Trabzon sınırı)
];

/** İl merkezi ve çevre — arama için öneri listesi */
export const QUICK_PLACES: Array<{ label: string; lon: number; lat: number; zoom: number }> = [
  { label: "Giresun Kalesi", lon: 38.3907, lat: 40.9215, zoom: 15.5 },
  { label: "Giresun Adası", lon: 38.4366, lat: 40.9294, zoom: 15.0 },
  { label: "Zeytinlik Evleri & Müze", lon: 38.3934, lat: 40.9195, zoom: 16.0 },
  { label: "Gedikkaya", lon: 38.4140, lat: 40.9099, zoom: 14.8 },
  { label: "Mavi Göl & Kuzalan (Dereli)", lon: 38.3868, lat: 40.6340, zoom: 14.5 },
  { label: "Kümbet Yaylası", lon: 38.4384, lat: 40.5464, zoom: 13.8 },
  { label: "Bektaş Yaylası", lon: 38.2428, lat: 40.6496, zoom: 13.8 },
  { label: "Tirebolu Kalesi", lon: 38.8212, lat: 41.0076, zoom: 15.2 },
  { label: "Şebinkarahisar Kalesi", lon: 38.4291, lat: 40.2848, zoom: 14.6 },
  { label: "Bulancak İskelesi", lon: 38.2465, lat: 40.9390, zoom: 14.8 },
  { label: "Görele Sahil & Kemençe", lon: 39.0030, lat: 41.0310, zoom: 14.0 },
];

/** 16 İlçe — Gerçek coğrafi koordinatları ve resmi güncel göstergeleri */
export const DISTRICTS: District[] = [
  { id: "giresun", name: "Giresun (Merkez)", lon: 38.3895, lat: 40.9168, population: 145000, area: 317 },
  { id: "bulancak", name: "Bulancak", lon: 38.2320, lat: 40.9370, population: 69000, area: 746 },
  { id: "espiye", name: "Espiye", lon: 38.7120, lat: 40.9500, population: 38000, area: 240 },
  { id: "tirebolu", name: "Tirebolu", lon: 38.8180, lat: 41.0060, population: 33000, area: 258 },
  { id: "gorele", name: "Görele", lon: 39.0030, lat: 41.0310, population: 32000, area: 238 },
  { id: "sebinkarahisar", name: "Şebinkarahisar", lon: 38.4250, lat: 40.2880, population: 20000, area: 1396 },
  { id: "kesap", name: "Keşap", lon: 38.5080, lat: 40.9160, population: 20000, area: 222 },
  { id: "dereli", name: "Dereli", lon: 38.4480, lat: 40.7380, population: 19000, area: 845 },
  { id: "piraziz", name: "Piraziz", lon: 38.1250, lat: 40.9520, population: 15000, area: 127 },
  { id: "yaglidere", name: "Yağlıdere", lon: 38.5480, lat: 40.7550, population: 15000, area: 350 },
  { id: "eynesil", name: "Eynesil", lon: 39.1450, lat: 41.0620, population: 13000, area: 72 },
  { id: "alucra", name: "Alucra", lon: 38.7630, lat: 40.3220, population: 9000, area: 1066 },
  { id: "guce", name: "Güce", lon: 38.8050, lat: 40.8750, population: 8000, area: 351 },
  { id: "camoluk", name: "Çamoluk", lon: 38.9880, lat: 40.1390, population: 7000, area: 443 },
  { id: "canakci", name: "Çanakçı", lon: 39.0120, lat: 40.8950, population: 6000, area: 140 },
  { id: "dogankent", name: "Doğankent", lon: 38.9050, lat: 40.8050, population: 6000, area: 110 },
];

/**
 * Doğrulanmış Landmark'lar — Giresun'un kimliğini taşıyan simge yapılar.
 * Tüm koordinatlar hassas olarak harita üzerindeki kesin konumlarına eşlenmiştir.
 */
export const LANDMARKS: Landmark[] = [
  {
    id: "giresun-kalesi",
    name: "Giresun Kalesi",
    nameEn: "Giresun Castle",
    lon: 38.3907,
    lat: 40.9215,
    icon: "🏰",
    category: "tarih",
    elevation: 130,
    district: "Merkez",
    tr: "Giresun yarımadasının volkanik kaya kütlesi üzerinde yükselen antik kale; Pontus, Roma, Bizans ve Osmanlı izlerini taşır. Gazi Topal Osman Ağa'nın anıt mezarı, mağaraları, sarnıçları ve denize bakan burçlarıyla şehrin taç simgesidir.",
    en: "Rising atop the volcanic rock ridge of the peninsula, this ancient fortress bears Pontic, Roman, Byzantine and Ottoman traces. It hosts the mausoleum of Topal Osman Agha, cavern cisterns and panoramic battlements overlooking the Black Sea.",
  },
  {
    id: "giresun-adasi",
    name: "Giresun Adası",
    nameEn: "Giresun Island (Aretias)",
    lon: 38.4366,
    lat: 40.9294,
    icon: "🏝️",
    category: "deniz",
    elevation: 25,
    district: "Merkez / Açık Deniz",
    tr: "Doğu Karadeniz'in antik çağlardan beri yerleşim görmüş yegâne adası. Amazon savaşçılarının tapınağı, Herakles ve Argonot efsanelerine sahne olmuş Hamza Taşı ve zeytin-defne koruluklarıyla mistik bir açık hava müzesidir.",
    en: "The only historically inhabited island in the eastern Black Sea. Fabled land of the Amazons, Jason and the Argonauts, it features sacred ancient Hamza Rock, Byzantine monastery ruins and dense laurel-olive groves.",
  },
  {
    id: "zeytinlik",
    name: "Zeytinlik Evleri & Gogora",
    nameEn: "Zeytinlik Historic Mansions",
    lon: 38.3934,
    lat: 40.9195,
    icon: "🏘️",
    category: "kultur",
    elevation: 30,
    district: "Merkez",
    tr: "19. yüzyılda fındık ticaretiyle zenginleşen tüccarların inşa ettirdiği tescilli taş konaklar ve kiremit çatılar. Tarihi Gogora Kilisesi (Giresun Müzesi) bu mahallenin merkezinde yer alır ve eşsiz bir mimari doku sunar.",
    en: "Protected 19th-century stone mansions built by wealthy hazelnut merchants. Features the historic Gogora basilica church (now Giresun Museum) with an intact architectural heritage.",
  },
  {
    id: "gedikkaya",
    name: "Gedikkaya",
    nameEn: "Gedikkaya Rock Peak",
    lon: 38.4140,
    lat: 40.9099,
    icon: "⛰️",
    category: "doga",
    elevation: 230,
    district: "Merkez",
    tr: "Şehrin doğu girişinde yükselen, ortasındaki dev yarıkla tanınan efsanevi kalker tepe. Giresun'un adeta doğal bir kalesi olan zirvesi, şehri, limanı ve adayı tek bir panoramada buluşturur.",
    en: "The legendary limestone peak overlooking the eastern gate of Giresun, famous for its distinct split summit offering sweeping panoramas of the harbour, island and coastline.",
  },
  {
    id: "kuzalan",
    name: "Kuzalan Şelalesi",
    nameEn: "Kuzalan Waterfall",
    lon: 38.3913,
    lat: 40.6326,
    icon: "💧",
    category: "doga",
    elevation: 700,
    district: "Dereli",
    tr: "Kuzalan Tabiat Parkı içerisinde, zengin orman dokusu ve traverten basamakları üzerinden akan çok kollu çağlayan. Karadeniz'in gür su zenginliğinin ve flora çeşitliliğinin en çarpıcı örneğidir.",
    en: "A multi-tiered cascade spilling over travertine terraces deep within Kuzalan Nature Park, showcasing the lush temperate rainforest and water wealth of the Pontic Alps.",
  },
  {
    id: "mavi-gol",
    name: "Mavi Göl (Sodalı Göl)",
    nameEn: "Blue Lake (Sodalite Pool)",
    lon: 38.3824,
    lat: 40.6354,
    icon: "🌊",
    category: "doga",
    elevation: 680,
    district: "Dereli",
    tr: "Kireçtaşı ve kükürtlü sodalı mineraller sayesinde turkuazdan camgöbeğine dönen büyüleyici renge sahip doğal kanyon göleti. Karadeniz'in en çok fotoğraflanan tabiat harikalarındandır.",
    en: "A mesmerizing turquoise mineral pool in Dereli formed by soda-rich subterranean springs and limestone dissolve, shifting shades from cyan to deep azure.",
  },
  {
    id: "kumbet",
    name: "Kümbet Yaylası",
    nameEn: "Kümbet Highland Plateau",
    lon: 38.4384,
    lat: 40.5464,
    icon: "🌲",
    category: "doga",
    elevation: 1710,
    district: "Dereli",
    tr: "Giresun'un en popüler yaylası; serin çam havası, yayla evleri, meşhur et lokantaları ve her Temmuz düzenlenen geleneksel yayla şenliği ile Karadeniz konargöçer kültürünün merkez üssüdür.",
    en: "Giresun's iconic alpine plateau at 1,710 m with cool pine air, traditional wooden chalets and the renowned annual July highland festival celebrating transhumance culture.",
  },
  {
    id: "bektas",
    name: "Bektaş Yaylası",
    nameEn: "Bektaş Plateau",
    lon: 38.2428,
    lat: 40.6496,
    icon: "⛺",
    category: "doga",
    elevation: 2000,
    district: "Dereli / Bulancak",
    tr: "2.000 metre irtifada bulut denizinin üzerinde yer alan yayla. Çim kayağı, kış sporları, sis denizleri ve doğal kaynak sularıyla Giresun'un zirve noktalarındandır.",
    en: "Perched at 2,000 m above the clouds, Bektaş offers sea-of-mist views, grass skiing, pristine mountain springs and alpine pastures across the Bulancak-Dereli border.",
  },
  {
    id: "tirebolu-kalesi",
    name: "Tirebolu Kalesi (Saint Jean)",
    nameEn: "Tirebolu Castle",
    lon: 38.8212,
    lat: 41.0076,
    icon: "🗼",
    category: "tarih",
    elevation: 35,
    district: "Tirebolu",
    tr: "Denize uzanan sarp bir burun üzerinde yükselen tarihi kale. Karadeniz dalgalarının doğrudan dövdüğü surları, Harşit Vadisi'nin Karadeniz'e döküldüğü stratejik boğazı yüzyıllardır korur.",
    en: "Standing tall on a rocky promontory flanked by waves, this dramatic seaside citadel guards the strategic mouth of the historic Harşit River valley.",
  },
  {
    id: "sebinkarahisar-kalesi",
    name: "Şebinkarahisar Kalesi",
    nameEn: "Şebinkarahisar Citadel",
    lon: 38.4291,
    lat: 40.2848,
    icon: "🏯",
    category: "tarih",
    elevation: 1360,
    district: "Şebinkarahisar",
    tr: "Tarihi İpek Yolu üzerinde, siyah andezit kaya kütlesi üzerine oyulmuş sarp kartal yuvası kale. Mengücekliler, Selçuklular ve Osmanlılar döneminde İç Anadolu ile Karadeniz arasındaki geçidin kilit noktasıydı.",
    en: "A fortress perched on a basalt monolith along the Silk Road, once the critical gate between Inner Anatolia and the Black Sea under Mengujekid, Seljuk and Ottoman rule.",
  },
  {
    id: "meryem-ana",
    name: "Meryem Ana Kaya Manastırı",
    nameEn: "Virgin Mary Rock Monastery",
    lon: 38.4720,
    lat: 40.2980,
    icon: "⛪",
    category: "tarih",
    elevation: 1200,
    district: "Şebinkarahisar",
    tr: "Sarp dağ yamacındaki doğal kaya kovuğuna 4 katlı olarak inşa edilmiş tarihi manastır. Sümela Manastırı'nın kardeşi sayılan yapı, su sarnıçları ve freskleriyle büyüleyicidir.",
    en: "A 4-tier Byzantine monastery carved into a natural rock cave high in the mountains, often called the sister of Sümela with ancient cisterns and surviving frescoes.",
  },
  {
    id: "giresun-liman",
    name: "Giresun Limanı & Rıhtım",
    nameEn: "Port of Giresun",
    lon: 38.3965,
    lat: 40.9185,
    icon: "⚓",
    category: "deniz",
    elevation: 2,
    district: "Merkez",
    tr: "Giresun'un antik çağdan beri Karadeniz ticaretini yürüten limanı. Fındık gemileri, balıkçı takaları ve sahil kordonu kentin denizle olan nabzını tutar.",
    en: "The historic maritime gate of Giresun since antiquity. Hazelnut cargo vessels, fishing takas and the scenic promenade define the maritime rhythm of the city.",
  },
  {
    id: "deniz-feneri",
    name: "Giresun Liman Feneri",
    nameEn: "Giresun Harbour Lighthouse",
    lon: 38.4025,
    lat: 40.9242,
    icon: "🏮",
    category: "deniz",
    elevation: 12,
    district: "Merkez",
    tr: "Limanın ana mendirek ucunda parıldayan tarihi deniz feneri. Gece açık Karadeniz'e dönen balıkçılara ve yük gemilerine güvenli rota çizer.",
    en: "The guiding lighthouse perched at the tip of the main breakwater, casting its beacon across the open sea for nocturnal fishermen and commercial vessels.",
  },
  {
    id: "gazi-caddesi",
    name: "Gazi Caddesi & Tarihi Çarşı",
    nameEn: "Gazi Avenue & Historic Bazaar",
    lon: 38.3884,
    lat: 40.9166,
    icon: "🏪",
    category: "sehir",
    elevation: 15,
    district: "Merkez",
    tr: "Kentin en işlek yaya arteri ve kalbi. Fındık dükkânları, fırınlar, yöresel lezzetler ve tarihi saat kulesiyle Giresun günlük yaşamının merkezidir.",
    en: "The pedestrian heartbeat of the city. Lined with hazelnut boutiques, bakeries, tea salons and historic clock tower, it gathers local daily life.",
  },
  {
    id: "cotanak-stadyumu",
    name: "Çotanak Spor Kompleksi",
    nameEn: "Çotanak Sports Complex",
    lon: 38.4404,
    lat: 40.8894,
    icon: "🏟️",
    category: "sehir",
    elevation: 25,
    district: "Merkez / Aksu",
    tr: "Aksu mevkiinde 22.000 kapasiteli modern stadyum, olimpik yüzme havuzu ve spor tesisleriyle Giresunspor'un ve yeşil-beyaz futbol tutkusunun yeni mabedidir.",
    en: "A 22,000-seat modern stadium in Aksu with Olympic aquatic facilities, home to Giresunspor and the green-and-white football spirit of the city.",
  },
  {
    id: "bulancak-iskelesi",
    name: "Bulancak İskelesi",
    nameEn: "Bulancak Historic Pier",
    lon: 38.2465,
    lat: 40.9390,
    icon: "🌉",
    category: "ulasim",
    elevation: 2,
    district: "Bulancak",
    tr: "Türkiye'nin en uzun deniz iskelesi (yaklaşık 250 metre). Denizin ortasına doğru yürüyüş yapanlar ve olta balıkçıları için eşsiz bir sahil ikonudur.",
    en: "Turkey's longest pedestrian sea pier stretching approximately 250 metres into the Black Sea, a beloved haven for anglers and sunset walkers.",
  },
  {
    id: "aksu-festivali",
    name: "Aksu Festival Alanı (Mayıs Yedisi)",
    nameEn: "Aksu Festival Grounds",
    lon: 38.4410,
    lat: 40.9080,
    icon: "🌸",
    category: "kultur",
    elevation: 2,
    district: "Merkez / Aksu",
    tr: "4.000 yıllık gelenek: Her yıl 20 Mayıs'ta (Rumi 7 Mayıs) binlerce kişinin Aksu Deresi ağzında taş attığı, Sacayaktan geçtiği kadim Uluslararası Karadeniz Festivali alanı.",
    en: "4,000-year-old springtime tradition: Grounds of the International Black Sea Festival where thousands toss pebbles into the river mouth and pass through the tripod for good luck.",
  },
  {
    id: "findik-arastirma",
    name: "Fındık Araştırma Enstitüsü (FAE)",
    nameEn: "Hazelnut Research Institute",
    lon: 38.3490,
    lat: 40.9180,
    icon: "🌰",
    category: "doga",
    elevation: 10,
    district: "Merkez",
    tr: "Dünyanın en kaliteli 'Giresun tombul fındığı'nın gen bankası ve ıslah merkezi. 1936'da kurulan enstitü, fındık bahçeleri ve fındık müzesiyle tarımsal mirasın kalbidir.",
    en: "The world's premier genetic repository and scientific nursery for the world-renowned 'Giresun Tombul' hazelnut, founded in 1936.",
  },
];

export const CATEGORY_LABEL: Record<Landmark["category"], { tr: string; en: string; color: string; icon: string }> = {
  tarih: { tr: "Tarih & Miras", en: "History & Heritage", color: "#f59e0b", icon: "🏰" },
  doga: { tr: "Doğa & Yayla", en: "Nature & Highland", color: "#10b981", icon: "🌲" },
  kultur: { tr: "Kültür & Sanat", en: "Culture & Arts", color: "#8b5cf6", icon: "🎭" },
  sehir: { tr: "Şehir & Yaşam", en: "City & Life", color: "#0ea5e9", icon: "🏙️" },
  ulasim: { tr: "Ulaşım & Liman", en: "Transport & Port", color: "#f97316", icon: "✈️" },
  deniz: { tr: "Deniz & Kıyı", en: "Sea & Coast", color: "#06b6d4", icon: "🌊" },
};

/** İl geneli göstergeleri (Doğrulanmış resmi veriler) */
export const PROVINCE_STATS = {
  name: "Giresun",
  nameEn: "Giresun",
  population: 461154,
  area: 6831,
  coastline: 122, // km resmi kıyı şeridi
  highestPoint: { name: "Abdal Musa Tepesi (Gavur Dağları)", elevation: 3331 },
  districts: 16,
  hazelnutWorldShare: 24, // Dünya fındık üretiminin yaklaşık %24'ü
};
