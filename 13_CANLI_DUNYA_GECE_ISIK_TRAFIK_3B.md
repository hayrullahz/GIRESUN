# Canlı Dünya Geliştirmeleri: Kamera Sinematiği, Gündüz Işığı ve Berrak 3D

## 1. Giresun Kalesi Açılış Sinematiği (3D Fly-in)
- Proje açılışında kamera doğrudan **Giresun Kalesi** (`lon: 38.3907, lat: 40.9215`) koordinatlarına odaklanır.
- Açılışta yumuşak bir yükselme, hafif dönme (`bearing: 275° → 315°`) ve izometrik eğim (`pitch: 42° → 54.7°`) ile akıcı sinematik bir yaklaşım (`cubic ease out`, 2400ms) uygulanır.

## 2. Gündüz Aydınlatması ve Canlı Gösterim
- Varsayılan mod sistemin gece saatine göre kararmak yerine doğrudan canlı gündüz moduna (`manualTime = 13.5`, 13:30 güneş açısı) ayarlanmıştır.
- HGM Ortofoto parlaklık ve kontrast dengesi güçlendirilmiştir.
- İl sınırları dışındaki vignette karartma opasitesi `0.40`'tan `0.16`'ya çekilerek boğucu karanlık ortadan kaldırılmış, ferah bir derinlik sağlanmıştır.

## 3. 3D Arazi ve Sis Giderme
- Gökyüzü ve sis ayarlarındaki boğucu duman/sis efekti (`atmosphere-blend: 0.8 -> 0.15`, `fog-ground-blend: 0.5 -> 0.05`) kaldırılarak dağlar, vadi ve tepe yükseltileri kristal berraklığında görünür hale getirilmiştir.
- Arazi kabartması (hillshade) gölge tonları sert karartmadan dengeli tonlara çekilmiştir.
