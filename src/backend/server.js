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
const sharedWalletRoutes = require('./routes/sharedWalletRoutes'); // ✅ FIXED

const app = express();
const PORT = 5000;

// Connect to MongoDB 
connectDB();

// Middleware (MUST come before routes!)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Debug middleware
app.use((req, res, next) => {
  console.log("📨 Incoming:", req.method, req.url);
  next();
});

app.use("/api", groqRoutes);
app.use('/', sharedWalletRoutes);
// Other routes
app.use("/api/balance", balanceRoutes);
app.use("/", uploadAvatarRouter);
app.use("/", userRoutes);
app.use("/", transactionRoutes);

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

// Signup route
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
    res.send("User registered successfully!");
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

// Start server 
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});