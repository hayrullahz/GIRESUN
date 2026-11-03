import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";
import { addTrafficSprites, type TrafficSprites } from "./sprites";

/**
 * Canlı trafik: gerçek yol geometrisi üzerinde 3B görünümlü araçlar,
 * yaya akışı, deniz üzerinde tekneler ve vapurlar, dönen fener ışınları.
 * Yollar görünür harita karolarından (queryRenderedFeatures) okunur.
 */
type LL = [number, number];
const R = 111320;
const PI = Math.PI;

interface Route { pts: LL[]; cum: number[]; len: number }
interface Mover {
  route: Route;
  d: number;
  dir: 1 | -1;
  speed: number;
  kind: "car" | "bus" | "truck" | "pedestrian" | "boat" | "ferry";
  color: string;
  size: number;
  loop: boolean;
  road: boolean;
  img: string;
  /** Yaya yürüyüş kareleri (A/B) */
  frames?: [string, string];
  /** Yaya için yol kenarına kaydırma (m, işaretli) */
  side?: number;
}

const mk = (pts: LL[]): Route => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    const dx = (pts[i][0] - pts[i - 1][0]) * R * Math.cos((pts[i][1] * PI) / 180);
    const dy = (pts[i][1] - pts[i - 1][1]) * R;
    cum.push(cum[i - 1] + Math.hypot(dx, dy));
  }
  return { pts, cum, len: cum[cum.length - 1] };
};

function at(r: Route, d: number): { p: LL; h: number } {
  d = Math.max(0, Math.min(r.len, d));
  let i = 1;
  while (i < r.cum.length - 1 && r.cum[i] < d) i++;
  const seg = r.cum[i] - r.cum[i - 1] || 1;
  const t = (d - r.cum[i - 1]) / seg;
  const a = r.pts[i - 1];
  const b = r.pts[i];
  const cos = Math.cos((a[1] * PI) / 180);
  return {
    p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
    h: (Math.atan2((b[0] - a[0]) * cos, b[1] - a[1]) * 180) / PI,
  };
}

const ahead = (p: LL, h: number, m: number): LL => {
  const r = (h * PI) / 180;
  return [
    p[0] + (Math.sin(r) * m) / (R * Math.cos((p[1] * PI) / 180)),
    p[1] + (Math.cos(r) * m) / R,
  ];
};

const circleRoute = (c: LL, rad: number, n = 28): Route => {
  const pts: LL[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * PI * 2;
    pts.push([
      c[0] + (Math.cos(a) * rad * 1.3) / (R * Math.cos((c[1] * PI) / 180)),
      c[1] + (Math.sin(a) * rad) / R,
    ]);
  }
  return mk(pts);
};

const CAR_COLORS = ["#e63946", "#f1faee", "#a8dadc", "#ffb703", "#8ecae6", "#ffffff", "#2a9d8f", "#c77dff"];
const BEACONS: LL[] = [[38.4025, 40.9242], [38.4372, 40.9305]];

export class Traffic {
  private m: MLMap | null = null;
  private movers: Mover[] = [];
  private boats: Mover[] = [];
  private sprites!: TrafficSprites;
  private enabled = true;
  private night = 0;
  private raf = 0;
  private last = 0;
  private angle = 0;
  private timer = 0;

