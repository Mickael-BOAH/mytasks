// Service worker for BOA Tasks PWA
// Handles push notifications (from web-push server) and click navigation.

self.addEventListener('install',  () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; }
  catch { data = { title: 'BOA Tasks', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'BOA Tasks';
  const options = {
    body: data.body || '',
    icon: '/mytasks/icon.svg',
    badge: '/mytasks/icon.svg',
    tag: data.tag || 'boa-task',
    requireInteraction: !!data.requireInteraction,
    data: { url: data.url || '/mytasks/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/mytasks/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      // Focus an existing tab if already open, otherwise open a new one
      for (const w of wins) {
        if (w.url.includes('/mytasks/') && 'focus' in w) { w.navigate(url); return w.focus(); }
      }
      return self.clients.openWindow(url);
    })
  );
});
