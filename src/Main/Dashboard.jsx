import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  FaChartLine,
  FaBullseye,
  FaUsers,
  FaWallet as FaWalletIcon,
  FaGraduationCap
} from "react-icons/fa";

import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import useFinanceData from "../hooks/FinanceData";
import Bestie from "../Modal/bestie";

import "../css/FinanceCard.css";

const Dashboard = () => {
  const { transactions, savingGoals, budgetGoals, balance, userId, refresh } = useFinanceData();
  const navigate = useNavigate();

  const [userName, setUserName] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name || "User");
    }
  }, []);

  // Weekly chart data — recomputes when transactions change
  const weeklyData = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const data = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => ({
      day,
      expenses: 0,
    }));

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate >= startOfWeek && tDate <= now) {
        const dayIndex = (tDate.getDay() + 6) % 7;
        if (t.type === "expense") data[dayIndex].expenses += Math.abs(Number(t.amount));
      }
    });

    return data;
  }, [transactions]);

  // Weekly total — recomputes when weeklyData changes
  const weeklyExpensesTotal = useMemo(() =>
    weeklyData.reduce((sum, day) => sum + day.expenses, 0),
  [weeklyData]);

  // Monthly income — recomputes when transactions change
  const monthlyIncome = useMemo(() => {
    const currentMonth = new Date().getMonth();
    return transactions
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && t.type === "income";
      })
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  }, [transactions]);

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          color: white;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden;
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
      `}</style>

      <Navbar />

      <div style={{ background: "linear-gradient(100deg, #111827, #0F0F1A)", minHeight: "100vh", width: "100%", color: "white", padding: "16px" }}>
        {/* HERO SECTION */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", paddingTop: "10px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: "500", display: "flex", gap: "8px", alignItems: "center", margin: 0, paddingTop: "30px" }}>
            Hi <span style={{ color: "#A78BFA" }}>{userName || "User"}</span>
          </h1>

          <p style={{ fontWeight: "100", fontSize: "26px", margin: "4px 0 0 0", textAlign: "center" }}>
            <FaGraduationCap style={{ fontSize: "48px", color: "#A78BFA", verticalAlign: "middle", paddingBottom: "8px" }} />{" "}
            Welcome back to your Student <br /> finance <span style={{ color: "#A78BFA" }}>guide</span>
          </p>

          <p style={{ fontSize: "16px", textAlign: "center", fontWeight: "100", color: "#b8b8b8ff" }}>
            Stay on top of your student budget with smart tracking, shared wallets, and tips that make money management easier.
          </p>
        </div>

        {/* FINANCE CARD */}
        <div className="finance-wrapper">
          <div className="finance-card">
            <div className="section-label">Overview</div>
            <h2 className="finance-title">Finance Assistant</h2>

            {/* Top Stats */}
            <div className="stats-grid">
              <div className="stat-card">
                <p className="stat-label">Balance</p>
                <h3 className="stat-value">£{balance.toFixed(2)}</h3>
              </div>

              <div className="stat-card">
                <p className="stat-label">Monthly Income</p>
                <h3 className="stat-value">£{monthlyIncome.toFixed(2)}</h3>
              </div>

              <div className="stat-card">
                <p className="stat-label">Weekly Expenses</p>
                <h3 className="stat-value">£{weeklyExpensesTotal.toFixed(2)}</h3>
              </div>
            </div>

            {/* Bot */}
            <Bestie
              balance={balance}
              transactions={transactions}
              savingGoals={savingGoals}
              budgetGoals={budgetGoals}
              userId={userId}
              onTransactionChange={refresh} 
            />

            {/* Chart */}
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: 20, bottom: 30 }}>
                  <XAxis
                    dataKey="day"
                    stroke="#aaa"
                    tick={{ fill: "#fff", fontSize: 12 }}
                    tickLine={false}
                    interval={0}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "5px" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value) => [`£${value.toFixed(2)}`, "Spent"]}
                  />
                  <Area type="monotone" dataKey="expenses" stroke="#A78BFA" fill="#A78BFA55" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* How it works title */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "50px" }}>
          <p style={{ textAlign: "left", maxWidth: "900px", width: "100%", color: "#b8b8b8" }}>How it works</p>
        </div>

        {/* Smart spending section */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", paddingTop: "10px" }}>
          <h2 style={{ fontSize: "40px", fontWeight: "500", display: "flex", gap: "8px", alignItems: "center", margin: 0 }}>
            Smart Spending tools for <span style={{ color: "#A78BFA" }}>students</span>
          </h2>
          <p style={{ fontSize: "16px", textAlign: "center", fontWeight: "100", color: "#b8b8b8ff" }}>
            Keep your student life on budget! Monitor spending trends, compare months, <br />
            and spot where you can save so you can stress less and enjoy more.
          </p>
        </div>
      </div>

      {/* Features grid */}
      <div className="features-grid">
        <Link to="/transactions" style={{ textDecoration: "none" }}>
          <div className="feature-card">
            <FaChartLine className="feature-icon" />
            <h2 className="feature-title">Finance Tracking</h2>
            <p className="feature-text">Stay on top of your income and expenses effortlessly.</p>
          </div>
        </Link>

        <Link to="/SharedWallet" style={{ textDecoration: "none" }}>
          <div className="feature-card">
            <FaWalletIcon className="feature-icon" />
            <h2 className="feature-title">Shared Wallets</h2>
            <p className="feature-text">Manage group expenses without stress.</p>
          </div>
        </Link>

        <Link to="/account" state={{ activeTab: "budget" }} style={{ textDecoration: "none" }}>
          <div className="feature-card">
            <FaBullseye className="feature-icon" />
            <h2 className="feature-title">Save for Goals</h2>
            <p className="feature-text">Set goals, track progress, and stay motivated.</p>
          </div>
        </Link>

        <div className="feature-card">
          <FaUsers className="feature-icon" />
          <h2 className="feature-title">Community</h2>
          <p className="feature-text">Learn, share, and support each other as students.</p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;