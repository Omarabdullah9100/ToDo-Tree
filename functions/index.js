const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp(); // Initialize the Firebase Admin SDK

// Function to send push notification when a new task is added/updated
exports.sendPushNotification = functions.firestore
    .document('tasks/{taskId}') // Triggered when a task document is created or updated
    .onWrite(async (change, context) => {
        const taskData = change.after.data(); // Get task data

        // Prepare the message to send as a notification
        const message = {
            notification: {
                title: 'New Task Added',
                body: `Task: ${taskData.name}`, // Example task data
            },
            token: taskData.deviceToken, // Device token for the user to send the notification to
        };

        try {
            // Send the push notification using Firebase Admin SDK
            await admin.messaging().send(message);
            console.log("Notification sent successfully!");
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    });