  init(m: MLMap) {
    this.m = m;
    this.sprites = addTrafficSprites(m);
    const empty = { type: "FeatureCollection", features: [] } as never;
    m.addSource("traffic", { type: "geojson", data: empty });
    m.addSource("beacons", { type: "geojson", data: empty });
    // 3D binaların altına yerleştir: araçlar bina cephelerinin arkasında kalır
    const before = m.getLayer("building-3d")
      ? "building-3d"
      : m.getLayer("place-city")
        ? "place-city"
        : undefined;
    const z = (a: number, b: number, c: number) =>
      ["interpolate", ["linear"], ["zoom"], 11, a, 14, b, 17, c];
    const kind = (t: string) => ["==", ["get", "t"], t];

    // Araçlar: 3B görünümlü sprite'lar (gövde, cam, tekerlek ve gölge sprite içinde)
    m.addLayer({ id: "traffic-body", type: "symbol", source: "traffic", filter: kind("body") as never,
      layout: {
        "icon-image": ["get", "img"] as never,
        "icon-size": ["interpolate", ["linear"], ["zoom"], 11.5, ["*", ["get", "s"], 0.06], 14, ["*", ["get", "s"], 0.10], 16, ["*", ["get", "s"], 0.15], 17.5, ["*", ["get", "s"], 0.20]] as never,
        "icon-rotate": ["get", "b"] as never,
        "icon-rotation-alignment": "viewport",
        "icon-pitch-alignment": "viewport",
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      } }, before);

    // Yayalar: yalnızca yakın zoom'da, yol kenarında yürüyen figürler
    m.addLayer({ id: "traffic-pedestrian", type: "symbol", source: "traffic", filter: kind("ped") as never,
      minzoom: 15,
      layout: {
        "icon-image": ["get", "img"] as never,
        "icon-size": ["interpolate", ["linear"], ["zoom"], 15, 0.12, 16.5, 0.175, 17.5, 0.23] as never,
        "icon-rotate": ["get", "b"] as never,
        "icon-rotation-alignment": "viewport",
        "icon-pitch-alignment": "viewport",
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      } }, before);

    // Gece farları ve stop lambaları
    m.addLayer({ id: "traffic-head", type: "circle", source: "traffic", filter: kind("head") as never,
      paint: { "circle-radius": z(0.6, 1.1, 2.2) as never, "circle-color": "#fff3c4", "circle-opacity": 0, "circle-blur": 0.8 } }, before);
    m.addLayer({ id: "traffic-tail", type: "circle", source: "traffic", filter: kind("tail") as never,
      paint: { "circle-radius": z(0.5, 1, 1.9) as never, "circle-color": "#ff3b30", "circle-opacity": 0, "circle-blur": 0.5 } }, before);

    m.addLayer({ id: "traffic-nav", type: "circle", source: "traffic", filter: kind("nav") as never,
      paint: { "circle-radius": z(1.2, 2.2, 5) as never, "circle-color": ["get", "c"] as never, "circle-opacity": 0, "circle-blur": 0.4 } }, before);
    m.addLayer({ id: "beacon-beam", type: "line", source: "beacons",
      paint: { "line-color": "#fff3c4", "line-width": z(2, 4, 9) as never, "line-blur": 3, "line-opacity": 0 } }, before);

    this.buildBoats();
    this.setNight(this.night);
    m.on("moveend", () => this.scheduleRoads());
    // Trafik her karede kaynağı güncellediği için harita "idle" durumuna geçmez;
    // yolların ilk yüklemede dolması için kısa gecikmeli denemeler yapılır.
    m.on("sourcedata", (e) => {
      if (e.sourceId === "planet" && e.isSourceLoaded && this.movers.length === 0) {
        this.scheduleRoads();
      }
    });
    [800, 2200, 5000].forEach((d) =>
      window.setTimeout(() => {
        if (!this.movers.length) this.refreshRoads();
      }, d),
    );
    this.raf = requestAnimationFrame(this.frame);
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.push([], []);
  }

