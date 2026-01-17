const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const fs = require("fs");

// multer config (uploads to /uploads)
const upload = multer({ dest: "uploads/" });

router.post("/upload-avatar", upload.single("avatar"), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
    });

    // delete local file
    fs.unlinkSync(req.file.path);

    // save Cloudinary URL to user
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: result.secure_url },
      { new: true }
    );

    res.json({ avatar: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Upload failed" });
  }
});
router.post("/remove-avatar", async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: "" },
      { new: true }
    );

    res.json({ avatar: user.avatar });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to remove avatar" });
  }
});


module.exports = router;
