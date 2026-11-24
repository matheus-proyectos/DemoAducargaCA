const CACHE_NAME = "aducarga-v1";
const STATIC_ASSETS = [
  "/",
  "/offline",
  "/brand/logo192.png",
  "/brand/logo512.png",
  "/brand/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo peticiones del mismo origen
  if (url.origin !== self.location.origin) return;

  // API / datos: intento red, fallback offline solo si es GET
  if (request.method === "GET") {
    event.respondWith(
      caches.match(request).then((cached) =>
        fetch(request)
          .then((response) => {
            if (response.ok && request.url.startsWith(self.location.origin)) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || caches.match("/offline"))
      )
    );
  }
});