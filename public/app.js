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
const auth = firebase.auth();
const db = firebase.firestore();
let messaging;

// Try to initialize messaging if supported
try {
  messaging = firebase.messaging();
} catch (error) {
  console.log("Firebase messaging not supported in this browser", error);
}

// DOM Elements
const signInContainer = document.getElementById('sign-in-container');
const signUpContainer = document.getElementById('sign-up-container');
const todoContainer = document.getElementById('todo-container');
const signUpLink = document.getElementById('sign-up-link');
const signInLink = document.getElementById('sign-in-link');
const signInButton = document.getElementById('sign-in-button');
const signUpButton = document.getElementById('sign-up-button');
const logoutButton = document.getElementById('logout-button');
const userEmailElement = document.getElementById('user-email');
const addTaskButton = document.getElementById('add-task-btn');
const notificationSound = document.getElementById('notification-sound');
const themeToggle = document.getElementById('theme-toggle');

// Theme Toggle Functionality
// Check for saved theme preference or use system preference
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const currentTheme = localStorage.getItem("theme");

// Apply theme based on saved preference or system preference
if (currentTheme === "light") {
  document.body.classList.add("light-mode");
  themeToggle.checked = true;
} else if (currentTheme === "dark") {
  document.body.classList.remove("light-mode");
  themeToggle.checked = false;
} else {
  // Apply based on system preference if no saved preference
  if (!prefersDarkScheme.matches) {
    document.body.classList.add("light-mode");
    themeToggle.checked = true;
  }
}

// Theme toggle event listener
themeToggle.addEventListener("change", function() {
  if (this.checked) {
    document.body.classList.add("light-mode");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.remove("light-mode");
    localStorage.setItem("theme", "dark");
  }
});

// Event Listeners
signUpLink.addEventListener('click', () => {
  signInContainer.style.display = 'none';
  signUpContainer.style.display = 'block';
});

signInLink.addEventListener('click', () => {
  signUpContainer.style.display = 'none';
  signInContainer.style.display = 'block';
});

signInButton.addEventListener('click', signIn);
signUpButton.addEventListener('click', signUp);
logoutButton.addEventListener('click', signOut);
addTaskButton.addEventListener('click', addTask);

// Authentication State Change Listener
auth.onAuthStateChanged((user) => {
  if (user) {
      console.log('User signed in:', user.uid);
      userEmailElement.textContent = `Signed in as: ${user.email}`;
      showTodoPage();
      displayTasks();
      initializeMessaging();
      checkReminders();
  } else {
      showSignInPage();
  }
});

// Sign In Function
function signIn() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  if (email && password) {
      auth.signInWithEmailAndPassword(email, password)
          .then((userCredential) => {
              const user = userCredential.user;
              console.log('Signed in as:', user.uid);
          })
          .catch((error) => {
              alert(`Error signing in: ${error.message}`);
              console.error("Error signing in:", error.message);
          });
  } else {
      alert("Please enter email and password");
  }
}

// Sign Up Function
function signUp() {
  const email = document.getElementById('new-email').value;
  const password = document.getElementById('new-password').value;

  if (email && password) {
      auth.createUserWithEmailAndPassword(email, password)
          .then((userCredential) => {
              const user = userCredential.user;
              console.log('User signed up with UID:', user.uid);
          })
          .catch((error) => {
              alert(`Error signing up: ${error.message}`);
              console.error("Error signing up:", error.message);
          });
  } else {
      alert("Please enter email and password");
  }
}

// Sign Out Function
function signOut() {
  auth.signOut()
      .then(() => {
          console.log('User signed out');
      })
      .catch((error) => {
          console.error("Error signing out:", error);
      });
}

// Show Sign In Page
function showSignInPage() {
  signInContainer.style.display = 'block';
  signUpContainer.style.display = 'none';
  todoContainer.style.display = 'none';
}

// Show Todo Page
function showTodoPage() {
  signInContainer.style.display = 'none';
  signUpContainer.style.display = 'none';
  todoContainer.style.display = 'block';
}

