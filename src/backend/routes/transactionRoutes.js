const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

// ====================
// Add a transaction
// ====================
router.post("/transactions", async (req, res) => {
  try {
    const data = req.body;

    // Make sure userId is provided
    if (!data.userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Normalize type
    if (data.type) data.type = data.type.toLowerCase();

    // Save transaction
    const transaction = new Transaction(data);
    await transaction.save();

    res.status(201).json(transaction);
  } catch (err) {
    console.error("Error saving transaction:", err);
    res.status(500).json({ message: "Failed to save transaction" });
  }
});

// Get all transactions for a specific user
router.get("/transactions", async (req, res) => {
  try {
    const userId = req.query.userId; // pass from frontend

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Only fetch transactions for this user
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

module.exports = router;
