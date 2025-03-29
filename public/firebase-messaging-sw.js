// Import Firebase scripts for messaging
importScripts('https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/9.1.2/firebase-messaging.js');

// Firebase Configuration
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

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});
