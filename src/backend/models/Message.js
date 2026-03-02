const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  walletId: { type: String, required: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderAvatar: { type: String, default: null },
  senderColor: { type: String, default: "#7c6b9e" },
  text: { type: String, required: true },
  type: { type: String, default: "message" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", MessageSchema);