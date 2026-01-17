console.log("THIS SERVER FILE IS RUNNING");

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const uploadAvatarRouter = require("./routes/uploadAvatar");
const userRoutes = require("./routes/userRoutes"); 
const app = express();

const PORT = 5000;

// Connect to MongoDB 
connectDB();

// Middleware
app.use(cors({
  origin: true, // allow all localhost origins
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // REQUIRED for FormData

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

//Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Debug middleware
app.use((req, res, next) => {
  console.log("➡️ Incoming:", req.method, req.url);
  next();
});

// Use routers
app.use("/", uploadAvatarRouter);
app.use("/", userRoutes);

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

