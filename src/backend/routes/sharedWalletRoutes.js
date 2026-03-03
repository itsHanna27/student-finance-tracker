const express = require('express');
const router = express.Router();
const { SharedWallet, WalletTransaction } = require('../models/sharedWallet');
const Notification = require('../models/Notification');

// Helper
const calculateNextReset = (schedule) => {
  if (!schedule || schedule === "none") return null;
  const now = new Date();
  if (schedule === "weekly")  { now.setDate(now.getDate() + 7); return now; }
  if (schedule === "monthly") { now.setMonth(now.getMonth() + 1); return now; }
  if (schedule === "yearly")  { now.setFullYear(now.getFullYear() + 1); return now; }
  return null;
};

// Create a new wallet
router.post('/create-wallet', async (req, res) => {
  try {
    const { title, members, splitType, last, balanceLeft, paid, createdBy } = req.body;
    if (!title || !members || !splitType || !createdBy)
      return res.status(400).json({ message: 'Missing required fields' });
    if (members.length === 0)
      return res.status(400).json({ message: 'At least one member is required' });

    const newWallet = new SharedWallet({ title, members, splitType, last, balanceLeft, paid, createdBy });
    await newWallet.save();

    const creator = members.find(m => m.id === createdBy);
    const creatorName = creator?.name || "Someone";
    const otherMembers = members.filter(m => m.id !== createdBy);
    await Promise.all(otherMembers.map(member =>
      Notification.create({
        userId: member.id, type: "wallet_added",
        title: "Added to Shared Wallet",
        message: `${creatorName} added you to the shared wallet "${title}".`,
        fromUserId: createdBy, fromUserName: creatorName,
        walletId: newWallet._id.toString(), walletTitle: title,
      })
    ));

    res.status(201).json(newWallet);
  } catch (err) {
    console.error('Error creating wallet:', err);
    res.status(500).json({ message: 'Failed to create wallet', error: err.message });
  }
});

// Get all wallets for a specific user
router.get('/wallets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const wallets = await SharedWallet.find({ 'members.id': userId }).sort({ createdAt: -1 });

    const walletsWithBalances = await Promise.all(wallets.map(async (wallet) => {
      const transactions = await WalletTransaction.find({ walletId: wallet._id.toString() });
      const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
      const budgetAmount = wallet.paid || wallet.balanceLeft || "£0.00";
      const budgetValue = parseFloat(budgetAmount.replace('£', ''));
      const currentBalance = budgetValue - totalSpent;
      const lastTransaction = transactions.length > 0
        ? transactions.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
      return {
        ...wallet.toObject(),
        totalSpent: `£${totalSpent.toFixed(2)}`,
        currentBalance: `£${currentBalance.toFixed(2)}`,
        budgetValue: `£${budgetValue.toFixed(2)}`,
        lastActivity: lastTransaction ? new Date(lastTransaction.date).toLocaleDateString() : null,
      };
    }));

    res.json(walletsWithBalances);
  } catch (err) {
    console.error('Error fetching wallets:', err);
    res.status(500).json({ message: 'Failed to fetch wallets', error: err.message });
  }
});

// Get a specific wallet by ID
router.get('/wallet/:walletId', async (req, res) => {
  try {
    const wallet = await SharedWallet.findById(req.params.walletId);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch wallet', error: err.message });
  }
});

// Update a wallet
router.put('/wallet/:walletId', async (req, res) => {
  try {
    const updatedWallet = await SharedWallet.findByIdAndUpdate(
      req.params.walletId, req.body, { new: true, runValidators: true }
    );
    if (!updatedWallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json(updatedWallet);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update wallet', error: err.message });
  }
});

// Delete a wallet
router.delete('/wallet/:walletId', async (req, res) => {
  try {
    await WalletTransaction.deleteMany({ walletId: req.params.walletId });
    const deletedWallet = await SharedWallet.findByIdAndDelete(req.params.walletId);
    if (!deletedWallet) return res.status(404).json({ message: 'Wallet not found' });
    res.json({ message: 'Wallet deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete wallet', error: err.message });
  }
});

// Get all transactions for a wallet
router.get('/wallets/:walletId/transactions', async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ walletId: req.params.walletId }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
});

// Add a transaction to a wallet
router.post('/wallets/:walletId/transactions', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { description, amount, paidBy, paidByName, date } = req.body;
    if (!description || amount === undefined || !paidBy)
      return res.status(400).json({ message: 'Missing required fields' });

    const newTransaction = new WalletTransaction({
      walletId, description, amount, paidBy,
      date: date || new Date().toISOString(),
    });
    await newTransaction.save();
    await SharedWallet.findByIdAndUpdate(walletId, { last: new Date().toISOString() });

    const wallet = await SharedWallet.findById(walletId);
    if (wallet) {
      const otherMembers = wallet.members.filter(m => m.id !== paidBy);
      await Promise.all(otherMembers.map(member =>
        Notification.create({
          userId: member.id, type: "wallet_transaction",
          title: `New Transaction in "${wallet.title}"`,
          message: `${paidByName || "Someone"} added £${Number(amount).toFixed(2)} — ${description}.`,
          fromUserId: paidBy, fromUserName: paidByName || "Someone",
          walletId, walletTitle: wallet.title,
        })
      ));
    }

    res.status(201).json(newTransaction);
  } catch (err) {
    console.error('Error adding transaction:', err);
    res.status(500).json({ message: 'Failed to add transaction', error: err.message });
  }
});

