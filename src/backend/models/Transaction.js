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
  
  // Fields for budgeting/saving
  period: {
    type: String,
    enum: ["weekly", "monthly"],
  },
  title: String,
  startDate: String,
  currentSaved: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);