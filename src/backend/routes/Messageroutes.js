const express = require("express");
const router = express.Router();
const Message = require("../models/Message");

// gets all messages for a wallet (sorted oldest to newest)
router.get("/wallets/:id/messages", async (req, res) => {
  try {
    const messages = await Message.find({ walletId: req.params.id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// post a new message
router.post("/wallets/:id/messages", async (req, res) => {
  try {
    const { senderId, senderName, senderAvatar, senderColor, text, type } = req.body; 

    // Allow system messages to skip validation
    if (type !== "system" && (!senderId || !senderName || !text?.trim())) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const message = new Message({
      walletId: req.params.id,
      senderId,
      senderName,
      senderAvatar: senderAvatar || null,
      senderColor: senderColor || "#7c6b9e",
      text: text.trim(),
      type: type || "message", 
    });

    const saved = await message.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("Error saving message:", err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// DELETE all messages for a wallet
router.delete("/wallets/:id/messages", async (req, res) => {
  try {
    await Message.deleteMany({ walletId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete messages" });
  }
});

module.exports = router;