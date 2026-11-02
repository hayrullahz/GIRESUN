# Giresun İl Sınırı & Dış Bölge Karartma Maskesi (Açık Deniz & İzometrik Odak)

Bu doküman, projede **Giresun ili sınırları içerisindeki kara alanının ve Karadeniz deniz koridorunun aydınlık ve odakta kalmasını**, çevre illerin (Ordu, Trabzon, Gümüşhane, Sivas) karartılmasını ve **deniz sınırlarının tamamen kaldırılarak açık deniz görsel efektlerine hazır hale getirilmesini** açıklar.

---

## 1. Deniz Sınırlarının Kaldırılması & Açık Deniz Mimarisi

Kullanıcı talebi doğrultusunda kıyı şeridinde ve açık Karadeniz'de yapay sınır çizgileri **tamamen kaldırılmıştır**:

- **Kıyı Çizgisinde Sınır Yok**: Önceden plajı/kıyı şeridini kesen sınır çizgisi kaldırıldı. Sınır çizgisi artık sadece **Kara Sınırlarını (Land Border)** takip eder: Eynesil'den (Trabzon sınırı) güneye inip Alucra/Çamoluk/Şebinkarahisar üzerinden Piraziz'e (Ordu sınırı) uzanır.
- **Deniz Koridoru Aydınlık**: Maske poligonunun kuzey ucu açık denize doğru serbest bırakılmıştır. Bu sayede Giresun Kalesi'nin önü, Giresun Adası, kıyı suları ve açık Karadeniz ufku kesintisiz olarak aydınlıktır.
- **Görsel Efekt Alanı**: Açık kalan bu deniz alanında canlı su efektleri (animasyonlu `water-waves` dalga shader'ı, köpükler, ada feneri ışığı ve balıkçı takaları) engelsizce izlenebilir.

```
+-------------------------------------------------------------+
|  KARADENİZ (AÇIK DENİZ & CANLI EFEKTLER)                    |
|  [Dalga Shader'ı, Köpükler, Ada Işıltısı - Çizgisiz & Aydın]|
|                                                             |
|       (Ordu Denizi)    [ Giresun Adası ]    (Trabzon Denizi)|
|           DARK             %100 AYDIN             DARK      |
|                      ~~~~~~~~~~~~~~~~~~~~~                  |
|                        GİRESUN SAHİLİ                       |
|                      (SINIR ÇİZGİSİ YOK!)                   |
|  (Ordu Kara)       +------------------------+ (Trabzon Kara)|
|      DARK          |   GİRESUN MERKEZ &     |     DARK      |
|   /=========\      |   16 İLÇE KARA ALANI   |  /==========\ |
|   | NEON    |      |                        |  | NEON     | |
|   | KARA    |      |   %100 AYDINLIK &      |  | KARA     | |
|   | SINIRI  |      |   3B ORTOFOTO & BİNA   |  | SINIRI   | |
|   \=========/      +------------------------+  \==========/ |
|       (Sivas)             (Gümüşhane)                       |
|        DARK                  DARK                           |
+-------------------------------------------------------------+
```

---

## 2. GeoJSON Geometrisi: LineString vs Polygon

İki ayrı GeoJSON bileşeni üretilmiştir:

1. **`GIRESUN_LAND_BORDER` (LineString)**:
   - Sadece kara sınırlarını içerir (29 doğrulanmış kırık nokta).
   - Eynesil sahilinden başlar (`39.1635, 41.0793`), güneye inerek ili kuşatır ve Piraziz sahilinde biter (`38.1232, 40.9551`).
   - Kıyı boyunca devam etmez; böylece denizde veya sahilde hiçbir çizgi oluşmaz.

2. **`GIRESUN_MASK` (Inverted Polygon with Open Sea Corridor)**:
   - Dış halka: Tüm dünyayı çevreleyen 12 noktalı antimeridyen korumalı poligon.
   - İç delik: Eynesil'den Piraziz'e kadar kara sınırını izler, Piraziz'den doğrudan kuzeye (85° enlemine) açılarak açık denizi içine alır ve Eynesil'de kapanır.
   - Sonuç: Ordu ve Trabzon karartılırken, Giresun'un önündeki tüm deniz alanı açık ve aydınlık kalır.

---

## 3. Katman Sıralaması & Görsel Hiyerarşi

MapLibre katman ağacında kara sınırı ve açık deniz hiyerarşisi:

| Katman ID | Tip | Kaynak | Açıklama |
|---|---|---|---|
| `aerial` | raster | aerial | HGM Atlas hava fotoğrafı (Ön tanımlı açık) |
| `water-waves` | fill | planet | Animasyonlu dikişsiz dalga motoru |
| `building-3d` | fill-extrusion | planet | 3B binalar |
| `giresun-outside-dark` | fill | giresunMask | Giresun dışını karartan maske (Deniz koridoru açık) |
| `giresun-border-glow` | line | giresunLandBorder | **Yalnızca kara sınırında** neon cyan ışıma (6px blur) |
| `giresun-border-line` | line | giresunLandBorder | **Yalnızca kara sınırında** Apple HIG açık mavi kontur (2.2px) |
| `landmark-label` | symbol | landmarks | Doğrulanmış simge yer işaretleri |

---

## 4. Dinamik Gece & Gündüz Uyumu

Maske statik bir karanlık yerine gün ışığı açısına göre nefes alır:
- **Gündüz Modu**: `%72` maske opaklığı.
- **Gece Modu**: `%90` maske opaklığı, derin uzay tonu (`#020408`).
- Açık deniz koridoru geceleri de aydınlık su efektlerini ve fener ışıklarını taşır.

---

## 5. İlgili Kod Dosyaları

- [`src/config/giresunBoundary.ts`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/config/giresunBoundary.ts): `GIRESUN_LAND_BORDER` (LineString) ve `GIRESUN_MASK` (Polygon).
- [`public/giresun_land_border.json`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/public/giresun_land_border.json): Kara sınırı GeoJSON dosyası.
- [`public/giresun_mask.json`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/public/giresun_mask.json): Deniz koridoru açık ters maske.
- [`src/config/style.ts`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/config/style.ts): Katman tanımları (`giresunLandBorder` ve `giresunMask`).
- [`src/map/sea.ts`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/map/sea.ts): Animasyonlu deniz ve dalga motoru.
