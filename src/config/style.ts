import type { StyleSpecification } from "maplibre-gl";
import { GIRESUN_LAND_BORDER, GIRESUN_MASK } from "./giresunBoundary";

/**
 * OpenFreeMap (OpenMapTiles şeması) vektör karoları + AWS terrarium DEM arazi.
 * Hiçbir API anahtarı gerekmez.
 *
 * Katman sırası alttan üste doğrudur; izometrik bakışta derinlik hissi için
 * arazi kabartması, 3B binalar ve animasyonlu deniz birlikte kullanılır.
 */
const PLANET = "https://tiles.openfreemap.org/planet/20261025_080012_pt/{z}/{x}/{y}.pbf";
const TERRARIUM = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
// HGM Atlas (Harita Genel Müdürlüğü) resmi uçak ortofotosu — kristal netlik
const HGM_AERIAL =
  "/hgm-tiles/webservis/ortofoto/{z}/{x}/{y}.jpg?apikey=rXKdDZxXgj2hgFspEC4BKG4HMittQ0Y6";

export const SOURCES = {
  planet: {
    type: "vector" as const,
    tiles: [PLANET],
    maxzoom: 14,
    attribution:
      'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Tiles <a href="https://openfreemap.org/">OpenFreeMap</a>',
  },
  terrain: {
    type: "raster-dem" as const,
    tiles: [TERRARIUM],
    tileSize: 256,
    encoding: "terrarium" as const,
    maxzoom: 15,
    attribution:
      'Elevation: <a href="https://registry.opendata.aws/terrain-tiles/">AWS Terrain Tiles</a> (public domain)',
  },
  aerial: {
    type: "raster" as const,
    tiles: [HGM_AERIAL],
    tileSize: 256,
    maxzoom: 19,
    attribution:
      'Ortofoto: <a href="https://atlas.harita.gov.tr/">Harita Genel Müdürlüğü (HGM)</a>',
  },
  /** Gerçek OSM ve HGM ayak izlerinden çıkarılmış doğrulanmış binalar */
  realBuildings: {
    type: "geojson" as const,
    data: "/real_buildings.json",
  },
  /** Landmark işaretleri — elle hazırlanmış GeoJSON */
  landmarks: {
    type: "geojson" as const,
    data: { type: "FeatureCollection" as const, features: [] },
  },
  /** Giresun resmi kara sınırı GeoJSON (Deniz sınırları kaldırıldı) */
  giresunLandBorder: {
    type: "geojson" as const,
    data: GIRESUN_LAND_BORDER,
  },
  /** Giresun dışını karartan ters maske GeoJSON (Deniz koridoru açık) */
  giresunMask: {
    type: "geojson" as const,
    data: GIRESUN_MASK,
  },
};

