// Service Worker logic removed for Native Android (APK) Build.
// The app will run directly from the bundled assets or server.
// No caching strategy is applied to prevent conflicts with APK updates.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});
