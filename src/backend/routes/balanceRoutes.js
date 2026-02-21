const express = require("express");
const router = express.Router();
const Balance = require("../models/Balance");

//get current balance
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    let balance = await Balance.findOne({ userId });

    // If first time, create balance record
    if (!balance) {
      balance = await Balance.create({ userId, balance: 0 });
    }

    res.json(balance);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch balance" });
  }
});

//update
router.put("/", async (req, res) => {
  try {
    const { userId, balance } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    if (balance < 0) {
      return res.status(400).json({ message: "Balance cannot be negative" });
    }

    const updated = await Balance.findOneAndUpdate(
      { userId },
      { balance },
      { new: true, upsert: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update balance" });
  }
});

module.exports = router;
