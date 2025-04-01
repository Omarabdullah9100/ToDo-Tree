// Filename: service-worker.js

// Cache name for offline functionality
const CACHE_NAME = 'todo-tree-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/public/Images/favicon.png',
  '/public/Images/checklist_icon.png',
  '/public/sounds/notification.mp3'
];

// Install event - cache assets safely
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Opened cache');
      try {
        // Fetch files individually to avoid '206 Partial Content' errors
        for (const url of urlsToCache) {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
          }
        }
      } catch (error) {
        console.error('Cache install error:', error);
      }
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache if available, else fetch from network
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
      return; // Ignore non-GET requests (POST, PUT, DELETE, etc.)
    }
  
    event.respondWith(
      caches.match(event.request).then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(networkResponse => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone()); // Cache only GET responses
              return networkResponse;
            });
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            throw error;
          });
      })
    );
  });
  

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      console.error('Push event error:', error);
    }
  }

  const title = data.title || "Task Reminder";
  const options = {
    body: data.body || "You have a task to complete!",
    icon: '/Images/favicon.png',
    badge: '/Images/favicon.png',
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'View Task' },
      { action: 'close', title: 'Dismiss' }
    ],
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event - open the app and focus on specific task
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      for (const client of windowClients) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});
