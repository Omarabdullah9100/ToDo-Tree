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

  // Check if the payload contains valid notification data
  const notificationTitle = payload.notification.title || "New Task"; // Fallback to a default title
  const notificationBody = payload.notification.body || "You have a new task."; // Fallback to a default body
  const notificationIcon = payload.notification.icon || '/firebase-logo.png'; // Fallback to a default icon

  const notificationOptions = {
    body: notificationBody,
    icon: notificationIcon,
    data: payload.data // Include any extra data in the notification
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Add event listener for notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received: ', event);

  // Close the notification (optional)
  event.notification.close();

  // If the user clicks on the notification, handle the action (navigate to a page, etc.)
  event.waitUntil(
    clients.openWindow('/tasks') // Open the tasks page when the notification is clicked (example)
  );
});
