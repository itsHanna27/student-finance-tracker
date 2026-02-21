const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ["friend_request", "friend_accepted", "wallet_transaction", "wallet_added"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    
    fromUserId: { type: String }, 
    fromUserName: { type: String }, 
    walletId: { type: String },
    walletTitle: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);