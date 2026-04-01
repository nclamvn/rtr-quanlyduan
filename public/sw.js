/**
 * RtR Control Tower — Service Worker
 * - Cache-first for static assets
 * - Network-first for API calls
 * - Background sync queue for offline mutations
 * - Offline fallback page
 */

const CACHE_NAME = "rtr-v1";
const STATIC_ASSETS = ["/", "/index.html"];
const API_CACHE = "rtr-api-v1";
const SYNC_QUEUE_KEY = "rtr-sync-queue";

// Install: cache shell
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME && k !== API_CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (mutations handled by background sync)
  if (request.method !== "GET") return;

  // Supabase API: network-first with cache fallback
  if (url.hostname.includes("supabase")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // Static assets: cache-first
  if (url.pathname.startsWith("/assets/") || url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // HTML: network-first, fallback to cache
  event.respondWith(fetch(request).catch(() => caches.match("/index.html")));
});

// Background Sync: retry failed mutations when back online
self.addEventListener("sync", (event) => {
  if (event.tag === "rtr-mutation-sync") {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  // Read queue from IndexedDB (simplified: use BroadcastChannel to coordinate)
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: "SYNC_QUEUE_PROCESS" });
  });
}

// Push notifications (future use)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "RtR Control Tower", {
      body: data.message || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "rtr-notification",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
