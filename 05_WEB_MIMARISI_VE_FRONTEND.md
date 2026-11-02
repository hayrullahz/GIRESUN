# 💻 WEB MİMARİSİ, FRONTEND VE ARAYÜZ TASARIMI

Bu belge, **Isometric Giresun** web uygulamasının kullanıcı arayüzünü, OpenSeaDragon entegrasyonunu, shader katmanlarını ve ses tasarımını detaylandırır.

---

## 1. Teknoloji Seçimleri

| Katman | Teknoloji | Seçilme Nedeni |
|---|---|---|
| **Paket Yöneticisi & Çalışma Zamanı** | **Bun** | Ultra hızlı paket yükleme, hafif TypeScript desteği. |
| **Ön Yüz Çatısı** | **React 19 + TypeScript** | Modüler bileşen yapısı, tip güvenliği ve shader state yönetimi. |
| **Derleme Aracı** | **Vite** | Hızlı HMR (Hot Module Replacement) ve optimize üretim derlemesi. |
| **Harita / DZI Motoru** | **OpenSeaDragon 5.x** | Gigapiksellik derin zoom haritalarında endüstri standardı performans. |
| **GPU Gölgelendiricileri** | **WebGL (Raw GLSL)** | Harita üzerine sıfır gecikmeli, 60 FPS kar ve dalga parçacık efektleri. |
| **İkon Seti** | **Lucide React** | Modern, hafif vektörel arayüz simgeleri. |

---

## 2. Dizin Yapısı (Frontend Architecture)

```
src/app/
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── main.tsx
    ├── App.tsx                        # Ana sayfa ve koordinat yönlendirme
    ├── config.ts                      # DZI yolları, varsayılan koordinatlar
    ├── components/
    │   ├── IsometricMap.tsx           # OpenSeaDragon konteyneri
    │   ├── SnowShaderOverlay.tsx      # WebGL kar ve tipi shader tuvali
    │   ├── WaterShaderOverlay.tsx     # WebGL kıyı dalga ve köpük tuvali
    │   ├── Minimap.tsx                # Giresun genel bakış radar haritası
    │   ├── POIPanels.tsx              # Kale, Ada, Zeytinlik hızlı atlama butonları
    │   ├── WeatherControlPanel.tsx    # Kar/Yaz geçişi ve parçacık ayarları
    │   └── AudioController.tsx        # Karadeniz dalga ve fırtına sesleri
    ├── shaders/
    │   ├── snow_particles.glsl.ts     # Kar yağışı vertex & fragment shader'ı
    │   ├── blizzard_fog.glsl.ts       # Fırtına sisi shader'ı
    │   └── water_waves.glsl.ts        # Kıyı köpük ve dalga shader'ı
    └── styles/
        ├── index.css
        └── retro_ui.css               # 90'lar SimCity pencereleri ve buton stilleri
```

---

## 3. Katmanlı Tuval Render Mimarisi (Canvas Layering)

Tüm katmanlar OpenSeaDragon haritası üzerinde tam ekran olarak `z-index` ile üst üste biner:

```
[ z-index: 50 ]  Arayüz Bileşenleri (Header, Butonlar, Kar Paneli, POI Kartları)
[ z-index: 30 ]  WebGL Kar Parçacıkları (Snow Particle Overlay - Şeffaf)
[ z-index: 20 ]  WebGL Fırtına Sisi (Blizzard Haze Overlay - Yarı Şeffaf)
[ z-index: 15 ]  WebGL Su & Dalga Efekti (Kıyı Maskesi Üzerinde)
[ z-index: 10 ]  OpenSeaDragon DZI Görüntüleyici (Taban Harita: dzi/base veya dzi/snow)
[ z-index:  1 ]  Arka Plan Rengi (#15181F - Koyu Retro Lacivert)
```

---

## 4. Akıllı POI (Önemli Noktalar) Hızlı Atlama Sistemi

Kullanıcı haritada kaybolmasın diye sol altta şık bir POI menüsü bulunur. Butona tıklandığında OpenSeaDragon kamerası yumuşak bir yay (smooth easing) ile ilgili koordinata kayar:

```typescript
// POI Koordinat Tanımları (Giresun Grid Sistemi)
export const GIRESUN_POIS = [
  {
    id: "kale",
    title: "Giresun Kalesi",
    description: "Volkanik tepe üzerindeki antik kale ve Karadeniz panoraması",
    target: [0.50, 0.48], // OpenSeaDragon normalize koordinatları
    zoom: 12.5,
    icon: "Castle"
  },
  {
    id: "ada",
    title: "Giresun Adası (Aretias)",
    description: "Amazonların ve Argonotların mitolojik adası, Hamza Taşı",
    target: [0.52, 0.22],
    zoom: 13.0,
    icon: "Trees"
  },
  {
    id: "zeytinlik",
    title: "Zeytinlik Mahallesi",
    description: "Kiremit çatılı tarihi taş konaklar ve dar sokaklar",
    target: [0.47, 0.53],
    zoom: 14.0,
    icon: "Home"
  },
  {
    id: "liman",
    title: "Giresun Limanı",
    description: "Mendirek, fenerler ve Karadeniz balıkçı takaları",
    target: [0.58, 0.50],
    zoom: 13.2,
    icon: "Anchor"
  }
];
```

---

## 5. Kar Modu Etkileşim Deneyimi (Snow Mode UX)

1. **Tek Tıkla Kışa Geçiş**:
   - Üst bardaki **Kar Tanesi (❄️)** butonuna basıldığında veya URL'e `?mode=snow` girildiğinde:
     - Harita tabanı `dzi/base`'ten `dzi/snow`'a pürüzsüzce geçer.
     - WebGL Kar Parçacık Tuvali aktive olur ve kar yağışı başlar.
     - Soğuk kış fırtınası sis katmanı devreye girer.
2. **Ayarlanabilir Kar Kontrolleri**:
   - Kar Miktarı (Parçacık yoğunluğu: Az, Normal, Kar Fırtınası).
   - Rüzgâr Şiddeti (Karadeniz Poyrazı / Sağa-Sola Salınım).
   - Sis Yoğunluğu (Ufuk çizgisindeki pus).
3. **Retro CRT / Scanline Modu (İsteğe Bağlı)**:
   - 90'ların tüplü monitör nostaljisini yaşatmak için hafif CRT tarama çizgileri overlay'i eklenebilir.

---

## 6. Ses Atmosferi (Soundscape)

Web Audio API kullanılarak tasarlanan ortam sesleri:
- **Yaz / Normal Mod**: Hafif Karadeniz kıyı dalgaları ve uzaktan gelen martı sesleri.
- **Kar Modu**: Uğultulu soğuk kış rüzgârı, kale kayalıklarına çarpan sert dalgalar ve sessizlik hissi.
- *(Varsayılan olarak sessizdir; kullanıcı sol alttaki hoparlör butonuna basarak sesi açabilir).*
