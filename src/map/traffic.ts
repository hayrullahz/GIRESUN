import type { Map as MLMap, GeoJSONSource } from "maplibre-gl";

/**
 * Canlı trafik: gerçek yol geometrisi üzerinde arabalar/otobüsler/kamyonlar,
 * deniz üzerinde tekneler ve vapurlar, dönen fener ışınları.
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
  kind: "car" | "bus" | "truck" | "boat" | "ferry";
  color: string;
  size: number;
  loop: boolean;
  road: boolean;
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
  private enabled = true;
  private night = 0;
  private raf = 0;
  private last = 0;
  private angle = 0;
  private timer = 0;

  init(m: MLMap) {
    this.m = m;
    const empty = { type: "FeatureCollection", features: [] } as never;
    m.addSource("traffic", { type: "geojson", data: empty });
    m.addSource("beacons", { type: "geojson", data: empty });
    const before = m.getLayer("place-city") ? "place-city" : undefined;
    const z = (a: number, b: number, c: number) =>
      ["interpolate", ["linear"], ["zoom"], 11, a, 14, b, 17, c];
    const kind = (t: string) => ["==", ["get", "t"], t];

    m.addLayer({ id: "traffic-wake", type: "circle", source: "traffic", filter: kind("wake") as never,
      paint: { "circle-radius": z(3, 7, 16) as never, "circle-color": "#ffffff", "circle-opacity": 0.2, "circle-blur": 1 } }, before);
    m.addLayer({ id: "traffic-head", type: "circle", source: "traffic", filter: kind("head") as never,
      paint: { "circle-radius": z(3, 9, 24) as never, "circle-color": "#ffe9a8", "circle-opacity": 0, "circle-blur": 0.9 } }, before);
    m.addLayer({ id: "traffic-tail", type: "circle", source: "traffic", filter: kind("tail") as never,
      paint: { "circle-radius": z(1.5, 3.5, 8) as never, "circle-color": "#ff3b30", "circle-opacity": 0, "circle-blur": 0.3 } }, before);
    
    // Araç gövdesi: Gerçekçi izometrik araç geometrisi (gölge + gövde + cam + tavan)
    m.addLayer({ id: "traffic-shadow", type: "circle", source: "traffic", filter: kind("body") as never,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, ["*", ["get", "s"], 2.8], 14, ["*", ["get", "s"], 6.2], 17, ["*", ["get", "s"], 15]] as never,
        "circle-color": "rgba(0,0,0,0.45)",
        "circle-blur": 0.8,
        "circle-translate": [1, 2],
      } }, before);

    m.addLayer({ id: "traffic-body", type: "circle", source: "traffic", filter: kind("body") as never,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, ["*", ["get", "s"], 2.5], 14, ["*", ["get", "s"], 5.5], 17, ["*", ["get", "s"], 14]] as never,
        "circle-color": ["get", "c"] as never,
        "circle-stroke-color": "#111827",
        "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 11, 0.8, 14, 1.6, 17, 3],
        "circle-opacity": 1.0,
      } }, before);

    // Araç cam / tavan vurgusu (araç hissi verir, nokta görüntüsünü ortadan kaldırır)
    m.addLayer({ id: "traffic-roof", type: "circle", source: "traffic", filter: kind("body") as never,
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 11, ["*", ["get", "s"], 1.1], 14, ["*", ["get", "s"], 2.4], 17, ["*", ["get", "s"], 6.5]] as never,
        "circle-color": "#1e293b",
        "circle-opacity": 0.85,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 0.5,
      } }, before);

    m.addLayer({ id: "traffic-nav", type: "circle", source: "traffic", filter: kind("nav") as never,
      paint: { "circle-radius": z(1.2, 2.2, 5) as never, "circle-color": ["get", "c"] as never, "circle-opacity": 0, "circle-blur": 0.4 } }, before);
    m.addLayer({ id: "beacon-beam", type: "line", source: "beacons",
      paint: { "line-color": "#fff3c4", "line-width": z(2, 4, 9) as never, "line-blur": 3, "line-opacity": 0 } }, before);

    this.buildBoats();
    this.setNight(this.night);
    m.on("moveend", () => {
      clearTimeout(this.timer);
      this.timer = window.setTimeout(() => this.refreshRoads(), 450);
    });
    m.once("idle", () => this.refreshRoads());
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

  private buildBoats() {
    const loop = circleRoute([38.4366, 40.9294], 420);
    const harbor = mk([[38.404, 40.927], [38.42, 40.933], [38.43, 40.9395], [38.46, 40.947]]);
    const offshore = mk([[38.2, 40.985], [38.32, 40.985], [38.44, 40.992], [38.56, 40.995], [38.68, 41.02], [38.8, 41.05]]);
    const fishing = mk([[38.3, 40.965], [38.36, 40.975], [38.4, 40.972], [38.34, 40.962], [38.3, 40.965]]);
    const mkBoat = (route: Route, d: number, speed: number, kind: Mover["kind"], color: string, size: number, loopIt: boolean): Mover =>
      ({ route, d, dir: 1, speed, kind, color, size, loop: loopIt, road: false });
    this.boats = [
      mkBoat(loop, 0, 28, "boat", "#ffffff", 1.3, true),
      mkBoat(loop, loop.len / 2, 24, "boat", "#ffd27a", 1.3, true),
      mkBoat(harbor, 0, 30, "boat", "#ffffff", 1.4, false),
      mkBoat(harbor, harbor.len, 26, "boat", "#8ecae6", 1.4, false),
      mkBoat(offshore, 0, 55, "ferry", "#ff8c42", 2.1, false),
      mkBoat(offshore, offshore.len, 48, "ferry", "#f1faee", 2.1, false),
      mkBoat(fishing, 0, 22, "boat", "#ffb703", 1.2, true),
      mkBoat(fishing, fishing.len * 0.5, 20, "boat", "#ffffff", 1.2, true),
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
    const out: Mover[] = [];
    for (const it of items) {
      if (out.length >= 130) break;
      for (let i = 0; i < it.w && out.length < 130; i++) {
        const roll = Math.random();
        const kind: Mover["kind"] = roll > 0.93 ? "bus" : roll > 0.85 ? "truck" : "car";
        out.push({
          route: it.r,
          d: Math.random() * it.r.len,
          dir: Math.random() > 0.5 ? 1 : -1,
          speed: (it.w === 3 ? 65 : 45) * (0.8 + Math.random() * 0.5),
          kind,
          color: kind === "bus" ? "#ffb703" : kind === "truck" ? "#adb5bd" : CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
          size: kind === "car" ? 1 : 1.35,
          loop: false,
          road: true,
        });
      }
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
    const k = Math.max(0.4, Math.min(10, Math.pow(2, 15 - zoom)));
    const feats: unknown[] = [];
    const push = (mv: Mover) => {
      mv.d += mv.dir * mv.speed * dt * k;
      if (mv.loop) mv.d = (mv.d + mv.route.len) % mv.route.len;
      else if (mv.d <= 0 || mv.d >= mv.route.len) {
        mv.dir = mv.dir === 1 ? -1 : 1;
        mv.d = Math.max(0, Math.min(mv.route.len, mv.d));
      }
      const { p, h: h0 } = at(mv.route, mv.d);
      const h = mv.dir === 1 ? h0 : h0 + 180;
      const pt = (c: LL, t: string, extra: Record<string, unknown> = {}) =>
        feats.push({ type: "Feature", properties: { t, c: mv.color, s: mv.size, ...extra }, geometry: { type: "Point", coordinates: c } });
      pt(p, "body");
      if (mv.road) {
        pt(ahead(p, h, 9 * mv.size), "head");
        pt(ahead(p, h, -3 * mv.size), "tail");
      } else {
        pt(ahead(p, h, -14 * mv.size), "wake");
        pt(ahead(p, h + 90, 4 * mv.size), "nav", { c: "#ff3b30" });
        pt(ahead(p, h - 90, 4 * mv.size), "nav", { c: "#34c759" });
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
