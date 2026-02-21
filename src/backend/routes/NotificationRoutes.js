const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

// Get all notifications for a user
router.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});


router.put("/notifications/read-all/:userId", async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId }, { read: true });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
});

// Mark a single notification as read
router.put("/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: "Notification not found" });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

// deletes notification
router.delete("/notifications/:id", async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification dismissed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to dismiss notification" });
  }
});

module.exports = router;