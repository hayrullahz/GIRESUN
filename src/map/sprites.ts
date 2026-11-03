import type { Map as MLMap } from "maplibre-gl";

/**
 * Trafik ve yaya sprite'ları — canvas ile üretilen 3B görünümlü ikonlar.
 * Sprite'lar kuzeye bakar; harita yönüne göre `icon-rotate` ile döndürülür.
 */

const S = 192; // fiziksel piksel (pixelRatio 2 → 96 mantıksal px)
const P = 2;

type ImageDataLike = { width: number; height: number; data: Uint8ClampedArray };

function makeSprite(draw: (ctx: CanvasRenderingContext2D) => void): ImageDataLike {
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(P, P);
  draw(ctx);
  const img = ctx.getImageData(0, 0, S, S);
  return { width: img.width, height: img.height, data: img.data };
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  const g = ctx.createRadialGradient(x, y, 1, x, y, Math.max(rx, ry));
  g.addColorStop(0, "rgba(0,0,0,0.4)");
  g.addColorStop(0.55, "rgba(0,0,0,0.2)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function bodyGradient(ctx: CanvasRenderingContext2D, color: string, y0: number, y1: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, shade(color, 1.24));
  g.addColorStop(0.42, color);
  g.addColorStop(1, shade(color, 0.7));
  return g;
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) * f);
  const g = clamp(((n >> 8) & 255) * f);
  const b = clamp((n & 255) * f);
  return `rgb(${r},${g},${b})`;
}

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glass(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = "#142433";
  ctx.fill();
  ctx.strokeStyle = "rgba(170,215,240,0.28)";
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Cam parlaması
  ctx.fillStyle = "rgba(175,220,248,0.22)";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.16, y + h * 0.12);
  ctx.lineTo(x + w * 0.42, y + h * 0.12);
  ctx.lineTo(x + w * 0.26, y + h * 0.88);
  ctx.lineTo(x + w * 0.06, y + h * 0.88);
  ctx.closePath();
  ctx.fill();
}

function carBody(ctx: CanvasRenderingContext2D, color: string) {
  ctx.beginPath();
  ctx.moveTo(35.5, 15.5);
  ctx.quadraticCurveTo(48, 12.4, 60.5, 15.5);
  ctx.quadraticCurveTo(65.2, 17.6, 66, 24);
  ctx.lineTo(66.4, 72);
  ctx.quadraticCurveTo(66.4, 80.4, 60.8, 82);
  ctx.lineTo(35.2, 82);
  ctx.quadraticCurveTo(29.6, 80.4, 29.6, 72);
  ctx.lineTo(30, 24);
  ctx.quadraticCurveTo(30.8, 17.6, 35.5, 15.5);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, 15, 82);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,12,17,0.55)";
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Kaput
  ctx.fillStyle = shade(color, 1.16);
  rr(ctx, 34.4, 17.4, 27.2, 11.6, 4);
  ctx.fill();
  // Ön tampon
  ctx.fillStyle = shade(color, 0.72);
  rr(ctx, 33.6, 15.6, 28.8, 3.4, 1.7);
  ctx.fill();
  // Ön cam
  glass(ctx, 35.2, 29.6, 25.6, 13, 3.2);
  // Tavan
  ctx.fillStyle = bodyGradient(ctx, shade(color, 1.06), 42, 64);
  rr(ctx, 34.6, 43, 26.8, 21, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(35.6, 45.5);
  ctx.lineTo(60.4, 45.5);
  ctx.stroke();
  // Sunroof
  ctx.fillStyle = "rgba(16,30,44,0.82)";
  rr(ctx, 38.6, 46.6, 18.8, 7.4, 2);
  ctx.fill();
  // Arka cam
  glass(ctx, 35.8, 63.6, 24.4, 10.4, 3);
  // Bagaj
  ctx.fillStyle = shade(color, 0.9);
  rr(ctx, 33.4, 73.4, 29.2, 6.8, 3);
  ctx.fill();

  // Aynalar
  ctx.fillStyle = shade(color, 0.8);
  rr(ctx, 26.4, 28.6, 4.2, 3.2, 1.5);
  ctx.fill();
  rr(ctx, 65.4, 28.6, 4.2, 3.2, 1.5);
  ctx.fill();

  // Farlar / stoplar
  ctx.fillStyle = "#fff6d5";
  rr(ctx, 35.4, 15.8, 8.6, 3, 1.4);
  ctx.fill();
  rr(ctx, 52, 15.8, 8.6, 3, 1.4);
  ctx.fill();
  ctx.fillStyle = "#ff3b30";
  rr(ctx, 34.2, 78.6, 8.2, 2.8, 1.2);
  ctx.fill();
  rr(ctx, 53.6, 78.6, 8.2, 2.8, 1.2);
  ctx.fill();
}

