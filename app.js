// Import Firebase
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/auth';

// Firebase configuration (replace with your Firebase config)
const firebaseConfig = {
    apiKey: "AIzaSyDQUzseHoekIQihohpW-8XFy-fKvibbS8c",
    authDomain: "todo-list-9dbcf.firebaseapp.com",
    projectId: "todo-list-9dbcf",
    storageBucket: "todo-list-9dbcf.firebasestorage.app",
    messagingSenderId: "503251074837",
    appId: "1:503251074837:web:9ab8901930ba884953f31c"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firestore and Authentication
const db = firebase.firestore();
const auth = firebase.auth();

// Set up a listener to check if user is logged in
auth.onAuthStateChanged(user => {
  if (user) {
    console.log("User logged in", user);
    loadTasks();
  } else {
    console.log("No user logged in");
  }
});

// Handle user login
function login(email, password) {
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Logged in as", userCredential.user.email);
      loadTasks();  // Load tasks after successful login
    })
    .catch((error) => {
      console.error("Login error", error);
    });
}

// Handle user logout
function logout() {
  auth.signOut()
    .then(() => {
      console.log("Logged out");
    })
    .catch((error) => {
      console.error("Logout error", error);
    });
}

// Add task
function addTask() {
  const taskText = document.getElementById("input-box").value;
  const category = document.getElementById("category-select").value;
  const taskContainer = document.getElementById("list-container");

  if (taskText.trim() === "") return;

  // Create task item
  const taskItem = document.createElement("li");
  taskItem.innerHTML = `
    <span class="task-text">${taskText}</span> 
    <span class="category">${category}</span>
    <div class="task-actions">
        <button class="check-task" onclick="toggleTaskCheck(this)">Check</button>
        <button class="delete-task" onclick="deleteTask(this)">Delete</button>
    </div>
  `;

  taskContainer.appendChild(taskItem);

  // Save task in Firestore
  db.collection("tasks").add({
    text: taskText,
    category: category,
    completed: false,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  // Reset input box
  document.getElementById("input-box").value = "";
}

// Toggle task as complete (mark with strikethrough)
function toggleTaskCheck(button) {
  const taskItem = button.closest("li");
  taskItem.classList.toggle("checked");

  // Update task in Firestore
  const taskText = taskItem.querySelector(".task-text").textContent;
  db.collection("tasks").where("text", "==", taskText).get().then(snapshot => {
    snapshot.forEach(doc => {
      db.collection("tasks").doc(doc.id).update({
        completed: taskItem.classList.contains("checked")
      });
    });
  });
}

// Delete task
function deleteTask(button) {
  const taskItem = button.closest("li");
  const taskText = taskItem.querySelector(".task-text").textContent;

  // Remove task from Firestore
  db.collection("tasks").where("text", "==", taskText).get().then(snapshot => {
    snapshot.forEach(doc => {
      db.collection("tasks").doc(doc.id).delete();
    });
  });

  taskItem.remove();
}

// Load tasks from Firestore
function loadTasks() {
  db.collection("tasks").orderBy("timestamp").onSnapshot(snapshot => {
    const taskContainer = document.getElementById("list-container");
    taskContainer.innerHTML = "";  // Clear current tasks

    snapshot.forEach(doc => {
      const task = doc.data();
      const taskItem = document.createElement("li");
      taskItem.classList.toggle("checked", task.completed);
      taskItem.innerHTML = `
        <span class="task-text">${task.text}</span> 
        <span class="category">${task.category}</span>
        <div class="task-actions">
            <button class="check-task" onclick="toggleTaskCheck(this)">Check</button>
            <button class="delete-task" onclick="deleteTask(this)">Delete</button>
        </div>
      `;
      taskContainer.appendChild(taskItem);
    });
  });
}
