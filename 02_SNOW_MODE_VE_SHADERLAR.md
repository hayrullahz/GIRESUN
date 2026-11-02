# ❄️ SNOW MODU VE WEBGL SHADER'LARI DERİN İNCELEMESİ

`https://isometric.nyc/snow` adresindeki efsanevi **Snow Modu**, yalnızca basit bir filtre değildir. İki katmanlı hibrit bir mimariyle çalışır:

1. **Görsel Zemin Katmanı (Static Winter DZI Tiles)**: Binaların çatılarının, ağaçların, sokakların ve parkların yapay zekâ tarafından beyaz karla kaplanmış olarak render edildiği ayrı bir DZI görüntü piramidi (`dzi/snow`).
2. **Dinamik Atmosfer Katmanı (Real-time GPU Shaders)**: OpenSeaDragon tuvali üzerine giydirilen donanım hızlandırmalı WebGL kar parçacıkları ve fırtına sisi shader'ı.

---

## 1. Mimari Katman Şeması

```
+-------------------------------------------------------------+
| 3. UI Kontrol Paneli (Kar Miktarı, Rüzgâr, Parçacık Boyutu)   |
+-------------------------------------------------------------+
| 2. WebGL Canvas Overlay                                     |
|    ├── Kar Fırtınası / Sis Shader (Cool Blue-Gray Fog)      |
|    └── Kar Tanesi Parçacık Shader (WebGL Points + Wobble)   |
+-------------------------------------------------------------+
| 1. OpenSeaDragon Görüntüleyici                              |
|    ├── Standart Mod:  dzi/base (Yeşil / Yaz Giresun)        |
|    └── Kar Modu:      dzi/snow (Beyaz / Karlı Giresun)      |
+-------------------------------------------------------------+
```

---

## 2. WebGL Kar Parçacık Shader'ı (Particle Shader)

`isometric.nyc` kaynak kodlarından çıkarılan gerçek GLSL gölgelendirici mantığı:

### A. Vertex Shader (Parçacık Hareketi ve Fizik)
Her bir kar tanesi bağımsız bir nokta (`gl_PointSize`) olarak işlenir. Derinlik (`a_depth`), rüzgâr hızı (`u_windSpeed`), rüzgâr salınımı (`u_windOscillation`) ve yalpalama (`wobble`) GPU üzerinde hesaplanır:

```glsl
// Kar Parçacığı Vertex Shader
attribute float a_seed;   // [0..1] Rastgele tohum değeri (X başlangıcı ve faz)
attribute float a_seed2;  // [0..1] Rastgele düşüş hızı faktörü
attribute float a_seed3;  // [0..1] Boyut ve titreşim varyasyonu
attribute float a_depth;  // [0..1] Kamera derinliği (0 = Uzak, 1 = Yakın)

uniform vec2 u_resolution;       // Ekran çözünürlüğü (genişlik, yükseklik)
uniform float u_time;            // Geçen süre (saniye)
uniform float u_fallSpeed;       // Düşüş hızı çarpanı
uniform float u_windSpeed;       // Temel rüzgâr hızı
uniform float u_windOscillation; // Karadeniz rüzgâr hamlesi/salınımı
uniform float u_depthEffect;     // Derinlik perspektif kuvveti

varying float v_alpha;           // Fragment shader'a aktarılan saydamlık

void main() {
    // 1. Dikey Düşüş Hesaplama (Yakın taneler daha hızlı düşer)
    float speedMult = 0.6 + a_depth * 0.8 + a_seed2 * 0.4;
    float y = fract(a_seed2 + u_time * u_fallSpeed * speedMult / u_resolution.y);

    // 2. Rüzgâr ve Salınım (Rüzgâr hamleleri)
    float windMult = 0.5 + a_depth * 0.5;
    float totalWind = u_windSpeed + u_windOscillation;
    float windOffset = u_time * totalWind * windMult / u_resolution.x;

    // 3. Kar Tanesinin Sağa-Sola Salınması (Gentle Sine Wobble)
    float wobbleFreq = 1.5 + a_seed * 1.0;
    float wobbleAmp = 15.0 + a_seed3 * 10.0; // 15-25 piksel genişliğinde salınım
    float wobble = sin(u_time * wobbleFreq + a_seed * 6.28318) * wobbleAmp / u_resolution.x;

    // 4. Yatay Konum ve Ekran Kenarından Döngü (Screen Wrap)
    float x = fract(a_seed + windOffset + wobble * 0.5);

    // 5. Merkeze Hafif Yakınsama (3D İzometrik Derinlik Hissi)
    float convergence = u_depthEffect * 0.03 * (1.0 - a_depth);
    x = mix(x, 0.5, convergence * y);

    // 6. Klip Uzayına Dönüştürme
    vec2 clipSpace = vec2(x, y) * 2.0 - 1.0;
    clipSpace.y = -clipSpace.y; // Canvas Y koordinatını ters çevir
    gl_Position = vec4(clipSpace, 0.0, 1.0);

    // 7. Boyut: Derinliğe göre ölçekleme (Uzak: 1-2px, Yakın: 3-6px)
    float baseSize = 1.0 + a_depth * 4.0 + a_seed3 * 1.5;
    gl_PointSize = baseSize * (1.0 + u_depthEffect * 0.2 * a_depth);

    // 8. Saydamlık: Uzaktakiler daha silik, yakındakiler daha belirgin
    v_alpha = 0.2 + a_depth * 0.5 + a_seed3 * 0.2;
}
```