function wheels(
  ctx: CanvasRenderingContext2D,
  xs: number[],
  ys: number[],
  w = 5.6,
  h = 11.4,
) {
  for (const x of xs) {
    for (const y of ys) {
      ctx.fillStyle = "#0d1218";
      rr(ctx, x, y, w, h, 2.4);
      ctx.fill();
      ctx.fillStyle = "#39434e";
      rr(ctx, x + w * 0.28, y + h * 0.32, w * 0.44, h * 0.36, 1.4);
      ctx.fill();
    }
  }
}

function drawCar(ctx: CanvasRenderingContext2D, color: string) {
  shadow(ctx, 48, 83.5, 21, 6.6);
  wheels(ctx, [26.6, 63.8], [34.4, 62.4]);
  carBody(ctx, color);
}

function drawBus(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 48, 89, 23, 6.6);
  wheels(ctx, [25.6, 64.4], [23.4, 66], 6, 12);
  ctx.beginPath();
  rr(ctx, 29.4, 5.6, 37.2, 82.6, 6.4);
  ctx.fillStyle = bodyGradient(ctx, "#ffc233", 5, 88);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,12,17,0.55)";
  ctx.lineWidth = 0.9;
  ctx.stroke();

  // Ön cam
  glass(ctx, 31.4, 8.6, 33.2, 9.6, 3.6);
  // Yan cam bantları
  ctx.fillStyle = "#16283a";
  rr(ctx, 30.4, 24, 5.6, 48, 2.4);
  ctx.fill();
  rr(ctx, 60, 24, 5.6, 48, 2.4);
  ctx.fill();
  ctx.strokeStyle = "rgba(175,220,248,0.2)";
  ctx.lineWidth = 0.6;
  for (let y = 29; y < 71; y += 5.6) {
    ctx.beginPath();
    ctx.moveTo(30.8, y);
    ctx.lineTo(35.6, y);
    ctx.moveTo(60.4, y);
    ctx.lineTo(65.2, y);
    ctx.stroke();
  }
  // Tavan panelleri
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(40, 9.4);
  ctx.lineTo(39, 84);
  ctx.moveTo(56, 9.4);
  ctx.lineTo(57, 84);
  ctx.stroke();
  // Arka cam
  glass(ctx, 32, 76.4, 32, 8.4, 3);
  // Farlar / stoplar
  ctx.fillStyle = "#fff6d5";
  rr(ctx, 31.6, 6.2, 8, 2.8, 1.2);
  ctx.fill();
  rr(ctx, 56.4, 6.2, 8, 2.8, 1.2);
  ctx.fill();
  ctx.fillStyle = "#ff3b30";
  rr(ctx, 31.8, 85.2, 7.6, 2.6, 1.2);
  ctx.fill();
  rr(ctx, 56.6, 85.2, 7.6, 2.6, 1.2);
  ctx.fill();
}

function drawTruck(ctx: CanvasRenderingContext2D) {
  shadow(ctx, 48, 86, 23, 7);
  wheels(ctx, [25.8, 64.4], [37, 67], 6, 11.6);

  // Kargo kasası
  ctx.beginPath();
  rr(ctx, 29.4, 34, 37.2, 50.4, 3);
  ctx.fillStyle = bodyGradient(ctx, "#d7dde2", 34, 84);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,12,17,0.5)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.strokeStyle = "rgba(90,105,118,0.4)";
  ctx.lineWidth = 0.7;
  for (let y = 40; y < 84; y += 6) {
    ctx.beginPath();
    ctx.moveTo(30.6, y);
    ctx.lineTo(65.4, y);
    ctx.stroke();
  }
  // Arka kapılar
  ctx.strokeStyle = "rgba(50,64,76,0.7)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(48, 76);
  ctx.lineTo(48, 84);
  ctx.stroke();

  // Kabin
  ctx.beginPath();
  rr(ctx, 32.4, 8.4, 31.2, 23.4, 4.4);
  ctx.fillStyle = bodyGradient(ctx, "#2f6fa8", 8, 32);
  ctx.fill();
  ctx.stroke();
  glass(ctx, 34.4, 11.4, 27.2, 8.6, 3);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  rr(ctx, 36, 9.2, 24, 2, 1);
  ctx.fill();
  // Farlar / stoplar
  ctx.fillStyle = "#fff6d5";
  rr(ctx, 34, 9, 7.4, 2.6, 1.2);
  ctx.fill();
  rr(ctx, 54.6, 9, 7.4, 2.6, 1.2);
  ctx.fill();
  ctx.fillStyle = "#ff3b30";
  rr(ctx, 31.4, 81.4, 7.2, 2.6, 1.2);
  ctx.fill();
  rr(ctx, 57.4, 81.4, 7.2, 2.6, 1.2);
  ctx.fill();
}

