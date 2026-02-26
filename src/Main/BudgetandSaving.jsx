import React, { useEffect, useState } from "react";
import "../css/BudgetandSaving.css";
import { FaClock } from "react-icons/fa";


const BudgetandSaving = ({ setActiveTab = () => {} }) => {
  const [mode, setMode] = useState("saving"); // saving | budget
  const [period, setPeriod] = useState("weekly");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [amountDigits, setAmountDigits] = useState("");

  const [existingGoal, setExistingGoal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  // format
  const formatDisplay = () => {
    if (!amountDigits) return "0.00";
    return (parseFloat(amountDigits) / 100).toFixed(2);
  };

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setAmountDigits(value);
  };

  // date
  const getDaysLeft = (startDate, period) => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const now = new Date();
    const maxDays = period === "weekly" ? 7 : 30;
    const diffInMs = start.getTime() + maxDays * 24 * 60 * 60 * 1000 - now.getTime();
    const daysLeft = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(daysLeft, maxDays));
  };

  // checks if expired
  const isGoalExpired = (startDate, period) => {
    if (!startDate) return false;
    const daysLeft = getDaysLeft(startDate, period);
    return daysLeft === 0;
  };

  // auto delete expired goal
  const autoDeleteIfExpired = async (goal) => {
    if (!goal || !goal.startDate) return;

    if (isGoalExpired(goal.startDate, goal.period)) {
      console.log(`Goal expired, auto-deleting: ${goal._id}`);
      try {
        await fetch(`http://localhost:5000/transactions/${goal._id}`, {
          method: "DELETE",
        });
        setExistingGoal(null);
        setIsEditing(false);
        setTitle("");
        setStartDate("");
        setAmountDigits("");
      } catch (err) {
        console.error("Failed to auto-delete expired goal:", err);
      }
    }
  };

  //fetch goal
  useEffect(() => {
    const fetchGoal = async () => {
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (!currentUser.id) return;

      try {
        const res = await fetch(
          `http://localhost:5000/transactions?userId=${currentUser.id}`
        );
        const data = await res.json();

        const goal = data.find((t) => t.type === mode && t.period === period);

        if (goal) {
          if (isGoalExpired(goal.startDate, goal.period)) {
            await autoDeleteIfExpired(goal);
          } else {
            setExistingGoal({
              _id: goal._id,
              type: goal.type,
              period: goal.period,
              title: goal.title || "",
              startDate: goal.startDate || "",
              amount: goal.amount || 0,
            });
          }
        } else {
          setExistingGoal(null);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchGoal();
  }, [mode, period]);

  //checks if goal is expired
  useEffect(() => {
    if (!existingGoal || !existingGoal.startDate) return;

    const intervalId = setInterval(() => {
      autoDeleteIfExpired(existingGoal);
    }, 60000);
    autoDeleteIfExpired(existingGoal);

    return () => clearInterval(intervalId);
  }, [existingGoal]);

  // prefilled when edit
  useEffect(() => {
    if (isEditing && existingGoal) {
      setTitle(existingGoal.title || "");
      setStartDate(existingGoal.startDate || "");
      setAmountDigits(
        existingGoal.amount ? Math.round(existingGoal.amount * 100).toString() : ""
      );
    } else if (!isEditing) {
      setTitle("");
      setStartDate("");
      setAmountDigits("");
    }
  }, [isEditing, existingGoal]);

  // save
  const handleSave = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser.id) {
      alert("User not found");
      return;
    }

    if (!amountDigits || parseFloat(amountDigits) === 0) {
      alert("Please enter an amount first");
      return;
    }

    if (!startDate) {
      alert("Please enter a start date first");
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
      const url =
        existingGoal && isEditing
          ? `http://localhost:5000/transactions/${existingGoal._id}`
          : "http://localhost:5000/transactions";

      const method = existingGoal && isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      const savedTransaction = await res.json();

      setIsEditing(false);
      setExistingGoal(savedTransaction);
      setTitle("");
      setStartDate("");
      setAmountDigits("");
    } catch (err) {
      console.error(err);
      alert("Failed to save. Make sure all fields are correct.");
    }
  };

  //delete
  const handleDelete = async () => {
    if (!existingGoal) return;

    try {
      await fetch(`http://localhost:5000/transactions/${existingGoal._id}`, {
        method: "DELETE",
      });

      setExistingGoal(null);
      setIsEditing(false);
      setTitle("");
      setStartDate("");
      setAmountDigits("");
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // clear
  const handleClear = () => {
    setTitle("");
    setStartDate("");
    setAmountDigits("");
    setMode("saving");
    setPeriod("weekly");
  };

  // min and max
  const getMinDate = (period) => {
    const today = new Date();
    const minDate = new Date(today);

    if (period === "weekly") {
      minDate.setDate(today.getDate() - 6);
    } else if (period === "monthly") {
      minDate.setDate(today.getDate() - 30);
    }

    return minDate.toISOString().split("T")[0];
  };

  const getMaxDate = (period) => {
    const today = new Date();
    const maxDate = new Date(today);

    if (period === "weekly") {
      maxDate.setDate(today.getDate() + 6);
    } else if (period === "monthly") {
      maxDate.setMonth(today.getMonth() + 1);
      maxDate.setDate(0);
    }

    return maxDate.toISOString().split("T")[0];
  };

  // view mode
  if (existingGoal && !isEditing) {
    return (
      <div className="budget-card">
        <div className="budget-header">
          <h2 className="budget-title">
            {mode === "budget" ? "Your budget" : "Your saving goal"}
          </h2>
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

        <div className="goal-summary-card">
          <div className="goal-amount-section">
            <span className="currency-symbol">£</span>
            <span className="amount-large">{existingGoal.amount.toFixed(2)}</span>
          </div>

          <div className="goal-info-grid">
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <div className="info-content">
                <div className="info-label">Period</div>
                <div className="info-value">{existingGoal.period}</div>
              </div>
            </div>

            {existingGoal.title && (
              <div className="info-card">
                <div className="info-icon">
                  <i className="fas fa-tag"></i>
                </div>
                <div className="info-content">
                  <div className="info-label">Title</div>
                  <div className="info-value">{existingGoal.title}</div>
                </div>
              </div>
            )}

            {existingGoal.startDate && (
              <div className="info-card">
                <div className="info-icon">
                  <FaClock />
                </div>
                <div className="info-content">
                  <div className="info-label">
                    {existingGoal.period === "weekly"
                      ? "Days left this week"
                      : "Days left this month"}
                  </div>
                  <div className="info-value">
                    {getDaysLeft(existingGoal.startDate, existingGoal.period)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="action-buttons">
          <button className="btn-edit" onClick={() => setIsEditing(true)}>
            <i className="fas fa-edit"></i>
            Edit Goal
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            <i className="fas fa-trash-alt"></i>
            Delete
          </button>
        </div>
      </div>
    );
  }

  // form
  return (
    <div className="budget-card">
      <div className="budget-header">
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
          {isEditing && (
            <span
              style={{
                cursor: "pointer",
                fontSize: "30px",
                fontWeight: "600",
                color: "#ffffff",
                position: "absolute",
                bottom: "65px",
                left: "-30px",
              }}
              onClick={() => setIsEditing(false)}
              onMouseEnter={(e) => (e.target.style.color = "#333")}
              onMouseLeave={(e) => (e.target.style.color = "#ffffff")}
            >
              ←
            </span>
          )}
          <h2 className="budget-title">
            {mode === "budget" ? "Set your budget" : "Set your saving goal"}
          </h2>
        </div>

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

      <div className="period-toggle">
        <button className={period === "weekly" ? "active" : ""} onClick={() => setPeriod("weekly")}>
          Weekly
        </button>
        <button className={period === "monthly" ? "active" : ""} onClick={() => setPeriod("monthly")}>
          Monthly
        </button>
      </div>

      <label>{mode === "budget" ? "Total budget amount (£)" : "Saving goal amount (£)"}</label>
      <input type="text" value={formatDisplay()} onChange={handleAmountChange} placeholder="0.00" />

      <label>Title (Optional)</label>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label>Start Date</label>
      <input type="date" value={startDate} min={getMinDate(period)} max={getMaxDate(period)} onChange={(e) => setStartDate(e.target.value)}/>

      <div className="budget-actions">
        <button className="save-btn" onClick={handleSave}>
          {isEditing ? "Update" : "Save"}
        </button>
        <button className="clear-btn" onClick={handleClear}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default BudgetandSaving;