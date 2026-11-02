# 🛣️ İZOMETRİK GİRESUN UYGULAMA YOL HARİTASI VE GÖREVLER

Bu belge, fikirden çalışan nihai web haritasına kadar projenin aşamalarını, araç gereksinimlerini ve hemen atılabilecek adımları tanımlar.

---

## 1. Geliştirme Fazları (Phased Roadmap)

```
[Faz 1: Çekirdek Kurulum & Harita Görüntüleyici MVP]
        │
        ▼
[Faz 2: 3D Coğrafi Veri & Blender İzometrik Şablonu]
        │
        ▼
[Faz 3: AI Görsel Üretimi (Yaz + Karadeniz Kışı)]
        │
        ▼
[Faz 4: WebGL Shader'ları (Snow Engine & Karadeniz Dalgası)]
        │
        ▼
[Faz 5: POI Bilgi Kartları, Ses ve Canlı Yayına Alma]
```

---

### Faz 1: Çekirdek Kurulum & Harita Görüntüleyici (MVP) — *Öncelik: Çok Yüksek*
- [ ] Bun tabanlı React + Vite + TypeScript web projesinin oluşturulması (`src/app`).
- [ ] `openseadragon` paketinin entegrasyonu ve tam ekran izometrik görüntüleyici kabuğu.
- [ ] Test amaçlı örnek bir 2:1 izometrik mini karo piramidinin (DZI) yüklenmesi.
- [ ] Fare sürükleme (pan), yakınlaştırma (zoom) ve koordinat göstergesinin çalışır hale getirilmesi.

### Faz 2: Coğrafi Veri ve Blender Şablonu — *Öncelik: Yüksek*
- [ ] Giresun Kalesi ve Giresun Adası için GeoJSON sınırlarının (`geo_data/giresun_bounds.json`) tanımlanması.
- [ ] Google 3D Tiles veya OpenStreetMap üzerinden Giresun 3D yükseklik ve bina verisinin temini.
- [ ] Blender üzerinde 2:1 izometrik ortografik kamera açısının ($30^\circ$ eğim, $45^\circ$ açı) sabitlenmesi.
- [ ] $512 \times 512$ boyutlarında ham uydu/3D kuadran render scriptinin yazılması.

### Faz 3: AI Stil Üretimi & Seam Önleme — *Öncelik: Yüksek*
- [ ] `Qwen/Image-Edit` ve SimCity 2000 piksel sanatı LoRA adaptörünün hazırlanması.
- [ ] Giresun Kalesi ve Zeytinlik Mahallesi için deneme karolarının üretilmesi.
- [ ] **Kar Modu Doku Üretimi**: Aynı karoların karlı kış varyasyonlarının (`generations/snow`) yapay zekâ ile türetilmesi.
- [ ] Karoların SQLite `quadrants.db` veritabanında indekslenmesi.
- [ ] `pyvips` ile `dzi/base` ve `dzi/snow` Deep Zoom piramitlerinin derlenmesi.

### Faz 4: WebGL Kar, Su Shader Motoru & Gece Işıkları — *Öncelik: Yüksek*
- [ ] `SnowShaderOverlay.tsx` bileşeninin kodlanması:
  - GPU tabanlı 15.000 parçacıklı kar tanesi vertex ve fragment shader'ı.
  - Karadeniz poyraz rüzgârı salınımı ve derinlik perspektifi.
  - Blizzard sis örtüsü (Cool Blue-Gray fog).
- [ ] `WaterShaderOverlay.tsx` bileşeninin kodlanması:
  - Giresun Adası ve sahil boyunca kıyı köpüğü ve hareketli dalgalar.
- [ ] **Gece Modu & Şehir Işıkları (`NightOverlay.tsx`)**:
  - Giresun koordinatlarına göre astronomik gün batımı/doğumu entegrasyonu (`tinydetroit.com` tarzı).
  - Giresun Kalesi sur aydınlatması, Zeytinlik pencereleri ve Giresun Adası dönen feneri.
- [ ] Üst barda ❄️ **Kar Modu** ve 🌙 **Gece Modu** geçiş kontrollerinin bağlanması.

### Faz 5: Minik Trafik, Apple HIG Arayüzü & Canlı Yayın — *Öncelik: Yüksek*
- [ ] **Apple HIG Buzlu Cam Dock (`AppleDock.tsx`)**:
  - macOS/iOS tarzı `backdrop-filter: blur(24px)` yüzen dock (`tinywarsaw.app` tarzı).
  - 44px dokunma alanları, dinamik ada durum kapsülü ve akıcı yay animasyonları.
- [ ] **Minik Trafik ve Deniz Simülasyonu (`TrafficLayer.tsx`)**:
  - Karadeniz Sahil Yolu üzerinde hareket eden araçlar, sarı dolmuşlar ve gece far ışık huzmeleri.
  - Liman ile Giresun Adası arasında seyreden balıkçı takaları ve köpük izleri.
- [ ] Giresun Kalesi, Giresun Adası, Zeytinlik ve Liman için interaktif tıklanabilir POI noktaları.
- [ ] Tarihi ve turistik bilgi pencereleri (Giresun fındığı, Amazon efsaneleri, kale tarihi).
- [ ] Karadeniz dalga ve kış fırtınası ses atmosferi (Web Audio API).
- [ ] Cloudflare Pages / Vercel veya AWS S3/CloudFront üzerinden yayına alma.

---

## 2. Gerekli Araçlar ve Bağımlılıklar

### Sistem Araçları (macOS)
```bash
# Web runtime
curl -fsSL https://bun.sh/install | bash

# Python ortam yöneticisi
curl -LsSf https://astral.sh/uv/install.sh | sh

# DZI piramit oluşturucu devasa görsel kütüphanesi
brew install vips
```

### Python Paketleri
- `pyvips`: Hızlı DZI piramidi ihracı için.
- `shapely`: Coğrafi poligon ve sınır hesaplamaları için.
- `pillow`: Ön işleme ve renk paleti indeksleme için.
- `sqlite3`: Karo veritabanı yönetimi için.

### Frontend Paketleri (Bun)
- `react`, `react-dom`, `@types/react`
- `openseadragon`, `@types/openseadragon`
- `lucide-react` (Arayüz ikonları)

---

## 3. Hemen Atılabilecek İlk Adım

Geliştirmeye başlamak için hazır yapı taşlarımız:
1. `src/app` altında OpenSeaDragon + WebGL Snow Shader içeren çalışan bir **ön yüz prototipi** ayağa kaldırılabilir.
2. Giresun'un odak noktası olan **Giresun Kalesi** için ilk pilot 2:1 izometrik deneme karosu ve kar modu görseli üretilebilir!
