# 🌍 DÜNYA İZOMETRİK HARİTALARI (TINY.LONDON, TINY DETROIT, TINY WARSAW) İNCELEMESİ

Bu belge, kullanıcının işaret ettiği `tinydetroit.com`, `tiny.london/world/` ve `tinywarsaw.app` projelerinin derinlemesine analizini, öne çıkan özelliklerini ve **Isometric Giresun** projesine aktarılacak devrimsel yenilikleri içerir.

---

## 1. Global "Tiny Cities" Ekosistemi (`tiny.london/world`)

`https://tiny.london/world/` dizini, `isometric.nyc` ile başlayan akımın tüm dünyaya nasıl yayıldığını gösteren küresel bir vitrindir. 

Dünyanın önde gelen örnekleri ve teknik kazanımları:

| Şehir & Proje | Geliştirici | Öne Çıkan Özellik | Giresun'a Katkısı |
|---|---|---|---|
| **Detroit** ([tinydetroit.com](https://tinydetroit.com)) | Andy Coenen ekosistemi | **Gelişmiş Çevre & Hava Motoru**: Astronomik gün doğumu/batımı, 5 zaman dilimi (Dawn/Day/Dusk/Night), WMO canlı hava durumu (Clear/Rain/Snow/Fog), People Mover hattı. | Giresun için gerçek zamanlı gün doğumu, gün batımı, deniz sisi ve yağmur motoru. |
| **Varşova** ([tinywarsaw.app](https://tinywarsaw.app)) | Bedirhan Yıldırım | **Apple HIG Arayüzü & Minik Araçlar**: Low-poly 3D diorama, Apple cam dock tasarımı, interaktif araç sürüşü (araba, otobüs, balon, uçak), gerçek zamanlı farlar/ışıklar. | Apple HIG UI, yüzen cam menüler, Karadeniz Sahil Yolu trafiği ve ada tekneleri. |
| **İstanbul** ([isometricistanbul.com](https://isometricistanbul.com)) | Yahya Bedirhan Pak | **Boğaz ve İki Yaka**: İBB 3D şehir modelinden Qwen LoRA ile üretilen piksel Boğaziçi ve vapur hatları. | Türkiye coğrafyasına ve Karadeniz kıyı tipolojisine en yakın yerel model referansı. |
| **Rotterdam** ([010.jjpcodes.com](https://010.jjpcodes.com)) | JJP | **Gece Pencereleri & Işıklar**: Gece olduğunda evlerin pencerelerinde yanan sarı ışıklar ve gerçek zamanlı hava durumu. | Giresun Kalesi sur aydınlatması ve Zeytinlik konaklarının gece parıldayan pencereleri. |
| **Seul** ([hypeseoul.xyz](https://hypeseoul.xyz)) | bitjaru | **Canlı Seul Saati & Metro**: Kore saatiyle senkronize gece/gündüz ve hareket eden vagonlar. | Giresun yerel saatine bağlı dinamik aydınlatma. |
| **Stockholm** ([tinysthlm.com](https://tinysthlm.com)) | Tiny STHLM | **Tarifeli Deniz Ulaşımı**: Adalar arasında sefer yapan feribotlar ve tekneler. | Giresun Limanı ile Giresun Adası arasında mekik dokuyan gezi takaları. |

---

## 2. Tiny Detroit'in Gelişmiş Ortam Motoru (Deep Dive)

`tinydetroit.com` incelendiğinde haritanın sadece bir görsel değil, **yaşayan bir atmosfer simülasyonu** olduğu görülür:

### A. Astronomik Güneş Pozisyonu ve Zaman Dilimleri
Harita, Detroit'in enlem ve boylamına göre güneşin doğuş ve batış saatlerini (`sunrise` / `sunset`) gerçek zamanlı hesaplar:
- **Night (Gece)**: `brightness: 0.88, saturate: 0.55, night: 0.6, warm: 0`
- **Dawn (Şafak)**: Ufukta pembe/turuncu tonlar (`warm: 0.20 - 0.35`)
- **Morning (Sabah)**: Yumuşak sabah güneşi
- **Day (Gündüz)**: Tam netlik `brightness: 1.0, saturate: 1.0`
- **Evening (Akşam)**: Gün batımı öncesi altın saat (Golden Hour, `warm: 0.38`)
- **Dusk (Alacakaranlık)**: Mor-lacivert gökyüzü geçişi

### B. WMO Canlı Hava Durumu Entegrasyonu
Open-Meteo API üzerinden canlı hava kodları çekilerek tuval üzerine dinamik filtreler basılır:
- **0 (Açık)**: Kristal berraklık.
- **3 (Bulutlu)**: Doygunluk %45 düşürülür, kontrast azaltılır.
- **63 (Yağmur)**: Tuvalde ıslak zemin parlaması + su damlaları.
- **73 (Kar)**: Parçacık motoru devreye girer.
- **45 (Sis / Karadeniz Pusu)**: Haze katmanı (`.32 * c`) devreye girerek uzak tepeleri gizler.

---

## 3. Tiny Warsaw ve Apple Human Interface Guidelines (HIG)

`tinywarsaw.app`, bir web haritasının sanki yerel bir macOS / iOS uygulamasıymış gibi hissettirmesini sağlayan **Apple HIG prensiplerini** kusursuz uygulamıştır:

```
+------------------------------------------------------------------+
|  [ Top Bar: Şehir Bilgisi, Canlı Saat, Hava Rozeti, Ses]         |
|                                                                  |
|                                                                  |
|                       HARİTA ALANI                               |
|                                                                  |
|                                                                  |
|  +------------------------------------------------------------+  |
|  |  [🚗 Sür / İzle]  [🏰 Odak]  [☀️/🌙 Zaman]  [❄️ Kış]  [⚙️]   |  |
|  +------------------------------------------------------------+  |
|        Yüzen Apple Cam Dock (Floating Frosted Glass Dock)        |
+------------------------------------------------------------------+
```

### Apple HIG Tasarım Kuralları:
1. **Buzlu Cam (Frosted Glassmorphism)**:
   - `background: rgba(255, 255, 255, 0.72);` (Koyu modda `rgba(20, 26, 34, 0.80)`)
   - `backdrop-filter: blur(20px) saturate(180%);`
   - `border: 1px solid rgba(255, 255, 255, 0.18);`
2. **Apple Dokunma Standardı (44x44px Rule)**:
   - Mobilde ve tablette tüm tıklanabilir butonlar en az 44x44 piksel dokunma alanına sahiptir.
3. **Kavis ve Geometri (Continuous Squircle)**:
   - Keskin köşeler yerine Apple'ın tescilli `squircle` eğrileri (`border-radius: 14px - 22px`, hap butonlar için `999px`).
4. **Tipografi**:
   - Sistem fontları: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif`.
   - İstatistik ve koordinatlarda rakamların oynamaması için sabit genişlikli sayı fontu (`font-variant-numeric: tabular-nums`).
5. **Güvenli Alanlar (Safe Area Insets)**:
   - iPhone çentiği ve Dinamik Ada için `env(safe-area-inset-top)` ve alt ev çubuğu için `env(safe-area-inset-bottom)` desteği.
