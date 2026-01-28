import React, { useState, useEffect } from "react";
 import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  FaChartLine,
  FaBullseye,
  FaUsers,
  FaWallet as FaWalletIcon,
  FaWallet,
  FaBell,
  FaGraduationCap
} from "react-icons/fa";

import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar";

import { NavLink } from "react-router-dom";

import "../css/FinanceCard.css";


const data = [
  { day: "Mon", amount: 30 },
  { day: "Tue", amount: 28 },
  { day: "Wed", amount: 40 },
  { day: "Thu", amount: 45 },
  { day: "Fri", amount: 38 },
  { day: "Sat", amount: 50 },
  { day: "Sun", amount: 20 }
];

const Dashboard = () => {
   const navigate = useNavigate();
  useEffect(() => {
  const user = localStorage.getItem("user");
  if (!user) {
    navigate("/login");
  }
}, [navigate]);

  const [showBalance, setShowBalance] = useState(true);
  const [balance, setBalance] = useState(1200);
const [userName, setUserName] = useState("");
 useEffect(() => {
  const storedUser = localStorage.getItem("user");

  if (storedUser) {
    const user = JSON.parse(storedUser);
     setUserName(user.surname);
    setUserName(user.name); // 
  }
}, []);


  return (
    <>
     <style>{`
  html, body,  #root {
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
`}</style>


      {/* NAVBAR ADDED HERE */}
      <Navbar />
      <div
        style={{
          background: "linear-gradient(100deg, #111827, #0F0F1A)",
          minHeight: "100vh",
          width: "100%",
          color: "white",
          padding: "16px",
        }}
      >
        {/* HERO SECTION */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            paddingTop: "10px",
          }}
        >
          <h1
            style={{
              fontSize: "40px",
              fontWeight: "500",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              margin: 0,
              paddingTop: "30px",
            }}
          >
            Hi <span style={{ color: "#A78BFA" }}>
  {userName || "User"}
</span>
          </h1>

          <p
            style={{
              fontWeight: "100",
              fontSize: "26px",
              margin: "4px 0 0 0",
              textAlign: "center",
            }}
          >
            <FaGraduationCap
              style={{
                fontSize: "48px",
                color: "#A78BFA",
                verticalAlign: "middle",
                paddingBottom: "8px",
              }}
            />{" "}
            Welcome back to your Student <br /> finance{" "}
            <span style={{ color: "#A78BFA" }}>guide</span>
          </p>

          <p
            style={{
              fontSize: "16px",
              textAlign: "center",
              fontWeight: "100",
              color: "#b8b8b8ff",
            }}
          >
            Stay on top of your student budget with smart tracking, shared wallets,
            and tips that make money management easier.
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
                <h3 className="stat-value">£634.56</h3>
              </div>

              <div className="stat-card">
                <p className="stat-label">Monthly income</p>
                <h3 className="stat-value">£1200.00</h3>
              </div>

              <div className="stat-card">
                <p className="stat-label">Monthly Expenses</p>
                <h3 className="stat-value">£650.07</h3>
              </div>
            </div>

            {/* Chart */}
            <div className="chart-container" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data}
                  margin={{ top: 10, right: 10, left: 20, bottom: 30 }}
                >
                  <XAxis
                    dataKey="day"
                    stroke="#aaa"
                    tick={{ fill: "#fff", fontSize: 12 }}
                    tickLine={false}
                    interval={0}
                    padding={{ left: 0, right: 0 }}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "none",
                      borderRadius: "5px",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />

                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#A78BFA"
                    fill="#A78BFA55"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* HOW IT WORKS TITLE */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: "50px",
          }}
        >
          <p
            style={{
              textAlign: "left",
              maxWidth: "900px",
              width: "100%",
              color: "#b8b8b8",
            }}
          >
            How it works
          </p>
        </div>

        {/* SMART SPENDING SECTION */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            paddingTop: "10px",
          }}
        >
          <h2
            style={{
              fontSize: "40px",
              fontWeight: "500",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              margin: 0,
            }}
          >
            Smart Spending tools for{" "}
            <span style={{ color: "#A78BFA" }}>students</span>
          </h2>

          <p
            style={{
              fontSize: "16px",
              textAlign: "center",
              fontWeight: "100",
              color: "#b8b8b8ff",
            }}
          >
            Keep your student life on budget! Monitor spending trends, compare
            months, <br />
            and spot where you can save so you can stress less and enjoy more.
          </p>
        </div>
      </div>

      {/* FEATURE GRID */}
     <div className="features-grid">
  <Link to="/transactions" style={{ textDecoration: "none" }}>
    <div className="feature-card">
      <FaChartLine className="feature-icon" />
      <h2 className="feature-title">Finance Tracking</h2>
      <p className="feature-text">
        Stay on top of your income and expenses effortlessly.
      </p>
    </div>
  </Link>



        <div className="feature-card">
          <FaWalletIcon className="feature-icon" />
          <h2 className="feature-title">Shared Wallets</h2>
          <p className="feature-text">Manage group expenses without stress.</p>
        </div>

      <Link to="/account" state={{ activeTab: "budget" }} style={{ textDecoration: "none" }}>
      <div className="feature-card">
        <FaBullseye className="feature-icon" />
        <h2 className="feature-title">Save for Goals</h2>
        <p className="feature-text">
          Set goals, track progress, and stay motivated.
        </p>
      </div>
    </Link>

        <div className="feature-card">
          <FaUsers className="feature-icon" />
          <h2 className="feature-title">Community</h2>
          <p className="feature-text">
            Learn, share, and support each other as students.
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
