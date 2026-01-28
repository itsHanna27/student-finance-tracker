import React, { useState } from "react";
import "./addBudget.css";

const Withdraw = ({ onClose, savingGoal, onUpdate }) => {
  const [amountDigits, setAmountDigits] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);

  // Safety check - if no saving goal exists, show error
  if (!savingGoal) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>Error</h2>
          <p>No saving goal found. Please create a goal first.</p>
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
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

    const amountToWithdraw = parseFloat(amountDigits) / 100;
    const currentSavedAmount = savingGoal.currentSaved || 0;

    // Check if trying to withdraw more than saved
    if (amountToWithdraw > currentSavedAmount) {
      alert(`You can't withdraw £${amountToWithdraw.toFixed(2)}. You only have £${currentSavedAmount.toFixed(2)} saved.`);
      return;
    }

    try {
      setIsLoading(true);

      // Update the saving goal's current saved amount (subtract)
      const updatedGoal = {
        ...savingGoal,
        currentSaved: currentSavedAmount - amountToWithdraw,
      };

      const res = await fetch(`http://localhost:5000/transactions/${savingGoal._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedGoal),
      });

      if (!res.ok) throw new Error("Failed to update goal");

      const updatedGoalData = await res.json();
      console.log("Goal updated successfully:", updatedGoalData);

      // Call the onUpdate callback to refresh the goal in parent BEFORE closing
      if (onUpdate) {
        await onUpdate();
      }

      alert(`Successfully withdrew £${amountToWithdraw.toFixed(2)} from your goal!`);
      
      onClose();
    } catch (err) {
      console.error("Error withdrawing from goal:", err);
      alert("Failed to withdraw from goal. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const goalSaved = savingGoal?.currentSaved || 0;
  const goalTarget = savingGoal?.amount || 0;
  const progress = goalTarget > 0 ? (goalSaved / goalTarget) * 100 : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Withdraw from Goal</h2>

        <div
          className="progress-row"
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            gap: "8px",
          }}
        >
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
          <button 
            className="confirm-btn" 
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Withdrawing..." : "Confirm"}
          </button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;