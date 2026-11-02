# Apple HIG, Hata Düzeltme ve UI Kuralları

Bu doküman, projede uygulanan Apple HIG standartlarını, UI katman hiyerarşisini ve yükleme ekranı güvenliğini belgeler.

---

## 1. Apple Human Interface Guidelines (HIG) İlkeleri

- **Cam Morfolojisi (Liquid Glass)**: `backdrop-filter: blur(24px) saturate(180%)` ile şeffaf, derinlikli cam paneller.
- **Hiyerarşik Düzen**:
  - **Z-Index 1000**: Üst Bar (`.apple-header`)
  - **Z-Index 1000**: Sağ Navigasyon / Pusula Adası (`.apple-nav-island`)
  - **Z-Index 1000**: Alt Segmentli Dock (`.apple-bottom-dock-container`)
  - **Z-Index 1500**: Spotlight Arama Sonuçları (`.apple-search-dropdown`)
  - **Z-Index 2000**: Sol Çekmece Sidebar (`.apple-sidebar-overlay`)
  - **Z-Index 2000**: Veri Panosu Dashboard (`.dashboard-overlay`)
  - **Z-Index 2200**: Apple Landmark Sheet Modalı (`.landmark-modal-overlay`)
  - **Z-Index 9999**: Açılış Yükleme Ekranı (`#loader`)
- **Çakışma Engelleme**: Modallar ve pencereler bağımsız flex/fixed kapsayıcılarda ortalanır, harita kontrollerinin üzerine binmez.

---

## 2. Kapatılabilir Pencereler ve Etkileşimler

- Tüm pencerelerde belirgin, Apple HIG standartlarında kapatma butonları (`.apple-modal-close`, `.apple-panel-close`, `.dashboard-close-btn`).
- Dışarı tıklama (`backdrop click`) ve `Escape` tuşu ile pencerelerin tamamı kapanır.
- Saat popover paneli harici yere tıklandığında veya çarpı butonuna basıldığında kapanır.

---

## 3. Loader Kilitlenme Koruması ve Font Uyumluluğu

- **Font Glifi Düzeltmesi**: OpenFreeMap glif sunucusu font ailesi olarak `Open Sans` yerine resmi şablonu olan `Noto Sans Regular` / `Noto Sans Bold` kabul etmektedir. 404 veren font çağrıları güncellendi.
- **Fail-safe Yükleme Ekranı (Loader Timeout)**: Harita `load` olayının harici karo gecikmelerinde kilitlenmemesi için `once("load")` yapısına ek olarak 2.5 saniyelik zaman aşımı koruması (`fallback timer`) eklendi; loader harita render edildiğinde anında kalkar.
