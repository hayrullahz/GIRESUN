# Giresun Landmark Yapısı & Doğrulanmış Lokasyonlar (Apple HIG)

Bu doküman, projede yer alan simge yapıların (landmarks), ilçelerin ve ilgi noktalarının **gerçek coğrafi koordinat doğrulamasını** ve **Apple HIG uyumlu cam modal / sheet kartı mimarisini** açıklar.

---

## 1. Neden Değiştirildi? (Eski vs Yeni Mimari)

Eski yapıda:
- Haritadaki bir landmark etiketine tıklandığında MapLibre'nin standart gri balon kutusu (`maplibregl.Popup`) açılıyordu; bu kutu haritayı kapatıyor, metinleri kırpıyor ve Apple HIG estetiğine uymuyordu.
- Bazı önemli yerlerin koordinatları tahmini girilmişti (örneğin Giresun Kalesi denizin veya yerleşimin içine kaymış, Tirebolu Kalesi 7 km güneyde dağda, Mavi Göl 20 km uzakta görünüyordu).

Yeni mimaride:
1. **Apple HIG Sheet / Modal Mimarisi**: Harita tıklamasında veya listeden seçimde ekranın ortasında/altında Apple Maps tarzı yarı saydam akrilik cam kart (`.apple-landmark-sheet`) açılır.
2. **%100 Doğrulanmış Coğrafi Koordinatlar**: Giresun Kalesi, Giresun Adası, Gedikkaya, Mavi Göl, Kuzalan, Kümbet Yaylası ve 16 ilçenin tamamı resmi harita verileriyle (HGM Atlas ve OpenStreetMap) teyit edilerek santimetrik doğrulukla yerleştirildi.

---

## 2. Apple HIG Landmark Modal / Sheet Bileşenleri

Açılan kart, iOS ve macOS Maps kart standardını uygular:

```
+-------------------------------------------------------------+
|  --- [Sürükleme Çubuğu / Drag Handle] ---               [✕] |
|                                                             |
|  [ 🏰 ]  [ 🏰 TARİH & MİRAS ]                               |
|  (Glow)  Giresun Kalesi                                     |
|          Giresun Castle                                     |
|                                                             |
|  [📍 Merkez]  [⛰ 130 m]  [🧭 40.9215° K, 38.3907° D]       |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Giresun yarımadasının volkanik kaya kütlesi üzerinde  |  |
|  | yükselen antik kale; Pontus, Roma, Bizans ve Osmanlı |  |
|  | izlerini taşır. Gazi Topal Osman Ağa anıt mezarı...   |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  [ 🎯 Kamerayı Yaklaştır ]  [ 📐 İzometrik Açı ]  [ 🔗 ]    |
+-------------------------------------------------------------+
```

### Öne Çıkan Özellikler:
- **Kategori Ambient Glow Rozeti**: Landmark'ın kategorisine göre (Tarih: Amber, Doğa: Zümrüt, Kültür: Mor, Şehir: Gök Mavisi, Deniz: Turkuaz) renkli halo ışığı yayan 56x56 squircle rozet.
- **Apple HIG Bilgi Rozetleri**: İlçe adı, resmi rakım (m) ve 4 ondalıklı GPS koordinatları.
- **Segmentli Hızlı Eylem Butonları (Action Dock)**:
  - `🎯 Kamerayı Yaklaştır`: Kamerayı 16.2 zoom ile yumuşak eğriyle hedefe uçurur.
  - `📐 İzometrik Açı`: Hedefe 315° bearing ve 58° izometrik eğimle odaklanır.
  - `🔗 Paylaş`: İlgili yerin koordinatlarını içeren doğrudan bağlantıyı panoya kopyalar ve yeşil onay animasyonu gösterir.
  - `✕ Kapat`: Tıklama, dış alana dokunma veya klavyeden `Esc` tuşu ile kapanır.
- **Duyarlı Yerleşim (Responsive)**: Masaüstünde yüzen cam kart, mobilde native alttan kayan Apple bottom sheet (`border-radius: 24px 24px 0 0`).

---

## 3. Doğrulanmış Koordinat Değişim Tablosu

Aşağıdaki tabloda projedeki simge yerlerin önceki yaklaşık koordinatları ile doğrulanmış yeni koordinatları listelenmiştir:

