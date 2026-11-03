/**
 * Gerçek bina ayak izlerini üretir (bölge bazlı).
 *
 * Kaynak: Microsoft Global Building Footprints (Bing imagery, ODbL)
 * https://github.com/microsoft/GlobalMLBuildingFootprints
 *
 * Kullanım (argümansız çalıştırma Duroğlu varsayılanlarını kullanır):
 *   node scripts/build-district-buildings.mjs
 *   node scripts/build-district-buildings.mjs --district merkezms \
 *     --lat 40.9166 --lon 38.3872 --radius 3000 --prefix merkezms- --dedupe
 *
 * Kurumsal ağlarda TLS kök sertifikası Node'a tanıtılmadıysa:
 *   node --use-system-ca scripts/build-district-buildings.mjs ...
 *
 * - public/data/buildings/<district>.json  → bölgesel modüler dosya
 * - public/real_buildings.json             → haritanın okuduğu birleşik veri (eklenir)
 * - public/data/buildings/manifest.json    → kayıt + bbox bilgisi güncellenir
 *
 * --dedupe: mevcut bir binanın merkezine 6 m'den yakın yeni ayak izlerini atlar.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};

const DISTRICT = arg("district", "duroglu");
const CENTER = {
  lat: Number(arg("lat", 40.83021)),
  lon: Number(arg("lon", 38.46724)),
};
const RADIUS = Number(arg("radius", 2200));
const ID_PREFIX = arg("prefix", "duroglu-");
const DEDUPE_M = process.argv.includes("--dedupe") ? 6 : 0;
const INDEX_URL =
  "https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv";

const COLORS = [
  "#e2d9cc",
  "#d8cbb8",
  "#cdbca4",
  "#c2b19a",
  "#d5cfc2",
  "#bbae9b",
  "#b7bcc0",
  "#c8c2b6",
];

const M_PER_DEG = 111320;
const COS_LAT = Math.cos((CENTER.lat * Math.PI) / 180);

function tileXY(lon, lat, z) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  );
  return [x, y];
}

function quadkey(lon, lat, z) {
  const [x, y] = tileXY(lon, lat, z);
  let key = "";
  for (let i = z; i > 0; i--) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if (x & mask) digit += 1;
    if (y & mask) digit += 2;
    key += digit;
  }
  return key;
}

function distanceM(lat, lon) {
  const R = 6371000;
  const p = Math.PI / 180;
  const dLat = (lat - CENTER.lat) * p;
  const dLon = (lon - CENTER.lon) * p;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(CENTER.lat * p) * Math.cos(lat * p) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function ringAreaM2(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    sum += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return Math.abs(sum / 2) * M_PER_DEG * M_PER_DEG * COS_LAT;
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function floorsFor(area, dist, h) {
  const pick = h % 100;
  let floors;
  if (area < 45) floors = 1;
  else if (area < 90) floors = 2;
  else if (area < 160) floors = 2 + (pick > 55 ? 1 : 0);
  else if (area < 320) floors = 3;
  else floors = 2;
  if (area > 800) floors = 2;
  if (dist < 450) floors += 1;
  if (dist < 250 && area < 420) floors += 1;
  return Math.min(6, floors);
}

function centroid(ring) {
  let lon = 0;
  let lat = 0;
  for (const [x, y] of ring) {
    lon += x;
    lat += y;
  }
  return [lon / ring.length, lat / ring.length];
}

function distance2(a, b) {
  const dx = (a[0] - b[0]) * M_PER_DEG * COS_LAT;
  const dy = (a[1] - b[1]) * M_PER_DEG;
  return dx * dx + dy * dy;
}

/** Var olan binaların merkezlerini ızgara hücrelerine yerleştirir. */
function buildExistingGrid(features) {
  const cell = 0.0002;
  const grid = new Map();
  for (const f of features) {
    const ring = f.geometry?.coordinates?.[0];
    if (!Array.isArray(ring) || ring.length < 4) continue;
    const c = centroid(ring);
    const key = `${Math.round(c[0] / cell)}:${Math.round(c[1] / cell)}`;
    const list = grid.get(key);
    if (list) list.push(c);
    else grid.set(key, [c]);
  }
  return { grid, cell };
}

function nearExisting(grid, cell, c, limitSq) {
  if (!limitSq) return false;
  const gx = Math.round(c[0] / cell);
  const gy = Math.round(c[1] / cell);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const list = grid.get(`${gx + dx}:${gy + dy}`);
      if (!list) continue;
      for (const e of list) if (distance2(c, e) < limitSq) return true;
    }
  }
  return false;
}

