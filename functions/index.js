const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendPushNotification = functions.firestore
    // eslint-disable-next-line max-len
    .document("tasks/{taskId}") // Triggered when a task document is created or updated
    .onWrite(async (change, context) => {
      const taskData = change.after.data(); // Get task data
      const deviceToken = taskData.deviceToken;

      if (!deviceToken) return; // Exit if no device token

      const message = {
        notification: {
          title: "New Task Added",
          body: `Task: ${taskData.name}`,
        },
        token: deviceToken,
      };

      try {
        await admin.messaging().send(message);
        console.log("Notification sent successfully!");
      } catch (error) {
        console.error("Error sending notification:", error);
      }
    });
