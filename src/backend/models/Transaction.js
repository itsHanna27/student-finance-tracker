const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  date: String,
  type: String,
  category: String,
  name: String,
  description: String,
  amount: Number,
  frequency: String,
  studentFinancePayments: Array,
  userId: { type: String, required: true },

  // Budgeting/saving fields
  period: {
    type: String,
    enum: ["weekly", "monthly"],
  },
  title: String,
  startDate: String,
  currentSaved: { type: Number, default: 0 },

  // Recurring transaction fields
  parentId: { type: String, default: null }, 
      // set on generated copies, null on originals
  lastProcessed: { type: Date, default: null },  // tracks when original was last duplicated

}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);