async function resolvePartUrl() {
  const key = quadkey(CENTER.lon, CENTER.lat, 9);
  console.log(`Quadkey (z9): ${key}`);
  const csv = await (await fetch(INDEX_URL)).text();
  const row = csv
    .split("\n")
    .find((line) => line.startsWith(`Turkey,${key},`));
  if (!row) throw new Error(`Turkey/${key} veri parçası bulunamadı`);
  const [, , url, size] = row.split(",");
  console.log(`Parça: ${size}`);
  return url;
}

async function main() {
  const realPath = "public/real_buildings.json";
  const real = JSON.parse(readFileSync(realPath, "utf8"));
  const existing = real.features.filter(
    (f) => !String(f.properties?.id ?? "").startsWith(ID_PREFIX),
  );
  const { grid, cell } = buildExistingGrid(existing);

  const url = await resolvePartUrl();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`İndirme başarısız: ${res.status}`);
  const gz = Buffer.from(await res.arrayBuffer());
  const lines = gunzipSync(gz).toString("utf8").split("\n");

  const features = [];
  let seen = 0;
  let deduped = 0;
  for (const line of lines) {
    if (!line.trim()) continue;
    let raw;
    try {
      raw = JSON.parse(line);
    } catch {
      continue;
    }
    const ring = raw.geometry?.coordinates?.[0];
    if (!Array.isArray(ring) || ring.length < 4) continue;
    seen++;

    const c = centroid(ring);
    const dist = distanceM(c[1], c[0]);
    if (dist > RADIUS) continue;

    const area = ringAreaM2(ring);
    if (area < 6 || area > 20000) continue;
    if (nearExisting(grid, cell, c, DEDUPE_M * DEDUPE_M)) {
      deduped++;
      continue;
    }

    const id = `${ID_PREFIX}${features.length}`;
    const h = hash(ring[0][0].toFixed(6) + ring[0][1].toFixed(6));
    const floors = floorsFor(area, dist, h);
    const height = Math.round((floors * 3.1 + 0.8) * 10) / 10;
    const color = COLORS[h % COLORS.length];
    const coords = ring.map(([x, y]) => [
      Math.round(x * 1e7) / 1e7,
      Math.round(y * 1e7) / 1e7,
    ]);

    features.push({
      type: "Feature",
      properties: {
        id,
        name: "",
        height,
        min_height: 0,
        color,
        district: DISTRICT,
      },
      geometry: { type: "Polygon", coordinates: [coords] },
    });
  }

  if (features.length === 0) throw new Error("Ayar aralığında bina bulunamadı");

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const f of features) {
    for (const [lon, lat] of f.geometry.coordinates[0]) {
      minLon = Math.min(minLon, lon);
      minLat = Math.min(minLat, lat);
      maxLon = Math.max(maxLon, lon);
      maxLat = Math.max(maxLat, lat);
    }
  }
  const bbox = [
    Math.round(minLon * 1e7) / 1e7,
    Math.round(minLat * 1e7) / 1e7,
    Math.round(maxLon * 1e7) / 1e7,
    Math.round(maxLat * 1e7) / 1e7,
  ];

  const districtPath = `public/data/buildings/${DISTRICT}.json`;
  writeFileSync(
    districtPath,
    JSON.stringify({ type: "FeatureCollection", district: DISTRICT, features }),
  );

  real.features = existing;
  real.features.push(...features);
  writeFileSync(realPath, JSON.stringify(real));

  const manifestPath = "public/data/buildings/manifest.json";
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const [key, entry] of Object.entries(manifest)) {
    if (key === DISTRICT) continue;
    const data = JSON.parse(readFileSync(`public${entry.file}`, "utf8"));
    const b = [Infinity, Infinity, -Infinity, -Infinity];
    for (const f of data.features) {
      for (const [lon, lat] of f.geometry.coordinates[0]) {
        b[0] = Math.min(b[0], lon);
        b[1] = Math.min(b[1], lat);
        b[2] = Math.max(b[2], lon);
        b[3] = Math.max(b[3], lat);
      }
    }
    entry.bbox = b.map((v) => Math.round(v * 1e7) / 1e7);
  }
  manifest[DISTRICT] = {
    count: features.length,
    file: `/data/buildings/${DISTRICT}.json`,
    bbox,
  };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

  console.log(
    `Tarandı: ${seen} · ${DISTRICT}: ${features.length} bina · çakışan atlandı: ${deduped} · bbox: ${bbox.join(", ")}`,
  );
  console.log(`Toplam real_buildings.json: ${real.features.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
