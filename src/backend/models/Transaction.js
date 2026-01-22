// models/Transaction.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  date: String,
  type: String,
  category: String,
  name: String,           // for subscriptions
  description: String,
  amount: Number,
  frequency: String,      // for house/subscriptions
  studentFinancePayments: Array,
  userId: { type: String, required: true }, // ← user identifier
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
