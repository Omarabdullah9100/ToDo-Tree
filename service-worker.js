// Service Worker: For handling push notifications

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('my-cache').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/app.js',
                '/style.css',
                '/Images/favicon.png', // Add any other files you want to cache
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== 'my-cache') {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Listen for push notifications
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/Images/favicon.png', // Add your icon
        badge: '/Images/favicon.png', // Add your badge
    };

    event.waitUntil(
        self.registration.showNotification('Reminder', options)
    );
});

// Handle click on notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    // You can add more actions here, like opening the task page
});
