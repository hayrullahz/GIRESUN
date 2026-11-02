import { PROVINCE_STATS, DISTRICTS, LANDMARKS } from "../config/giresun";
import { t, getLang } from "../lib/i18n";
import type { GiresunMap } from "../map/map";

/** Veri panosu — tam ekran Apple HIG modal paneli */
export class Dashboard {
  private el: HTMLElement;
  private map: GiresunMap;

  constructor(map: GiresunMap) {
    this.map = map;
    this.el = document.createElement("section");
    this.el.className = "dashboard";
    this.el.hidden = true;
    this.el.setAttribute("role", "dialog");
    this.el.setAttribute("aria-modal", "true");
    document.body.appendChild(this.el);
  }

  open() {
    this.render();
    this.el.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => this.el.classList.add("open"));
  }

  close() {
    this.el.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
      this.el.hidden = true;
    }, 250);
  }

  private render() {
    const lang = getLang();
    const s = PROVINCE_STATS;

    const byPop = [...DISTRICTS].sort((a, b) => b.population - a.population).slice(0, 10);
    const byDensity = DISTRICTS.map((d) => ({ d, value: Math.round(d.population / d.area) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    this.el.innerHTML = `
      <div class="dash-backdrop" data-close></div>
      <div class="dash-container">
        <!-- Sabit Apple Başlık Çubuğu -->
        <header class="dash-head">
          <div class="dash-head-text">
            <h2>${t("dashTitle")}</h2>
            <p>${t("dashIntro")}</p>
          </div>
          <button class="dash-close-circle" data-close title="${t("close")}" aria-label="${t("close")}">
            <span>✕</span>
          </button>
        </header>

        <!-- İstatistik Kartları -->
        <div class="dash-cards">
          ${card(t("statPopulation"), s.population.toLocaleString(lang), "👥")}
          ${card(t("statArea"), s.area.toLocaleString(lang) + " km²", "🗺️")}
          ${card(t("statCoast"), s.coastline + " km", "🌊")}
          ${card(t("statDistricts"), String(s.districts), "🧭")}
          ${card(t("statHazelnut"), "%" + s.hazelnutWorldShare, "🌰")}
          ${card(t("statHighest"), s.highestPoint.elevation + " m", "⛰️")}
        </div>

        <!-- Grafikler Izgarası -->
        <div class="dash-grid">
          <div class="dash-panel">
            <h3>${t("topDistricts")}</h3>
            <canvas id="chart-districts" height="240"></canvas>
          </div>
          <div class="dash-panel">
            <h3>${t("density")}</h3>
            <canvas id="chart-density" height="240"></canvas>
          </div>
        </div>

        <!-- Rakım Profili -->
        <div class="dash-panel">
          <h3>${t("elevationProfile")}</h3>
          <canvas id="chart-elevation" height="150"></canvas>
          <div class="elev-legend"><span>● ${t("seaLevel")}</span><span>▲ yayla ~2500 m</span></div>
        </div>

        <!-- Alt Bilgi -->
        <footer class="dash-foot">
          <div>${t("sourceOsm")} · ${LANDMARKS.length} ${t("landmarksCount")}</div>
          <div>${t("attribution")}</div>
        </footer>
      </div>
    `;

    // Kapatma butonları ve arkaplan tıklaması
    this.el.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.close();
      });
    });

    // Grafikleri çiz — bara tıklayınca haritada o ilçeye uç
    const fly = (lon: number, lat: number) => {
      this.close();
      this.map.goTo(lon, lat, 12.8);
    };

    requestAnimationFrame(() => {
      drawBar(
        this.el.querySelector<HTMLCanvasElement>("#chart-districts")!,
        byPop.map((x) => ({ label: x.name, value: x.population })),
        "#3fae6b",
        (v) => v.toLocaleString(lang),
        (i) => fly(byPop[i].lon, byPop[i].lat),
      );
      drawBar(
        this.el.querySelector<HTMLCanvasElement>("#chart-density")!,
        byDensity.map((x) => ({ label: x.d.name, value: x.value })),
        "#5aa9e6",
        (v) => String(v),
        (i) => fly(byDensity[i].d.lon, byDensity[i].d.lat),
      );
      drawElevation(this.el.querySelector<HTMLCanvasElement>("#chart-elevation")!);
    });
  }
}

function card(title: string, value: string, icon: string): string {
  return `<div class="dash-card">
    <span class="dash-ico">${icon}</span>
    <div>
      <div class="dash-val">${value}</div>
      <div class="dash-lbl">${title}</div>
    </div>
  </div>`;
}

function drawBar(
  canvas: HTMLCanvasElement,
  data: Array<{ label: string; value: number }>,
  color: string,
  fmt: (v: number) => string,
  onClick?: (index: number) => void,
) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 320;
  const h = canvas.height;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!data.length) return;
  const max = Math.max(...data.map((d) => d.value));
  const rowH = h / data.length;
  const labelW = 90;
  const barMax = w - labelW - 60;
  ctx.font = "11px system-ui, sans-serif";

  const hit: Array<{ y0: number; y1: number; i: number }> = [];
  data.forEach((d, i) => {
    const y = i * rowH + rowH / 2;
    const bw = (d.value / max) * barMax;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(labelW, y - rowH * 0.28, barMax, rowH * 0.56);
    ctx.fillStyle = color;
    ctx.fillRect(labelW, y - rowH * 0.28, bw, rowH * 0.56);
    ctx.fillStyle = "#dfe6e9";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(d.label, labelW - 8, y);
    ctx.textAlign = "left";
    ctx.fillStyle = "#9fb0b8";
    ctx.fillText(fmt(d.value), labelW + barMax + 6, y);
    hit.push({ y0: i * rowH, y1: (i + 1) * rowH, i });
  });

  if (onClick) {
    canvas.style.cursor = "pointer";
    canvas.addEventListener("click", (ev) => {
      const rect = canvas.getBoundingClientRect();
      const y = ev.clientY - rect.top;
      const row = hit.find((r) => y >= r.y0 && y < r.y1);
      if (row) onClick(row.i);
    });
  }
}

function drawElevation(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = canvas.clientWidth || 600;
  const h = 150;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const pts = [0, 20, 60, 150, 340, 620, 980, 1350, 1720, 2050, 2300, 2500, 2200, 1600, 900, 300, 0];
  const max = 2500;
  const step = w / (pts.length - 1);
  const yOf = (v: number) => h - (v / max) * (h - 10) - 5;
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#6fd0e8");
  grad.addColorStop(1, "#0d3b52");
  ctx.beginPath();
  ctx.moveTo(0, h);
  pts.forEach((v, i) => ctx.lineTo(i * step, yOf(v)));
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.beginPath();
  pts.forEach((v, i) => (i ? ctx.lineTo(i * step, yOf(v)) : ctx.moveTo(0, yOf(v))));
  ctx.strokeStyle = "#6fd0e8";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(0, yOf(0));
  ctx.lineTo(w, yOf(0));
  ctx.stroke();
  ctx.setLineDash([]);
}
