const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Balance = require("../models/Balance");


const recalculateUserBalance = async (userId) => {
  try {
    // Get all transactions for this user (excluding saving and budget types)
    const transactions = await Transaction.find({ 
      userId,
      type: { $nin: ['saving', 'budget', 'house'] } // Excluding house budget and saving from transactions
    });
    
    // Sum all transaction amounts
    const totalBalance = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Update the balance in the Balance collection
    await Balance.findOneAndUpdate(
      { userId },
      { balance: totalBalance },
      { new: true, upsert: true }
    );
    
    return totalBalance;
  } catch (err) {
    console.error("Error recalculating balance:", err);
    throw err;
  }
};

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

    // ✅ Recalculate balance after creating transaction
    await recalculateUserBalance(data.userId);

    res.status(201).json(transaction);
  } catch (err) {
    console.error("Error saving transaction:", err);
    res.status(500).json({ message: "Failed to save transaction" });
  }
});

// Get all transactions for a specific user
router.get("/transactions", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

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
    
    // ✅ Get transaction first to get userId
    const transaction = await Transaction.findById(id);
    
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const userId = transaction.userId;
    
    // Delete the transaction
    await Transaction.findByIdAndDelete(id);

    // ✅ Recalculate balance after deleting
    await recalculateUserBalance(userId);

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
      { new: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // ✅ Recalculate balance after updating
    await recalculateUserBalance(updatedTransaction.userId);

    res.json(updatedTransaction);
  } catch (err) {
    console.error("Error updating transaction:", err);
    res.status(500).json({ message: "Failed to update transaction" });
  }
});

// Saving and Budgeting
router.post("/", async (req, res) => {
  try {
    const transaction = await Transaction.create(req.body);
    
    // ✅ Recalculate balance if userId exists
    if (req.body.userId) {
      await recalculateUserBalance(req.body.userId);
    }
    
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/* GET all transactions */
router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;