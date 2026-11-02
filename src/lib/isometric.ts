import type { Map as MLMap } from "maplibre-gl";

/**
 * Gerçek izometrik kamera: heading 315°, tilt = atan(√2) ≈ 54.74°.
 * Isometric Istanbul ile aynı bakış açısı.
 */
export const ISO_PITCH = 54.7;
export const ISO_BEARING = 315;

/**
 * URL durumu: ?x=<lon>&y=<lat>&z=<zoom>
 * Isometric Istanbul'un ?x=&y=&z= şemasıyla aynı isimlendirme; burada x/y
 * enlem/boylam, z MapLibre zoom seviyesidir. Ayrıca pitch/bearing de saklanır.
 */
export interface ViewState {
  lon: number;
  lat: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

export function readUrlState(search: string): Partial<ViewState> {
  const p = new URLSearchParams(search);
  const num = (k: string) => {
    const v = Number(p.get(k));
    return Number.isFinite(v) ? v : undefined;
  };
  const lon = num("x");
  const lat = num("y");
  const zoom = num("z");
  const state: Partial<ViewState> = {};
  if (lon !== undefined) state.lon = lon;
  if (lat !== undefined) state.lat = lat;
  if (zoom !== undefined) state.zoom = zoom;
  const b = num("bearing");
  if (b !== undefined) state.bearing = b;
  const pi = num("pitch");
  if (pi !== undefined) state.pitch = pi;
  return state;
}

/** Harita durumunu URL'e yazar (replaceState — geçmişi doldurmaz). */
export function writeUrlState(map: MLMap, extra?: Record<string, string>) {
  const c = map.getCenter();
  const params = new URLSearchParams();
  params.set("x", c.lng.toFixed(4));
  params.set("y", c.lat.toFixed(4));
  params.set("z", map.getZoom().toFixed(3));
  params.set("bearing", map.getBearing().toFixed(1));
  params.set("pitch", map.getPitch().toFixed(1));
  if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
  const url = `${location.pathname}?${params.toString()}`;
  history.replaceState(null, "", url);
}

/** Paylaşılabilir bağlantı üretir. */
export function shareUrl(map: MLMap): string {
  const c = map.getCenter();
  const base = `${location.origin}${location.pathname}`;
  const p = new URLSearchParams();
  p.set("x", c.lng.toFixed(4));
  p.set("y", c.lat.toFixed(4));
  p.set("z", map.getZoom().toFixed(3));
  return `${base}?${p.toString()}`;
}
