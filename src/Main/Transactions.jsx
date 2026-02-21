import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlus, FaEdit, FaFilter, FaCreditCard, FaExclamationTriangle } from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import "../css/Transaction.css";
import CurrentBalance from "../Modal/currentBalance";
import AddBudget from "../Modal/addBudget";
import Withdraw from "../Modal/withdraw";
import EditTransaction from "../Modal/editTransaction";
import AddTransaction from "../Modal/AddTransaction";
import Congrats from "../Modal/congrats";
import Bestie from "../Modal/bestie";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

const Transactions = () => {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [currentEditTransaction, setCurrentEditTransaction] = useState(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [congratsData, setCongratsData] = useState(null);
  const [includeHouseRent, setIncludeHouseRent] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [savingGoals, setSavingGoals] = useState({ weekly: null, monthly: null });
  const [budgetGoals, setBudgetGoals] = useState({ weekly: null, monthly: null });
  const [goalView, setGoalView] = useState("saving");
  const [periodFilter, setPeriodFilter] = useState("weekly");
  const [balance, setBalance] = useState(0);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);
  const [lineChartPeriod, setLineChartPeriod] = useState("weekly");
  const [transactions, setTransactions] = useState([]);
  const [dismissedBudgetAlerts, setDismissedBudgetAlerts] = useState({});
  const [budgetAlertData, setBudgetAlertData] = useState(null);
  const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // which goal to show based on current view and period toggle
  const currentGoal = goalView === "saving"
    ? savingGoals[periodFilter]
    : budgetGoals[periodFilter];

  // Calculates how much has been spent within the budget goal's time window
  const calculateBudgetSpent = () => {
    const budgetGoal = budgetGoals[periodFilter];
    if (!budgetGoal) return 0;
    const startDate = new Date(budgetGoal.startDate);
    const periodDays = budgetGoal.period === "weekly" ? 7 : 30;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + periodDays);
    return transactions
      .filter(t => {
        if (t.type === "saving" || t.type === "budget") return false;
        if (t.amount >= 0) return false;
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  // Caps progress at the goal amount so the bar never overflows
  const goalSaved = goalView === "saving"
    ? Math.min(currentGoal?.currentSaved || 0, currentGoal?.amount || 0)
    : Math.min(calculateBudgetSpent(), currentGoal?.amount || 0);

  const progress = currentGoal ? (goalSaved / currentGoal.amount) * 100 : 0;

  // Uncapped version used to show if you've gone over budget 
  const actualProgress = goalView === "saving"
    ? (currentGoal?.currentSaved || 0)
    : calculateBudgetSpent();

  // Shows the congrats modal if a saving goal has been reached
  const checkGoalReached = () => {
    if (goalView !== "saving") return;
    if (!currentGoal || currentGoal.congratsShown) return;
    if (currentGoal.currentSaved >= currentGoal.amount) {
      setCongratsData({ goalAmount: currentGoal.amount, period: periodFilter, streak: currentGoal.streak || 1 });
      setShowCongratsModal(true);
      markCongratsAsShown(currentGoal._id);
    }
  };

  // Shows a warning banner if spending hits 80% of  budget
  const checkBudgetWarning = () => {
    ["weekly", "monthly"].forEach((period) => {
      const budgetGoal = budgetGoals[period];
      if (!budgetGoal || !budgetGoal.amount) return;
      const startDate = new Date(budgetGoal.startDate);
      const periodDays = budgetGoal.period === "weekly" ? 7 : 30;
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + periodDays);
      const spent = transactions
        .filter(t => {
          if (t.type === "saving" || t.type === "budget") return false;
          if (t.amount >= 0) return false;
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const percentSpent = (spent / budgetGoal.amount) * 100;
      if (percentSpent >= 80 && !dismissedBudgetAlerts[budgetGoal._id]) {
        setBudgetAlertData({
          goalId: budgetGoal._id,
          period,
          spent,
          budgetAmount: budgetGoal.amount,
          exceeded: spent > budgetGoal.amount,
          exceededBy: spent > budgetGoal.amount ? spent - budgetGoal.amount : 0,
          remaining: budgetGoal.amount - spent,
        });
        setShowBudgetAlert(true);
      }
    });
  };

  // Marks congrats as shown in DB so it doesn't pop up again on refresh
  const markCongratsAsShown = async (goalId) => {
    try {
      await fetch(`http://localhost:5000/transactions/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ congratsShown: true }),
      });
    } catch (err) {
      console.error("Failed to mark congrats as shown:", err);
    }
  };

  // Fetches balance from backend
  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`http://localhost:5000/api/balance?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(data => setBalance(data.balance))
      .catch(err => console.error("Failed to fetch balance:", err));
  }, [currentUser?.id]);

  // Check goal and budget warning whenever transactions or goal changes
  useEffect(() => {
    checkGoalReached();
    checkBudgetWarning();
  }, [currentGoal, transactions, goalView]);

  // Returns true if a goal's time period has fully expired
  const isGoalExpired = (startDate, period) => {
    if (!startDate) return false;
    const start = new Date(startDate);
    const now = new Date();
    const maxDays = period === "weekly" ? 7 : 30;
    const diffInMs = start.getTime() + maxDays * 24 * 60 * 60 * 1000 - now.getTime();
    return Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) <= 0;
  };

  // Deletes an expired goal from the DB automatically
  const autoDeleteIfExpired = async (goal) => {
    if (!goal || !goal.startDate) return false;
    if (isGoalExpired(goal.startDate, goal.period)) {
      try {
        await fetch(`http://localhost:5000/transactions/${goal._id}`, { method: "DELETE" });
        return true;
      } catch (err) {
        console.error("Failed to auto-delete expired goal:", err);
        return false;
      }
    }
    return false;
  };

  // Fetches saving and budget goals, auto-deletes any expired ones
  const fetchSavingGoal = async () => {
    try {
      setIsLoadingGoal(true);
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser.id) return;
      const res = await fetch(`http://localhost:5000/transactions?userId=${currentUser.id}`);
      const data = await res.json();

      const savingsByPeriod = { weekly: null, monthly: null };
      const budgetsByPeriod = { weekly: null, monthly: null };

      for (const saving of data.filter(t => t.type === "saving")) {
        const wasDeleted = await autoDeleteIfExpired(saving);
        if (!wasDeleted && saving.period) savingsByPeriod[saving.period] = saving;
      }
      for (const budget of data.filter(t => t.type === "budget")) {
        const wasDeleted = await autoDeleteIfExpired(budget);
        if (!wasDeleted && budget.period) budgetsByPeriod[budget.period] = budget;
      }

      setSavingGoals(savingsByPeriod);
      setBudgetGoals(budgetsByPeriod);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    } finally {
      setIsLoadingGoal(false);
    }
  };

  // Fetch goals on mount, then re-check every 60 seconds 
  useEffect(() => { fetchSavingGoal(); }, []);
  useEffect(() => {
    const intervalId = setInterval(fetchSavingGoal, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // fetches balance from backend
  const recalculateBalance = async () => {
    if (!currentUser?.id) return;
    try {
      const res = await fetch(`http://localhost:5000/api/balance?userId=${currentUser.id}`);
      const data = await res.json();
      setBalance(data.balance);
    } catch (err) {
      console.error("Failed to fetch balance:", err);
    }
  };

  // Fetches all transactions for this user on mount
  useEffect(() => {
    const fetchTransactions = async () => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser.id) return;
      try {
        const res = await fetch(`http://localhost:5000/transactions?userId=${currentUser.id}`);
        const data = await res.json();
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setTransactions([]);
      }
    };
    fetchTransactions();
  }, []);

  // Adds a new transaction to local state and refreshes balance
  const handleAddTransaction = (newTransaction) => {
    const type = newTransaction.type?.toLowerCase();
    if (type === "studentfinance") { recalculateBalance(); return; }
    setTransactions((prev) => [...prev, newTransaction]);
    recalculateBalance();
  };

  // Filters transactions as user types in the search bar
  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = transactions.filter((t) => {
      const type = t.type?.toLowerCase();
      if (type === "saving" || type === "budget" || type === "studentfinance") return false;
      return (
        (t.category?.toLowerCase() || "").includes(value) ||
        (t.description?.toLowerCase() || "").includes(value) ||
        type.includes(value)
      );
    });
    setFilteredTransactions(filtered);
  };

  // Keeps the table in sync whenever transactions change, excluding internal types
  useEffect(() => {
    const filtered = transactions.filter((t) => {
      const type = t.type?.toLowerCase();
      return type !== "saving" && type !== "budget" && type !== "studentfinance";
    });
    setFilteredTransactions(filtered);
  }, [transactions]);

  // Saves an edited transaction to the backend and updates local state
  const handleUpdateTransaction = async (updatedTransaction) => {
    try {
      const res = await fetch(`http://localhost:5000/transactions/${updatedTransaction._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTransaction),
      });
      if (!res.ok) throw new Error("Failed to update");
      const saved = await res.json();
      setTransactions(transactions.map(t => t._id === saved._id ? saved : t));
      recalculateBalance();
      setIsEditTransactionOpen(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Could not save changes. Please try again.");
    }
  };

  // Deletes a transaction from the backend and removes it from local state
  const handleDeleteTransaction = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/transactions/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setTransactions(transactions.filter(t => t._id !== id));
      setIsEditTransactionOpen(false);
      recalculateBalance();
    } catch (err) {
      console.error(err);
      alert("Could not delete transaction. Please try again.");
    }
  };

  // Pie chart slice colours
  const PIE_COLORS = ["#b387ff", "#f5a6ff", "#c45bff", "#f4caff", "#9b59b6"];

  // Line chart data — builds weekly or monthly spending totals
  const lineData = React.useMemo(() => {
    if (lineChartPeriod === "weekly") {
      const days = [];
      const today = new Date();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      // Loop through last 7 days, oldest first
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        // Set exact start and end of this day
        const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
        // Filter to real expenses only, then add them up
        const daySpending = transactions
          .filter(t => {
            if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return false;
            if (t.amount >= 0) return false;
            const d = new Date(t.date);
            return d >= dayStart && d <= dayEnd;
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        days.push({ month: dayNames[date.getDay()], value: daySpending });
      }
      return days;
    } else {
      const months = [];
      const today = new Date();
      // Loop through last 12 months, oldest first
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        // Filter to real expenses only, then add them up
        const monthSpending = transactions
          .filter(t => {
            if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return false;
            if (t.amount >= 0) return false;
            const d = new Date(t.date);
            return d >= monthStart && d <= monthEnd;
          })
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        months.push({ month: monthDate.toLocaleDateString('en-US', { month: 'short' }), value: monthSpending });
      }
      return months;
    }
  }, [transactions, lineChartPeriod]);

  // Pie chart data — totals spending per category, top 5 shown + rest merged to "Other"
  const pieData = React.useMemo(() => {
    const categoryTotals = {};
    transactions.forEach((t) => {
      if (t.amount >= 0) return;
      if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return;
      const category = t.category?.trim().toLowerCase() || "other";
      // Check if house/bills related
      const isHouseBills = ["house_rent", "house rent", "rent", "bills", "utilities", "housing"].includes(category);
      // Skip house/bills if user toggled them off
      if (!includeHouseRent && isHouseBills) return;
      const categoryName = t.category?.trim() || "Other";
      categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Math.abs(t.amount);
    });
    // Sort highest to lowest
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    const topFive = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const data = topFive.map(([name, value]) => ({ name, value }));
    if (rest.length > 0) {
      data.push({ name: "Other", value: rest.reduce((sum, [, v]) => sum + v, 0) });
    }
    return data;
  }, [transactions, includeHouseRent]);

  // Opens the edit balance modal
  const editBalance = () => setIsEditBalanceOpen(true);

  return (
    <>
      <style>{`
        html, body {
          margin: 0; padding: 0;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          color: white; width: 100%; min-height: 100%; overflow-x: hidden;
        }
        body::after {
          content: ''; position: fixed; top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(100deg, #111827, #0F0F1A); z-index: -1;
        }
      `}</style>

      <Navbar />
      <Bestie
        balance={balance}
        transactions={transactions}
        savingGoals={savingGoals}
        budgetGoals={budgetGoals}
        userId={currentUser?.id}
      />

      <div style={{ background: "linear-gradient(100deg, #111827, #0F0F1A)", minHeight: "100vh", width: "100%", color: "white", padding: "16px" }}>
        <div style={{ minHeight: "100vh", padding: "5px", textAlign: "center" }}>
          <h1 style={{ fontSize: "40px", fontWeight: "500", marginBottom: "0px", color: "#A78BFA" }}>
            Financial Overview
          </h1>
          <p style={{ fontSize: "16px", fontWeight: "100", marginBottom: "40px", color: "#b8b8b8ff" }}>
            View and manage all your recent income and expenses in one place.
          </p>

          {/* Budget warning banner */}
          {showBudgetAlert && budgetAlertData && (
            <div className="budget-alert">
              <FaExclamationTriangle className="alert-icon" />
              <span>
                {budgetAlertData.exceeded ? (
                  <>You've exceeded your {budgetAlertData.period} budget by{" "}
                    <span style={{ color: "#ff5555", fontWeight: 700 }}>£{budgetAlertData.exceededBy.toFixed(2)}</span>
                  </>
                ) : (
                  <>Warning! You've used more than 80% of your {budgetAlertData.period} budget. Only{" "}
                    <span style={{ color: "#ff0000", fontWeight: 600 }}>£{budgetAlertData.remaining.toFixed(2)}</span> remaining.
                  </>
                )}
              </span>
              <button onClick={() => {
                setShowBudgetAlert(false);
                setDismissedBudgetAlerts(prev => ({ ...prev, [budgetAlertData.goalId]: true }));
                setBudgetAlertData(null);
              }}>✕</button>
            </div>
          )}

          <div className="overview-container">

            {/* Balance card */}
            <div className="small-card balance-card">
              <button onClick={editBalance} style={{ position: "absolute", left: "20px", background: "#01041E", color: "white", border: "1px solid white", padding: "8px 15px", borderRadius: "20px", cursor: "pointer" }} className="edit-btn">Edit</button>
              <h3>Current Balance</h3>
              <p className="balance-amount">£{balance.toFixed(2)}</p>
              <p className="card-number">XXXX XXXX XXXX XXXX 3456</p>
            </div>

            {/* Saving / Budget goal card */}
            <div style={{ width: "85vh" }} className="small-card goal-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {/* Toggles between weekly and monthly */}
                <div className="goal-tag" onClick={() => setPeriodFilter(periodFilter === "weekly" ? "monthly" : "weekly")}>
                  {periodFilter === "weekly" ? "Weekly" : "Monthly"}
                </div>
                {/* Toggles between saving and budgeting views */}
                <div className="goal-toggle">
                  <button className={`toggle-btn ${goalView === "budgeting" ? "active" : ""}`} onClick={() => setGoalView("budgeting")}>Budgeting</button>
                  <button className={`toggle-btn ${goalView === "saving" ? "active" : ""}`} onClick={() => setGoalView("saving")}>Saving</button>
                </div>
              </div>

              <h3>{goalView === "saving" ? "Saving Goal" : "Budget"}</h3>
              <p className="goal-sub">
                {currentGoal
                  ? currentGoal.title || `${goalView === "saving" ? "Save" : "Budget"} £${currentGoal.amount}`
                  : `No ${periodFilter} ${goalView} goal set yet`}
              </p>

              <div className="progress-row">
                <span>{goalView === "saving" ? "Progress" : "Spent"}</span>
                <span>
                  <span style={goalView === "budgeting" && currentGoal && actualProgress > currentGoal.amount ? { color: "#ff5555" } : {}}>
                    £{goalView === "budgeting" ? actualProgress.toFixed(2) : goalSaved.toFixed(2)}
                  </span>/£{currentGoal ? currentGoal.amount.toFixed(2) : "0.00"}
                </span>
              </div>

              {/* Progress bar + turns red if over budget */}
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: currentGoal ? `${Math.min(progress, 100)}%` : "0%",
                  backgroundColor: goalView === "budgeting" && currentGoal && actualProgress > currentGoal.amount ? "#ff5555" : undefined,
                }} />
              </div>

              {goalView === "saving" ? (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="goal-btn" onClick={() => {
                    if (currentGoal) { setIsAddBudgetOpen(true); }
                    else { navigate("/account", { state: { activeTab: "budget" } }); }
                  }}>
                    {currentGoal ? "Add to goal" : "Create goal"}
                  </button>
                  {currentGoal && (
                    <button className="withdraw-btn" onClick={() => setIsWithdrawOpen(true)}>Withdraw Amount</button>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {!currentGoal && (
                    <button className="goal-btn" onClick={() => navigate("/account", { state: { activeTab: "budget" } })}>
                      Create budget
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modals */}
            {isAddBudgetOpen && currentGoal && (
              <AddBudget savingGoal={currentGoal} onUpdate={fetchSavingGoal} onClose={() => { setIsAddBudgetOpen(false); fetchSavingGoal(); }} />
            )}
            {isWithdrawOpen && currentGoal && (
              <Withdraw savingGoal={currentGoal} onUpdate={fetchSavingGoal} onClose={() => { setIsWithdrawOpen(false); fetchSavingGoal(); }} />
            )}
            {isEditTransactionOpen && currentEditTransaction && (
              <EditTransaction transaction={currentEditTransaction} onClose={() => setIsEditTransactionOpen(false)} onSave={handleUpdateTransaction} onDelete={handleDeleteTransaction} />
            )}
            {isEditBalanceOpen && (
              <CurrentBalance balance={balance} setBalance={setBalance} onClose={() => setIsEditBalanceOpen(false)} onAddTransaction={handleAddTransaction} />
            )}
            {isAddTransactionOpen && (
              <AddTransaction onClose={() => setIsAddTransactionOpen(false)} onAddTransaction={handleAddTransaction} setTransactions={setTransactions} setShowEdit={setIsEditTransactionOpen} />
            )}
            {showCongratsModal && congratsData && (
              <Congrats
                {...congratsData}
                onClose={() => { setShowCongratsModal(false); setCongratsData(null); }}
                onCreateNew={() => { setShowCongratsModal(false); setCongratsData(null); navigate("/account", { state: { activeTab: "budget" } }); }}
              />
            )}

            {/* Charts */}
            <div className="charts-container">

              {/* Line chart */}
              <div style={{ width: "600px" }} className="chart-card">
                <h3 className="chart-title" style={{ marginBottom: "30px" }}>Spending Over Time</h3>
                <div className="chart-tag" onClick={() => setLineChartPeriod(lineChartPeriod === "weekly" ? "monthly" : "weekly")} style={{ cursor: "pointer" }}>
                  {lineChartPeriod === "weekly" ? "Weekly" : "Monthly"}
                </div>
                <ResponsiveContainer width="100%" height={270}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="month" stroke="#cda9ff" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#cda9ff" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1c1c1e", borderRadius: "8px", border: "1px solid #b387ff" }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value) => `£${Number(value).toFixed(2)}`}
                    />
                    <Line type="monotone" dataKey="value" stroke="#d08cff" strokeWidth={3} dot={{ r: 5, fill: "#d08cff", strokeWidth: 2 }} activeDot={{ r: 7 }} animationDuration={800} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart */}
              <div className="chart-card pie-card">
                <h3 className="chart-title" style={{ marginTop: "-8px" }}>Spending Breakdown</h3>
                <label className="rent-toggle">
                  <input type="checkbox" checked={includeHouseRent} onChange={() => setIncludeHouseRent(!includeHouseRent)} />
                  <span className="slider" />
                  <span className="toggle-text">Include house/bills transactions</span>
                </label>
                <ResponsiveContainer width="100%" height={310}>
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1c1c1e", borderRadius: "8px", border: "1px solid #b387ff" }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value) => `£${Number(value).toFixed(2)}`}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                    <Pie key={includeHouseRent ? "include" : "exclude"} data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={false}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === "Other" ? "#5f47b3" : PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transactions table */}
            <div className="transactions-container">
              <h2 className="transactions-title">
                <FaCreditCard style={{ color: "#A78BFA", fontSize: "45px" }} />
                Transactions
              </h2>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "15px" }}>
                <div className="search-bar" style={{ flex: 1, minWidth: "250px" }}>
                  <input placeholder="Search transaction by category, type, or description" value={searchTerm} onChange={handleSearch} />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                  <button style={{ background: "#A78BFA", padding: "10px 18px", borderRadius: "8px", border: "none", color: "white", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}
                    onClick={() => setIsAddTransactionOpen(true)}>
                    <FaPlus /> Add Transaction
                  </button>
                  <button className="filter-btn"><FaFilter /></button>
                </div>
              </div>

              <div className="table-wrapper" style={{ overflowX: "auto" }}>
                <table className="transactions-table" style={{ width: "100%", tableLayout: "fixed" }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount(£)</th>
                      <th>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((t, index) => (
                      <tr key={index}>
                        <td>{t.date ? new Date(t.date).toLocaleDateString() : "-"}</td>
                        <td>
                          <span className={`type-badge ${t.type}`}>
                            {t.type === "studentfinance" ? "Student Finance"
                              : t.type === "subscription" ? "Subscription"
                              : t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          </span>
                        </td>
                        <td>
                          {t.type.toLowerCase() === "subscription" ? t.category || "-"
                            : t.type.toLowerCase() === "studentfinance" ? "Student Finance"
                            : t.category || "-"}
                        </td>
                        <td style={{ wordBreak: "break-word" }}>{t.description ?? "-"}</td>
                        <td className={t.amount > 0 ? "amount-positive" : "amount-negative"}>
                          {Math.abs(t.amount ?? 0).toFixed(2)}
                        </td>
                        <td>
                          <button className="edit-btn" onClick={() => { setCurrentEditTransaction(t); setIsEditTransactionOpen(true); }}>
                            <FaEdit />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Transactions;