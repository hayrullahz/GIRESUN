import type { Map as MLMap } from "maplibre-gl";

/**
 * Gece şehir ışıkları: yol parıltısı, landmark halesi ve işaret noktaları.
 * `night` 0 (gündüz) → 1 (gece).
 */
export function addNightLayers(m: MLMap) {
  if (!m.getLayer("road-glow")) {
    m.addLayer(
      {
        id: "road-glow",
        type: "line",
        source: "planet",
        "source-layer": "transportation",
        minzoom: 11,
        filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary", "secondary", "tertiary", "major", "minor", "service"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#ffcf70",
          "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.5, 15, 5, 18, 12],
          "line-blur": 4,
          "line-opacity": 0,
        },
      },
      m.getLayer("road-minor") ? "road-minor" : undefined,
    );
  }
  if (!m.getLayer("landmark-halo")) {
    m.addLayer(
      {
        id: "landmark-halo",
        type: "circle",
        source: "landmarks",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 8, 15, 26],
          "circle-color": "#ffd27a",
          "circle-blur": 1,
          "circle-opacity": 0,
        },
      },
      m.getLayer("landmark-label") ? "landmark-label" : undefined,
    );
  }
  if (!m.getLayer("landmark-dot")) {
    m.addLayer(
      {
        id: "landmark-dot",
        type: "circle",
        source: "landmarks",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 8, 4, 15, 7],
          "circle-color": [
            "match", ["get", "category"],
            "tarih", "#f59e0b", "doga", "#10b981", "kultur", "#8b5cf6",
            "sehir", "#0ea5e9", "ulasim", "#f97316", "#06b6d4",
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      },
      m.getLayer("landmark-label") ? "landmark-label" : undefined,
    );
  }
}

export function applyNight(m: MLMap, night: number) {
  if (m.getLayer("road-glow")) m.setPaintProperty("road-glow", "line-opacity", 0.5 * night);
  if (m.getLayer("landmark-halo")) m.setPaintProperty("landmark-halo", "circle-opacity", 0.55 * night);
}

/** Gece/gündüz bina rengi: geceleri bazı binalar sıcak pencere ışığıyla yanar. */
export function buildingColor(night: number, base: string, top: string): unknown {
  const h = ["coalesce", ["get", "render_height"], ["get", "height"], 8];
  const normal = ["interpolate", ["linear"], h, 0, base, 60, top];
  if (night < 0.25) return normal;
  const lit = night > 0.6 ? "#f6c76b" : "#c9a45e";
  return ["case", ["<", ["%", ["floor", ["*", h, 13.7]], 5], 2], lit, normal];
}
