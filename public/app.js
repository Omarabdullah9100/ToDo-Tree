// Import Firebase modules using the modular SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging.js";

// Firebase configuration
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
const auth = getAuth(app);
const firestore = getFirestore(app);
const messaging = getMessaging(app);

// Show or hide elements based on user authentication state
function toggleAuthUI(isLoggedIn) {
  if (isLoggedIn) {
    document.getElementById('sign-in-container').style.display = 'none';
    document.getElementById('sign-up-container').style.display = 'none';
    document.getElementById('todo-container').style.display = 'block';
    loadTasks(); // Load tasks for logged-in user
  } else {
    document.getElementById('sign-in-container').style.display = 'block';
    document.getElementById('sign-up-container').style.display = 'none';
    document.getElementById('todo-container').style.display = 'none';
  }
}

// Show sign-up form when clicked on "Sign Up"
document.getElementById('sign-up-link').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('sign-in-container').style.display = 'none';
  document.getElementById('sign-up-container').style.display = 'block';
});

// Show sign-in form when clicked on "Sign In"
document.getElementById('sign-in-link').addEventListener('click', function(event) {
  event.preventDefault();
  document.getElementById('sign-up-container').style.display = 'none';
  document.getElementById('sign-in-container').style.display = 'block';
});

// Sign up with email/password
document.getElementById('sign-up-button').addEventListener('click', () => {
  const email = document.getElementById('new-email').value;
  const password = document.getElementById('new-password').value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      toggleAuthUI(true); // Redirect to todo list
    })
    .catch((error) => {
      console.error('Error during sign up: ', error);
    });
});

// Sign in with email/password
document.getElementById('sign-in-button').addEventListener('click', () => {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      toggleAuthUI(true); // Redirect to todo list
    })
    .catch((error) => {
      console.error('Error during sign in: ', error);
    });
});

// Log out
document.getElementById('logout-button').addEventListener('click', () => {
  signOut(auth)
    .then(() => {
      toggleAuthUI(false); // Show sign-in/sign-up form again
    })
    .catch((error) => {
      console.error('Error during sign out: ', error);
    });
});

// Add Task
function addTask() {
  const taskInput = document.getElementById("input-box").value;
  const categorySelect = document.getElementById("category-select").value;
  const reminderDate = document.getElementById("reminder-select").value;

  if (taskInput && auth.currentUser) {
    const tasksRef = collection(firestore, "tasks");

    addDoc(tasksRef, {
      userId: auth.currentUser.uid,
      name: taskInput,
      category: categorySelect,
      reminder: reminderDate,
      timestamp: new Date()
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

// Display tasks from Firestore
function displayTasks() {
  const listContainer = document.getElementById("list-container");
  listContainer.innerHTML = ''; // Clear previous tasks

  const tasksRef = query(collection(firestore, "tasks"), where("userId", "==", auth.currentUser.uid), orderBy("timestamp", "desc"));
  onSnapshot(tasksRef, (querySnapshot) => {  // Real-time update with onSnapshot
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
              li.classList.add("checked"); // Mark task as completed visually
          });

          listContainer.appendChild(li);
      });
  });
}

// Delete Task
function deleteTask(taskId) {
  const taskRef = doc(firestore, "tasks", taskId);
  deleteDoc(taskRef)
    .then(() => console.log("Task deleted"))
    .catch(error => console.error("Error deleting task:", error));
}

// Mark Task as Complete
function completeTask(taskId) {
  const taskRef = doc(firestore, "tasks", taskId);
  updateDoc(taskRef, { completed: true })
    .then(() => console.log("Task marked as complete"))
    .catch(error => console.error("Error completing task:", error));
}

// Load tasks when the user is logged in
function loadTasks() {
  if (auth.currentUser) {
    displayTasks();
  }
}

// Monitor auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    toggleAuthUI(true);
  } else {
    toggleAuthUI(false);
  }
});

// Initially check user login status
window.onload = () => {
  if (auth.currentUser) {
    toggleAuthUI(true);
  } else {
    toggleAuthUI(false);
  }
};
