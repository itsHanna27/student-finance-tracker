const express = require('express');
const router = express.Router();
const { SharedWallet, WalletTransaction } = require('../models/sharedWallet');

// Create a new wallet
router.post('/create-wallet', async (req, res) => {
  try {
    console.log(' Received wallet creation request:', JSON.stringify(req.body, null, 2));
    
    const { title, members, splitType, last, balanceLeft, paid, createdBy } = req.body;

    // Validation
    if (!title || !members || !splitType || !createdBy) {
      console.log('❌ Validation failed - missing fields');
      return res.status(400).json({ 
        message: 'Missing required fields: title, members, splitType, createdBy' 
      });
    }

    if (members.length === 0) {
      console.log(' Validation failed - no members');
      return res.status(400).json({ 
        message: 'At least one member is required' 
      });
    }

    console.log(' Validation passed, creating wallet...');

    const newWallet = new SharedWallet({
      title,
      members,
      splitType,
      last,
      balanceLeft,
      paid,
      createdBy
    });

    await newWallet.save();
    
    console.log('Wallet saved successfully:', newWallet._id);
    
    res.status(201).json(newWallet);
  } catch (err) {
    console.error(' Error creating wallet:', err);
    res.status(500).json({ 
      message: 'Failed to create wallet', 
      error: err.message 
    });
  }
});

// Get all wallets for a specific user 
router.get('/wallets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find wallets where user is a member
    const wallets = await SharedWallet.find({
      'members.id': userId
    }).sort({ createdAt: -1 });

    // Calculate current balances for each wallet
    const walletsWithBalances = await Promise.all(
      wallets.map(async (wallet) => {
        // Get all transactions for this wallet
        const transactions = await WalletTransaction.find({ walletId: wallet._id.toString() });
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

        // Get budget value
        const budgetAmount = wallet.paid || wallet.balanceLeft || "£0.00";
        const budgetValue = parseFloat(budgetAmount.replace('£', ''));
        const currentBalance = budgetValue - totalSpent;

        // Get last transaction date if exists
        const lastTransaction = transactions.length > 0 
          ? transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
          : null;

        // Return wallet with calculated balance
        return {
          ...wallet.toObject(),
          totalSpent: `£${totalSpent.toFixed(2)}`,
          currentBalance: `£${currentBalance.toFixed(2)}`,
          budgetValue: `£${budgetValue.toFixed(2)}`,
          lastActivity: lastTransaction ? new Date(lastTransaction.date).toLocaleDateString() : null
        };
      })
    );

    res.json(walletsWithBalances);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    res.status(500).json({ 
      message: 'Failed to fetch wallets', 
      error: err.message 
    });
  }
});

// Get a specific wallet by ID
router.get('/wallet/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const wallet = await SharedWallet.findById(walletId);
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    res.json(wallet);
  } catch (err) {
    console.error('Error fetching wallet:', err);
    res.status(500).json({ 
      message: 'Failed to fetch wallet', 
      error: err.message 
    });
  }
});

// Update a wallet
router.put('/wallet/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    const updates = req.body;

    const updatedWallet = await SharedWallet.findByIdAndUpdate(
      walletId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedWallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json(updatedWallet);
  } catch (err) {
    console.error('Error updating wallet:', err);
    res.status(500).json({ 
      message: 'Failed to update wallet', 
      error: err.message 
    });
  }
});

// Delete a wallet
router.delete('/wallet/:walletId', async (req, res) => {
  try {
    const { walletId } = req.params;
    
    // Delete all transactions for this wallet
    await WalletTransaction.deleteMany({ walletId: walletId });
    
    // Delete the wallet
    const deletedWallet = await SharedWallet.findByIdAndDelete(walletId);
    
    if (!deletedWallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json({ message: 'Wallet deleted successfully' });
  } catch (err) {
    console.error('Error deleting wallet:', err);
    res.status(500).json({ 
      message: 'Failed to delete wallet', 
      error: err.message 
    });
  }
});

// wallet transaction route

// Get all transactions for a wallet
router.get('/wallets/:walletId/transactions', async (req, res) => {
  try {
    const { walletId } = req.params;

    const transactions = await WalletTransaction.find({ walletId })
      .sort({ createdAt: -1 }); // Most recent first

    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ 
      message: 'Failed to fetch transactions', 
      error: err.message 
    });
  }
});

// Add a transaction to a wallet
router.post('/wallets/:walletId/transactions', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { description, amount, paidBy, date } = req.body;

    // Validation
    if (!description || amount === undefined || !paidBy) {
      return res.status(400).json({ 
        message: 'Missing required fields: description, amount, paidBy' 
      });
    }

    const newTransaction = new WalletTransaction({
      walletId,
      description,
      amount,
      paidBy,
      date: date || new Date().toISOString()
    });

    await newTransaction.save();

    // Update wallet's last activity timestamp
    await SharedWallet.findByIdAndUpdate(
      walletId,
      { last: new Date().toISOString() }
    );

    res.status(201).json(newTransaction);
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ 
      message: 'Failed to add transaction', 
      error: err.message 
    });
  }
});

// Delete a transaction
router.delete('/wallets/:walletId/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const deletedTransaction = await WalletTransaction.findByIdAndDelete(transactionId);

    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    console.error('Error deleting transaction:', err);
    res.status(500).json({ 
      message: 'Failed to delete transaction', 
      error: err.message 
    });
  }
});
// Leave a wallet
router.post('/wallet/:walletId/leave', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const wallet = await SharedWallet.findById(walletId);
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Remove user from members array
    wallet.members = wallet.members.filter(member => member.id !== userId);

    // If no members left, delete the wallet and all its transactions
    if (wallet.members.length === 0) {
      await WalletTransaction.deleteMany({ walletId: walletId });
      await SharedWallet.findByIdAndDelete(walletId);
      return res.json({ 
        message: 'You were the last member. Wallet has been deleted.',
        deleted: true 
      });
    }

    // Otherwise, just save the updated wallet
    await wallet.save();
    
    res.json({ 
      message: 'Successfully left the wallet',
      deleted: false,
      wallet: wallet 
    });
  } catch (err) {
    console.error('Error leaving wallet:', err);
    res.status(500).json({ 
      message: 'Failed to leave wallet', 
      error: err.message 
    });
  }
});

// Update a transaction
router.put('/wallets/:walletId/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const updates = req.body;

    const updatedTransaction = await WalletTransaction.findByIdAndUpdate(
      transactionId,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(updatedTransaction);
  } catch (err) {
    console.error('Error updating transaction:', err);
    res.status(500).json({ 
      message: 'Failed to update transaction', 
      error: err.message 
    });
  }
});

module.exports = router;