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
  if (themeToggle) {
    themeToggle.checked = true;
  }
} else if (currentTheme === "dark") {
  document.body.classList.remove("light-mode");
  if (themeToggle) {
    themeToggle.checked = false;
  }
} else {
  // Apply based on system preference if no saved preference
  if (!prefersDarkScheme.matches) {
    document.body.classList.add("light-mode");
    if (themeToggle) {
      themeToggle.checked = true;
    }
  }
}

// Theme toggle event listener
if (themeToggle) {
  themeToggle.addEventListener("change", function() {
    if (this.checked) {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    } else {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    }
  });
}

// Event Listeners
if (signUpLink) {
  signUpLink.addEventListener('click', () => {
    signInContainer.style.display = 'none';
    signUpContainer.style.display = 'block';
  });
}

if (signInLink) {
  signInLink.addEventListener('click', () => {
    signUpContainer.style.display = 'none';
    signInContainer.style.display = 'block';
  });
}

if (signInButton) {
  signInButton.addEventListener('click', signIn);
}

if (signUpButton) {
  signUpButton.addEventListener('click', signUp);
}

if (logoutButton) {
  logoutButton.addEventListener('click', signOut);
}

if (addTaskButton) {
  addTaskButton.addEventListener('click', addTask);
}

// Authentication State Change Listener
auth.onAuthStateChanged((user) => {
  if (user) {
      console.log('User signed in:', user.uid);
      if (userEmailElement) {
        userEmailElement.textContent = `Signed in as: ${user.email}`;
      }
      showTodoPage();
      displayTasks();
      initializeMessaging();
      checkReminders();
      
      // Check for task ID in URL (from notification click)
      const urlParams = new URLSearchParams(window.location.search);
      const taskId = urlParams.get('taskId');
      if (taskId) {
        setTimeout(() => highlightTask(taskId), 1000);
      }
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
  if (signInContainer) signInContainer.style.display = 'block';
  if (signUpContainer) signUpContainer.style.display = 'none';
  if (todoContainer) todoContainer.style.display = 'none';
}

// Show Todo Page
function showTodoPage() {
  if (signInContainer) signInContainer.style.display = 'none';
  if (signUpContainer) signUpContainer.style.display = 'none';
  if (todoContainer) todoContainer.style.display = 'block';
}

// Initialize Firebase Messaging
function initializeMessaging() {
  if (!messaging) return;

  Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // Get FCM token
          messaging.getToken({ vapidKey: "BMBvWtE7-apHuAWHXK-z7SIhtM55DE4Zn0ZPCqLBciVXak1C-vgapNvgPxEbM9KyPUaLl3M4QflBIuEO7-O7_R8" }).then((currentToken) => {
              if (currentToken) {
                  saveTokenToFirestore(currentToken);
                  // After saving token, sync pending reminders
                  syncPendingReminders();
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
                      console.log('Firebase Messaging Service Worker registered');
                      
                      // Register for push notifications
                      return registration.pushManager.subscribe({
                          userVisibleOnly: true,
                          applicationServerKey: urlBase64ToUint8Array('BMBvWtE7-apHuAWHXK-z7SIhtM55DE4Zn0ZPCqLBciVXak1C-vgapNvgPxEbM9KyPUaLl3M4QflBIuEO7-O7_R8')
                      });
                  })
                  .then(function(subscription) {
                      console.log('Push notification subscription successful', subscription);
                  })
                  .catch(function(err) {
                      console.log('Service Worker registration or push subscription failed', err);
                  });
              
              // Register main service worker
              navigator.serviceWorker.register('/service-worker.js')
                  .then(function(registration) {
                      console.log('Main Service Worker registered');
                  })
                  .catch(function(err) {
                      console.log('Main Service Worker registration failed', err);
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
          fcmToken: token,
          lastTokenUpdate: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true })
      .then(() => {
          console.log('Token saved to Firestore');
      })
      .catch((error) => {
          console.error('Error saving token:', error);
      });
  }
}

// Sync pending reminders to ensure notifications will be sent
function syncPendingReminders() {
  const user = auth.currentUser;
  if (!user) return;
  
  const now = new Date();
  
  db.collection('users').doc(user.uid).collection('tasks')
    .where('completed', '==', false)
    .where('reminder', '>', now.toISOString())
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        console.log('No pending reminders to sync');
        return;
      }
      
      console.log(`Syncing ${querySnapshot.size} pending reminders`);
      
      // Get the user's FCM token
      return db.collection('users').doc(user.uid).get()
        .then((userDoc) => {
          if (!userDoc.exists || !userDoc.data().fcmToken) {
            console.log('No FCM token found for user');
            return;
          }
          
          const fcmToken = userDoc.data().fcmToken;
          const pendingReminders = [];
          
          querySnapshot.forEach((doc) => {
            const task = doc.data();
            pendingReminders.push({
              id: doc.id,
              name: task.name,
              reminder: task.reminder,
              category: task.category
            });
          });
          
          // You would typically send this to a server endpoint
          // For this example, we'll schedule them locally
          pendingReminders.forEach(task => {
            const reminderTime = new Date(task.reminder).getTime();
            const timeUntilReminder = reminderTime - now.getTime();
            
            if (timeUntilReminder > 0) {
              console.log(`Scheduling reminder for "${task.name}" in ${Math.floor(timeUntilReminder/1000)} seconds`);
              
              // Store the scheduled reminder in localStorage to persist across page reloads
              const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '{}');
              scheduledReminders[task.id] = {
                scheduledAt: now.getTime(),
                remindAt: reminderTime,
                name: task.name,
                category: task.category
              };
              localStorage.setItem('scheduledReminders', JSON.stringify(scheduledReminders));
              
              // In a production app, you would use a server-side solution
              // This is a client-side approximation for demonstration
              setTimeout(() => {
                checkIfReminderStillValid(task.id, task.name);
              }, timeUntilReminder);
            }
          });
        });
    })
    .catch((error) => {
      console.error('Error syncing pending reminders:', error);
    });
}

