require("dotenv").config();
console.log("GROQ KEY:", process.env.GROQ_API_KEY ? "✅ loaded" : "❌ missing");
console.log("THIS SERVER FILE IS RUNNING");

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Import routes
const transactionRoutes = require("./routes/transactionRoutes");
const uploadAvatarRouter = require("./routes/uploadAvatar");
const userRoutes = require("./routes/userRoutes"); 
const balanceRoutes = require("./routes/balanceRoutes");
const groqRoutes = require("./routes/groqRoutes");
const sharedWalletRoutes = require('./routes/sharedWalletRoutes');
const notificationRoutes = require("./routes/NotificationRoutes");

const app = express();
const PORT = 5000;

// Connect to MongoDB 
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Debug middleware
app.use((req, res, next) => {
  console.log("Incoming:", req.method, req.url);
  next();
});

app.use("/api", groqRoutes);
app.use('/', sharedWalletRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/", uploadAvatarRouter);
app.use("/", userRoutes);
app.use("/", transactionRoutes);
app.use("/", notificationRoutes);

// Test route 
app.get("/", (req, res) => {
  res.send("Server is running");
});

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Signup route — now returns userId and user info as JSON
app.post("/signup", async (req, res) => {
  try {
    const { name, surname, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).send("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      surname,
      email,
      password: hashedPassword,
    });

    await user.save();


    res.json({
      userId: user._id,
      name: user.name,
      surname: user.surname,
      email: user.email,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});


// Login route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid email or password");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Invalid email or password");

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
app.delete("/delete-account", async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send("User not found");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).send("Incorrect password");

    await User.findByIdAndDelete(userId);

    res.send("Account deleted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});
app.put("/update-profile", async (req, res) => {
  try {
    const { userId, name, surname, password } = req.body;

    const updateFields = { name, surname };

    // Only update password if they provided one
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.password = hashed;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true }
    );

    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      surname: updatedUser.surname,
      email: updatedUser.email,
      avatar: updatedUser.avatar || "",
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Start server 
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});