// Initialize Firebase Messaging
function initializeMessaging() {
  if (!messaging) return;

  Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // Get FCM token
          messaging.getToken({ vapidKey: "YOUR_VAPID_KEY_HERE" }).then((currentToken) => {
              if (currentToken) {
                  saveTokenToFirestore(currentToken);
              } else {
                  console.log('No registration token available.');
              }
          }).catch((err) => {
              console.log('An error occurred while retrieving token.', err);
          });
          
          // Handle foreground messages
          messaging.onMessage((payload) => {
              console.log('Message received:', payload);
              showNotification(payload.notification.title, payload.notification.body);
          });
          
          // Register service worker for background notifications
          if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/firebase-messaging-sw.js')
                  .then(function(registration) {
                      console.log('Service Worker registered');
                      
                      // Register for push notifications
                      return registration.pushManager.subscribe({
                          userVisibleOnly: true,
                          applicationServerKey: urlBase64ToUint8Array('YOUR_VAPID_PUBLIC_KEY')
                      });
                  })
                  .then(function(subscription) {
                      console.log('Push notification subscription successful', subscription);
                  })
                  .catch(function(err) {
                      console.log('Service Worker registration or push subscription failed', err);
                  });
          }
      }
  });
}

// Base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Save token to Firestore
function saveTokenToFirestore(token) {
  const user = auth.currentUser;
  if (user) {
      db.collection('users').doc(user.uid).set({
          fcmToken: token
      }, { merge: true })
      .then(() => {
          console.log('Token saved to Firestore');
      })
      .catch((error) => {
          console.error('Error saving token:', error);
      });
  }
}

// Add Task Function
function addTask() {
  const taskInput = document.getElementById('input-box').value.trim();
  const category = document.getElementById('category-select').value;
  const reminder = document.getElementById('reminder-select').value;
  
  if (!taskInput) {
      alert('Please enter a task');
      return;
  }
  
  const user = auth.currentUser;
  if (!user) {
      alert('Please sign in to add tasks');
      return;
  }

  // Add task to Firestore
  db.collection('users').doc(user.uid).collection('tasks').add({
      name: taskInput,
      category: category,
      reminder: reminder ? new Date(reminder).toISOString() : null,
      completed: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => {
      console.log('Task added successfully');
      document.getElementById('input-box').value = '';
      document.getElementById('reminder-select').value = '';
      displayTasks();
      
      // Schedule local notification if reminder is set
      if (reminder) {
          const reminderDate = new Date(reminder);
          scheduleLocalNotification(taskInput, reminderDate);
      }
  })
  .catch((error) => {
      console.error('Error adding task:', error);
      alert('Error adding task: ' + error.message);
  });
}

// Schedule a local notification
function scheduleLocalNotification(title, date) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  const now = new Date();
  const timeUntilReminder = date.getTime() - now.getTime();
  
  if (timeUntilReminder <= 0) return;
  
  setTimeout(() => {
      showNotification('Task Reminder', title);
  }, timeUntilReminder);
}

// Display Tasks
function displayTasks() {
  const user = auth.currentUser;
  if (!user) return;

  const listContainer = document.getElementById('list-container');
  listContainer.innerHTML = '';

  db.collection('users').doc(user.uid).collection('tasks')
      .orderBy('createdAt', 'desc')
      .get()
      .then((querySnapshot) => {
          querySnapshot.forEach((doc) => {
              const task = doc.data();
              const taskId = doc.id;
              
              // Create task element
              const li = document.createElement('li');
              if (task.completed) {
                  li.classList.add('checked');
              }
              
              // Format reminder date if exists
              let reminderText = '';
              if (task.reminder) {
                  const reminderDate = new Date(task.reminder);
                  reminderText = reminderDate.toLocaleString();
              }
              
              // Create task HTML
              li.innerHTML = `
                  <div class="task-content">
                      <span class="task-name">${task.name}</span>
                      <span class="category">${task.category}</span>
                      ${reminderText ? `<span class="reminder">Reminder: ${reminderText}</span>` : ''}
                  </div>
                  <div class="task-actions">
                      <button class="complete-btn">${task.completed ? 'Undo' : 'Complete'}</button>
                      <button class="delete-btn">Delete</button>
                  </div>
              `;
              
              // Complete button event
              li.querySelector('.complete-btn').addEventListener('click', () => {
                  toggleTaskCompletion(taskId, !task.completed);
              });
              
              // Delete button event
              li.querySelector('.delete-btn').addEventListener('click', () => {
                  deleteTask(taskId);
              });
              
              listContainer.appendChild(li);
          });
      })
      .catch((error) => {
          console.error('Error getting tasks:', error);
      });
}

