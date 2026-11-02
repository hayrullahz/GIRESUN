import type { Map as MLMap } from "maplibre-gl";

/**
 * Animasyonlu deniz.
 *
 * MapLibre her kareyi yeniden çizdiğinde pahalı olabileceğinden, dalga hareketi
 * önceden üretilmiş seamless (dikişsiz) dalga dokularının fill-pattern ile
 * değiştirilmesiyle elde edilir. Düşük fps'te dönen bu döngü hem akıcı hem ucuzdur.
 *
 * Dokular periyodik sinüs toplamlarıyla üretilir; bu sayede karo kenarlarında
 * dikiş görünmez.
 */

const SIZE = 128;
const FRAMES = 6;

/** Periyodik dalga alanı — kendi içinde tekrar eder (dikişsiz). */
function waveField(
  u: number,
  v: number,
  phase: number,
): number {
  const TAU = Math.PI * 2;
  // Farklı frekans/fazda sinüsler → doğal dalga deseni
  let w = 0;
  w += Math.sin(TAU * (2 * u) + phase) * 0.5;
  w += Math.sin(TAU * (3 * v) - phase * 0.8) * 0.35;
  w += Math.sin(TAU * (2 * u + 3 * v) + phase * 1.3) * 0.2;
  w += Math.sin(TAU * (5 * u - 2 * v) - phase * 0.5) * 0.12;
  return w / 1.17; // normalize ~[-1,1]
}

function makeFrame(phase: number): ImageData {
  const c = document.createElement("canvas");
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(SIZE, SIZE);
  const d = img.data;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE;
      const v = y / SIZE;
      const w = waveField(u, v, phase);
      // Parlak tepe noktaları (köpük/parlama), taban şeffaf
      const crest = Math.pow(Math.max(0, w), 2.2);
      const i = (y * SIZE + x) * 4;
      d[i] = 180;
      d[i + 1] = 226;
      d[i + 2] = 255;
      d[i + 3] = Math.round(crest * 200);
    }
  }
  return img;
}

export class AnimatedSea {
  private index = 0;
  private timer: number | null = null;
  private map: MLMap | null = null;
  private fps = 8;
  private enabled = true;

  init(map: MLMap) {
    this.map = map;
    // maplibre addImage, "width/height/data" (ImageData biçimi) düz nesneleri güvenle kabul eder;
    // ImageData/ImageBitmap ayrı yollara girebildiği için düz nesne olarak veriyoruz.
    const addImage = map.addImage.bind(map) as (
      id: string,
      image: { width: number; height: number; data: Uint8ClampedArray },
      options?: { pixelRatio?: number; sdf?: boolean },
    ) => void;
    for (let i = 0; i < FRAMES; i++) {
      const img = makeFrame((i / FRAMES) * Math.PI * 2);
      addImage(
        `wave-${i}`,
        { width: img.width, height: img.height, data: img.data },
        { pixelRatio: 1 },
      );
    }
    this.start();
  }

  start() {
    if (this.timer !== null || !this.map) return;
    this.timer = window.setInterval(() => this.tick(), 1000 / this.fps);
  }

  stop() {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick() {
    if (!this.map || !this.enabled) return;
    this.index = (this.index + 1) % FRAMES;
    if (this.map.getLayer("water-waves")) {
      this.map.setPaintProperty("water-waves", "fill-pattern", `wave-${this.index}`);
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.map?.getLayer("water-waves")) {
      this.map.setPaintProperty("water-waves", "fill-opacity", on ? 0.5 : 0);
    }
    if (on) this.start();
    else this.stop();
  }
}

export const sea = new AnimatedSea();
