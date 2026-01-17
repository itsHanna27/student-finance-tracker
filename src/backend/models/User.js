const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  avatar: { type: String, default: "" },

  // confirmed friends
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // incoming friend requests
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // optional: outgoing requests
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

const User = mongoose.model('User', userSchema);
module.exports = User;