  setNight(n: number) {
    this.night = n;
    const m = this.m;
    if (!m) return;
    const set = (id: string, prop: string, v: number) => m.getLayer(id) && m.setPaintProperty(id, prop, v);
    set("traffic-head", "circle-opacity", 0.85 * n);
    set("traffic-tail", "circle-opacity", 0.9 * n);
    set("traffic-nav", "circle-opacity", 0.95 * n);
    set("beacon-beam", "line-opacity", 0.6 * n);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.timer);
  }

  private scheduleRoads() {
    clearTimeout(this.timer);
    this.timer = window.setTimeout(() => this.refreshRoads(), 450);
  }

  private buildBoats() {
    const loop = circleRoute([38.4366, 40.9294], 420);
    const harbor = mk([[38.404, 40.927], [38.42, 40.933], [38.43, 40.9395], [38.46, 40.947]]);
    const offshore = mk([[38.2, 40.985], [38.32, 40.985], [38.44, 40.992], [38.56, 40.995], [38.68, 41.02], [38.8, 41.05]]);
    const fishing = mk([[38.3, 40.965], [38.36, 40.975], [38.4, 40.972], [38.34, 40.962], [38.3, 40.965]]);
    const mkBoat = (route: Route, d: number, speed: number, kind: Mover["kind"], color: string, size: number, loopIt: boolean, img: string): Mover =>
      ({ route, d, dir: 1, speed, kind, color, size, loop: loopIt, road: false, img });
    this.boats = [
      mkBoat(loop, 0, 7, "boat", "#ffffff", 1.1, true, this.sprites.boat),
      mkBoat(loop, loop.len / 2, 6, "boat", "#ffd27a", 1.1, true, this.sprites.boat),
      mkBoat(harbor, 0, 8, "boat", "#ffffff", 1.15, false, this.sprites.boat),
      mkBoat(harbor, harbor.len, 7, "boat", "#8ecae6", 1.15, false, this.sprites.boat),
      mkBoat(offshore, 0, 16, "ferry", "#ff8c42", 1.8, false, this.sprites.ferry),
      mkBoat(offshore, offshore.len, 15, "ferry", "#f1faee", 1.8, false, this.sprites.ferry),
      mkBoat(fishing, 0, 5, "boat", "#ffb703", 1.05, true, this.sprites.boat),
      mkBoat(fishing, fishing.len * 0.5, 5, "boat", "#ffffff", 1.05, true, this.sprites.boat),
    ];
  }

  private refreshRoads() {
    const m = this.m;
    if (!m || m.getZoom() < 11) {
      this.movers = [];
      return;
    }
    const layers = ["road-highway", "road-major", "road-minor"].filter((id) => m.getLayer(id));
    if (!layers.length) return;
    const zoom = m.getZoom();
    const items: { r: Route; w: number }[] = [];
    for (const f of m.queryRenderedFeatures({ layers })) {
      const g = f.geometry;
      const lines = g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
      const w = f.layer.id === "road-highway" ? 3 : f.layer.id === "road-major" ? 2 : zoom >= 14 ? 1 : 0;
      if (!w) continue;
      for (const l of lines) {
        if (l.length < 2) continue;
        const r = mk(l.map((c) => [c[0], c[1]] as LL));
        if (r.len > 120) items.push({ r, w });
      }
    }
    items.sort(() => Math.random() - 0.5);
    const cap = zoom >= 15 ? 32 : zoom >= 13 ? 46 : 56;
    const pedCap = zoom >= 15 ? 14 : 8;
    const out: Mover[] = [];
    let vehicles = 0;
    for (const it of items) {
      if (vehicles >= cap) break;
      const perRoute = it.w >= 3 ? 2 : 1;
      for (let i = 0; i < perRoute && vehicles < cap; i++) {
        const roll = Math.random();
        const kind: Mover["kind"] = roll > 0.93 ? "bus" : roll > 0.84 ? "truck" : "car";
        out.push({
          route: it.r,
          d: Math.random() * it.r.len,
          dir: Math.random() > 0.5 ? 1 : -1,
          speed: (kind === "bus" ? 10.5 : kind === "truck" ? 9.5 : 13.5) * (0.85 + Math.random() * 0.3),
          kind,
          color: kind === "bus" ? "#ffb703" : kind === "truck" ? "#adb5bd" : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
          size: kind === "car" ? 1 : kind === "bus" ? 1.22 : 1.16,
          loop: false,
          road: true,
          img: kind === "bus" ? this.sprites.bus : kind === "truck" ? this.sprites.truck : this.sprites.cars[Math.floor(Math.random() * this.sprites.cars.length)],
        });
        vehicles++;
      }
    }
    // Yayalar: ana yollara değil, sokak ve caddelere; kaldırım hizasında yürür
    let peds = 0;
    for (const it of items) {
      if (peds >= pedCap) break;
      if (it.w >= 3 || Math.random() > 0.55) continue;
      const frames = this.sprites.people[Math.floor(Math.random() * this.sprites.people.length)];
      const off = it.w === 1 ? 3.8 + Math.random() * 1.4 : 6 + Math.random() * 1.6;
      out.push({
        route: it.r,
        d: Math.random() * it.r.len,
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 1.3 + Math.random() * 0.5,
        kind: "pedestrian",
        color: "#334155",
        size: 1,
        loop: false,
        road: true,
        img: frames[0],
        frames,
        side: (Math.random() > 0.5 ? 1 : -1) * off,
      });
      peds++;
    }
    this.movers = out;
  }

  private frame = (ts: number) => {
    this.raf = requestAnimationFrame(this.frame);
    const m = this.m;
    if (!m || !this.enabled || document.hidden || ts - this.last < 33) return;
    const dt = Math.min(0.1, (ts - this.last) / 1000);
    this.last = ts;
    const zoom = m.getZoom();
    const bearing = m.getBearing();
    const feats: unknown[] = [];
    const push = (mv: Mover) => {
      mv.d += mv.dir * mv.speed * dt;
      if (mv.loop) mv.d = (mv.d + mv.route.len) % mv.route.len;
      else if (mv.d <= 0 || mv.d >= mv.route.len) {
        mv.dir = mv.dir === 1 ? -1 : 1;
        mv.d = Math.max(0, Math.min(mv.route.len, mv.d));
      }
      const { p, h: h0 } = at(mv.route, mv.d);
      const h = mv.dir === 1 ? h0 : h0 + 180;
      // Yayalar kaldırımda, araçlar gidiş yönünün sağ şeridinde ilerler
      const offset = mv.kind === "pedestrian" ? (mv.side ?? 0) : mv.road ? 2.1 : 0;
      const pos: LL = offset ? ahead(p, h + 90, offset) : p;
      const b = h - bearing;
      const img = mv.frames
        ? mv.frames[Math.floor(ts / 440 + mv.d * 2) % 2]
        : mv.img;
      const pt = (c: LL, t: string, extra: Record<string, unknown> = {}) =>
        feats.push({
          type: "Feature",
          properties: { t, c: mv.color, s: mv.size, b, img, ...extra },
          geometry: { type: "Point", coordinates: c },
        });
      pt(pos, mv.kind === "pedestrian" ? "ped" : "body");
      if (mv.road && mv.kind !== "pedestrian") {
        const half = mv.kind === "bus" ? 5.6 : mv.kind === "truck" ? 4.8 : 2.5;
        pt(ahead(pos, h, half + 1.2), "head");
        pt(ahead(pos, h, -half - 0.6), "tail");
      } else if (!mv.road) {
        const half = mv.kind === "ferry" ? 6.5 : 3;
        pt(ahead(p, h + 90, half), "nav", { c: "#ff3b30" });
        pt(ahead(p, h - 90, half), "nav", { c: "#34c759" });
      }
    };
    if (zoom >= 11.5) this.movers.forEach(push);
    this.boats.forEach(push);

    this.angle = (this.angle + 45 * dt) % 360;
    const beams = BEACONS.flatMap((c) =>
      [0, 180].map((o) => ({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [c, ahead(c, this.angle + o, 900)] },
      })),
    );
    this.push(feats, this.night > 0.05 ? beams : []);
  };

  private push(feats: unknown[], beams: unknown[]) {
    const m = this.m;
    if (!m) return;
    (m.getSource("traffic") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: feats } as never);
    (m.getSource("beacons") as GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: beams } as never);
  }
}

export const traffic = new Traffic();
