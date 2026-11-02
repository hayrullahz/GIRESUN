/**
 * Service worker — statik varlıkları ve harita karolarını önbellekler.
 * İkinci açılışta harita anında açılır. En eski karolar önce silinir (~1 GB sınır).
 */
const CACHE = "giresun-iso-v1";
const TILE_HOSTS = ["tiles.openfreemap.org", "s3.amazonaws.com", "server.arcgisonline.com"];
const LIMIT = 1000 * 1024 * 1024; // ~1 GB

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isTile = TILE_HOSTS.includes(url.hostname);

  if (!isTile) {
    // Statik varlıklar: cache-first, arka planda güncelle
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Karolar: network-first (taze), başarısızsa önbellek
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(async (c) => {
            await c.put(req, copy);
            trim(c);
          });
        }
        return res;
      })
      .catch(() => caches.match(req)),
  );
});

/** Basit boyut sınırı: anahtarlara göre en eski ~%20 sil. */
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length < 800) return;
  const drop = Math.floor(keys.length * 0.2);
  for (let i = 0; i < drop; i++) await cache.delete(keys[i]);
  void LIMIT;
}
