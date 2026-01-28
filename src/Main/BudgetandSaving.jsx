import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/BudgetandSaving.css";

const BudgetandSaving = ({ setActiveTab = () => {} }) => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [mode, setMode] = useState("saving"); // budget | saving
  const [period, setPeriod] = useState("weekly");
  const [amountDigits, setAmountDigits] = useState("");

  const formatDisplay = () => {
    if (!amountDigits) return "0.00";
    const num = parseFloat(amountDigits) / 100;
    return num.toFixed(2);
  };

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    // Limit to avoid huge numbers
    if (value.length > 10) value = value.slice(0, 10);
    setAmountDigits(value);
  };

  const handleSave = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    
    if (!currentUser.id) {
      alert("User not found. Please log in again.");
      return;
    }

    const payload = {
      userId: currentUser.id,
      type: mode,
      period,
      amount: parseFloat(amountDigits) / 100,
      title,
      startDate,
      date: startDate || new Date().toISOString(),
    };

    try {
      const res = await fetch("http://localhost:5000/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Backend error:", errorData);
        throw new Error(errorData.message || "Failed to save");
      }

      // Reset form
      setAmountDigits("");
      setTitle("");
      setStartDate("");
      setMode("saving");
      setPeriod("weekly");

      alert(mode === "budget" ? "Budget saved successfully!" : "Goal saved successfully!");

      // Navigate to the Transactions page (not the tab)
      navigate("/transactions");
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    }
  };

  const handleClear = () => {
    setAmountDigits("");
    setTitle("");
    setStartDate("");
    setMode("saving");
    setPeriod("weekly");
  };

  return (
    <div className="budget-card">
      <div className="budget-header">
        <div className="budget-title-group">
          <h2 className="budget-title">
            {mode === "budget" ? "Set your budget" : "Set your saving goal"}
          </h2>
          {mode === "budget" && (
            <p className="budget-sub">
              Note that your bills will not contribute to your budget
            </p>
          )}
        </div>

        {/* Budget / Saving toggle */}
        <div className="mode-toggle">
          <button
            className={mode === "budget" ? "active" : ""}
            onClick={() => setMode("budget")}
          >
            Budgeting
          </button>
          <button
            className={mode === "saving" ? "active" : ""}
            onClick={() => setMode("saving")}
          >
            Saving
          </button>
        </div>
      </div>

      {/* Weekly / Monthly */}
      <div className="period-toggle">
        <button
          className={period === "weekly" ? "active" : ""}
          onClick={() => setPeriod("weekly")}
        >
          Weekly
        </button>
        <button
          className={period === "monthly" ? "active" : ""}
          onClick={() => setPeriod("monthly")}
        >
          Monthly
        </button>
      </div>

      <label>
        {mode === "budget" ? "Total budget amount (£)" : "Saving goal amount (£)"}
      </label>
      <input
        type="text"
        value={formatDisplay()}
        onChange={handleAmountChange}
        placeholder="0.00"
      />

      <label>Title (Optional)</label>
      <input
        type="text"
        placeholder={mode === "budget" ? "e.g Weekly budget" : "e.g Saving for Paris trip"}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Start Date</label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />

      <div className="budget-actions">
        <button className="save-btn" onClick={handleSave}>
          {mode === "budget" ? "Save Budget" : "Save Goal"}
        </button>

        <button className="clear-btn" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default BudgetandSaving;