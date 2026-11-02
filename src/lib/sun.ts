/**
 * Basit güneş pozisyonu hesabı (gündüz/gece aydınlatması için).
 * Giresun enlemi ~40.9°K.
 */
export function sunElevation(lat: number, lon: number, date: Date): number {
  // Julian günü
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = (date.getTime() - start) / 86400000;
  // Düklem (declination) — yaklaşık
  const decl = 23.44 * Math.sin(((360 / 365.24) * (dayOfYear - 81)) * (Math.PI / 180));
  // Yerel saat (UTC+3 Türkiye)
  const utcHours =
    date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const localSolar = utcHours + lon / 15 + 3 - 0; // Türkiye UTC+3
  const hourAngle = (localSolar - 12) * 15; // derece
  const latR = (lat * Math.PI) / 180;
  const declR = (decl * Math.PI) / 180;
  const haR = (hourAngle * Math.PI) / 180;
  const sinEl =
    Math.sin(latR) * Math.sin(declR) + Math.cos(latR) * Math.cos(declR) * Math.cos(haR);
  return (Math.asin(Math.max(-1, Math.min(1, sinEl))) * 180) / Math.PI;
}

/** 0 (gece) → 1 (tam gündüz) arasında yumuşak geçiş. */
export function daylight(lat: number, lon: number, date: Date): number {
  const el = sunElevation(lat, lon, date);
  // -6° ile +12° arasında geçiş (med/gündüz sınırları)
  if (el <= -6) return 0;
  if (el >= 12) return 1;
  return (el + 6) / 18;
}

/** İki renk arasında interpolasyon (hex). */
export function lerpColor(a: string, b: string, t: number): string {
  const pa = hex(a);
  const pb = hex(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function hex(h: string): number[] {
  const s = h.replace("#", "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}