// Check if a reminder is still valid before showing notification
function checkIfReminderStillValid(taskId, taskName) {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('users').doc(user.uid).collection('tasks').doc(taskId).get()
    .then((doc) => {
      if (doc.exists) {
        const task = doc.data();
        // Only show notification if task still exists and is not completed
        if (!task.completed) {
          showNotification('Task Reminder', taskName, taskId);
          
          // Remove from scheduled reminders in localStorage
          const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '{}');
          delete scheduledReminders[taskId];
          localStorage.setItem('scheduledReminders', JSON.stringify(scheduledReminders));
        }
      }
    })
    .catch((error) => {
      console.error('Error checking reminder validity:', error);
    });
}

// Add Task Function
function addTask() {
  const taskInput = document.getElementById('input-box');
  const category = document.getElementById('category-select');
  const reminder = document.getElementById('reminder-select');
  
  if (!taskInput || !category || !reminder) {
    console.error('One or more task input elements not found');
    return;
  }

  const taskInputValue = taskInput.value.trim();
  const categoryValue = category.value;
  const reminderValue = reminder.value;
  
  if (!taskInputValue) {
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
      name: taskInputValue,
      category: categoryValue,
      reminder: reminderValue ? new Date(reminderValue).toISOString() : null,
      completed: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
      console.log('Task added successfully with ID:', docRef.id);
      taskInput.value = '';
      reminder.value = '';
      displayTasks();
      
      // Schedule local notification if reminder is set
      if (reminderValue) {
          const reminderDate = new Date(reminderValue);
          scheduleLocalNotification(taskInputValue, reminderDate, docRef.id);
          
          // Sync reminders to ensure push notifications work even when browser is closed
          syncPendingReminders();
      }
  })
  .catch((error) => {
      console.error('Error adding task:', error);
      alert('Error adding task: ' + error.message);
  });
}

// Schedule a local notification
function scheduleLocalNotification(title, date, taskId) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  const now = new Date();
  const timeUntilReminder = date.getTime() - now.getTime();
  
  if (timeUntilReminder <= 0) return;
  
  // Store in localStorage to track scheduled notifications
  const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '{}');
  scheduledReminders[taskId] = {
    scheduledAt: now.getTime(),
    remindAt: date.getTime(),
    name: title
  };
  localStorage.setItem('scheduledReminders', JSON.stringify(scheduledReminders));
  
  console.log(`Scheduled local notification for "${title}" in ${Math.floor(timeUntilReminder/1000)} seconds`);
  
  setTimeout(() => {
    showNotification('Task Reminder', title, taskId);
    
    // Remove from scheduled reminders
    const currentReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '{}');
    delete currentReminders[taskId];
    localStorage.setItem('scheduledReminders', JSON.stringify(currentReminders));
  }, timeUntilReminder);
}