### B. Fragment Shader (Yumuşak Kar Tanesi Dokusu)
Kare pikseller yerine kenarları yumuşatılmış, hafif buz mavisi-beyaz daireler çizer:

```glsl
precision mediump float;
varying float v_alpha;

void main() {
    // Merkeze olan uzaklığı hesapla (0.0 merkez, 0.5 kenar)
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);

    // Dairesel yumuşak kenar geçişi (Anti-aliased soft edge)
    float alpha = smoothstep(0.5, 0.2, dist) * v_alpha;

    // Hafif karlı mavi-beyaz ton (RGB: 242, 247, 255)
    vec3 snowColor = vec3(0.95, 0.97, 1.0);

    gl_FragColor = vec4(snowColor, alpha);
}
```

---

## 3. Dinamik Kar Parçacık Sayısı Optimizasyonu

Ekran çözünürlüğüne göre gereksiz GPU yükü oluşturmamak ve mobilde kasmayı önlemek için dinamik parçacık formülü:

$$\text{Maksimum Parçacık} = \min\left(15000, \max\left(500, \left\lfloor \frac{\text{Genişlik} \times \text{Yükseklik} \times 7.5}{1000} \right\rfloor \right)\right)$$

- **Mobil Ekran (390 x 844)**: ~2.400 parçacık (yüksek 60 FPS performansı).
- **Full HD (1920 x 1080)**: ~15.000 parçacık (yoğun Karadeniz tipi fırtınası).
- **4K Ekran**: 15.000 tavan limitte kalarak GPU'yu korur.

---

## 4. Kar Fırtınası & Sis Örtüsü (Blizzard Fog Shader)

Fırtına hissini artırmak için kar tanelerinin arkasına hafif transparan bir sis örtüsü atılır:
- **Renk**: `vec3 fogColor = vec3(0.85, 0.88, 0.92);` (Soğuk Karadeniz deniz sisi)
- **Saydamlık**: `0.10 - 0.25` arası kullanıcı slider'ı ile ayarlanabilir.

---

## 5. Canlı Su ve Dalga Shader'ı (Karadeniz Kıyı Dalgaları)

Giresun bir sahil ve ada kenti olduğu için su kenarlarındaki dinamik dalga efekti çok kritiktir:
- **Distance Mask (Mesafe Maskesi)**:
  - **Siyah Pikseller**: Kara (Giresun Kalesi, Sahil Yolu, Evler) -> Efektsiz geçer.
  - **Beyaz Pikseller**: Derin Karadeniz suları -> Hafif koyulaşan dalga titreşimleri alır.
  - **Degrade / Gri Pikseller**: Kıyı çizgisi -> Kıyıya vuran beyaz köpük dalgacıkları (`foamThreshold`).

---

## 6. Giresun'a Özel Kış Atmosferi Eklentileri

`isometric.nyc`'ye kıyasla Giresun'da yapacağımız ek iyileştirmeler:

1. **Rüzgâr Yönü / Poyraz Modu**: Karadeniz'in meşhur poyraz rüzgârını taklit etmek için kar tanelerini kuzeydoğudan güneybatıya doğru 35° açıyla estirmek.
2. **Kıyı Fırtınası Ses Efekti (Opsiyonel Audio)**: Kar modu açıldığında arkada fısıldayan rüzgâr ve kayalıklara vuran dalga uğultusu (Web Audio API ile düşük volumde loop).
3. **Mevsim Geçiş Butonu**:
   - 🌿 **Fındık Hasadı Modu (Yaz)**: Zümrüt yeşili fındık bahçeleri, güneşli Karadeniz mavisi.
   - ❄️ **Karadeniz Fırtınası Modu (Kış)**: Karlı kale surları, buz tutmuş çatılar, savrulan kar taneleri ve köpüren dalgalar.
