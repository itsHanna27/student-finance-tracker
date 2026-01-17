import React, { useState } from "react";
import "./addBudget.css";

const AddBudget = ({ onClose, goalSaved = 350, goalTarget = 500 }) => {
  const progress = (goalSaved / goalTarget) * 100;

  const [amountDigits, setAmountDigits] = useState(""); 

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        <h2>Withdraw from budget</h2>

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
  <span>£{goalSaved}/£{goalTarget}</span>
</div>


        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* MONEY INPUT */}
        <input
          type="text"
          value={formatDisplay()}  
          onChange={handleAmountChange}
          placeholder="£0.00"
        />

        <div className="modal-buttons">
          <button className="confirm-btn">Confirm</button>
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBudget;
