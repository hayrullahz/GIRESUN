import type { GiresunMap } from "../map/map";
import { t, getLang, toggleLang } from "../lib/i18n";
import { shareUrl } from "../lib/isometric";
import { searchPlaces, type SearchResult } from "./search";
import { QUICK_PLACES } from "../config/giresun";
import type { WeatherMode } from "../map/weather";

export interface UiCallbacks {
  onOpenDashboard: () => void;
  onOpenSidebar: (tab: "landmarks" | "districts") => void;
  onReset: () => void;
}

export function buildControls(map: GiresunMap, cb: UiCallbacks) {
  // ——— 1. ÜST BAR (Apple HIG Unified Header) ———
  const header = document.createElement("header");
  header.className = "apple-header";
  header.innerHTML = `
    <!-- Sol Ada: Marka & Gezinti Butonları -->
    <div class="apple-island header-island-left">
      <a class="apple-logo-badge" href="./" title="isometric giresun">
        <span class="apple-logo-icon">🏝️</span>
        <span class="apple-logo-text">isometric giresun</span>
      </a>
      <div class="apple-divider"></div>
      <div class="header-pills">
        <button class="apple-pill-btn" data-open="landmarks" title="${t("landmarks")}">
          <span>📍</span> <span>${t("landmarks")}</span>
        </button>
        <button class="apple-pill-btn" data-open="districts" title="${t("districts")}">
          <span>🧭</span> <span>${t("districts")}</span>
        </button>
      </div>
    </div>

    <!-- Orta Ada: Apple Spotlight Arama Alanı -->
    <div class="apple-island header-island-center">
      <div data-slot="search" class="apple-search-wrap">
        <span class="search-lens">🔍</span>
        <input class="apple-search-input" type="search" placeholder="${t("searchPlaceholder")}"
               aria-label="${t("searchPlaceholder")}" autocomplete="off" />
        <kbd class="search-kbd">/</kbd>
        <div class="search-results apple-search-dropdown" hidden></div>
      </div>
    </div>

    <!-- Sağ Ada: Araçlar & Kontroller -->
    <div class="apple-island header-island-right">
      <button class="apple-tool-btn" data-act="dashboard" title="${t("dashboard")}">
        <span>📊</span> <span class="tool-label">${t("dashboard")}</span>
      </button>
      <div class="apple-divider"></div>
      <button class="apple-tool-btn icon-only" data-act="lang" title="TR / EN">
        <span class="lang-pill" data-lang-label>${getLang().toUpperCase()}</span>
      </button>
      <button class="apple-tool-btn icon-only" data-act="share" title="${t("share")}">
        <span>🔗</span>
      </button>
      <button class="apple-tool-btn icon-only" data-act="reset" title="${t("resetView")}">
        <span>⌂</span>
      </button>
    </div>
  `;
  document.body.appendChild(header);

  // ——— 2. SAĞ 3B KAMERA ADASI (Apple HIG Nav Island) ———
  const navIsland = document.createElement("aside");
  navIsland.className = "apple-nav-island";
  navIsland.setAttribute("aria-label", "Kamera ve Yön Kontrolleri");
  navIsland.innerHTML = `
    <!-- 2B / 3B Hızlı Geçiş -->
    <button class="apple-nav-btn" data-nav="toggle2d3d" title="${t("toggle3d")}">
      <span class="nav-3d-badge" data-dim-badge>3D</span>
    </button>

    <!-- Dinamik Dönen Pusula -->
    <button class="apple-nav-btn compass-btn" data-nav="compass" title="${t("compassTooltip")}">
      <svg class="compass-needle" viewBox="0 0 24 24" width="20" height="20">
        <polygon points="12,2 16,12 12,9" fill="#ff3b30" />
        <polygon points="12,2 8,12 12,9" fill="#ff453a" />
        <polygon points="12,22 16,12 12,15" fill="#c7c7cc" />
        <polygon points="12,22 8,12 12,15" fill="#f2f2f7" />
      </svg>
    </button>

    <div class="apple-dock-divider"></div>

    <!-- 45° Dönme (Bearing) -->
    <button class="apple-nav-btn" data-nav="rot-left" title="${t("rotateLeft")}">
      <span class="nav-glyph">↺</span>
    </button>
    <button class="apple-nav-btn" data-nav="rot-right" title="${t("rotateRight")}">
      <span class="nav-glyph">↻</span>
    </button>

    <div class="apple-dock-divider"></div>

    <!-- Çevirme / Eğim (Pitch / Tilt) -->
    <button class="apple-nav-btn" data-nav="tilt-up" title="${t("tiltUp")}">
      <span class="nav-glyph">▲</span>
    </button>
    <button class="apple-nav-btn" data-nav="tilt-down" title="${t("tiltDown")}">
      <span class="nav-glyph">▼</span>
    </button>

    <div class="apple-dock-divider"></div>

    <!-- Zoom -->
    <button class="apple-nav-btn" data-nav="zoom-in" title="${t("zoomIn")}">
      <span class="nav-glyph">+</span>
    </button>
    <button class="apple-nav-btn" data-nav="zoom-out" title="${t("zoomOut")}">
      <span class="nav-glyph">−</span>
    </button>
  `;
  document.body.appendChild(navIsland);

  // ——— 3. ALT DOCK (Apple HIG Segmented Glass Dock) ———
  const dockWrap = document.createElement("div");
  dockWrap.className = "apple-bottom-dock-container";
  dockWrap.innerHTML = `
    <!-- Zaman Popover Paneli (Dock'un üstünde temizce açılır) -->
    <div class="apple-time-popover" hidden>
      <div class="time-popover-header">
        <span class="time-popover-title">🕒 ${t("timeOfDay")}</span>
        <div class="time-popover-right">
          <label class="time-follow-label">
            <input type="checkbox" /> ${t("followSun")}
          </label>
          <button class="time-close-btn" data-time-close title="${t("close")}" aria-label="${t("close")}">✕</button>
        </div>
      </div>
      <input type="range" min="0" max="24" step="0.1" value="13.5" class="apple-slider" />
      <div class="time-ticks">
        <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
      </div>
    </div>

    <!-- Segmentli Cam Dock -->
    <nav class="apple-dock">
      <!-- Görünüm Katmanları -->
      <div class="dock-segment">
        <button class="dock-chip" data-layer="buildings">🏙️ <span>${t("buildings3d")}</span></button>
        <button class="dock-chip" data-layer="terrain">⛰️ <span>${t("terrain")}</span></button>
        <button class="dock-chip on" data-layer="aerial">🛰️ <span>${t("aerial")}</span></button>
        <button class="dock-chip" data-layer="waves">🌊 <span>${t("waves")}</span></button>
        <button class="dock-chip on" data-layer="traffic">🚗 <span>${t("traffic")}</span></button>
        <button class="dock-chip on" data-layer="mask" title="${t("maskTooltip")}">🎯 <span>${t("giresunFocus")}</span></button>
      </div>

      <div class="apple-dock-divider"></div>

      <!-- Hava Durumu Modları -->
      <div class="dock-segment">
        <button class="dock-chip" data-weather="clear">☀️ <span>${t("clear")}</span></button>
        <button class="dock-chip" data-weather="snow">❄️ <span>${t("snow")}</span></button>
        <button class="dock-chip" data-weather="rain">🌧️ <span>${t("rain")}</span></button>
      </div>

      <div class="apple-dock-divider"></div>

      <!-- Zaman Butonu -->
      <button class="dock-chip" data-act="time">🕐 <span>${t("timeOfDay")}</span></button>
    </nav>
  `;
  document.body.appendChild(dockWrap);

  // ——— DURUM YÖNETİMİ ———
  const state = {
    buildings: true,
    terrain: true,
    aerial: true,
    waves: true,
    mask: true,
    traffic: true,
    weather: "clear" as WeatherMode,
  };

  const syncDockChips = () => {
    dockWrap.querySelectorAll<HTMLElement>("[data-layer]").forEach((el) => {
      el.classList.toggle("on", (state as never as Record<string, boolean>)[el.dataset.layer!]);
    });
    dockWrap.querySelectorAll<HTMLElement>("[data-weather]").forEach((el) => {
      el.classList.toggle("on", el.dataset.weather === state.weather);
    });
  };

  // Katman Aç/Kapa
  dockWrap.querySelectorAll<HTMLButtonElement>("[data-layer]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const k = btn.dataset.layer as "buildings" | "terrain" | "aerial" | "waves" | "mask" | "traffic";
      (state as never as Record<string, boolean>)[k] = !(state as never as Record<string, boolean>)[k];
      if (k === "buildings") map.setBuildings(state.buildings);
      if (k === "terrain") map.setTerrain(state.terrain);
      if (k === "aerial") map.setAerial(state.aerial);
      if (k === "waves") map.setWaves(state.waves);
      if (k === "mask") map.setMask(state.mask);
      if (k === "traffic") map.setTraffic(state.traffic);
      syncDockChips();
    });
  });

  // Hava Durumu
  dockWrap.querySelectorAll<HTMLButtonElement>("[data-weather]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.weather = btn.dataset.weather as WeatherMode;
      map.setWeather(state.weather);
      syncDockChips();
    });
  });

  // Zaman Kaydırıcısı (Popover)
  const timePopover = dockWrap.querySelector<HTMLElement>(".apple-time-popover")!;
  const timeBtn = dockWrap.querySelector<HTMLButtonElement>('[data-act="time"]')!;
  const range = timePopover.querySelector<HTMLInputElement>("input[type=range]")!;
  const follow = timePopover.querySelector<HTMLInputElement>("input[type=checkbox]")!;

  const closeTimePopover = () => {
    timePopover.hidden = true;
    timeBtn.classList.remove("popover-active");
  };

  timeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const willOpen = timePopover.hidden;
    if (willOpen) {
      timePopover.hidden = false;
      timeBtn.classList.add("popover-active");
    } else {
      closeTimePopover();
    }
  });

  timePopover.querySelector("[data-time-close]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeTimePopover();
  });

  range.addEventListener("input", () => {
    follow.checked = false;
    map.setManualTime(Number(range.value));
  });

  follow.addEventListener("change", () => {
    if (follow.checked) map.setManualTime(null);
  });

  document.addEventListener("click", (e) => {
    const target = e.target as Node;
    if (!timePopover.contains(target) && target !== timeBtn && !timeBtn.contains(target)) {
      closeTimePopover();
    }
  });

  // ——— KAMERA & PUSULA ETKİLEŞİMLERİ ———
  const needle = navIsland.querySelector<HTMLElement>(".compass-needle");
  const dimBadge = navIsland.querySelector<HTMLElement>("[data-dim-badge]");

  const syncCompass = () => {
    const b = map.map.getBearing();
    const p = map.map.getPitch();
    if (needle) needle.style.transform = `rotate(${-b}deg)`;
    if (dimBadge) dimBadge.textContent = p > 20 ? "3D" : "2D";
  };

  map.map.on("rotate", syncCompass);
  map.map.on("pitch", syncCompass);
  syncCompass();

  const handleNavAction = (act: string) => {
    if (act === "rot-left") map.rotateBy(-45);
    if (act === "rot-right") map.rotateBy(45);
    if (act === "tilt-up") map.tiltBy(12);
    if (act === "tilt-down") map.tiltBy(-12);
    if (act === "toggle2d3d") map.toggle2D3D();
    if (act === "compass") map.resetView();
    if (act === "zoom-in") map.zoomIn();
    if (act === "zoom-out") map.zoomOut();
  };

  navIsland.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-nav]");
    if (btn && btn.dataset.nav) handleNavAction(btn.dataset.nav);
  });

  // Klavye Kısayolları (Q/E dönme, R/F eğim, C 2D/3D)
  window.addEventListener("keydown", (e) => {
    if (document.activeElement?.tagName === "INPUT") return;
    if (e.key === "q" || e.key === "Q") map.rotateBy(-22.5);
    if (e.key === "e" || e.key === "E") map.rotateBy(22.5);
    if (e.key === "r" || e.key === "R") map.tiltBy(10);
    if (e.key === "f" || e.key === "F") map.tiltBy(-10);
    if (e.key === "c" || e.key === "C") map.toggle2D3D();
  });

  // ——— ÜST BAR EYLEMLERİ ———
  header.addEventListener("click", async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-act], [data-open]");
    if (!btn) return;

    if (btn.dataset.open) {
      cb.onOpenSidebar(btn.dataset.open as "landmarks" | "districts");
      return;
    }

    const act = btn.dataset.act;
    if (act === "lang") {
      toggleLang();
      location.reload();
    }
    if (act === "share") {
      const url = shareUrl(map.map);
      try {
        await navigator.clipboard.writeText(url);
        toast(t("copied"));
      } catch {
        window.prompt(t("share"), url);
      }
    }
    if (act === "dashboard") cb.onOpenDashboard();
    if (act === "reset") cb.onReset();
  });

  // ——— SPOTLIGHT ARAMA ALANI ———
  const input = header.querySelector<HTMLInputElement>(".apple-search-input")!;
  const results = header.querySelector<HTMLElement>(".apple-search-dropdown")!;
  let abort: AbortController | null = null;
  let debounce = 0;

  const renderResults = (items: SearchResult[]) => {
    if (!items.length) {
      results.hidden = false;
      results.innerHTML = `<div class="sr-empty">${t("searchNoResult")}</div>`;
      return;
    }
    results.hidden = false;
    results.innerHTML = items
      .map(
        (r, i) => `<button class="sr-item" data-i="${i}">
          <span class="sr-name">${escapeHtml(r.name)}</span>
          <span class="sr-sub">${escapeHtml(shorten(r.display_name))}</span>
        </button>`,
      )
      .join("");
    results.querySelectorAll<HTMLButtonElement>(".sr-item").forEach((el) => {
      el.addEventListener("click", () => {
        const r = items[Number(el.dataset.i)];
        map.goTo(r.lon, r.lat, 15);
        results.hidden = true;
        input.blur();
      });
    });
  };

  const renderQuick = () => {
    results.hidden = false;
    results.innerHTML =
      `<div class="sr-label">${t("searchNearby")}</div>` +
      QUICK_PLACES.map(
        (p, i) => `<button class="sr-item" data-q="${i}">
          <span class="sr-name">${escapeHtml(p.label)}</span></button>`,
      ).join("");
    results.querySelectorAll<HTMLButtonElement>("[data-q]").forEach((el) => {
      el.addEventListener("click", () => {
        const p = QUICK_PLACES[Number(el.dataset.q)];
        map.goTo(p.lon, p.lat, p.zoom);
        results.hidden = true;
        input.blur();
      });
    });
  };

  input.addEventListener("focus", renderQuick);
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    const q = input.value;
    if (q.trim().length < 2) {
      renderQuick();
      return;
    }
    debounce = window.setTimeout(async () => {
      abort?.abort();
      abort = new AbortController();
      try {
        const items = await searchPlaces(q, getLang(), abort.signal);
        renderResults(items);
      } catch {
        /* iptal/hata sessiz */
      }
    }, 350);
  });

  document.addEventListener("click", (e) => {
    if (!header.contains(e.target as Node)) results.hidden = true;
  });

  syncDockChips();
  return { refresh: () => location.reload() };
}

function shorten(s: string): string {
  const parts = s.split(",");
  return parts.length > 3 ? parts.slice(1, 4).join(",").trim() : s;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export function toast(msg: string) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 400);
  }, 2000);
}
