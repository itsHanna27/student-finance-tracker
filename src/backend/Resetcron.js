const cron = require('node-cron');
const Transaction = require('./models/Transaction');
const Balance = require('./models/Balance');

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
  } catch (err) {
    console.error('[RecurringCron] Balance recalc error:', err);
  }
};

const advanceDate = (date, frequency) => {
  const next = new Date(date);
  if (frequency === "weekly")  { next.setDate(next.getDate() + 7); return next; }
  if (frequency === "monthly") { next.setMonth(next.getMonth() + 1); return next; }
  if (frequency === "yearly")  { next.setFullYear(next.getFullYear() + 1); return next; }
  return null;
};

// Runs every day at 9am
cron.schedule('0 9 * * *', async () => {
  const now = new Date();
  console.log(`[RecurringCron] ====== TICK at ${now.toISOString()} ======`);

  try {
    const originals = await Transaction.find({
      frequency: { $in: ["weekly", "monthly", "yearly"] },
      type: { $in: ["house", "subscription"] },
      parentId: { $exists: false },
    });

    console.log(`[RecurringCron] Found ${originals.length} original recurring transaction(s)`);

    for (const t of originals) {
      let baseDate = new Date(t.lastProcessed || t.createdAt);
      let copiesCreated = 0;

      // Loop — keep creating copies until we've caught up to now
      while (true) {
        const nextDue = advanceDate(baseDate, t.frequency);
        if (!nextDue || nextDue > now) break;

        const newDateStr = nextDue.toISOString().split('T')[0];

        // Guard against duplicates
        const alreadyExists = await Transaction.findOne({
          parentId: t._id.toString(),
          date: newDateStr,
          userId: t.userId,
        });

        if (!alreadyExists) {
          const newTransaction = new Transaction({
            date: newDateStr,
            type: t.type,
            category: t.category,
            description: t.description,
            amount: t.amount,
            frequency: t.frequency,
            userId: t.userId,
            parentId: t._id.toString(),
          });
          await newTransaction.save();
          copiesCreated++;
          console.log(`[RecurringCron] ✅ Created copy: ${t.category} (${t.frequency}) → ${newDateStr}`);
        }

        // Advance base date so next loop iteration checks the period after this one
        baseDate = nextDue;
      }

      // Update lastProcessed to now so next daily run starts from today
      if (copiesCreated > 0) {
        await Transaction.findByIdAndUpdate(t._id, { lastProcessed: now });
        await recalculateUserBalance(t.userId);
        console.log(`[RecurringCron] "${t.category}" — ${copiesCreated} copy/copies created`);
      }
    }

    console.log(`[RecurringCron] ====== DONE ======`);
  } catch (err) {
    console.error('[RecurringCron] Error:', err);
  }
});

module.exports = {};