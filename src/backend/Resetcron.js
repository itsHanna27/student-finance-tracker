const cron = require('node-cron');
const { SharedWallet, WalletTransaction } = require('./models/sharedWallet');

// Runs every day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Checking wallets for scheduled resets...');
  try {
    const now = new Date();

    const wallets = await SharedWallet.find({
      resetSchedule: { $ne: "none" },
      nextResetDate: { $lte: now },
    });

    for (const wallet of wallets) {
      await WalletTransaction.deleteMany({ walletId: wallet._id.toString() });
      wallet.lastResetDate = now;
      wallet.nextResetDate = calculateNextReset(wallet.resetSchedule);
      await wallet.save();
      console.log(`[Cron] Reset transactions for wallet: ${wallet.title}`);
    }

    console.log(`[Cron] Done. Reset ${wallets.length} wallet(s).`);
  } catch (err) {
    console.error('[Cron] Reset error:', err);
  }
});

const calculateNextReset = (schedule) => {
  const now = new Date();
  if (schedule === "weekly")  { now.setDate(now.getDate() + 7); return now; }
  if (schedule === "monthly") { now.setMonth(now.getMonth() + 1); return now; }
  if (schedule === "yearly")  { now.setFullYear(now.getFullYear() + 1); return now; }
  return null;
};

module.exports = {};