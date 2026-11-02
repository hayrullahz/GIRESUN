import maplibregl from "maplibre-gl";
import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { buildStyle, OSM_ATTRIBUTION } from "../config/style";
import {
  HOME,
  BOUNDS,
  LANDMARKS,
  type Landmark,
} from "../config/giresun";
import {
  ISO_PITCH,
  ISO_BEARING,
  readUrlState,
  writeUrlState,
} from "../lib/isometric";
import { daylight, lerpColor } from "../lib/sun";
import { sea } from "./sea";
import { weather, type WeatherMode } from "./weather";
import { traffic } from "./traffic";
import { addNightLayers, applyNight, buildingColor } from "./nightlights";

export interface MapOptions {
  buildings: boolean;
  aerial: boolean;
  waves: boolean;
  terrain: boolean;
  weather: WeatherMode;
}

export class GiresunMap {
  map: MLMap;
  private urlTimer = 0;
  private sunTimer = 0;
  /** Varsayılan: 13.5 (13:30 - aydınlık, canlı gündüz modu). */
  private manualTime: number | null = 13.5;
  private onLandmark?: (lm: Landmark) => void;

  constructor(container: HTMLElement, opts: MapOptions) {
    const urlState = readUrlState(location.search);
    const hasUrlPos = urlState.lon !== undefined && urlState.lat !== undefined;
    const center: [number, number] = hasUrlPos
      ? [urlState.lon!, urlState.lat!]
      : [HOME.lon, HOME.lat];
    const zoom = urlState.zoom ?? (hasUrlPos ? HOME.zoom : 13.6);
    const bearing = urlState.bearing ?? (hasUrlPos ? ISO_BEARING : 275);
    const pitch = urlState.pitch ?? (hasUrlPos ? ISO_PITCH : 42);

    this.map = new maplibregl.Map({
      container,
      style: buildStyle(),
      center,
      zoom,
      bearing,
      pitch,
      maxPitch: 70,
      minZoom: 8,
      maxZoom: 17.5,
      attributionControl: false,
      cooperativeGestures: false,
      dragRotate: true,
      pitchWithRotate: true,
      touchPitch: true,
      bounds: [
        [BOUNDS[0][0], BOUNDS[0][1]],
        [BOUNDS[1][0], BOUNDS[1][1]],
      ],
      fitBoundsOptions: { padding: { top: 80, bottom: 90, left: 30, right: 80 } },
    });

    this.map.addControl(
      new maplibregl.AttributionControl({ compact: true, customAttribution: OSM_ATTRIBUTION }),
      "bottom-left",
    );

    this.map.on("load", () => this.onLoad(opts));
    this.map.on("moveend", () => this.scheduleUrl());
  }

  onLandmarkClick(fn: (lm: Landmark) => void) {
    this.onLandmark = fn;
  }

  private onLoad(opts: MapOptions) {
    this.setupTerrain(opts.terrain);
    this.setupLandmarks();
    sea.init(this.map);
    sea.setEnabled(opts.waves);
    this.setupWeather(opts.weather);
    this.applyLayers(opts);
    this.setupLive();
    this.applyTimeOfDay(this.manualTime ?? 13.5);
    this.bindInteractions();

    // Otomatik saat güncellemesi (sadece canlı saate geçilirse)
    this.sunTimer = window.setInterval(() => {
      if (this.manualTime === null) {
        const now = new Date();
        this.applyTimeOfDay(now.getHours() + now.getMinutes() / 60);
      }
    }, 60000);

    // Giresun Kalesi'ne yumuşak 3D yaklaşım ve tatlı dönme efekti (fly-in)
    const urlState = readUrlState(location.search);
    const hasCustomUrl = urlState.lon !== undefined && urlState.lat !== undefined;
    if (!hasCustomUrl) {
      window.setTimeout(() => {
        this.map.easeTo({
          center: [HOME.lon, HOME.lat],
          zoom: HOME.zoom,
          bearing: HOME.bearing,
          pitch: HOME.pitch,
          duration: 2400,
          easing: (t) => 1 - Math.pow(1 - t, 3), // cubic ease out
        });
      }, 400);
    }

    writeUrlState(this.map);
    document.body.classList.add("map-ready");
  }

  /** Deniz efekt düzeni, 3B yapılar, gece ışıkları ve canlı trafik. */
  private setupLive() {
    const m = this.map;
    // Hava fotoğrafı denizi örtmesin: su ve dalga katmanlarını fotoğrafın üstüne al
    if (m.getLayer("hillshade")) {
      for (const id of ["waterway", "water", "water-waves"]) {
        if (m.getLayer(id)) m.moveLayer(id, "hillshade");
      }
    }
    if (m.getLayer("water")) m.setPaintProperty("water", "fill-opacity", 0.86);
    addNightLayers(m);
    traffic.init(m);
  }

