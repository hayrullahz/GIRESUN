# ⚙️ YAPAY ZEKÂ VE DOKU ÜRETİM BORUHATTI (PIPELINE)

Bu belge, gerçek dünya coğrafi verilerinden başlayarak **Isometric Giresun** için dikişsiz piksel harita karolarının (hem yazlık hem de karlı kışlık) nasıl üretileceğini adım adım açıklar.

---

## 1. Genel Boru Hattı Akışı

```
[1. Coğrafi Veri & Yükseklik]
        │
        ▼
[2. Blender 3D Orthographic Render (512x512)]
        │
        ▼
[3. AI Model: Qwen-Image-Edit & LoRA Infill]
   ├── Mod A: Standart Karadeniz Yazı (Yeşil/Mavi)
   └── Mod B: Karadeniz Kışı / Snow Modu (Beyaz/Buzul)
        │
        ▼
[4. Komşu Karo Dikişsiz Birleştirme (Seam Prevention)]
        │
        ▼
[5. SQLite quadrants.db Kaydı]
        │
        ▼
[6. libvips / pyvips ile DZI Piramit İhracı (WebP)]
```

---

## 2. Aşama 1: 3D Coğrafi Veri ve Orto-Kamera Yakalama

Giresun'un gerçekçi sokakları, eğimleri ve binaları için temel altlık oluşturulur:

1. **Veri Kaynakları**:
   - **Google Photorealistic 3D Tiles**: Giresun şehir merkezi ve kalesinin 3B bina ve doku modelleri.
   - **OpenStreetMap (OSM)**: Sokak ağları, bina taban alanları (footprints) ve kıyı çizgisi.
   - **SRTM / Copernicus DEM**: Giresun'un dik eğimli yükseklik profili.

2. **Blender / PyThreeJS Kamera Kurulumu**:
   - **Projeksiyon**: Orthographic (Perspektif bozulması sıfır).
   - **Kamera Açısı**: Eğim (Pitch) $30^\circ$, Dönüş (Yaw/Azimuth) $45^\circ$.
   - **Kuadran Boyutu**: $512 \times 512$ piksel.
   - **Örtüşme (Overlap)**: Karoların birbirine kusursuz kenetlenmesi için kenarlarda 32-64 piksellik güvenlik marjı bırakılır.

---

## 3. Aşama 2: AI Stil Dönüşümü ve Model Eğitimi

`isometric.nyc`'nin uyguladığı **Omni Infill** yöntemi kullanılır:

### A. Model Seçenekleri
- **Birincil Model**: **`Qwen/Image-Edit`** (Görsel tamamlama ve stilize etme için açık kaynaklı en güçlü model).
- **Stil LoRA'sı**: *SimCity 2000*, *RollerCoaster Tycoon* ve *Habbo Hotel* estetiğinde retro piksel sanatı LoRA adaptörü (FLUX veya SDXL tabanlı).
- **Eğitim Verisi**: Giresun'un Blender 3D render'ları ile piksellenmiş sentetik çiftler (Image-to-Image pairs).

### B. Prompt Mühendisliği
- **Temel Yaz Prompt'u**:
  > *"Retro 90s isometric 2:1 pixel art of Giresun Black Sea city, SimCity 2000 aesthetic, Giresun castle stone fortress on a steep cliff, red clay tile roof traditional houses, lush green hazelnut trees, deep blue ocean coastline, crisp pixel outlines, 16-bit color palette."*
- **Snow Mode (Kar Modu) Prompt'u**:
  > *"Retro 90s isometric 2:1 pixel art of Giresun covered in heavy winter blizzard snow, SimCity 2000 winter aesthetic, snow-laden roofs, frosted hazelnut orchards, icy fortress walls, frosty atmosphere, subtle blue-white snow blanket, crisp pixel art."*

---

## 4. Aşama 3: Dikiş Hatası (Seam Artifact) Önleme Kuralları

Karolar yan yana geldiğinde sınır çizgilerinin belli olmaması için `isometric.nyc`'nin katı üretim kuralları uygulanır:

```
[Kural 1: İzole 2x2 Başlangıç]
XXXXXGG   (Eğer etrafta hiçbir komşu yoksa
XXSSXGG    2x2'lik bir blok sıfırdan üretilebilir)
XXSSXGG   
XXXXXGG   --> ✅ İZİN VERİLDİ

[Kural 2: Kenar Genişletme 1x2 veya 2x1]
XXGGSX    (Daha önce üretilen 'G' karolarının sağ kenarındaki
XXGGSX     64 piksellik doku referans alınarak 'S' üretilir)
XXXXXX    --> ✅ İZİN VERİLDİ (Dikişsiz Geçiş Sağlanır)
```

1. **Maskeli Inpaint**: Yeni üretilen karonun komşuya bakan kenarına, komşu karodan 32 piksellik bir dilim yapıştırılır ve aradaki geçiş alanı yapay zekâ tarafından doldurulur (infilled).
2. **Renk Paleti Kilitleme**: Karadeniz suyunun mavisi (`#1E3F66`), fındık yapraklarının yeşili (`#2D5A27`) ve kış karının mavimsi beyazı (`#F0F4F8`) sabit renk paletine indekslenir (palette quantization).

---

## 5. Aşama 4: SQLite Veritabanı Mimarisi (`quadrants.db`)

Her bir üretilen karo SQLite üzerinde kayıt altına alınır:

```sql
CREATE TABLE quadrants (
    x INTEGER NOT NULL,          -- Grid X koordinatı
    y INTEGER NOT NULL,          -- Grid Y koordinatı
    hash TEXT NOT NULL,          -- Görüntü dosya karması
    layer TEXT DEFAULT 'base',   -- 'base' (yazlık) veya 'snow' (karlı)
    is_water BOOLEAN DEFAULT 0,  -- Su/deniz karosu mu?
    water_distance_mask TEXT,    -- Dalga shader'ı için kıyı mesafe maskesi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (x, y, layer)
);
```

---

## 6. Aşama 5: libvips ile DZI Piramidi İhracı

Binlerce PNG dosyasını webde ışık hızında açmak için `libvips` C motoru kullanılır:

```bash
# Python pyvips export komutu (Yaz ve Kar versiyonları için)
python src/pipeline/export_dzi.py --layer base --output public/dzi/base
python src/pipeline/export_dzi.py --layer snow --output public/dzi/snow
```

- **Format**: WebP (Kayıpsız ya da Q=95 sıkıştırma ile PNG'ye göre %35 daha küçük dosya boyutu).
- **Karo Ebatı**: 512x512 piksel.
- **Sonuç**: Web uygulamasının doğrudan okuyacağı `tiles.dzi` ve `tiles_files/` klasör piramidi.
