/**
 * Hava durumu efektleri: yağmur ve kar.
 * Haritanın üzerinde 2D canvas parçacık katmanı; GPU dostu ve hafif.
 */
export type WeatherMode = "clear" | "rain" | "snow";

interface Drop {
  x: number;
  y: number;
  z: number; // derinlik 0..1 → hız ve boyut
  len: number;
  drift: number;
}

export class Weather {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private drops: Drop[] = [];
  private raf = 0;
  private mode: WeatherMode = "clear";
  private wind = 0.6;
  private w = 0;
  private h = 0;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "weather-canvas";
    this.ctx = this.canvas.getContext("2d")!;
    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  get element() {
    return this.canvas;
  }

  private resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = this.w * dpr;
    this.canvas.height = this.h * dpr;
    this.canvas.style.width = this.w + "px";
    this.canvas.style.height = this.h + "px";
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private spawn() {
    const count = this.mode === "rain" ? 260 : 180;
    this.drops = [];
    for (let i = 0; i < count; i++) {
      const z = Math.random();
      this.drops.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        z,
        len: this.mode === "rain" ? 10 + z * 18 : 1.2 + z * 2.2,
        drift: (Math.random() - 0.5) * 0.6,
      });
    }
  }

  setMode(mode: WeatherMode) {
    this.mode = mode;
    this.canvas.style.display = mode === "clear" ? "none" : "block";
    if (mode === "clear") {
      this.stop();
      this.ctx.clearRect(0, 0, this.w, this.h);
      return;
    }
    this.spawn();
    this.start();
  }

  private start() {
    if (this.raf) return;
    const loop = () => {
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  private stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.w, this.h);
    if (this.mode === "rain") {
      ctx.strokeStyle = "rgba(174,205,225,0.42)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of this.drops) {
        const speed = 9 + d.z * 12;
        const dx = this.wind * (0.5 + d.z) * 2;
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + dx, d.y + d.len);
        d.x += dx;
        d.y += speed;
        if (d.y > this.h) {
          d.y = -d.len;
          d.x = Math.random() * this.w;
        }
        if (d.x > this.w) d.x = 0;
      }
      ctx.stroke();
    } else if (this.mode === "snow") {
      ctx.fillStyle = "rgba(238,246,255,0.9)";
      for (const d of this.drops) {
        const speed = 0.7 + d.z * 1.6;
        d.y += speed;
        d.x += Math.sin(d.y * 0.01 + d.drift * 10) * 0.7 + this.wind * 0.2;
        if (d.y > this.h) {
          d.y = -4;
          d.x = Math.random() * this.w;
        }
        if (d.x > this.w) d.x = 0;
        if (d.x < 0) d.x = this.w;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.len, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export const weather = new Weather();