function hull(
  ctx: CanvasRenderingContext2D,
  color: string,
  pts: [number, number][],
) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 3) {
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
  }
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, color, 8, 84);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,12,17,0.5)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
}

function drawBoat(ctx: CanvasRenderingContext2D, hullColor: string, deck: string) {
  // Su izi (arkada)
  const wake = ctx.createLinearGradient(0, 62, 0, 92);
  wake.addColorStop(0, "rgba(255,255,255,0.4)");
  wake.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = wake;
  ctx.beginPath();
  ctx.moveTo(38, 72);
  ctx.lineTo(58, 72);
  ctx.lineTo(66, 92);
  ctx.lineTo(30, 92);
  ctx.closePath();
  ctx.fill();

  shadow(ctx, 48, 72, 16, 5);
  hull(ctx, hullColor, [
    [48, 7],
    [70, 30],
    [71, 58],
    [66, 80],
    [48, 84],
    [30, 80],
    [25, 58],
    [26, 30],
    [48, 7],
  ]);
  // Güverte
  ctx.beginPath();
  rr(ctx, 38, 36, 20, 26, 3);
  ctx.fillStyle = bodyGradient(ctx, deck, 36, 62);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,12,17,0.45)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
  glass(ctx, 40, 39, 16, 8, 2.4);
  // Pruva ışığı
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.arc(48, 13, 2, 0, Math.PI * 2);
  ctx.fill();
  // Sancak/iskelele ışıkları
  ctx.fillStyle = "#ff3b30";
  ctx.beginPath();
  ctx.arc(31.4, 40, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#34c759";
  ctx.beginPath();
  ctx.arc(64.6, 40, 1.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawFerry(ctx: CanvasRenderingContext2D) {
  const wake = ctx.createLinearGradient(0, 64, 0, 94);
  wake.addColorStop(0, "rgba(255,255,255,0.36)");
  wake.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = wake;
  ctx.beginPath();
  ctx.moveTo(34, 76);
  ctx.lineTo(62, 76);
  ctx.lineTo(72, 94);
  ctx.lineTo(24, 94);
  ctx.closePath();
  ctx.fill();

  shadow(ctx, 48, 76, 19, 5.6);
  hull(ctx, "#ff8c42", [
    [48, 6],
    [72, 28],
    [73, 60],
    [68, 82],
    [48, 87],
    [28, 82],
    [23, 60],
    [24, 28],
    [48, 6],
  ]);

  // İki katlı beyaz üst yapı
  ctx.beginPath();
  rr(ctx, 36, 28, 24, 40, 4);
  ctx.fillStyle = bodyGradient(ctx, "#f4f7f8", 28, 68);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,12,17,0.5)";
  ctx.lineWidth = 0.9;
  ctx.stroke();
  glass(ctx, 38.4, 32, 19.2, 7, 2.2);
  glass(ctx, 38.4, 44, 19.2, 7, 2.2);
  // Baca
  ctx.fillStyle = "#d94a3d";
  rr(ctx, 44, 23, 8, 5, 1.6);
  ctx.fill();
  // Pruva ışığı
  ctx.fillStyle = "#fff3c4";
  ctx.beginPath();
  ctx.arc(48, 11, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPerson(
  ctx: CanvasRenderingContext2D,
  jacket: string,
  skin: string,
  hair: string,
  phase: 0 | 1,
) {
  shadow(ctx, 48, 84, 9, 3.4);

  const fwd = phase === 0;

  // Bacaklar
  ctx.strokeStyle = "#2b3542";
  ctx.lineWidth = 6.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(45, 55);
  ctx.lineTo(fwd ? 40.5 : 46.5, fwd ? 79 : 77);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(51, 55);
  ctx.lineTo(fwd ? 55.5 : 49, fwd ? 77 : 79);
  ctx.stroke();

  // Ayakkabılar
  ctx.fillStyle = "#141b22";
  rr(ctx, fwd ? 37.2 : 43.6, fwd ? 77.6 : 75.6, 7.4, 4.2, 2);
  ctx.fill();
  rr(ctx, fwd ? 52.4 : 46, fwd ? 75.6 : 77.6, 7.4, 4.2, 2);
  ctx.fill();

  // Gövde (mont)
  ctx.beginPath();
  ctx.moveTo(40, 31.6);
  ctx.quadraticCurveTo(48, 27.8, 56, 31.6);
  ctx.quadraticCurveTo(58.4, 34, 57.2, 39);
  ctx.lineTo(55.8, 55);
  ctx.quadraticCurveTo(48, 58, 40.2, 55);
  ctx.lineTo(38.8, 39);
  ctx.quadraticCurveTo(37.6, 34, 40, 31.6);
  ctx.closePath();
  ctx.fillStyle = bodyGradient(ctx, jacket, 29, 57);
  ctx.fill();
  ctx.strokeStyle = "rgba(8,12,17,0.45)";
  ctx.lineWidth = 0.7;
  ctx.stroke();
  // Fermuar
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(48, 32.6);
  ctx.lineTo(48, 53);
  ctx.stroke();

  // Kollar (yürüyüş salınımı)
  ctx.strokeStyle = shade(jacket, 0.84);
  ctx.lineWidth = 4.6;
  ctx.beginPath();
  ctx.moveTo(41, 33.6);
  ctx.lineTo(fwd ? 36.8 : 39.6, fwd ? 41.4 : 47);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(55, 33.6);
  ctx.lineTo(fwd ? 57.2 : 56.4, fwd ? 47 : 41.4);
  ctx.stroke();
  // Eller
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(fwd ? 36.4 : 39.4, fwd ? 42.6 : 48.2, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(fwd ? 57.6 : 56.8, fwd ? 48.2 : 42.6, 2.4, 0, Math.PI * 2);
  ctx.fill();

  // Boyun
  ctx.fillStyle = shade(skin, 0.86);
  rr(ctx, 45.2, 27, 5.6, 5, 2.2);
  ctx.fill();

  // Baş
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(48, 21, 6.6, 0, Math.PI * 2);
  ctx.fill();
  // Saç
  ctx.fillStyle = hair;
  ctx.beginPath();
  ctx.arc(48, 19.8, 6.7, Math.PI * 1.02, Math.PI * 1.98);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(48, 17.4, 6.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Kulaklar
  ctx.fillStyle = shade(skin, 0.92);
  ctx.beginPath();
  ctx.arc(41.4, 21.6, 1.5, 0, Math.PI * 2);
  ctx.arc(54.6, 21.6, 1.5, 0, Math.PI * 2);
  ctx.fill();
  // Omuz vurgusu
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(41, 32.6);
  ctx.quadraticCurveTo(48, 29.6, 55, 32.6);
  ctx.stroke();
}

const CAR_COLORS = ["#c62828", "#1e5f8f", "#2f7d6d", "#d9dde1", "#30343a", "#8c6b3f"];
const JACKETS = ["#2f6fb5", "#c33f3a", "#2f8f57", "#7c5bb0"];
const SKINS = ["#e0b08a", "#c98f63", "#8f6144"];
const HAIRS = ["#2a1d16", "#4a3325", "#141414"];

export interface TrafficSprites {
  cars: string[];
  bus: string;
  truck: string;
  boat: string;
  ferry: string;
  /** Her yaya için [adım A, adım B] kare çifti. */
  people: [string, string][];
}

export function addTrafficSprites(map: MLMap): TrafficSprites {
  const add = (id: string, draw: (ctx: CanvasRenderingContext2D) => void) => {
    if (!map.hasImage(id)) {
      map.addImage(id, makeSprite(draw) as never, { pixelRatio: P });
    }
  };

  const cars = CAR_COLORS.map((c, i) => {
    const id = `veh-car-${i}`;
    add(id, (ctx) => drawCar(ctx, c));
    return id;
  });
  add("veh-bus", drawBus);
  add("veh-truck", drawTruck);
  add("veh-boat", (ctx) => drawBoat(ctx, "#f4f7f8", "#2a9d8f"));
  add("veh-ferry", drawFerry);

  const people = JACKETS.map((j, i) => {
    const a = `ped-${i}a`;
    const b = `ped-${i}b`;
    const skin = SKINS[i % SKINS.length];
    const hair = HAIRS[i % HAIRS.length];
    add(a, (ctx) => drawPerson(ctx, j, skin, hair, 0));
    add(b, (ctx) => drawPerson(ctx, j, skin, hair, 1));
    return [a, b] as [string, string];
  });

  return { cars, bus: "veh-bus", truck: "veh-truck", boat: "veh-boat", ferry: "veh-ferry", people };
}