// Delete a transaction
router.delete('/wallets/:walletId/transactions/:transactionId', async (req, res) => {
  try {
    const deletedTransaction = await WalletTransaction.findByIdAndDelete(req.params.transactionId);
    if (!deletedTransaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete transaction', error: err.message });
  }
});

// Update a transaction
router.put('/wallets/:walletId/transactions/:transactionId', async (req, res) => {
  try {
    const updatedTransaction = await WalletTransaction.findByIdAndUpdate(
      req.params.transactionId, req.body, { new: true, runValidators: true }
    );
    if (!updatedTransaction) return res.status(404).json({ message: 'Transaction not found' });
    res.json(updatedTransaction);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update transaction', error: err.message });
  }
});

// Leave a wallet
router.post('/wallet/:walletId/leave', async (req, res) => {
  try {
    const { walletId } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const wallet = await SharedWallet.findById(walletId);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    wallet.members = wallet.members.filter(member => member.id !== userId);

    if (wallet.members.length === 0) {
      await WalletTransaction.deleteMany({ walletId });
      await SharedWallet.findByIdAndDelete(walletId);
      return res.json({ message: 'You were the last member. Wallet has been deleted.', deleted: true });
    }

    await wallet.save();
    res.json({ message: 'Successfully left the wallet', deleted: false, wallet });
  } catch (err) {
    res.status(500).json({ message: 'Failed to leave wallet', error: err.message });
  }
});

// Kick a member (owner only)
router.post('/wallet/:id/kick', async (req, res) => {
  try {
    const { userId, memberId } = req.body;
    const wallet = await SharedWallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    if (wallet.createdBy.toString() !== userId.toString())
      return res.status(403).json({ message: 'Only the owner can remove members' });
    if (userId === memberId)
      return res.status(400).json({ message: 'You cannot kick yourself' });

    const kickedMember = wallet.members.find(m => m.id.toString() === memberId.toString());
    wallet.members = wallet.members.filter(m => m.id.toString() !== memberId.toString());
    await wallet.save();

    if (kickedMember) {
      const owner = wallet.members.find(m => m.id.toString() === userId.toString());
      await Notification.create({
        userId: memberId, type: "wallet_added",
        title: "Removed from Shared Wallet",
        message: `You have been removed from the shared wallet "${wallet.title}".`,
        fromUserId: userId, fromUserName: owner?.name || "The owner",
        walletId: wallet._id.toString(), walletTitle: wallet.title,
      });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (err) {
    console.error('Kick error:', err);
    res.status(500).json({ message: 'Failed to remove member', error: err.message });
  }
});

// Add a member (owner only)
router.post('/wallet/:id/add-member', async (req, res) => {
  try {
    const { userId, newMember } = req.body;
    const wallet = await SharedWallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    if (wallet.createdBy.toString() !== userId.toString())
      return res.status(403).json({ message: 'Only the owner can add members' });
    if (wallet.members.some(m => m.id.toString() === newMember.id.toString()))
      return res.status(400).json({ message: 'Already a member' });

    wallet.members.push(newMember);
    await wallet.save();

    const owner = wallet.members.find(m => m.id.toString() === userId.toString());
    await Notification.create({
      userId: newMember.id, type: "wallet_added",
      title: "Added to Shared Wallet",
      message: `${owner?.name || "Someone"} added you to the shared wallet "${wallet.title}".`,
      fromUserId: userId, fromUserName: owner?.name || "Someone",
      walletId: wallet._id.toString(), walletTitle: wallet.title,
    });

    res.json({ message: 'Member added', wallet });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Failed to add member', error: err.message });
  }
});

// Reset all transactions (owner only)
router.delete('/wallet/:id/reset-transactions', async (req, res) => {
  try {
    const { userId } = req.body;
    const wallet = await SharedWallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    if (wallet.createdBy.toString() !== userId.toString())
      return res.status(403).json({ message: 'Only the owner can reset transactions' });

    await WalletTransaction.deleteMany({ walletId: req.params.id });
    res.json({ message: 'All transactions reset' });
  } catch (err) {
    console.error('Reset transactions error:', err);
    res.status(500).json({ message: 'Failed to reset transactions', error: err.message });
  }
});

// Save auto reset schedule (owner only)
router.put('/wallet/:id/reset-schedule', async (req, res) => {
  try {
    const { userId, resetSchedule } = req.body;
    const wallet = await SharedWallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });
    if (wallet.createdBy.toString() !== userId.toString())
      return res.status(403).json({ message: 'Only the owner can set the schedule' });

    const nextDate = calculateNextReset(resetSchedule);
    console.log(`[Schedule] Setting ${resetSchedule} → next reset: ${nextDate}`);

    wallet.resetSchedule = resetSchedule;
    wallet.nextResetDate = nextDate;
    await wallet.save();

    res.json({ message: 'Schedule saved', resetSchedule, nextResetDate: wallet.nextResetDate });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ message: 'Failed to save schedule', error: err.message });
  }
});

module.exports = router;