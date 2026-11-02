import { BOUNDS } from "../config/giresun";

/**
 * OpenStreetMap Nominatim ile arama.
 * Kullanım politikası gereği düşük hızda, yalnızca haritada gösterim için.
 * Kullanıcının yazdığı metin analitik olarak toplanmaz.
 */
export interface SearchResult {
  display_name: string;
  name: string;
  lon: number;
  lat: number;
  type: string;
}

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

export async function searchPlaces(
  query: string,
  lang: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const [[minLon, minLat], [maxLon, maxLat]] = BOUNDS;
  const params = new URLSearchParams({
    q,
    format: "jsonv2",
    addressdetails: "0",
    limit: "8",
    "accept-language": lang,
    bounded: "1",
    viewbox: `${minLon},${maxLat},${maxLon},${minLat}`,
  });
  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const data = (await res.json()) as Array<Record<string, string>>;
  return data.map((d) => ({
    display_name: d.display_name ?? "",
    name: d.name ?? d.display_name ?? "",
    lon: Number(d.lon),
    lat: Number(d.lat),
    type: d.type ?? "",
  }));
}
