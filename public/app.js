// Firebase imports
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-messaging.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQUzseHoekIQihohpW-8XFy-fKvibbS8c",
  authDomain: "todo-list-9dbcf.firebaseapp.com",
  projectId: "todo-list-9dbcf",
  storageBucket: "todo-list-9dbcf.appspot.com",
  messagingSenderId: "503251074837",
  appId: "1:503251074837:web:9ab8901930ba884953f31c"
};

// Initialize Firebase only if not already initialized
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0]; // Use the existing app if already initialized
}

// Initialize Firestore and Messaging services
const firestore = getFirestore(app);
const messaging = getMessaging(app);

// Request permission to send notifications
async function requestPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted.");
      // Get the FCM token and save it to Firestore
      const token = await messaging.getToken({ vapidKey: "YOUR_VAPID_KEY" });

      if (token) {
        console.log("FCM Token:", token);
        saveTokenToFirestore(token);
      }
    } else {
      console.error("Notification permission denied.");
    }
  } catch (error) {
    console.error("Error requesting notification permission:", error);
  }
}

function saveTokenToFirestore(token) {
  const userRef = firestore.collection("users").doc("USER_ID"); // Replace with actual user ID

  userRef.set({ fcmToken: token }, { merge: true })
    .then(() => console.log("FCM Token saved to Firestore."))
    .catch(error => console.error("Error saving token:", error));
}

// Add Task function
function addTask() {
  const taskInput = document.getElementById("input-box").value;
  const categorySelect = document.getElementById("category-select").value;
  const reminderDate = document.getElementById("reminder-select").value;

  if (taskInput) {
    const tasksRef = firestore.collection("tasks");

    tasksRef.add({
      name: taskInput,
      category: categorySelect,
      reminder: reminderDate,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      deviceToken: "USER_DEVICE_TOKEN" // Replace with actual device token from Firestore
    }).then(() => {
      console.log("Task added to Firestore.");
      displayTasks(); // Refresh task list
    }).catch(error => {
      console.error("Error adding task:", error);
    });

    // Clear input fields
    document.getElementById("input-box").value = '';
    document.getElementById("category-select").value = 'Work';
    document.getElementById("reminder-select").value = '';
  }
}

// Delete Task function
function deleteTask(taskId) {
  const taskRef = firestore.collection("tasks").doc(taskId);
  taskRef.delete()
    .then(() => console.log("Task deleted"))
    .catch(error => console.error("Error deleting task:", error));
}

// Mark Task as Complete function
function completeTask(taskId) {
  const taskRef = firestore.collection("tasks").doc(taskId);
  taskRef.update({ completed: true })
    .then(() => console.log("Task marked as complete"))
    .catch(error => console.error("Error completing task:", error));
}

// Display tasks from Firestore
function displayTasks() {
  const listContainer = document.getElementById("list-container");
  listContainer.innerHTML = ''; // Clear previous tasks

  const tasksRef = firestore.collection("tasks").orderBy("timestamp", "desc");
  tasksRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const task = doc.data();
      const li = document.createElement("li");

      li.innerHTML = `
        <span class="task-name">${task.name}</span>
        <span class="category">${task.category}</span>
        <span class="reminder">${task.reminder}</span>
        <button class="delete-btn">Delete</button>
        <button class="complete-btn">Complete</button>
      `;

      li.querySelector(".delete-btn").addEventListener("click", () => {
        deleteTask(doc.id);
        li.remove();
      });

      li.querySelector(".complete-btn").addEventListener("click", () => {
        completeTask(doc.id);
        li.classList.add("checked"); // Visual indication of completion
      });

      listContainer.appendChild(li);
    });
  }).catch(error => {
    console.error("Error fetching tasks:", error);
  });
}

// Call displayTasks to load tasks on page load
window.onload = displayTasks;

// Event listener for "Add" button
document.querySelector("button").addEventListener("click", addTask);

// Request permission to send notifications when the app is loaded
requestPermission();
