// LokAI - Basic Service Worker
// In production, we would use something like "serwist" or "workbox"
// For now, this baseline satisfies PWA installability.

self.addEventListener('install', (event) => {
  console.log('LokAI: Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('LokAI: Service Worker activating.');
});

self.addEventListener('fetch', (event) => {
  // Basic pass-through
});
