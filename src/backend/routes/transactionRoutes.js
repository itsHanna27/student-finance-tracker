const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");
const Balance = require("../models/Balance");

const recalculateUserBalance = async (userId) => {
  try {
    const transactions = await Transaction.find({
      userId,
      type: { $nin: ["saving", "budget", "house"] },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalBalance = transactions.reduce((sum, t) => {
      const type = t.type?.toLowerCase();

      if (type === "studentfinance") {
        const duePayments = (t.studentFinancePayments || []).filter(
          p => p.date && new Date(p.date) <= today
        );
        return sum + duePayments.reduce((s, p) => s + (p.amount || 0), 0);
      }

      return sum + (t.amount || 0);
    }, 0);

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

// Add a transaction
router.post("/transactions", async (req, res) => {
  try {
    const data = req.body;
    if (!data.userId) return res.status(400).json({ message: "userId is required" });
    if (data.type) data.type = data.type.toLowerCase();
    const transaction = new Transaction(data);
    await transaction.save();
    await recalculateUserBalance(data.userId);
    res.status(201).json(transaction);
  } catch (err) {
    console.error("Error saving transaction:", err);
    res.status(500).json({ message: "Failed to save transaction" });
  }
});

// Get all transactions
router.get("/transactions/all", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching all transactions:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Get transactions
router.get("/transactions", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: "userId is required" });
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Delete a transaction
router.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("DELETE request for transaction id:", id); // debug log
    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });
    const userId = transaction.userId;
    await Transaction.findByIdAndDelete(id);
    await recalculateUserBalance(userId);
    res.json({ message: "Transaction deleted successfully" });
  } catch (err) {
    console.error("Error deleting transaction:", err);
    res.status(500).json({ message: "Failed to delete transaction" });
  }
});

// Update a transaction
router.put("/transactions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("PUT request for transaction id:", id); // debug log

    // Strip any synthetic/display-only fields the frontend may have attached
    const {
      _sfTermIndex,       // synthetic field added by frontend for SF rows
      description: _desc, // re-added cleanly below if needed
      ...rest
    } = req.body;

    // Normalise type to lowercase to match DB schema
    if (rest.type) rest.type = rest.type.toLowerCase();

    const updatedTransaction = await Transaction.findByIdAndUpdate(id, rest, { new: true });
    if (!updatedTransaction) return res.status(404).json({ message: "Transaction not found" });
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
    if (req.body.userId) await recalculateUserBalance(req.body.userId);
    res.status(201).json(transaction);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;