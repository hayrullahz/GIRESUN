import "./styles/app.css";
import { GiresunMap } from "./map/map";
import { buildControls } from "./ui/controls";
import { Sidebar } from "./ui/sidebar";
import { Dashboard } from "./ui/dashboard";
import { LandmarkModal } from "./ui/landmarkModal";
import { setLang, t, getLang } from "./lib/i18n";
import { readUrlState } from "./lib/isometric";

// Dil: ?lang= en | varsayılan tr
const url = readUrlState(location.search);
const langParam = new URLSearchParams(location.search).get("lang");
setLang(langParam === "en" ? "en" : "tr");
void url;

// Başlık
document.title = t("title");
const loaderText = document.querySelector<HTMLElement>("[data-loader]");
if (loaderText) loaderText.textContent = t("loading");

// Yükleniyor ekranı
const loader = document.querySelector<HTMLElement>("#loader");

const container = document.querySelector<HTMLElement>("#map")!;
const map = new GiresunMap(container, {
  buildings: true,
  aerial: true,
  waves: true,
  terrain: true,
  weather: "clear",
});

// Hata yakalama (geliştirme)
map.map.on("error", (e) => {
  // eslint-disable-next-line no-console
  console.error("MAP ERROR:", (e as unknown as { error?: unknown })?.error ?? e);
});
(window as unknown as Record<string, unknown>).__giresun = map.map;

const landmarkModal = new LandmarkModal(map);
map.onLandmarkClick((lm) => landmarkModal.show(lm));

const sidebar = new Sidebar(map, (lm) => landmarkModal.show(lm));
const dashboard = new Dashboard(map);

buildControls(map, {
  onOpenDashboard: () => dashboard.open(),
  onOpenSidebar: (tab) => sidebar.open(tab),
  onReset: () => map.resetView(),
});

// Harita hazır olduğunda veya zaman aşımında yükleniyor ekranını güvenle gizle
let loaderDismissed = false;
const dismissLoader = () => {
  if (loaderDismissed) return;
  loaderDismissed = true;
  loader?.classList.add("hide");
  setTimeout(() => loader?.remove(), 600);
};

map.map.once("load", () => {
  setTimeout(dismissLoader, 300);
});

// Güvenlik: 2.5 saniye içinde harita karoları gecikse bile loader takılı kalmasın
setTimeout(dismissLoader, 2500);

// Klavye kısayolları
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    sidebar.close();
    dashboard.close();
    landmarkModal.close();
  }
  if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
    e.preventDefault();
    document.querySelector<HTMLInputElement>(".search-field")?.focus();
  }
});

// Servis worker — karoları cihazda önbellekler (ikinci açılış anında)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`).catch(() => {});
  });
}

console.info(
  `%c🏝️ isometric giresun %c— ${getLang().toUpperCase()} · gerçek zamanlı 3B izometrik harita`,
  "color:#6fd0e8;font-weight:bold",
  "color:#9fb0b8",
);
