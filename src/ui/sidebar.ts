import type { GiresunMap } from "../map/map";
import { LANDMARKS, DISTRICTS, CATEGORY_LABEL } from "../config/giresun";
import { t, getLang } from "../lib/i18n";

export class Sidebar {
  private el: HTMLElement;
  private map: GiresunMap;
  private onSelectLandmark?: (lm: (typeof LANDMARKS)[0]) => void;

  constructor(map: GiresunMap, onSelectLandmark?: (lm: (typeof LANDMARKS)[0]) => void) {
    this.map = map;
    this.onSelectLandmark = onSelectLandmark;
    this.el = document.createElement("aside");
    this.el.className = "sidebar";
    this.el.hidden = true;
    document.body.appendChild(this.el);
  }

  open(tab: "landmarks" | "districts") {
    this.el.hidden = false;
    this.render(tab);
    requestAnimationFrame(() => this.el.classList.add("open"));
  }

  close() {
    this.el.classList.remove("open");
    setTimeout(() => (this.el.hidden = true), 280);
  }

  private render(tab: "landmarks" | "districts") {
    const lang = getLang();
    const tabs = `
      <div class="sb-tabs">
        <button class="sb-tab ${tab === "landmarks" ? "on" : ""}" data-tab="landmarks">${t("landmarks")}</button>
        <button class="sb-tab ${tab === "districts" ? "on" : ""}" data-tab="districts">${t("districts")}</button>
        <button class="sb-close" data-close>${t("close")}</button>
      </div>`;

    const list =
      tab === "landmarks"
        ? LANDMARKS.map((lm) => {
            const cat = CATEGORY_LABEL[lm.category];
            return `<button class="sb-item" data-lm="${lm.id}">
              <span class="sb-ico">${lm.icon}</span>
              <span class="sb-text">
                <span class="sb-name">${lang === "en" ? lm.nameEn : lm.name}</span>
                <span class="sb-sub" style="color:${cat.color}">${cat[lang]}</span>
              </span>
              <span class="sb-elev">${lm.elevation ?? 0} m</span>
            </button>`;
          }).join("")
        : DISTRICTS.map(
            (d) => `<button class="sb-item" data-d="${d.id}">
              <span class="sb-ico">📍</span>
              <span class="sb-text">
                <span class="sb-name">${d.name}</span>
                <span class="sb-sub">${d.population.toLocaleString(lang)} · ${d.area} km²</span>
              </span>
            </button>`,
          ).join("");

    this.el.innerHTML = `${tabs}<div class="sb-list">${list}</div>`;

    this.el.querySelector<HTMLElement>("[data-close]")?.addEventListener("click", () => this.close());
    this.el.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((b) =>
      b.addEventListener("click", () => this.open(b.dataset.tab as "landmarks" | "districts")),
    );
    this.el.querySelectorAll<HTMLButtonElement>("[data-lm]").forEach((b) =>
      b.addEventListener("click", () => {
        const lm = LANDMARKS.find((x) => x.id === b.dataset.lm);
        if (lm) {
          this.close();
          this.map.goTo(lm.lon, lm.lat, 15.5);
          this.onSelectLandmark?.(lm);
        }
      }),
    );
    this.el.querySelectorAll<HTMLButtonElement>("[data-d]").forEach((b) =>
      b.addEventListener("click", () => {
        const d = DISTRICTS.find((x) => x.id === b.dataset.d)!;
        this.map.goTo(d.lon, d.lat, 12.6);
      }),
    );
  }
}
