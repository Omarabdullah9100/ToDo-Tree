// Filename: functions/index.js (Firebase Cloud Functions)
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.scheduleReminders = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).send("");
    return;
  }

  // Handle the actual request
  try {
    const {userId, token, tasks} = req.body;

    if (!userId || !token || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({error: "Invalid request parameters"});
    }

    const scheduledTasks = [];

    // Schedule each task reminder
    for (const task of tasks) {
      if (!task.reminder) continue;

      const reminderDate = new Date(task.reminder);
      const now = new Date();

      // Skip past reminders
      if (reminderDate <= now) continue;

      // Schedule the reminder
      const delay = reminderDate.getTime() - now.getTime();

      // Use Firebase Cloud Messaging to send push notification
      setTimeout(async () => {
        try {
          await admin.messaging().send({
            token: token,
            notification: {
              title: "Task Reminder",
              body: task.name,
            },
            data: {
              taskId: task.id,
              url: "/?taskId=" + task.id,
            },
          });

          console.log(`Reminder sent for task: ${task.name}`);
        } catch (error) {
          console.error("Error sending reminder:", error);
        }
      }, delay);

      scheduledTasks.push({
        id: task.id,
        name: task.name,
        scheduledFor: reminderDate.toISOString(),
      });
    }

    return res.status(200).json({
      message: "Reminders scheduled successfully",
      count: scheduledTasks.length,
      tasks: scheduledTasks,
    });
  } catch (error) {
    console.error("Error scheduling reminders:", error);
    return res.status(500).json({error: "Internal server error"});
  }
});
