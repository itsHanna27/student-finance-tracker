import React, { useState } from "react";
import "../css/BudgetandSaving.css";

const BudgetandSaving = () => {
  const [mode, setMode] = useState("saving"); // budget | saving
  const [period, setPeriod] = useState("weekly");
  const [amountDigits, setAmountDigits] = useState("");

  const formatDisplay = () => {
    if (!amountDigits) return "0.00";

    const num = parseFloat(amountDigits) / 100;
    return num.toFixed(2);
  };

  const handleAmountChange = (e) => {
    // Only keep digits the user types
    let value = e.target.value.replace(/\D/g, "");

    // Limit to avoid huge numbers 
    if (value.length > 10) value = value.slice(0, 10);

    setAmountDigits(value);
  };

  return (
    <div className="budget-card">
      <div className="budget-header">
        <div className="budget-title-group">
          <h2 className="budget-title">Set your budget</h2>
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

      <label>Total budget amount (£)</label>
      <input 
        type="text" 
        value={formatDisplay()}
        onChange={handleAmountChange}
        placeholder="0.00"
      />

      <label>Title (Optional)</label>
      <input type="text" placeholder="e.g Saving for Paris trip" />

      <label>Start date</label>
      <input type="date" />

      <div className="budget-actions">
        <button className="save-btn">Save Budget</button>
        <button className="clear-btn">Clear</button>
      </div>
    </div>
  );
};

export default BudgetandSaving;