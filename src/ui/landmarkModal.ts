import type { GiresunMap } from "../map/map";
import { type Landmark, CATEGORY_LABEL } from "../config/giresun";
import { t, getLang } from "../lib/i18n";
import { shareUrl } from "../lib/isometric";

export class LandmarkModal {
  private el: HTMLElement;
  private currentLandmark: Landmark | null = null;
  private map: GiresunMap;

  constructor(map: GiresunMap) {
    this.map = map;
    this.el = document.createElement("div");
    this.el.className = "apple-modal-container";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-modal", "true");
    document.body.appendChild(this.el);

    // ESC ile kapatma
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.el.hidden) {
        this.close();
      }
    });
  }

  getCurrentLandmark(): Landmark | null {
    return this.currentLandmark;
  }

  show(lm: Landmark) {
    this.currentLandmark = lm;
    const lang = getLang();
    const cat = CATEGORY_LABEL[lm.category];
    const title = lang === "en" ? lm.nameEn : lm.name;
    const subTitle = lang === "en" ? lm.name : lm.nameEn;
    const desc = lang === "en" ? lm.en : lm.tr;

    this.el.innerHTML = `
      <div class="apple-modal-backdrop" data-close></div>
      <div class="apple-landmark-sheet">
        <!-- Kart Üst Bar & Kapatma Butonu -->
        <div class="sheet-handle-bar">
          <div class="sheet-drag-handle"></div>
        </div>

        <button class="sheet-close-btn" data-close title="${t("close")}" aria-label="${t("close")}">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div class="sheet-scroll-content">
          <!-- Hero Rozet & Başlık -->
          <div class="sheet-hero">
            <div class="sheet-icon-badge" style="--cat-glow: ${cat.color}">
              <span class="sheet-icon">${lm.icon}</span>
            </div>
            <div class="sheet-titles">
              <div class="sheet-cat-badge" style="color: ${cat.color}; background: ${cat.color}22">
                <span>${cat.icon}</span> ${cat[lang]}
              </div>
              <h2 class="sheet-title">${title}</h2>
              <div class="sheet-subtitle">${subTitle}</div>
            </div>
          </div>

          <!-- Apple HIG Bilgi Rozetleri (Badges) -->
          <div class="sheet-pills-row">
            ${
              lm.district
                ? `<div class="sheet-pill">
                    <span class="pill-ico">📍</span>
                    <span class="pill-text">${lm.district}</span>
                  </div>`
                : ""
            }
            ${
              lm.elevation !== undefined
                ? `<div class="sheet-pill">
                    <span class="pill-ico">⛰</span>
                    <span class="pill-text">${lm.elevation} m</span>
                  </div>`
                : ""
            }
            <div class="sheet-pill">
              <span class="pill-ico">🧭</span>
              <span class="pill-text">${lm.lat.toFixed(4)}° K, ${lm.lon.toFixed(4)}° D</span>
            </div>
          </div>

          <!-- Açıklama Metni -->
          <div class="sheet-body-wrap">
            <p class="sheet-description">${desc}</p>
          </div>
        </div>

        <!-- Alt Eylem Butonları (Apple HIG Segmented Actions) -->
        <div class="sheet-actions">
          <button class="sheet-btn primary" data-act="fly">
            <span>🎯</span> <span>${t("goTo")}</span>
          </button>
          <button class="sheet-btn" data-act="iso">
            <span>📐</span> <span>${t("isoView")}</span>
          </button>
          <button class="sheet-btn" data-act="share" title="${t("share")}">
            <span>🔗</span>
          </button>
        </div>
      </div>
    `;

    this.bindEvents(lm);
    this.el.hidden = false;
    requestAnimationFrame(() => this.el.classList.add("active"));
  }

  close() {
    this.el.classList.remove("active");
    setTimeout(() => {
      this.el.hidden = true;
      this.currentLandmark = null;
    }, 250);
  }

  private bindEvents(lm: Landmark) {
    this.el.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => this.close());
    });

    // Kamerayı Yaklaştır
    this.el.querySelector<HTMLButtonElement>('[data-act="fly"]')?.addEventListener("click", () => {
      this.map.goTo(lm.lon, lm.lat, 16.2);
    });

    // 3D İzometrik Bakış
    this.el.querySelector<HTMLButtonElement>('[data-act="iso"]')?.addEventListener("click", () => {
      this.map.goTo(lm.lon, lm.lat, 16.5, { bearing: 315, pitch: 58 });
    });

    // Paylaş / Bağlantıyı Kopyala
    this.el.querySelector<HTMLButtonElement>('[data-act="share"]')?.addEventListener("click", async (e) => {
      const btn = e.currentTarget as HTMLButtonElement;
      await shareUrl(this.map.map);
      btn.innerHTML = "<span>✓</span>";
      setTimeout(() => (btn.innerHTML = "<span>🔗</span>"), 1800);
    });
  }
}
