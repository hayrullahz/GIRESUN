# 🗺️ GİRESUN HARİTA PLANI, COĞRAFYA VE ODAK NOKTALARI

Giresun, dik dağların ve yemyeşil fındık yamaçlarının doğrudan Karadeniz'e indiği, eşsiz bir yarımada ve ada topoğrafyasına sahip tarihi bir şehirdir. Bu topoğrafya, 2:1 izometrik piksel sanatı için New York'un düz ızgarasından çok daha zengin bir dikey derinlik (yükseklik farkı) sunar.

---

## 1. Coğrafi Sınırlar (Bounding Box & Koordinatlar)

Projenin merkez üssü ve veri altyapısı projemizdeki [`src/config/giresun.ts`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/config/giresun.ts) dosyasında tanımlı zengin koordinat ve landmark verisiyle tam uyumludur:

| Parametre | Değer |
|---|---|
| **Merkez (Center Lat/Lng)** | `40.9128° N, 38.3895° E` (Giresun İl Merkezi) |
| **İzometrik Görünüm Açısı** | Bearing: `315°`, Pitch: `54.7°` (Klasik $\arctan(\sqrt{2})$ izometrik açısı) |
| **Sınırlayıcı Kutu (Bounding Box)** | `[37.9, 40.05]` (GB) ile `[39.15, 41.15]` (KD) |
| **Kuzey Sınırı (Kuzey Deniz/Ada)** | `40.9270° N` (Giresun Adası & Deniz Feneri) |
| **Doğu Sınırı (Aksu Deresi / Çotanak Stadyumu)** | `38.4490° E` |
| **Kamera Projeksiyonu** | 2:1 Dimetrik / İzometrik Ortografik (SimCity 2000 standardı) |

---

## 2. Haritanın 6 Temel Odak Bölgesi (Key Landmark Zones)

```
                       [ Karadeniz ]
                             ~ ~
                     🏝️ [ Giresun Adası ]
                             ~ ~
  [ Batı Sahili ]    🏰 [ Giresun Kalesi ]    🚢 [ Giresun Limanı ]
        \                     |                     /
         \---- 🏛️ [ Zeytinlik Mahallesi ] --------/
                      |               |
              [ Sahil Yolu ]    [ Atatürk Meydanı ]
                      |               |
             🌳 [ Fındık Bahçeleri & Gedikkaya Kayalığı ]
```

### 1. 🏰 Giresun Kalesi (Yarımada Zirvesi)
- **Konum**: Denize dimdik inen 100 metrelik volkanik kaya kütlesi.
- **İzometrik Detaylar**:
  - Taş surlar ve kale burçları.
  - Asırlık ulu çınarlar, çay bahçeleri ve patika yollar.
  - Zirvede dalgalanan Türk Bayrağı ve Topal Osman Ağa'nın anıt mezarı.
  - Kar Modunda: Kale kayalıklarına çarpan beyaz köpüklü kış dalgaları ve karlar altındaki taş surlar.

### 2. 🏝️ Giresun Adası (Aretias / Karadeniz'in İncisi)
- **Konum**: Kıyıdan yaklaşık 1.2 km açıkta, Doğu Karadeniz'in tek yaşanabilir adası.
- **İzometrik Detaylar**:
  - Mitolojik Amazon kadınlarının ve Argonotların efsanelerine konu olan Hamza Taşı.
  - Ceneviz/Bizans döneminden kalma kale kalıntıları ve şapel yıkıntıları.
  - Kuş cenneti (karabataklar, martılar).
  - Ada etrafında dolaşan küçük takalar ve balıkçı tekneleri.

### 3. 🏛️ Tarihi Zeytinlik Mahallesi
- **Konum**: Kalenin güneydoğu etekleri.
- **İzometrik Detaylar**:
  - 19. yüzyıl Osmanlı-Rum sivil mimarisi: Kırmızı kiremitli ahşap-taş konaklar.
  - Dar arnavut kaldırımlı sokaklar ve geniş taş avlular (bahçeler).
  - Eski Gogora Kilisesi (Giresun Müzesi).
  - Kar Modunda: Kiremit çatılardan sarkan buz sarkıtları ve bacalardan tüten piksel dumanlar!

### 4. 🚢 Giresun Limanı ve Balıkçı Barınakları
- **Konum**: Doğu kıyı şeridi.
- **İzometrik Detaylar**:
  - Liman mendireği ve yeşil-kırmızı fenerler.
  - Yük gemileri, fındık sevkiyat depoları ve takalar.
  - Dalgakıranda balık tutan küçük pikselli insanlar.

### 5. 🛣️ Karadeniz Sahil Yolu ve Meydan
- **Konum**: Deniz boyunca uzanan ana omurga.
- **İzometrik Detaylar**:
  - Palmiyeli yürüyüş ve bisiklet yolu.
  - Atatürk Meydanı ve Saat Kulesi.
  - Şehir içi sarı dolmuşlar ve hareket eden araçlar.

### 6. 🌳 Yamaç Fındık Bahçeleri ve Gedikkaya
- **Konum**: Güneye doğru dikleşen tepeler.
- **İzometrik Detaylar**:
  - Teraslanmış zümrüt yeşili fındık ocakları.
  - Küçük ahşap serpenti/kuruluklar ve bağ evleri.
  - Şehre tepeden bakan sarp Gedikkaya formasyonu.

---

## 3. Izgara (Grid) ve Koordinat Sistemi

`isometric.nyc`'nin SQLite tabanlı koordinat sistemi örnek alınmıştır:

- **Karo Ölçüsü (Quadrant)**: `512 x 512` piksel.
- **Grid Çözünürlüğü**:
  - `(0, 0)`: Giresun Kalesi Zirvesi (Referans Noktası).
  - Negatif X: Batıya (Giresun Üniversitesi Debboy Yerleşkesine doğru).
  - Pozitif X: Doğuya (Liman ve Aksu'ya doğru).
  - Pozitif Y: Güneye (Fındık tepelerine doğru).
  - Negatif Y: Kuzeye (Karadeniz ve Giresun Adası'na doğru).

```
                   [-Y: Karadeniz & Ada]
                             ^
                             |
 [-X: Batı Kıyısı] <--- (0,0) Kale ---> [+X: Liman & Doğu]
                             |
                             v
                  [+Y: Fındık Yamaçları]
```

Bu koordinat sistemi sayesinde, harita parça parça üretilebilir ve herhangi bir noktada dikiş hatası olmadan birleştirilebilir.