// Display Tasks
function displayTasks() {
  const user = auth.currentUser;
  if (!user) return;

  const listContainer = document.getElementById('list-container');
  if (!listContainer) {
    console.error('List container not found');
    return;
  }
  
  listContainer.innerHTML = '';

  db.collection('users').doc(user.uid).collection('tasks')
      .orderBy('createdAt', 'desc')
      .get()
      .then((querySnapshot) => {
          if (querySnapshot.empty) {
            listContainer.innerHTML = '<p class="empty-list">No tasks yet. Add some tasks to get started!</p>';
            return;
          }
          
          querySnapshot.forEach((doc) => {
              const task = doc.data();
              const taskId = doc.id;
              
              // Create task element
              const li = document.createElement('li');
              li.setAttribute('data-task-id', taskId);
              
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
          
          // Check for taskId in URL (for notification clicks)
          const urlParams = new URLSearchParams(window.location.search);
          const taskId = urlParams.get('taskId');
          if (taskId) {
            highlightTask(taskId);
          }
      })
      .catch((error) => {
          console.error('Error getting tasks:', error);
      });
}

// Highlight a specific task (used when notification is clicked)
function highlightTask(taskId) {
  const taskElement = document.querySelector(`li[data-task-id="${taskId}"]`);
  if (taskElement) {
    // Add highlight class
    taskElement.classList.add('highlight-task');
    
    // Scroll to the element
    taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Remove highlight after animation completes
    setTimeout(() => {
      taskElement.classList.remove('highlight-task');
    }, 3000);
  }
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
    if (completed && notificationSound) {
      notificationSound.play().catch(err => console.log('Error playing sound:', err));
    }
    
    // If task is completed, remove any scheduled reminders
    if (completed) {
      const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '{}');
      if (scheduledReminders[taskId]) {
        delete scheduledReminders[taskId];
        localStorage.setItem('scheduledReminders', JSON.stringify(scheduledReminders));
      }
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
    
    // Remove any scheduled reminders for this task
    const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '{}');
    if (scheduledReminders[taskId]) {
      delete scheduledReminders[taskId];
      localStorage.setItem('scheduledReminders', JSON.stringify(scheduledReminders));
    }
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
        showNotification('Task Reminder', task.name, doc.id);
      });
    })
    .catch((error) => {
      console.error('Error checking reminders:', error);
    });
    
  // Also check localStorage for any scheduled reminders that may have been missed
  checkMissedReminders();
    
  // Schedule next reminder check
  setTimeout(checkReminders, 60000); // Check every minute
}

// Check for missed reminders (e.g., after app was closed)
function checkMissedReminders() {
  const now = new Date().getTime();
  const scheduledReminders = JSON.parse(localStorage.getItem('scheduledReminders') || '{}');
  
  for (const [taskId, reminder] of Object.entries(scheduledReminders)) {
    // If the reminder time has passed
    if (reminder.remindAt <= now) {
      // Show notification
      showNotification('Task Reminder', reminder.name, taskId);
      
      // Remove from scheduled reminders
      delete scheduledReminders[taskId];
    }
  }
  
  localStorage.setItem('scheduledReminders', JSON.stringify(scheduledReminders));
}

// Show Notification
function showNotification(title, message, taskId = null) {
  // Try to play notification sound
  if (notificationSound) {
    notificationSound.play().catch(err => console.log('Error playing sound:', err));
  }
  
  // Show notification if permission granted
  if (Notification.permission === 'granted') {
    // Build notification options
    const options = {
      body: message,
      icon: '/Images/favicon.png',
      badge: '/Images/favicon.png',
      vibrate: [200, 100, 200],
      data: {
        taskId: taskId,
        timestamp: Date.now()
      }
    };
    
    // Create notification
    const notification = new Notification(title, options);
    
    // Handle notification click
    notification.onclick = function() {
      window.focus();
      
      // If we have a taskId, add it to the URL
      if (taskId) {
        // Add taskId to URL without refreshing the page
        const url = new URL(window.location.href);
        url.searchParams.set('taskId', taskId);
        window.history.pushState({}, '', url);
        
        // Highlight the task
        highlightTask(taskId);
      }
      
      this.close();
    };
  } else {
    // Fallback to alert for browsers without notification support
    alert(`${title}: ${message}`);
  }
}

// Filter Tasks by Category
const filterSelect = document.getElementById('filter-select');
if (filterSelect) {
  filterSelect.addEventListener('change', function() {
    const selectedCategory = this.value;
    filterTasks(selectedCategory);
  });
}

function filterTasks(category) {
  const user = auth.currentUser;
  if (!user) return;

  const listContainer = document.getElementById('list-container');
  if (!listContainer) return;
  
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
        li.setAttribute('data-task-id', taskId);
        
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
const exportBtn = document.getElementById('export-btn');
if (exportBtn) {
  exportBtn.addEventListener('click', exportTasksToCSV);
}

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
if (datePicker) {
  // Set min date to today
  const today = new Date();
  const formattedDate = today.toISOString().slice(0, 16);
  datePicker.min = formattedDate;
}

// Initialize application
window.onload = function() {
  // Check if browser supports required features
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
  } else {
    // Request notification permission on page load
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
  
  // Register service worker if supported
  if ('serviceWorker' in navigator) {
    // Main service worker - handles caching, offline support, and notification clicks
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Main ServiceWorker registration successful');
      })
      .catch(err => {
        console.log('Main ServiceWorker registration failed:', err);
      });
  }
  
  // Check for any missed reminders (e.g., ones that should have fired while the app was closed)
  checkMissedReminders();
};