export function buildStyle(): StyleSpecification {
  return {
    version: 8,
    name: "Giresun Isometric",
    glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
    sources: SOURCES as unknown as StyleSpecification["sources"],
    layers: [
      // ——— Zemin ———
      {
        id: "background",
        type: "background",
        paint: { "background-color": "#20303a" },
      },
      {
        id: "landcover-forest",
        type: "fill",
        source: "planet",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "wood"],
        paint: { "fill-color": "#1f4d34", "fill-opacity": 0.85 },
      },
      {
        id: "landcover-grass",
        type: "fill",
        source: "planet",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "grass"],
        paint: { "fill-color": "#2f5d3a", "fill-opacity": 0.6 },
      },
      {
        id: "landcover-rock",
        type: "fill",
        source: "planet",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "rock"],
        paint: { "fill-color": "#3b3f42", "fill-opacity": 0.7 },
      },
      {
        id: "landcover-sand",
        type: "fill",
        source: "planet",
        "source-layer": "landcover",
        filter: ["==", ["get", "class"], "sand"],
        paint: { "fill-color": "#6b5a3a", "fill-opacity": 0.55 },
      },
      {
        id: "landuse-residential",
        type: "fill",
        source: "planet",
        "source-layer": "landuse",
        minzoom: 11,
        filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood"]]],
        paint: { "fill-color": "#33414a", "fill-opacity": 0.4 },
      },
      {
        id: "park",
        type: "fill",
        source: "planet",
        "source-layer": "park",
        paint: { "fill-color": "#245c37", "fill-opacity": 0.5 },
      },

      // ——— Su ———
      {
        id: "water",
        type: "fill",
        source: "planet",
        "source-layer": "water",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: { "fill-color": "#0d3b52", "fill-opacity": 1 },
      },
      // Animasyonlu dalga katmanı (uzaklaştıkça şeffaflaşıp küçülen perspektif ayarı)
      {
        id: "water-waves",
        type: "fill",
        source: "planet",
        "source-layer": "water",
        filter: ["!=", ["get", "brunnel"], "tunnel"],
        paint: {
          "fill-pattern": "wave-0",
          "fill-opacity": [
            "interpolate",
            ["linear"],
            ["zoom"],
            8, 0.05,
            11, 0.22,
            14, 0.48,
            17, 0.70,
          ],
          "fill-translate": [0, 0],
        },
      },
      {
        id: "waterway",
        type: "line",
        source: "planet",
        "source-layer": "waterway",
        minzoom: 9,
        layout: { "line-cap": "round" },
        paint: {
          "line-color": "#1d6f8f",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 0.8, 14, 2.2, 18, 4],
        },
      },

      // ——— Hava Fotoğrafı (HGM Atlas Ortofoto — Ön Tanımlı Açık) ———
      {
        id: "aerial",
        type: "raster",
        source: "aerial",
        paint: {
          "raster-opacity": 0.95,
          "raster-fade-duration": 200,
          "raster-brightness-max": 1.0,
          "raster-contrast": 0.08,
        },
      },

      // ——— Arazi kabartması (gölge/derinlik — sis efekti yapmayacak şekilde ayarlandı) ———
      {
        id: "hillshade",
        type: "hillshade",
        source: "terrain",
        paint: {
          "hillshade-exaggeration": 0.28,
          "hillshade-shadow-color": "#1e293b",
          "hillshade-highlight-color": "#ffffff",
          "hillshade-accent-color": "#334155",
        },
      },

      // ——— Yollar ———
      {
        id: "road-minor",
        type: "line",
        source: "planet",
        "source-layer": "transportation",
        minzoom: 12,
        filter: ["in", ["get", "class"], ["literal", ["minor", "service", "track"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#4a5b64", "line-width": 1.1 },
      },
      {
        id: "road-major",
        type: "line",
        source: "planet",
        "source-layer": "transportation",
        minzoom: 9,
        filter: ["in", ["get", "class"], ["literal", ["major", "primary", "secondary", "tertiary"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#7c8a92",
          "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1, 14, 2.4, 18, 5],
        },
      },
      {
        id: "road-highway",
        type: "line",
        source: "planet",
        "source-layer": "transportation",
        filter: ["in", ["get", "class"], ["literal", ["trunk", "motorway"]]],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#c98a3a",
          "line-width": ["interpolate", ["linear"], ["zoom"], 6, 1.2, 12, 2.8, 18, 6.5],
        },
      },

      // ——— Binalar (3B) — Vektör Karo ve Gerçek Ayak İzi Katmanları ———
      {
        id: "building-3d",
        type: "fill-extrusion",
        source: "planet",
        "source-layer": "building",
        minzoom: 13,
        paint: {
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["coalesce", ["get", "render_height"], ["get", "height"], 8],
            0, "#8a8f93",
            12, "#9aa0a4",
            30, "#b0b6ba",
            60, "#c4cace",
          ],
          "fill-extrusion-height": [
            "coalesce",
            ["get", "render_height"],
            ["get", "height"],
            8,
          ],
          "fill-extrusion-base": [
            "coalesce",
            ["get", "render_min_height"], ["get", "min_height"], 0,
          ],
          "fill-extrusion-opacity": 0.92,
        },
      },
      {
        id: "real-building-3d",
        type: "fill-extrusion",
        source: "realBuildings",
        minzoom: 12,
        paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["get", "height"],
          "fill-extrusion-base": ["get", "min_height"],
          "fill-extrusion-opacity": 0.92,
        },
      },

      // ——— Giresun İl Sınırları Dışı Yumuşak Odak Maskesi (Apple Pasif Odak) ———
      {
        id: "giresun-outside-dark",
        type: "fill",
        source: "giresunMask",
        paint: {
          "fill-color": "#020617",
          "fill-opacity": 0.45,
        },
      },
      {
        id: "giresun-border-glow",
        type: "line",
        source: "giresunLandBorder",
        paint: {
          "line-color": "#60a5fa",
          "line-width": 3.5,
          "line-blur": 2.5,
          "line-opacity": 0.35,
        },
      },
      {
        id: "giresun-border-line",
        type: "line",
        source: "giresunLandBorder",
        paint: {
          "line-color": "#93c5fd",
          "line-width": 1.5,
          "line-opacity": 0.75,
        },
      },

      // ——— Sınırlar ———
      {
        id: "boundary-district",
        type: "line",
        source: "planet",
        "source-layer": "boundary",
        filter: ["all", ["==", ["get", "admin_level"], 6], ["==", ["get", "maritime"], 0]],
        paint: {
          "line-color": "#6fd0e8",
          "line-width": 1.1,
          "line-opacity": 0.55,
          "line-dasharray": [2, 2],
        },
      },

      // ——— Etiketler ———
      {
        id: "place-city",
        type: "symbol",
        source: "planet",
        "source-layer": "place",
        minzoom: 10,
        maxzoom: 15,
        filter: ["in", ["get", "class"], ["literal", ["city", "town"]]],
        layout: {
          "text-field": ["coalesce", ["get", "name:tr"], ["get", "name"]],
          "text-font": ["Noto Sans Bold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 10, 12, 14, 18],
          "text-anchor": "top",
          "text-offset": [0, 1],
        },
        paint: {
          "text-color": "#f4f1ea",
          "text-halo-color": "#0b1418",
          "text-halo-width": 1.4,
        },
      },
      {
        id: "place-village",
        type: "symbol",
        source: "planet",
        "source-layer": "place",
        minzoom: 13,
        filter: ["in", ["get", "class"], ["literal", ["village", "suburb", "hamlet"]]],
        layout: {
          "text-field": ["coalesce", ["get", "name:tr"], ["get", "name"]],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
        },
        paint: { "text-color": "#cfd6d9", "text-halo-color": "#0b1418", "text-halo-width": 1.2 },
      },

      // ——— Landmark işaretleri (GeoJSON — 3D harita odağını kapatmamak için varsayılan gizli) ———
      {
        id: "landmark-label",
        type: "symbol",
        source: "landmarks",
        minzoom: 14,
        layout: {
          "visibility": "none",
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Bold"],
          "text-size": 11,
          "text-anchor": "top",
          "text-offset": [0, 1.2],
          "text-allow-overlap": false,
          "symbol-sort-key": ["get", "sort"],
        },
        paint: {
          "text-color": "#ffe9a8",
          "text-halo-color": "#0b1418",
          "text-halo-width": 1.5,
        },
      },
    ],
  };
}

export const OSM_ATTRIBUTION =
  'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors · Tiles <a href="https://openfreemap.org/">OpenFreeMap</a>';
