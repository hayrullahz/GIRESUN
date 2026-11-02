# Gerçek Ayak İzleri ve 3D Yapılar (Modüler Veritabanı Mimarisi)

## 1. Doğrulanmış OSM + HGM Ayak İzleri
- Giresun Kalesi, Kale eteği, Çınarlar, Hacı Siyam, Zeytinlik Evleri, Bulancak, Espiye, Tirebolu, Keşap, Piraziz ve Görele'yi kapsayan gerçek bina poligonları sisteme aktarılmıştır.
- Toplam **1.241 gerçek bina ayak izi** ile şehir dokusu genişletilmiş, sahte sentetik kutular yerine gerçek mimari tabanlar kullanılmıştır.

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

## 3. 3D Katman Hiyerarşisi
- `real-building-3d`: GeoJSON kaynağından beslenen, `fill-extrusion` özellikli gerçek yapılar.
- Kat yüksekliklerine göre (`building:levels * 3.2m`) ve kullanım türlerine göre gerçeğe uygun dikey yükseltmeler tanımlanmıştır.
- Harita dokusu ortofoto üzerine tam oturacak şekilde ölçeklenmiştir.
