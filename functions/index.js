/* eslint-disable max-len */
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendPushNotification = functions.firestore
    .document("tasks/{taskId}") // Triggered when a task document is created or updated
    .onWrite(async (change, context) => {
      const taskData = change.after.data(); // Get task data
      const userId = taskData.userId;

      // Check if there is an update in the task
      if (!taskData || !userId) return;

      const userSnapshot = await admin.firestore().collection("users").doc(userId).get();
      const userToken = userSnapshot.data().deviceToken;

      if (!userToken) return; // Exit if no device token

      const message = {
        notification: {
          title: "New Task Added",
          body: `Task: ${taskData.task}`,
        },
        token: userToken,
      };

      try {
        await admin.messaging().send(message);
        console.log("Notification sent successfully!");
      } catch (error) {
        console.error("Error sending notification: ", error);
      }
    });