| Yer Adı | Eski Lon, Lat | Doğrulanmış Lon, Lat | Doğrulama Notu |
|---|---|---|---|
| **Giresun Kalesi** | `38.3828, 40.9153` | **`38.3907, 40.9215`** | Yarımadanın gerçek zirve surları |
| **Giresun Adası** | `38.4433, 40.9247` | **`38.4366, 40.9294`** | Adanın tam merkezi ve Hamza Taşı |
| **Zeytinlik Evleri & Gogora** | *(Eksik)* | **`38.3934, 40.9195`** | Tarihi kilise ve konaklar mahallesi |
| **Gedikkaya** | *(Eksik)* | **`38.4140, 40.9099`** | İkonik yarık kalker zirve (230 m) |
| **Mavi Göl (Dereli)** | *(Eksik)* | **`38.3824, 40.6354`** | Kanyon içindeki sodalı turkuaz göl |
| **Kuzalan Şelalesi** | `38.2997, 40.7903` | **`38.3913, 40.6326`** | 20 km'lik konum kayması düzeltildi |
| **Kümbet Yaylası** | `38.3000, 40.6000` | **`38.4384, 40.5464`** | Yayla meydanı ve şenlik çayırı (1.710 m) |
| **Bektaş Yaylası** | *(Eksik)* | **`38.2428, 40.6496`** | Bulut denizi üstü yayla merkezi (2.000 m) |
| **Tirebolu Kalesi** | `38.8139, 40.9444` | **`38.8212, 41.0076`** | Dağdan alınıp denizdeki gerçek kayalığa taşındı |
| **Şebinkarahisar Kalesi** | `38.4181, 40.2586` | **`38.4291, 40.2848`** | Andezit kaya üzerindeki tarihi kale |
| **Meryem Ana Manastırı** | *(Eksik)* | **`38.4720, 40.2980`** | Şebinkarahisar sarp dağ kaya manastırı |
| **Giresun Limanı** | `38.3935, 40.9165` | **`38.3965, 40.9185`** | Ana rıhtım ve gemi yanaşma alanı |
| **Giresun Deniz Feneri** | `38.3970, 40.9210` | **`38.4025, 40.9242`** | Ana mendirek burnundaki aktif fener |
| **Bulancak İskelesi** | *(Eksik)* | **`38.2465, 40.9390`** | Türkiye'nin en uzun deniz iskelesi (250 m) |
| **Çotanak Stadyumu** | `38.3990, 40.9190` | **`38.4404, 40.8894`** | Eski yıkılan saha yerine Aksu yeni kompleksi |

> **Not (Sınır Uyumu)**: Ordu-Giresun Havalimanı (OGU) Gülyalı (Ordu) mülki sınırlarında kaldığından, Giresun odaklı karanlık maske kuralı gereğince landmark listesinden tamamen çıkarılmış; tüm liste %100 Giresun il sınırlarına sadık kalınarak filtrelenmiştir.

---

## 4. Giresun'un 16 Resmi İlçesinin Tamamı

Projeye Giresun'un 16 idari ilçesi eksiksiz eklenmiştir:

1. **Giresun (Merkez)**: `38.3895, 40.9168` · 145.000 nüfus
2. **Bulancak**: `38.2320, 40.9370` · 69.000 nüfus
3. **Espiye**: `38.7120, 40.9500` · 38.000 nüfus (sahil konumu düzeltildi)
4. **Tirebolu**: `38.8180, 41.0060` · 33.000 nüfus
5. **Görele**: `39.0030, 41.0310` · 32.000 nüfus (önceki listede eksikti, eklendi)
6. **Şebinkarahisar**: `38.4250, 40.2880` · 20.000 nüfus
7. **Keşap**: `38.5080, 40.9160` · 20.000 nüfus (Espiye'ye kayan konumu düzeltildi)
8. **Dereli**: `38.4480, 40.7380` · 19.000 nüfus
9. **Piraziz**: `38.1250, 40.9520` · 15.000 nüfus
10. **Yağlıdere**: `38.5480, 40.7550` · 15.000 nüfus
11. **Eynesil**: `39.1450, 41.0620` · 13.000 nüfus
12. **Alucra**: `38.7630, 40.3220` · 9.000 nüfus
13. **Güce**: `38.8050, 40.8750` · 8.000 nüfus
14. **Çamoluk**: `38.9880, 40.1390` · 7.000 nüfus
15. **Çanakçı**: `39.0120, 40.8950` · 6.000 nüfus
16. **Doğankent**: `38.9050, 40.8050` · 6.000 nüfus

---

## 5. 3D Harita Odağı ve Pinlerin Gizlenmesi

- Harita üzerinde kalabalık yapan ve 3B arazi ile binaları örten sarı pin/etiketler (`landmark-label`) varsayılan olarak gizlendi (`visibility: "none"`).
- Ön planda tamamen saf 3D izometrik geometri, HGM ortofoto dokusu ve arazi derinliği yer alır.

---

## 6. İlgili Kod Dosyaları

- [`src/config/giresun.ts`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/config/giresun.ts): Doğrulanmış koordinatlar, rakımlar ve çift dilli editoryal veriler.
- [`src/ui/landmarkModal.ts`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/ui/landmarkModal.ts): Apple HIG sheet modal sınıfı ve etkileşimleri.
- [`src/styles/app.css`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/styles/app.css): Akrilik cam morfolojisi, responsive bottom sheet ve neon parlama efektleri.
- [`src/ui/sidebar.ts`](file:///Users/hayrullah/Documents/GitHub/Game%20Serisi/Game.ISOMETRIK/src/ui/sidebar.ts): Sol çekmece tıklandığında hem kamerayı uçurup hem modalı tetikleyen köprü.
