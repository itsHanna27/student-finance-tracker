const mongoose = require('mongoose');

// SharedWallet schema 
const sharedWalletSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  members: {
    type: Array,
    required: true
  },
  splitType: {
    type: String,
    required: true
  },
  last: {
    type: Date
  },
  balanceLeft: {
    type: String
  },
  paid: {
    type: String
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// WalletTransaction schema
const walletTransactionSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paidBy: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Exporting both models
module.exports = {
  SharedWallet: mongoose.model('SharedWallet', sharedWalletSchema),
  WalletTransaction: mongoose.model('WalletTransaction', walletTransactionSchema)
};