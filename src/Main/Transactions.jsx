import React, { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaEdit, FaFilter, FaCreditCard } from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import "../css/Transaction.css";

import useCountAnimation from "../Animation/useCountAnimation";

import AddBudget from "../Modal/addBudget";
import Withdraw from "../Modal/withdraw";
import EditTransaction from "../Modal/editTransaction";
import AddTransaction from "../Modal/AddTransaction";


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
  // ---- TRACK BALANCE, GOAL & PROGRESS ----
  const [balance, setBalance] = useState(0);
  const [goalSaved, setGoalSaved] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
   const [currentEditTransaction, setCurrentEditTransaction] = useState(null);

   const [searchTerm, setSearchTerm] = useState("");
const [filteredTransactions, setFilteredTransactions] = useState([]);


  const balanceTarget = 634.56;
  const goalTarget = 350;



  const [transactions, setTransactions] = useState([]);
useEffect(() => {
  const fetchTransactions = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser.id) return; 

    try {
      const res = await fetch(
        `http://localhost:5000/transactions?userId=${currentUser.id}`
      );
      const data = await res.json();

      // making data a array
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
  setFilteredTransactions(transactions);
}, [transactions]);
  // Ultra-smooth animation
  useCountAnimation(balanceTarget, goalTarget, setBalance, setGoalSaved, setProgress, 800);

 // const transactionsData = [
   // { date: "02/10/2025", type: "Income", category: "Loan", description: "Student Maintenance Loan", amount: 1200.0 },
   // { date: "03/10/2025", type: "Expense", category: "Rent", description: "October Rent Payment", amount: -450.0 },
  //  { date: "05/10/2025", type: "Expense", category: "Food", description: "Tesco Grocery Shop", amount: -37.8 },
    //{ date: "08/10/2025", type: "Expense", category: "Travel", description: "Train to London", amount: -22.0 }
 // ];
const getTransactionType = (t) => {
  if (t.type.toLowerCase() === "subscription") return t.name || "Subscription";
  if (t.type.toLowerCase() === "studentfinance") return "Student Finance";
  return t.type.charAt(0).toUpperCase() + t.type.slice(1);
};




  const PIE_COLORS = ["#b387ff", "#f5a6ff", "#c45bff", "#f4caff"];
  const lineData = [
    { month: "Jan", value: 1020 }, { month: "Feb", value: 840 }, { month: "Mar", value: 680 },
    { month: "Apr", value: 950 }, { month: "May", value: 870 }, { month: "Jun", value: 660 },
    { month: "Jul", value: 720 }, { month: "Aug", value: 760 }, { month: "Sept", value: 756 },
    { month: "Oct", value: 890 }, { month: "Nov", value: 600 }, { month: "Dec", value: 540 }
  ];
  const pieData = [
    { name: "Food", value: 300 }, { name: "Transport", value: 200 },
    { name: "Shopping", value: 250 }, { name: "Subscriptions", value: 150 }
  ];
const getTransactionCategory = (t) => {
  if (t.type.toLowerCase() === "subscription") return t.name || "Subscription";
  if (t.type.toLowerCase() === "studentfinance") return "Student Finance";
  if (t.type.toLowerCase() === "house") return t.category || "House / Bills";
  return t.category || "-";
};
const handleUpdateTransaction = async (updatedTransaction) => {
  try {
    const res = await fetch(`http://localhost:5000/transactions/${updatedTransaction._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTransaction),
    });

    if (!res.ok) throw new Error("Failed to update transaction on server");

    const savedTransaction = await res.json();

    setTransactions(transactions.map(t => 
      t._id === savedTransaction._id ? savedTransaction : t
    ));
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

    setTransactions(transactions.filter(t => t._id !== id));
    setIsEditTransactionOpen(false);
  } catch (err) {
    console.error(err);
    alert("Could not delete transaction. Please try again.");
  }
};


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
        .progress-fill {
          will-change: width;
          transition: width 0.7s linear;
        }
        .balance-amount {
          will-change: contents;
        }
      `}</style>

      <Navbar />

      <div style={{ background: "linear-gradient(100deg, #111827, #0F0F1A)", minHeight: "100vh", width: "100%", color: "white", padding: "16px" }}>
        <div style={{ minHeight: "100vh", padding: "5px", textAlign: "center" }}>
          
          <h1 style={{ fontSize: "40px", fontWeight: "500", marginBottom: "0px", color:"#A78BFA" }}>
            Financial Overview
          </h1>
          <p style={{ fontSize: "16px", fontWeight: "100", marginBottom:"40px", color: "#b8b8b8ff" }}>
            View and manage all your recent income and expenses in one place.
          </p>

          <div className="overview-container">
            
            {/* Current Balance */}
            <div className="small-card balance-card">
              <h3>Current Balance</h3>
              <p className="balance-amount">£{balance.toFixed(2)}</p>
              <p className="card-number">XXXX XXXX XXXX XXXX 3456</p>
            </div>

            {/* Budget Goal */}
            <div style={{width:"85vh"}} className="small-card goal-card">
              <div className="goal-tag">Monthly</div>
              <h3>Budget Goal</h3>
              <p className="goal-sub">Save 500 for the end of February</p>

              <div className="progress-row">
                <span>Progress</span>
                <span>£{goalSaved.toFixed(0)}/£500</span>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>

              <div style={{display:"flex", justifyContent: "space-between"}}>
                <button className="goal-btn" onClick={() => setIsAddBudgetOpen(true)}>
                  Add to goal
                </button>

                <button className="withdraw-btn" onClick={() => setIsWithdrawOpen(true)}>
                  Withdraw Amount
                </button>
              </div>
            </div>

            {/* Modals */}
            {isAddBudgetOpen && (
              <AddBudget onClose={() => setIsAddBudgetOpen(false)} />
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

            {/* Charts */}
            <div className="charts-container">
              {/* Line Chart */}
              <div style={{width: "600px"}} className="chart-card">
                <h3 className="chart-title">Spending Over Time</h3>
                <div className="chart-tag">Monthly</div>

                <ResponsiveContainer width="100%" height={270}>
                  <LineChart data={lineData}>
                    <XAxis dataKey="month" stroke="#cda9ff" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#cda9ff" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#1c1c1e", borderRadius: "8px", border: "1px solid #b387ff" }} 
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
                      contentStyle={{ backgroundColor: "#1c1c1e", borderRadius: "8px", border: "1px solid #b387ff" }} 
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
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap:"15px" }}>
                <div className="search-bar" style={{ flex: 1, minWidth: "250px" }}>
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
                      gap: "5px"
                    }}
                    onClick={() => setIsAddTransactionOpen(true)}
                  >
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

                <td style={{ wordBreak: "break-word" }}>{t.description ?? "-"}</td>

                <td className={t.amount > 0 ? "amount-positive" : "amount-negative"}>
                  {(t.amount ?? 0).toFixed(2)}
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