// Toggle Task Completion
function toggleTaskCompletion(taskId, completed) {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('users').doc(user.uid).collection('tasks').doc(taskId).update({
    completed: completed
  })
  .then(() => {
    console.log('Task completion status updated');
    displayTasks();
    
    // Play notification sound if task is completed
    if (completed) {
      notificationSound.play().catch(err => console.log('Error playing sound:', err));
    }
  })
  .catch((error) => {
    console.error('Error updating task:', error);
  });
}

// Delete Task
function deleteTask(taskId) {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('users').doc(user.uid).collection('tasks').doc(taskId).delete()
  .then(() => {
    console.log('Task deleted successfully');
    displayTasks();
  })
  .catch((error) => {
    console.error('Error deleting task:', error);
  });
}

// Check for Due Reminders
function checkReminders() {
  const user = auth.currentUser;
  if (!user) return;
  
  const now = new Date();
  
  db.collection('users').doc(user.uid).collection('tasks')
    .where('completed', '==', false)
    .where('reminder', '<=', now.toISOString())
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        showNotification('Task Reminder', task.name);
      });
    })
    .catch((error) => {
      console.error('Error checking reminders:', error);
    });
    
  // Schedule next reminder check
  setTimeout(checkReminders, 60000); // Check every minute
}

// Show Notification
function showNotification(title, message) {
  // Try to play notification sound
  notificationSound.play().catch(err => console.log('Error playing sound:', err));
  
  // Show notification if permission granted
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: '/images/notification-icon.png'
    });
    
    notification.onclick = function() {
      window.focus();
      this.close();
    };
  } else {
    // Fallback to alert for browsers without notification support
    alert(`${title}: ${message}`);
  }
}

// Filter Tasks by Category
document.getElementById('filter-select').addEventListener('change', function() {
  const selectedCategory = this.value;
  filterTasks(selectedCategory);
});

function filterTasks(category) {
  const user = auth.currentUser;
  if (!user) return;

  const listContainer = document.getElementById('list-container');
  listContainer.innerHTML = '';
  
  let query = db.collection('users').doc(user.uid).collection('tasks');
  
  if (category && category !== 'all') {
    query = query.where('category', '==', category);
  }
  
  query.orderBy('createdAt', 'desc')
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        listContainer.innerHTML = '<p class="empty-list">No tasks found</p>';
        return;
      }
      
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        const taskId = doc.id;
        
        // Create task element (same as in displayTasks function)
        const li = document.createElement('li');
        if (task.completed) {
          li.classList.add('checked');
        }
        
        // Format reminder date if exists
        let reminderText = '';
        if (task.reminder) {
          const reminderDate = new Date(task.reminder);
          reminderText = reminderDate.toLocaleString();
        }
        
        // Create task HTML
        li.innerHTML = `
          <div class="task-content">
            <span class="task-name">${task.name}</span>
            <span class="category">${task.category}</span>
            ${reminderText ? `<span class="reminder">Reminder: ${reminderText}</span>` : ''}
          </div>
          <div class="task-actions">
            <button class="complete-btn">${task.completed ? 'Undo' : 'Complete'}</button>
            <button class="delete-btn">Delete</button>
          </div>
        `;
        
        // Complete button event
        li.querySelector('.complete-btn').addEventListener('click', () => {
          toggleTaskCompletion(taskId, !task.completed);
        });
        
        // Delete button event
        li.querySelector('.delete-btn').addEventListener('click', () => {
          deleteTask(taskId);
        });
        
        listContainer.appendChild(li);
      });
    })
    .catch((error) => {
      console.error('Error filtering tasks:', error);
    });
}

// Export Tasks to CSV
document.getElementById('export-btn').addEventListener('click', exportTasksToCSV);

function exportTasksToCSV() {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('users').doc(user.uid).collection('tasks')
    .orderBy('createdAt', 'desc')
    .get()
    .then((querySnapshot) => {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Task,Category,Reminder,Completed\n";
      
      querySnapshot.forEach((doc) => {
        const task = doc.data();
        const reminderDate = task.reminder ? new Date(task.reminder).toLocaleString() : '';
        
        csvContent += `"${task.name}","${task.category}","${reminderDate}","${task.completed}"\n`;
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "tasks.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => {
      console.error('Error exporting tasks:', error);
    });
}

// Initialize date picker for reminder
const datePicker = document.getElementById('reminder-select');
// Set min date to today
const today = new Date();
const formattedDate = today.toISOString().slice(0, 16);
datePicker.min = formattedDate;

// Initialize application
window.onload = function() {
  // Check if browser supports required features
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
  }
  
  // Register service worker if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('ServiceWorker registration failed:', err);
      });
  }
};