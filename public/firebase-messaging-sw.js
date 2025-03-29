// Firebase Messaging Service Worker

importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyDQUzseHoekIQihohpW-8XFy-fKvibbS8c",
    authDomain: "todo-list-9dbcf.firebaseapp.com",
    projectId: "todo-list-9dbcf",
    storageBucket: "todo-list-9dbcf.appspot.com",
    messagingSenderId: "503251074837",
    appId: "1:503251074837:web:9ab8901930ba884953f31c"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/Images/favicon.png'
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});