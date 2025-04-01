// Initialize Firebase inside the service worker
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Firebase configuration (Make sure this matches your web app's Firebase config)
const firebaseConfig = {
    apiKey: "AIzaSyDQUzseHoekIQihohpW-8XFy-fKvibbS8c",
    authDomain: "todo-list-9dbcf.firebaseapp.com",
    projectId: "todo-list-9dbcf",
    storageBucket: "todo-list-9dbcf.appspot.com",
    messagingSenderId: "503251074837",
    appId: "1:503251074837:web:9ab8901930ba884953f31c"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background notifications (when app is closed)
messaging.setBackgroundMessageHandler(function(payload) {
    console.log("Received background message ", payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || "/default-notification-icon.png",
        vibrate: [200, 100, 200], 
        badge: "/default-notification-icon.png",
        data: { url: "/" } 
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Open app when notification is clicked
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow(event.notification.data.url);
        })
    );
});

// Force update of service worker
self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    event.waitUntil(
        clients.claim()
    );
});
