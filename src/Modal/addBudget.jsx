import React, { useState } from "react";
import { createPortal } from "react-dom";
import "../ModalCSS/addBudget.css";

const AddBudget = ({ onClose, savingGoal, monthlyGoal, onUpdate }) => {
  const [amountDigits, setAmountDigits] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);

  if (!savingGoal) {
    return createPortal(
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>Error</h2>
          <p>No saving goal found. Please create a goal first.</p>
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>,
      document.body
    );
  }

  const formatDisplay = () => {
    if (!amountDigits) return "£0.00";
    const num = parseFloat(amountDigits) / 100;
    return "£" + num.toFixed(2);
  };

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setAmountDigits(value);
  };

  const handleConfirm = async () => {
    if (!amountDigits || parseFloat(amountDigits) === 0) {
      alert("Please enter an amount");
      return;
    }

    const amountToAdd = parseFloat(amountDigits) / 100;

    try {
      setIsLoading(true);

      const currentSavedAmount = savingGoal.currentSaved || 0;
      const updatedWeeklyGoal = {
        ...savingGoal,
        currentSaved: currentSavedAmount + amountToAdd,
      };

      const res = await fetch(`http://localhost:5000/transactions/${savingGoal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWeeklyGoal),
      });
      if (!res.ok) throw new Error("Failed to update weekly goal");

      if (monthlyGoal) {
        const monthlySavedAmount = monthlyGoal.currentSaved || 0;
        const updatedMonthlyGoal = {
          ...monthlyGoal,
          currentSaved: monthlySavedAmount + amountToAdd,
        };

        const resMonthly = await fetch(`http://localhost:5000/transactions/${monthlyGoal._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedMonthlyGoal),
        });
        if (!resMonthly.ok) throw new Error("Failed to update monthly goal");
      }

      if (onUpdate) await onUpdate();
      alert(`Successfully added £${amountToAdd.toFixed(2)} to your goal!`);
      onClose();
    } catch (err) {
      console.error("Error adding to goal:", err);
      alert("Failed to add to goal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goalSaved = savingGoal?.currentSaved || 0;
  const goalTarget = savingGoal?.amount || 0;
  const progress = goalTarget > 0 ? (goalSaved / goalTarget) * 100 : 0;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add To Goal</h2>

        <div className="progress-row" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <span>Progress</span>
          <span>£{goalSaved.toFixed(2)}/£{goalTarget.toFixed(2)}</span>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        <input
          type="text"
          value={formatDisplay()}   
          onChange={handleAmountChange}
          placeholder="£0.00"
        />

        <div className="modal-buttons">
          <button className="confirm-btn" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? "Adding..." : "Confirm"}
          </button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddBudget;