# 🔬 ISOMETRIC.NYC DETAYLI ARAŞTIRMA VE TERSİNE MÜHENDİSLİK RAPORU

Bu belge, Andy Coenen ([@_coenen](https://x.com/_coenen) / GitHub: [cannoneyed](https://github.com/cannoneyed)) tarafından geliştirilen ve viral olan **https://isometric.nyc/** projesinin kapsamlı teknik incelemesini içerir.

---

## 1. Projenin Özeti ve Felsefesi

- **Canlı Site**: [https://isometric.nyc/](https://isometric.nyc/)
- **Kar Modu Linki**: [https://isometric.nyc/snow](https://isometric.nyc/snow)
- **Açık Kaynak Deposu**: [github.com/cannoneyed/isometric-nyc](https://github.com/cannoneyed/isometric-nyc)
- **Veri Deposu**: [oxen.ai/cannoneyed/isometric-nyc-tiles](https://oxen.ai/cannoneyed/isometric-nyc-tiles) (32.000+ karelik harita verisi)
- **Tasarım Esin Kaynağı**: 90'ların sonu ve 2000'lerin başındaki klasik şehir kurma oyunları (*SimCity 2000*, *RollerCoaster Tycoon*).
- **Üretim Yöntemi**: "Vibe-Engineering" — Geliştirici manuel olarak neredeyse hiç kod yazmamış, yapay zekâ kodlama ajanları (Claude Code, Cursor, Gemini CLI) ve görsel modelleri orkestre ederek projeyi hayata geçirmiştir.

---

## 2. Sistemin Temel Bileşenleri

`isometric.nyc` projesi 4 ana ayaktan oluşur:

```
isometric-nyc/
├── geo_data/            # NYC sınırları (GeoJSON), koordinat matrisleri
├── generations/         # SQLite veritabanı (quadrants.db) ve üretilen PNG kuadranları
├── inference/           # Modal üzerinde koşan Qwen-Image-Edit fine-tune modelleri
├── src/
│   ├── isometric_nyc/   # Python boru hattı (indirme, sınır belirleme, export_dzi.py)
│   └── app/             # Web ön yüzü (Bun, Vite, React, OpenSeaDragon, WebGL shaders)
```

---

## 3. İzometrik Projeksiyon Standardı

Proje, klasik video oyunu izometrik standardı olan **2:1 (dimetrik / izometrik oyun projeksiyonu)** kullanır:
- **Yatay Eksen**: Her 2 piksel yatay ilerlemeye karşılık 1 piksel dikey ilerleme (yaklaşık 26.565° açı, pratikte 30° kamera açısıyla render alınır).
- **Kuadran Boyutu (Tile Size)**: Her bir kuadran **512x512 piksel** çözünürlüktedir.
- **Kamera**: Gerçek dünyadaki 3B uydu verisi (Google 3D Tiles) ortografik kamera ile 45° yatay dönüş (azimuth) ve ~30° dikey eğim ile taranır.

---

## 4. Yapay Zekâ Üretim Boru Hattı (AI Pipeline)

Projenin en can alıcı kısmı, uydu görüntüsünü piksel sanatına dönüştürürken **kareler arasında dikiş izi (seam artifact) bırakmamasıdır**.

### Model Mimarisi
- Temel model: **`Qwen/Image-Edit`** (görsel düzenleme ve infill odaklı).
- Fine-tuning platformu: **Oxen.ai** ve **Modal.com** sunucusuz GPU altyapısı.
- Sentetik veri üretimi: Google'ın **Nano Banana** görsel üretim modeli ile `marimo` notebook'larında oluşturulan "ham render -> retro piksel sanatı" çiftleri.

### "Omni Infill" Tekniği ve Dikişsiz Birleştirme Kuralları
Yeni bir karo üretilirken sıfırdan üretilmez. Önceden üretilmiş komşu karoların kenar pikselleri maskelenerek modele girdi verilir:

```
[Daha önce üretilen karo]  ->  [Maskeli Geçiş Bölgesi]  ->  [Yeni Üretilecek Karo]
          (Referans)                  (AI Infill Köprüsü)           (Yeni Piksel Verisi)
```

**Üretim Kuralları:**
1. **2x2 Üretim**: Yalnızca etrafında daha önce üretilmiş hiçbir komşu karo yoksa izin verilir (sıfırdan ada/bölge başlatırken).
2. **1x2 veya 2x1 Üretim**: Var olan üretilmiş bloğun yanına ekleme yaparken kullanılır; model önceki karoların kenarlarını referans alarak dikişsiz devam ettirir.
3. **Su Maskeleme**: Sahil ve deniz karoları veritabanında su olarak etiketlenir ve otomatik dolgu/renk düzeltme araçlarıyla pürüzsüzleştirilir.

---

## 5. Web Görüntüleyici ve DZI (Deep Zoom Image) Mimarisi

32.000 adet 512x512 piksel karonun tek parça halinde yüklenmesi gigabaytlarca bellek gerektireceğinden **OpenSeaDragon** ve **DZI Piramidi** kullanılmıştır.

### DZI Formatı Nasıl Çalışır?
- **Piramit Yapısı**: Görüntü piramit seviyelerine (Level 0'dan Level 17'ye kadar) bölünür.
- En uzak zoom seviyesinde (Level 9) tek bir küçük WebP dosyası görünürken, en yakın zoom seviyesinde (Level 17) kullanıcı sadece baktığı ekrana denk gelen 512x512'lik WebP karolarını çeker.
- Dönüştürme aracı: **`libvips` (`pyvips dzsave`)**. C kütüphanesi olduğundan devasa gigapiksellik haritaları RAM'i şişirmeden saniyeler içinde piramide böler.

```
public/dzi/
├── tiles.dzi              # XML formatında boyut ve format tanımı
├── tiles_metadata.json    # Grid boyutları, origin koordinatları
└── tiles_files/           # Seviye bazlı WebP piramidi
    ├── 9/
    ├── ...
    └── 17/
        ├── 0_0.webp
        ├── 0_1.webp
        └── ...
```

---

## 6. Giresun Projesine Çıkarılan Temel Dersler

| Özellik | isometric.nyc Yaklaşımı | Giresun İçin Uyarlama |
|---|---|---|
| **Harita Kapsamı** | Manhattan ve 5 NYC bölgesi (düz ızgara planı) | Yarımada, dik kale tepesi, ada ve deniz (yüksek rakım farkı) |
| **Kış Modu** | Çift DZI katmanı (`dzi/snow`) + WebGL Shader | Giresun Kalesi ve Zeytinlik üzerinde karlı doku + deniz fırtınası shader'ı |
| **Su / Deniz** | Hudson ve East River (hareketsiz nehir dokusu) | Hırçın Karadeniz dalgaları + köpük shader'ı + kıyı mesafesi maskesi |
| **Ön Yüz Performansı** | OpenSeaDragon 5.x + WebP piramitleri | Düşük bant genişliğinde dahi anında yüklenen WebP/AVIF karoları |
| **Veri Yönetimi** | SQLite `quadrants.db` | Giresun karoları için koordinat indeksli yerel SQLite veritabanı |
