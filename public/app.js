// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/9.1.2/firebase-messaging.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Request Notification Permissions
async function requestPermission() {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");
      
      const token = await getToken(messaging, { vapidKey: "BMBvWtE7-apHuAWHXK-z7SIhtM55DE4Zn0ZPCqLBciVXak1C-vgapNvgPxEbM9KyPUaLl3M4QflBIuEO7-O7_R8" });

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

// Save FCM Token to Firestore
async function saveTokenToFirestore(token) {
  try {
    await addDoc(collection(db, "users"), { fcmToken: token });
    console.log("FCM Token saved to Firestore.");
  } catch (error) {
    console.error("Error saving token:", error);
  }
}

// Listen for incoming messages
onMessage(messaging, (payload) => {
  console.log("Message received:", payload);
  const { title, body, icon } = payload.notification;

  if (Notification.permission === "granted") {
    new Notification(title, { body, icon });
  }
});

// Add Task
async function addTask() {
  const taskInput = document.getElementById("input-box").value;
  const categorySelect = document.getElementById("category-select").value;
  const reminderDate = document.getElementById("reminder-select").value;

  if (taskInput) {
    try {
      await addDoc(collection(db, "tasks"), {
        name: taskInput,
        category: categorySelect,
        reminder: reminderDate,
        timestamp: serverTimestamp()
      });

      console.log("Task added to Firestore.");
      displayTasks(); // Refresh task list
    } catch (error) {
      console.error("Error adding task:", error);
    }

    // Clear input fields
    document.getElementById("input-box").value = "";
    document.getElementById("category-select").value = "Work";
    document.getElementById("reminder-select").value = "";
  }
}

// Delete Task
async function deleteTask(taskId) {
  try {
    await deleteDoc(doc(db, "tasks", taskId));
    console.log("Task deleted.");
    displayTasks();
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}

// Mark Task as Complete
async function completeTask(taskId) {
  try {
    await updateDoc(doc(db, "tasks", taskId), { completed: true });
    console.log("Task marked as complete.");
    displayTasks();
  } catch (error) {
    console.error("Error completing task:", error);
  }
}

// Display Tasks
async function displayTasks() {
  const listContainer = document.getElementById("list-container");
  listContainer.innerHTML = ""; // Clear previous tasks

  try {
    const querySnapshot = await getDocs(collection(db, "tasks"));

    querySnapshot.forEach((docSnap) => {
      const task = docSnap.data();
      const li = document.createElement("li");

      li.innerHTML = `
        <span class="task-name">${task.name}</span>
        <span class="category">${task.category}</span>
        <span class="reminder">${task.reminder}</span>
        <button class="delete-btn">Delete</button>
        <button class="complete-btn">Complete</button>
      `;

      li.querySelector(".delete-btn").addEventListener("click", () => {
        deleteTask(docSnap.id);
      });

      li.querySelector(".complete-btn").addEventListener("click", () => {
        completeTask(docSnap.id);
        li.classList.add("checked"); // Visual indication
      });

      listContainer.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

// Register Service Worker for Push Notifications
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/firebase-messaging-sw.js")
    .then((registration) => console.log("Service Worker registered:", registration))
    .catch((error) => console.error("Service Worker registration failed:", error));
}

// Load tasks on page load
window.onload = () => {
  displayTasks();
  requestPermission();
};

// Event listener for "Add" button
document.querySelector("button").addEventListener("click", addTask);
