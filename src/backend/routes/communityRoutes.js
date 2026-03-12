const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");

// GET all posts
router.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST create a new post
router.post("/api/posts", async (req, res) => {
  try {
   const { userId, title, text, hashtags } = req.body;
    if (!userId || !title || !text)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

    const post = new Post({
      userId,
      name: `${user.name} ${user.surname}`,
      avatar: user.avatar || initials,
      title,
      text,
      hashtags: hashtags || [],  
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST like a post (toggle)
router.post("/api/posts/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const alreadyLiked = post.likes.includes(userId);
    const alreadyDisliked = post.dislikes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.push(userId);
      if (alreadyDisliked) post.dislikes.pull(userId);

      // Notify post owner — wrapped in try/catch so it never breaks likes
      if (post.userId.toString() !== userId) {
        try {
          const liker = await User.findById(userId);
          await Notification.create({
            userId: post.userId,
            type: "community_like",
            title: "Someone liked your post!",
            message: `${liker.name} ${liker.surname} liked your post "${post.title}".`,
            fromUserId: userId,
            fromUserName: `${liker.name} ${liker.surname}`,
          });
        } catch (notifErr) {
          console.error("Like notification error:", notifErr);
        }
      }
    }

    await post.save();
    res.json({ likes: post.likes.length, dislikes: post.dislikes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST dislike a post (toggle)
router.post("/api/posts/:id/dislike", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const alreadyDisliked = post.dislikes.includes(userId);
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyDisliked) {
      post.dislikes.pull(userId);
    } else {
      post.dislikes.push(userId);
      if (alreadyLiked) post.likes.pull(userId);

      // Notify post owner — wrapped in try/catch so it never breaks dislikes
      if (post.userId.toString() !== userId) {
        try {
          const disliker = await User.findById(userId);
          await Notification.create({
            userId: post.userId,
            type: "community_dislike",
            title: "Someone disliked your post",
            message: `${disliker.name} ${disliker.surname} disliked your post "${post.title}".`,
            fromUserId: userId,
            fromUserName: `${disliker.name} ${disliker.surname}`,
          });
        } catch (notifErr) {
          console.error("Dislike notification error:", notifErr);
        }
      }
    }

    await post.save();
    res.json({ likes: post.likes.length, dislikes: post.dislikes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST add a comment
router.post("/api/posts/:id/comments", async (req, res) => {
  try {
    const { userId, text } = req.body;
    if (!userId || !text)
      return res.status(400).json({ error: "Missing fields" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const initials = `${user.name?.[0] ?? ""}${user.surname?.[0] ?? ""}`.toUpperCase();

    const comment = {
      userId,
      name: `${user.name} ${user.surname}`,
      avatar: user.avatar || initials,
      text,
    };

    post.comments.push(comment);
    await post.save();

    // Notify post owner — wrapped in try/catch so it never breaks comments
    if (post.userId.toString() !== userId) {
      try {
        await Notification.create({
          userId: post.userId,
          type: "community_comment",
          title: "New comment on your post",
          message: `${user.name} ${user.surname} commented: "${text.slice(0, 60)}${text.length > 60 ? "..." : ""}"`,
          fromUserId: userId,
          fromUserName: `${user.name} ${user.surname}`,
        });
      } catch (notifErr) {
        console.error("Comment notification error:", notifErr);
      }
    }

    res.status(201).json(post.comments[post.comments.length - 1]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a comment (only by comment author)
router.delete("/api/posts/:postId/comments/:commentId", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (comment.userId.toString() !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    post.comments.pull({ _id: req.params.commentId });
    await post.save();

    res.json({ message: "Comment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE a post (only by owner)
router.delete("/api/posts/:id", async (req, res) => {
  try {
    const { userId } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.userId.toString() !== userId)
      return res.status(403).json({ error: "Unauthorized" });

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;