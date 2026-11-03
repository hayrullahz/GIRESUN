# Gerçek Ayak İzleri ve 3D Yapılar (Modüler Veritabanı Mimarisi)

## 1. Doğrulanmış OSM + HGM Ayak İzleri
- Giresun Kalesi, Kale eteği, Çınarlar, Hacı Siyam, Zeytinlik Evleri, Bulancak, Espiye, Tirebolu, Keşap, Piraziz, Görele ve Duroğlu'nu kapsayan gerçek bina poligonları sisteme aktarılmıştır.
- Toplam **6.691 gerçek bina ayak izi** ile şehir dokusu genişletilmiş, sahte sentetik kutular yerine gerçek mimari tabanlar kullanılmıştır.

## 2. Modüler JSON Veritabanı Mimarisi (`/public/data/buildings/`)
Binalar devasa tek bir dosya yerine hem performans hem de kolay yönetilebilirlik için bölge ve ilçelere göre ayrıştırılmış veri tabanı dosyalarında tutulur:

- `public/data/buildings/manifest.json`: İlçe bina dosyaları indeksi ve metadata.
- `public/data/buildings/merkez.json`: 719 bina (Kale, Çınarlar, Zeytinlik, Hacı Siyam, Liman).
- `public/data/buildings/bulancak.json`: 77 bina (Bulancak merkez ve sahil).
- `public/data/buildings/tirebolu.json`: 67 bina (Tirebolu kalesi ve tarihi mahalleler).
- `public/data/buildings/gorele_eynesil.json`: 100 bina (Görele ve Eynesil sahil hatları).
- `public/data/buildings/espiye.json`: 15 bina.
- `public/data/buildings/kesap.json`: 6 bina.
- `public/data/buildings/guney_ilceler.json`: 257 bina (Şebinkarahisar, Alucra, Çamoluk, Dereli).
- `public/data/buildings/duroglu.json`: 1.470 bina (Duroğlu Beldesi — 40.83021, 38.46724 merkezli 2,2 km yarıçap).
- `public/data/buildings/merkezms.json`: 3.980 bina (Giresun merkez — 40.9166, 38.3872 merkezli 3 km yarıçap; mevcut isimli yapılarla çakışan 259 ayak izi atlanmıştır).

### Bölge verisi üretimi
- Kaynak: Microsoft Global Building Footprints (Bing görüntüleri, ODbL).
- Üretici: `scripts/build-district-buildings.mjs` — veri seti indeksinden ilgili karo indirilir, merkez yarıçapına göre filtrelenir, kat yüksekliği ve cephe rengi atanır.
  ```bash
  node --use-system-ca scripts/build-district-buildings.mjs --district merkezms \
    --lat 40.9166 --lon 38.3872 --radius 3000 --prefix merkezms- --dedupe
  ```
  Argüman verilmezse Duroğlu varsayılanları kullanılır; `--dedupe` mevcut bina merkezlerine 6 m'den yakın yeni ayak izlerini atlar.
- Çıktı hem modüler `<district>.json` dosyasına hem de haritanın okuduğu `public/real_buildings.json` birleşik dosyasına yazılır.
- `manifest.json` her bölge için `bbox` bilgisi taşır; yeni bölgeler aynı şablonla eklenebilir.

## 3. 3D Katman Hiyerarşisi
- `real-building-3d`: GeoJSON kaynağından beslenen, `fill-extrusion` özellikli gerçek yapılar.
- Kat yüksekliklerine göre (`building:levels * 3.2m`) ve kullanım türlerine göre gerçeğe uygun dikey yükseltmeler tanımlanmıştır.
- Harita dokusu ortofoto üzerine tam oturacak şekilde ölçeklenmiştir.