  setTraffic(on: boolean) {
    traffic.setEnabled(on);
  }

  private setupTerrain(on: boolean) {
    if (on) {
      this.map.setTerrain({ source: "terrain", exaggeration: 1.15 });
    }
    // Havasal gökyüzü — izometrik derinlik hissi için
    this.applySky(1);
  }

  /** Gökyüzü/fog renklerini gün ışığına (day 0..1) göre ayarlar. Sis benzeri basık bulanıklığı kaldırır. */
  private applySky(day: number) {
    this.map.setSky({
      "sky-color": lerpColor("#0f172a", "#8ec5fc", day),
      "horizon-color": lerpColor("#1e293b", "#e0f2fe", day),
      "fog-color": lerpColor("#0f172a", "#f0f9ff", day),
      "fog-ground-blend": 0.05,
      "horizon-fog-blend": 0.18,
      "atmosphere-blend": 0.15,
    });
  }

  private setupLandmarks() {
    const features = LANDMARKS.map((lm, i) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [lm.lon, lm.lat] },
      properties: {
        id: lm.id,
        name: lm.name,
        nameEn: lm.nameEn,
        icon: lm.icon,
        category: lm.category,
        sort: i,
      },
    }));
    const src = this.map.getSource("landmarks") as GeoJSONSource | undefined;
    src?.setData({ type: "FeatureCollection", features });
  }

  private setupWeather(mode: WeatherMode) {
    weather.setMode(mode);
    const el = weather.element;
    if (!el.parentElement) document.body.appendChild(el);
  }

  private applyLayers(opts: MapOptions) {
    const m = this.map;
    if (m.getLayer("building-3d")) {
      m.setLayoutProperty(
        "building-3d",
        "visibility",
        opts.buildings ? "visible" : "none",
      );
    }
    // Hava fotoğrafı katmanı görünürlüğü
    if (m.getLayer("aerial")) {
      m.setLayoutProperty(
        "aerial",
        "visibility",
        opts.aerial ? "visible" : "none",
      );
    }
  }

  /** Gündüz/gece geçişi — gökyüzü, zemin ve bina renklerini saatle uyumlar. */
  applyTimeOfDay(hour: number) {
    const m = this.map;
    const date = new Date();
    date.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
    const day = daylight(HOME.lat, HOME.lon, date);

    this.applySky(day);

    // Zemin tonu
    const bg = lerpColor("#141f26", "#334155", day);
    if (m.getLayer("background")) {
      m.setPaintProperty("background", "background-color", bg);
    }

    // Bina rengi — gece daha koyu + sıcak yanan pencereler, gündüz açık
    const night = 1 - day;
    if (m.getLayer("building-3d")) {
      const base = lerpColor("#3c4147", "#cbd5e1", day);
      const top = lerpColor("#4a5057", "#f1f5f9", day);
      m.setPaintProperty("building-3d", "fill-extrusion-color", buildingColor(night, base, top) as never);
      m.setPaintProperty(
        "building-3d",
        "fill-extrusion-opacity",
        day < 0.3 ? 0.97 : 0.92,
      );
    }
    if (m.getLayer("real-building-3d")) {
      const realBase = lerpColor("#4b5563", "#e2e8f0", day);
      const realTop = lerpColor("#6b7280", "#ffffff", day);
      m.setPaintProperty("real-building-3d", "fill-extrusion-color", buildingColor(night, realBase, realTop) as never);
      m.setPaintProperty("real-building-3d", "fill-extrusion-opacity", day < 0.3 ? 0.97 : 0.94);
    }

    // Hava fotoğrafı: gündüz pırıl pırıl ve canlı (MapLibre max 1.0 limitine uygun)
    if (m.getLayer("aerial")) {
      m.setPaintProperty("aerial", "raster-brightness-max", Math.min(1.0, 0.40 + 0.60 * day));
      m.setPaintProperty("aerial", "raster-saturation", -0.35 * night);
    }

    // Deniz rengi: gündüz turkuaz ve berrak, gece derin lacivert
    if (m.getLayer("water")) {
      m.setPaintProperty("water", "fill-color", lerpColor("#031526", "#0284c7", day));
    }

    applyNight(m, night);
    traffic.setNight(night);

    // Giresun dışı pasif karartma maskesi (il sınırının dışı net pasif gösterim)
    if (m.getLayer("giresun-outside-dark")) {
      const maskColor = lerpColor("#020408", "#081018", day);
      const maskOpacity = 0.58 - day * 0.12; // Gece: 0.58, Tam gündüz: 0.46 (belirgin pasif dış odak)
      m.setPaintProperty("giresun-outside-dark", "fill-color", maskColor);
      m.setPaintProperty("giresun-outside-dark", "fill-opacity", maskOpacity);
    }
  }

  setManualTime(hour: number | null) {
    this.manualTime = hour;
    this.applyTimeOfDay(hour ?? new Date().getHours() + new Date().getMinutes() / 60);
  }

  private bindInteractions() {
    const m = this.map;
    m.on("click", "landmark-label", (e) => {
      const f = e.features?.[0];
      if (!f) return;
      const id = String(f.properties?.id ?? "");
      const lm = LANDMARKS.find((l) => l.id === id);
      if (lm) {
        this.onLandmark?.(lm);
      }
    });
    m.on("mouseenter", "landmark-label", () => (m.getCanvas().style.cursor = "pointer"));
    m.on("mouseleave", "landmark-label", () => (m.getCanvas().style.cursor = ""));
  }

  goTo(lon: number, lat: number, zoom?: number, opts?: { bearing?: number; pitch?: number }) {
    this.map.flyTo({
      center: [lon, lat],
      zoom: zoom ?? Math.max(this.map.getZoom(), 14),
      bearing: opts?.bearing ?? ISO_BEARING,
      pitch: opts?.pitch ?? ISO_PITCH,
      padding: { top: 85, bottom: 95, left: 35, right: 85 },
      speed: 0.9,
      curve: 1.4,
    });
  }

  resetView() {
    this.map.flyTo({
      center: [HOME.lon, HOME.lat],
      zoom: HOME.zoom,
      bearing: ISO_BEARING,
      pitch: ISO_PITCH,
      speed: 0.8,
      curve: 1.5,
    });
  }

  /** Haritayı belirtilen derece kadar yumuşak döndür (örn: -45 veya +45) */
  rotateBy(degrees: number) {
    const current = this.map.getBearing();
    this.map.easeTo({
      bearing: (current + degrees + 360) % 360,
      duration: 350,
      easing: (t) => t * (2 - t),
    });
  }

  /** Haritanın eğim açısını (pitch) yumuşak değiştir (örn: +10 veya -10) */
  tiltBy(degrees: number) {
    const current = this.map.getPitch();
    const next = Math.max(0, Math.min(70, current + degrees));
    this.map.easeTo({
      pitch: next,
      duration: 350,
      easing: (t) => t * (2 - t),
    });
  }

  /** 2B Düz Kuşbakışı ile 3B İzometrik görünüm arasında geçiş yap */
  toggle2D3D() {
    const pitch = this.map.getPitch();
    const is3D = pitch > 20;
    if (is3D) {
      // 2B Kuşbakışı moda geç (pitch: 0, bearing: 0)
      this.map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 500,
        easing: (t) => t * (2 - t),
      });
    } else {
      // 3B İzometrik moda dön (pitch: ISO_PITCH, bearing: ISO_BEARING)
      this.map.easeTo({
        pitch: ISO_PITCH,
        bearing: ISO_BEARING,
        duration: 500,
        easing: (t) => t * (2 - t),
      });
    }
  }

  zoomIn() {
    this.map.zoomIn({ duration: 300 });
  }

  zoomOut() {
    this.map.zoomOut({ duration: 300 });
  }

  setWeather(mode: WeatherMode) {
    weather.setMode(mode);
  }

  setWaves(on: boolean) {
    sea.setEnabled(on);
  }

  setBuildings(on: boolean) {
    if (this.map.getLayer("building-3d")) {
      this.map.setLayoutProperty("building-3d", "visibility", on ? "visible" : "none");
    }
    if (this.map.getLayer("real-building-3d")) {
      this.map.setLayoutProperty("real-building-3d", "visibility", on ? "visible" : "none");
    }
  }

  setTerrain(on: boolean) {
    if (on) this.map.setTerrain({ source: "terrain", exaggeration: 1.25 });
    else this.map.setTerrain(null);
  }

  setMask(on: boolean) {
    const m = this.map;
    const vis = on ? "visible" : "none";
    if (m.getLayer("giresun-outside-dark")) m.setLayoutProperty("giresun-outside-dark", "visibility", vis);
    if (m.getLayer("giresun-border-glow")) m.setLayoutProperty("giresun-border-glow", "visibility", vis);
    if (m.getLayer("giresun-border-line")) m.setLayoutProperty("giresun-border-line", "visibility", vis);
  }

  setLandmarks(on: boolean) {
    if (this.map.getLayer("landmark-label")) {
      this.map.setLayoutProperty("landmark-label", "visibility", on ? "visible" : "none");
    }
  }

  destroy() {
    clearInterval(this.sunTimer);
    sea.stop();
    this.map.remove();
  }

  setAerial(on: boolean) {
    if (this.map.getLayer("aerial")) {
      this.map.setLayoutProperty("aerial", "visibility", on ? "visible" : "none");
    }
  }

  private scheduleUrl() {
    clearTimeout(this.urlTimer);
    this.urlTimer = window.setTimeout(() => writeUrlState(this.map), 300);
  }
}
