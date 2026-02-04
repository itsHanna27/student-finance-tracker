import React, { useState, useEffect, useMemo } from "react";

const useFinanceData = () => {
  const [transactions, setTransactions] = useState([]);
  const [savingGoals, setSavingGoals] = useState({ weekly: null, monthly: null });
  const [budgetGoals, setBudgetGoals] = useState({ weekly: null, monthly: null });
  const [balance, setBalance] = useState(0);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchAll = async () => {
      try {
        // transactions
        const txnRes = await fetch(
          `http://localhost:5000/transactions?userId=${currentUser.id}`
        );
        const txns = await txnRes.json();
        setTransactions(Array.isArray(txns) ? txns : []);

        // goals from transactions
        const savings = txns.filter(t => t.type === "saving");
        const budgets = txns.filter(t => t.type === "budget");

        setSavingGoals({
          weekly: savings.find(s => s.period === "weekly") || null,
          monthly: savings.find(s => s.period === "monthly") || null,
        });

        setBudgetGoals({
          weekly: budgets.find(b => b.period === "weekly") || null,
          monthly: budgets.find(b => b.period === "monthly") || null,
        });

        // balance
        const balRes = await fetch(
          `http://localhost:5000/api/balance?userId=${currentUser.id}`
        );
        const balData = await balRes.json();
        setBalance(balData.balance ?? 0);
      } catch (err) {
        console.error("Finance data fetch failed:", err);
      }
    };

    fetchAll();
  }, [currentUser?.id]);

  const monthlyData = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      income: 0,
      expenses: 0,
    }));

    transactions.forEach((t) => {
      const date = new Date(t.date);
      if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) return;

      const dayIndex = date.getDate() - 1;
      const amount = Number(t.amount);

      if (t.type === "income") data[dayIndex].income += amount;
      else if (t.type === "expense") data[dayIndex].expenses += amount;
    });

    return data;
  }, [transactions]);

  return {
    transactions,
    savingGoals,
    budgetGoals,
    balance,
    setTransactions,
    setBalance,
    userId: currentUser?.id,
    monthlyData, // <--- include it here for Dashboard
  };
};

export default useFinanceData;
