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
                  })
                  .catch(function(err) {
                      console.log('Service Worker registration failed', err);
                  });
          }
      }
  });
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
  })
  .catch((error) => {
      console.error('Error adding task:', error);
      alert('Error adding task: ' + error.message);
  });
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
  
  db.collection('users').doc(user.uid).collection('tasks').doc(taskId)
      .update({ completed: completed })
      .then(() => {
          console.log('Task completion toggled');
          displayTasks();
      })
      .catch((error) => {
          console.error('Error updating task:', error);
      });
}

// Delete Task
function deleteTask(taskId) {
  const user = auth.currentUser;
  if (!user) return;
  
  db.collection('users').doc(user.uid).collection('tasks').doc(taskId)
      .delete()
      .then(() => {
          console.log('Task deleted');
          displayTasks();
      })
      .catch((error) => {
          console.error('Error deleting task:', error);
      });
}

// Check for reminders
function checkReminders() {
  const user = auth.currentUser;
  if (!user) return;
  
  // Check for tasks with reminders every minute
  setInterval(() => {
      const now = new Date();
      
      db.collection('users').doc(user.uid).collection('tasks')
          .where('completed', '==', false)
          .get()
          .then((querySnapshot) => {
              querySnapshot.forEach((doc) => {
                  const task = doc.data();
                  
                  if (task.reminder) {
                      const reminderTime = new Date(task.reminder);
                      
                      // If it's reminder time (with 1-minute tolerance)
                      if (Math.abs(now - reminderTime) < 60000) {
                          if (!task.reminderShown) {
                              showNotification('Task Reminder', task.name);
                              
                              // Mark reminder as shown
                              db.collection('users').doc(user.uid).collection('tasks').doc(doc.id)
                                  .update({ reminderShown: true });
                          }
                      }
                  }
              });
          });
  }, 60000); // Check every minute
}

// Show Notification
function showNotification(title, body) {
  // Play sound
  notificationSound.play().catch(e => console.log('Error playing sound:', e));
  
  // Browser notification
  if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
          body: body,
          icon: 'Images/favicon.png'
      });
      
      notification.onclick = function() {
          window.focus();
          this.close();
      };
  }
}