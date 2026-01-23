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

// ====================
// Delete a transaction
// ====================
router.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Transaction.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

// ====================
// Update a transaction
// ====================
router.put("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      updatedData,
      { new: true } // return the updated doc
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json(updatedTransaction);
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});



module.exports = router;
