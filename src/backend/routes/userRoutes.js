const express = require("express");
const cloudinary = require("../config/cloudinary");
const multer = require("multer");
const User = require("../models/User");
const Notification = require("../models/Notification");
const router = express.Router();

// Multer setup (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

// Upload avatar
router.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const streamifier = require("streamifier");
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "avatars" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);
    const user = await User.findByIdAndUpdate(
      req.body.userId,
      { avatar: result.secure_url },
      { new: true }
    );
    res.json({ avatar: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "name surname _id avatar");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Remove friend
router.post("/remove-friend", async (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) return res.status(400).json({ message: "Missing IDs" });

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) return res.status(404).json({ message: "User not found" });

    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);

    await user.save();
    await friend.save();

    res.json({ message: "Friend removed!", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Send friend request
router.post("/send-friend-request", async (req, res) => {
  const { userId, friendId } = req.body;
  if (!userId || !friendId) return res.status(400).json({ message: "Missing IDs" });
  if (userId === friendId) return res.status(400).json({ message: "Cannot send request to yourself" });

  try {
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) return res.status(404).json({ message: "User not found" });

    if (!user.sentRequests) user.sentRequests = [];
    if (!friend.friendRequests) friend.friendRequests = [];

    if (user.sentRequests.includes(friendId) || user.friends.includes(friendId)) {
      return res.status(400).json({ message: "Request already sent or already friends" });
    }

    user.sentRequests.push(friendId);
    friend.friendRequests.push(userId);

    await user.save();
    await friend.save();

    // create notification forperson recvivng friend request
    await Notification.create({
      userId: friendId,
      type: "friend_request",
      title: "New Friend Request",
      message: `${user.name} ${user.surname} sent you a friend request.`,
      fromUserId: userId,
      fromUserName: `${user.name} ${user.surname}`,
    });

    res.json({ message: "Friend request sent!", user });
  } catch (err) {
    console.error("Error in send-friend-request:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get single user
router.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get users by IDs
router.post("/users-by-ids", async (req, res) => {
  try {
    const { ids } = req.body;
    const users = await User.find({ _id: { $in: ids } }, "name surname _id avatar");
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Respond to friend request (accept/reject)
router.post("/respond-request/:senderId", async (req, res) => {
  const { senderId } = req.params;
  const { receiverId, action } = req.body;

  try {
    const receiver = await User.findById(receiverId);
    const sender = await User.findById(senderId);
    if (!receiver || !sender) return res.status(404).json({ message: "User not found" });

    receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== receiverId);

    if (action === "accept") {
      if (!receiver.friends.includes(senderId)) receiver.friends.push(senderId);
      if (!sender.friends.includes(receiverId)) sender.friends.push(receiverId);

      //friend request
      await Notification.create({
        userId: senderId,
        type: "friend_accepted",
        title: "Friend Request Accepted",
        message: `${receiver.name} ${receiver.surname} accepted your friend request. You are now friends!`,
        fromUserId: receiverId,
        fromUserName: `${receiver.name} ${receiver.surname}`,
      });

      
      await Notification.deleteOne({
        userId: receiverId,
        type: "friend_request",
        fromUserId: senderId,
      });
    }

    await receiver.save();
    await sender.save();

    res.json({ message: action === "accept" ? "Friend request accepted!" : "Friend request rejected!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;