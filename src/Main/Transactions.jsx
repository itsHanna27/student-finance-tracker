import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaPlus, FaEdit, FaFilter, FaCreditCard, FaExclamationTriangle } from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import "../css/Transaction.css";

import useCountAnimation from "../Animation/useCountAnimation";

import AddBudget from "../Modal/addBudget";
import Withdraw from "../Modal/withdraw";
import EditTransaction from "../Modal/editTransaction";
import AddTransaction from "../Modal/AddTransaction";
import Congrats from "../Modal/congrats";

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

const Transactions = ({ setActiveTab }) => {
  // ---- TRACK BALANCE, GOAL & PROGRESS ----
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [currentEditTransaction, setCurrentEditTransaction] = useState(null);
  const [showCongratsModal, setShowCongratsModal] = useState(false);
  const [congratsData, setCongratsData] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const navigate = useNavigate();

  const [savingGoals, setSavingGoals] = useState({ weekly: null, monthly: null });
  const [budgetGoals, setBudgetGoals] = useState({ weekly: null, monthly: null });
  const [goalView, setGoalView] = useState("saving"); // "saving" or "budgeting"
  const [periodFilter, setPeriodFilter] = useState("weekly"); // "weekly" or "monthly"
  const [balance, setBalance] = useState(0);
  const [isLoadingGoal, setIsLoadingGoal] = useState(true);
  const [showBudgetAlert, setShowBudgetAlert] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [dismissedBudgetAlerts, setDismissedBudgetAlerts] = useState({});
const [budgetAlertData, setBudgetAlertData] = useState(null);

  const currentGoal = goalView === "saving" 
    ? savingGoals[periodFilter]
    : budgetGoals[periodFilter];
  
  // For budgeting: calculate spent from transactions
  // For saving: use currentSaved
  const calculateBudgetSpent = () => {
    if (goalView !== "budgeting" || !currentGoal) return 0;
    
    const startDate = new Date(currentGoal.startDate);
    const today = new Date();
    
    // Calculate period end date based on weekly/monthly
    const periodDays = currentGoal.period === "weekly" ? 7 : 30;
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + periodDays);
    
    // Sum up expenses from transactions within the budget period
    const spent = transactions
      .filter(t => {
        // Exclude saving and budget types
        if (t.type === "saving" || t.type === "budget") return false;
        
        // Only count expenses (negative amounts)
        if (t.amount >= 0) return false;
        
        // Check if transaction is within budget period
        const transactionDate = new Date(t.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return spent;
  };
  
  // Cap the displayed amount at goal amount
  const goalSaved = goalView === "saving" 
    ? Math.min(currentGoal?.currentSaved || 0, currentGoal?.amount || 0)
    : Math.min(calculateBudgetSpent(), currentGoal?.amount || 0);
    
  const progress = currentGoal ? (goalSaved / currentGoal.amount) * 100 : 0;
  const actualProgress = goalView === "saving"
    ? (currentGoal?.currentSaved || 0)
    : calculateBudgetSpent();

  // Check if goal is reached (for congratulations modal)
  const checkGoalReached = () => {
  if (goalView !== "saving") return;

  if (!currentGoal || currentGoal.congratsShown) return;

  const isGoalReached = currentGoal.currentSaved >= currentGoal.amount;

  if (isGoalReached) {
    setCongratsData({
      goalAmount: currentGoal.amount,
      period: periodFilter,
      streak: currentGoal.streak || 1
    });
    setShowCongratsModal(true);

    markCongratsAsShown(currentGoal._id);
  }
};


  const checkBudgetWarning = () => {
  if (goalView !== "budgeting" || !currentGoal) return;

  const spent = calculateBudgetSpent();
  const percentSpent = (spent / currentGoal.amount) * 100;

  if (
    percentSpent >= 80 &&
    percentSpent < 100 &&
    !currentGoal.alertShown &&
    !dismissedBudgetAlerts[currentGoal._id] &&
    !budgetAlertData
  ) {
    // Capture alert info once
    setBudgetAlertData({
      goalId: currentGoal._id,
      period: periodFilter,
      remaining: Math.max(0, currentGoal.amount - spent),
    });

    setShowBudgetAlert(true);
    markBudgetAlertShown(currentGoal._id);
  }
};


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

  const markBudgetAlertShown = async (goalId) => {
    try {
      await fetch(`http://localhost:5000/transactions/${goalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertShown: true }),
      });
    } catch (err) {
      console.error("Failed to mark alert as shown:", err);
    }
  };

  // Check goal status when data changes
  useEffect(() => {
    checkGoalReached();
    checkBudgetWarning();
  }, [currentGoal, transactions, goalView]);

  // Function to fetch saving goals and budgets
  const fetchSavingGoal = async () => {
    try {
      setIsLoadingGoal(true);
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser.id) return;

      const res = await fetch(`http://localhost:5000/transactions?userId=${currentUser.id}`);
      const data = await res.json();
      
      console.log("All transactions:", data);
      
      // Find all saving and budget goals
      const allSavings = data.filter((t) => t.type === "saving");
      const allBudgets = data.filter((t) => t.type === "budget");
      
      // Organize by period
      const savingsByPeriod = {
        weekly: allSavings.find(s => s.period === "weekly") || null,
        monthly: allSavings.find(s => s.period === "monthly") || null,
      };
      
      const budgetsByPeriod = {
        weekly: allBudgets.find(b => b.period === "weekly") || null,
        monthly: allBudgets.find(b => b.period === "monthly") || null,
      };
      
      console.log("Saving goals by period:", savingsByPeriod);
      console.log("Budgets by period:", budgetsByPeriod);
      
      setSavingGoals(savingsByPeriod);
      setBudgetGoals(budgetsByPeriod);
    } catch (err) {
      console.error("Failed to fetch goals:", err);
    } finally {
      setIsLoadingGoal(false);
    }
  };

  // Fetch saving goal on mount
  useEffect(() => {
    fetchSavingGoal();
  }, []);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser.id) return;

      try {
        const res = await fetch(
          `http://localhost:5000/transactions?userId=${currentUser.id}`
        );
        const data = await res.json();

        if (Array.isArray(data)) {
          setTransactions(data);
        } else {
          setTransactions([]);
        }
      } catch (err) {
        console.error("Failed to fetch transactions:", err);
        setTransactions([]);
      }
    };

    fetchTransactions();
  }, []);

  const handleAddTransaction = (newTransaction) => {
    setTransactions((prev) => [...prev, newTransaction]);
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = transactions.filter((t) => {
      // Filter out saving and budget types from the table
      if (t.type === "saving" || t.type === "budget") return false;
      
      const category = t.category ? t.category.toLowerCase() : "";
      const description = t.description ? t.description.toLowerCase() : "";
      const type = t.type ? t.type.toLowerCase() : "";
      return (
        category.includes(value) ||
        description.includes(value) ||
        type.includes(value)
      );
    });

    setFilteredTransactions(filtered);
  };

  useEffect(() => {
    // Filter out saving and budget types from the table
    const filtered = transactions.filter((t) => t.type !== "saving" && t.type !== "budget");
    setFilteredTransactions(filtered);
  }, [transactions]);

  const handleUpdateTransaction = async (updatedTransaction) => {
    try {
      const res = await fetch(
        `http://localhost:5000/transactions/${updatedTransaction._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTransaction),
        }
      );

      if (!res.ok) throw new Error("Failed to update transaction on server");

      const savedTransaction = await res.json();

      setTransactions(
        transactions.map((t) =>
          t._id === savedTransaction._id ? savedTransaction : t
        )
      );
    } catch (err) {
      console.error("Update failed:", err);
      alert("Could not save changes. Please try again.");
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setTransactions(transactions.filter((t) => t._id !== id));
      setIsEditTransactionOpen(false);
    } catch (err) {
      console.error(err);
      alert("Could not delete transaction. Please try again.");
    }
  };

  const PIE_COLORS = ["#b387ff", "#f5a6ff", "#c45bff", "#f4caff"];
  const lineData = [
    { month: "Jan", value: 1020 },
    { month: "Feb", value: 840 },
    { month: "Mar", value: 680 },
    { month: "Apr", value: 950 },
    { month: "May", value: 870 },
    { month: "Jun", value: 660 },
    { month: "Jul", value: 720 },
    { month: "Aug", value: 760 },
    { month: "Sept", value: 756 },
    { month: "Oct", value: 890 },
    { month: "Nov", value: 600 },
    { month: "Dec", value: 540 },
  ];
  const pieData = [
    { name: "Food", value: 300 },
    { name: "Transport", value: 200 },
    { name: "Shopping", value: 250 },
    { name: "Subscriptions", value: 150 },
  ];

  // Check if we're in standalone mode (has its own page) or embedded in Account
  const isStandalone = !setActiveTab || typeof setActiveTab !== 'function';

  // The main content
  const content = (
    <div
      style={{
        background: isStandalone ? "linear-gradient(100deg, #111827, #0F0F1A)" : "transparent",
        minHeight: isStandalone ? "100vh" : "auto",
        width: "100%",
        color: "white",
        padding: isStandalone ? "16px" : "0",
      }}
    >
      <div style={{ minHeight: isStandalone ? "100vh" : "auto", padding: "5px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "40px",
              fontWeight: "500",
              marginBottom: "0px",
              color: "#A78BFA",
            }}
          >
            Financial Overview
          </h1>
          <p
            style={{
              fontSize: "16px",
              fontWeight: "100",
              marginBottom: "40px",
              color: "#b8b8b8ff",
            }}
          >
            View and manage all your recent income and expenses in one place.
          </p>

          {/* Budget Alert */}
         {showBudgetAlert && budgetAlertData && (
      <div className="budget-alert">
        <FaExclamationTriangle className="alert-icon" />
        <span>
          Warning! You've used more than 80% of your {budgetAlertData.period} budget. Only £{budgetAlertData.remaining.toFixed(2)} remaining.
        </span>
        <button
          onClick={() => {
            setShowBudgetAlert(false);
            setDismissedBudgetAlerts(prev => ({ ...prev, [budgetAlertData.goalId]: true }));
            setBudgetAlertData(null);
          }}
        >
          ✕
        </button>
      </div>
    )}



          <div className="overview-container">
            {/* Current Balance */}
            <div className="small-card balance-card">
              <h3>Current Balance</h3>
              <p className="balance-amount">£{balance.toFixed(2)}</p>
              <p className="card-number">XXXX XXXX XXXX XXXX 3456</p>
            </div>

            {/* Saving/Budget Goal */}
            <div style={{ width: "85vh" }} className="small-card goal-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div 
                  className="goal-tag"
                  onClick={() => setPeriodFilter(periodFilter === "weekly" ? "monthly" : "weekly")}
                >
                  {periodFilter === "weekly" ? "Weekly" : "Monthly"}
                </div>

                <div className="goal-toggle">
                  <button
                    className={`toggle-btn ${goalView === "budgeting" ? "active" : ""}`}
                    onClick={() => setGoalView("budgeting")}
                  >
                    Budgeting
                  </button>
                  <button
                    className={`toggle-btn ${goalView === "saving" ? "active" : ""}`}
                    onClick={() => setGoalView("saving")}
                  >
                    Saving
                  </button>
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
                  £{goalSaved.toFixed(2)}/£{currentGoal ? currentGoal.amount : 0}
                </span>
              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ 
                    width: currentGoal ? `${Math.min(progress, 100)}%` : "0%",
                  }}
                />
              </div>

              {goalView === "saving" ? (
                // Saving view: show Add/Withdraw buttons
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    className="goal-btn"
                    onClick={() => {
                      if (currentGoal) {
                        setIsAddBudgetOpen(true);
                      } else {
                        if (setActiveTab && typeof setActiveTab === "function") {
                          setActiveTab("budget");
                        } else {
                          navigate("/account", { state: { activeTab: "budget" } });
                        }
                      }
                    }}
                  >
                    {currentGoal ? "Add to goal" : "Create goal"}
                  </button>

                  {currentGoal && (
                    <button
                      className="withdraw-btn"
                      onClick={() => setIsWithdrawOpen(true)}
                    >
                      Withdraw Amount
                    </button>
                  )}
                </div>
              ) : (
                // Budget view: show create budget button or just info
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {!currentGoal && (
                    <button
                      className="goal-btn"
                      onClick={() => {
                        if (setActiveTab && typeof setActiveTab === "function") {
                          setActiveTab("budget");
                        } else {
                          navigate("/account", { state: { activeTab: "budget" } });
                        }
                      }}
                    >
                      Create budget
                    </button>
                  )}
                </div>
              )}
            </div>

          
           {/* Modals */}
              {isAddBudgetOpen && currentGoal && (
                <AddBudget
                  savingGoal={currentGoal}
                  onUpdate={fetchSavingGoal}
                  onClose={() => {
                    setIsAddBudgetOpen(false);
                    fetchSavingGoal();
                  }}
                />
              )}
              {isWithdrawOpen && currentGoal && (
                <Withdraw
                  savingGoal={currentGoal}
                  onUpdate={fetchSavingGoal}
                  onClose={() => {
                    setIsWithdrawOpen(false);
                    fetchSavingGoal();
                  }}
                />
              )}

            {isEditTransactionOpen && currentEditTransaction && (
              <EditTransaction
                transaction={currentEditTransaction}
                onClose={() => setIsEditTransactionOpen(false)}
                onSave={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
              />
            )}

            {isAddTransactionOpen && (
              <AddTransaction
                onClose={() => setIsAddTransactionOpen(false)}
                onAddTransaction={handleAddTransaction}
                setTransactions={setTransactions}
                setShowEdit={setIsEditTransactionOpen}
              />
            )}

            {/* Congratulations Modal */}
            {showCongratsModal && congratsData && (
              <Congrats
                {...congratsData}
                onClose={() => {
                  setShowCongratsModal(false);
                  setCongratsData(null);
                }}
                onCreateNew={() => {
                  setShowCongratsModal(false);
                  setCongratsData(null);
                  if (setActiveTab && typeof setActiveTab === "function") {
                    setActiveTab("budget");
                  } else {
                    navigate("/account", { state: { activeTab: "budget" } });
                  }
                }}
              />
            )}

            {/* Charts */}
            <div className="charts-container">
              {/* Line Chart */}
              <div style={{ width: "600px" }} className="chart-card">
                <h3 className="chart-title">Spending Over Time</h3>
                <div className="chart-tag">Monthly</div>

                <ResponsiveContainer width="100%" height={270}>
                  <LineChart data={lineData}>
                    <XAxis
                      dataKey="month"
                      stroke="#cda9ff"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke="#cda9ff" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1c1c1e",
                        borderRadius: "8px",
                        border: "1px solid #b387ff",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#d08cff"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#d08cff", strokeWidth: 2 }}
                      activeDot={{ r: 7 }}
                      animationDuration={800}
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="chart-card pie-card">
                <h3 className="chart-title">Spending Breakdown</h3>

                <ResponsiveContainer width="100%" height={310}>
                  <PieChart>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1c1c1e",
                        borderRadius: "8px",
                        border: "1px solid #b387ff",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                    <Legend verticalAlign="bottom" height={36} />

                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      paddingAngle={0}
                      dataKey="value"
                      animationDuration={800}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transactions */}
            <div className="transactions-container">
              <h2 className="transactions-title">
                <FaCreditCard style={{ color: "#A78BFA", fontSize: "45px" }} />
                Transactions
              </h2>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                  flexWrap: "wrap",
                  gap: "15px",
                }}
              >
                <div
                  className="search-bar"
                  style={{ flex: 1, minWidth: "250px" }}
                >
                  <FaSearch className="search-icon" />
                  <input
                    placeholder="Search transaction by category, type, or description"
                    value={searchTerm}
                    onChange={handleSearch}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                  <button
                    style={{
                      background: "#A78BFA",
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: "none",
                      color: "white",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                    onClick={() => setIsAddTransactionOpen(true)}
                  >
                    <FaPlus /> Add Transaction
                  </button>

                  <button className="filter-btn">
                    <FaFilter />
                  </button>
                </div>
              </div>

              <div className="table-wrapper" style={{ overflowX: "auto" }}>
                <table
                  className="transactions-table"
                  style={{ width: "100%", tableLayout: "fixed" }}
                >
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
                        <td>
                          {t.date ? new Date(t.date).toLocaleDateString() : "-"}
                        </td>

                        <td>
                          <span className={`type-badge ${t.type}`}>
                            {t.type === "studentfinance"
                              ? "Student Finance"
                              : t.type === "subscription"
                              ? "Subscription"
                              : t.type.charAt(0).toUpperCase() + t.type.slice(1)}
                          </span>
                        </td>

                        <td>
                          {t.type.toLowerCase() === "subscription"
                            ? t.category || "-"
                            : t.type.toLowerCase() === "studentfinance"
                            ? "Student Finance"
                            : t.category || "-"}
                        </td>

                        <td style={{ wordBreak: "break-word" }}>
                          {t.description ?? "-"}
                        </td>

                        <td
                          className={
                            t.amount > 0 ? "amount-positive" : "amount-negative"
                          }
                        >
                          {(t.amount ?? 0).toFixed(2)}
                        </td>

                        <td>
                          <button
                            className="edit-btn"
                            onClick={() => {
                              setCurrentEditTransaction(t);
                              setIsEditTransactionOpen(true);
                            }}
                          >
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
  );

  // If standalone page, wrap with layout
  if (isStandalone) {
    return (
      <>
        <style>{`
          html, body {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          color: white;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden;
          overflow-x: hidden !important;
        }

        body::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          z-index: -1;
        }
          }
        `}</style>

        <Navbar />
        {content}
      </>
    );
  }

  // If embedded in Account, return just the content
  return content;
};

export default Transactions;