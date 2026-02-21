import React, { useState, useEffect } from "react";
import "./currentBalance.css";

const CurrentBalance = ({ balance, setBalance, onClose, onAddTransaction }) => {
  const [amountDigits, setAmountDigits] = useState(""); // store digits only
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    setAmountDigits(Math.round(balance * 100).toString()); 
  }, [balance]);

  // Format as £0.00
  const formatDisplay = () => {
    if (!amountDigits) return "£0.00";
    const num = parseFloat(amountDigits) / 100;
    return "£" + num.toFixed(2);
  };

  // Only allow digits input
  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setAmountDigits(value);
  };

  const handleConfirm = async () => {
    const newBalance = parseFloat(amountDigits) / 100;

    if (isNaN(newBalance)) {
      alert("Please enter a valid number");
      return;
    }

    // Calculate difference before updating backend
    const difference = newBalance - balance;

    try {
      // Update balance 
      const res = await fetch("http://localhost:5000/api/balance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, balance: newBalance }),
      });
      const data = await res.json();
      setBalance(Number(data.balance));

      // Add transaction
      if (difference !== 0) {
        const transactionRes = await fetch("http://localhost:5000/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            date: new Date().toISOString(),
            type: "balance-adjustment",
            category: "Balance Edit",
            description: "Manual balance update",
            amount: difference,
          }),
        });
        const savedTransaction = await transactionRes.json();
        if (onAddTransaction) onAddTransaction(savedTransaction);
      }

      onClose();
    } catch (err) {
      console.error("Failed to update balance:", err);
      alert("Could not update balance. Please try again.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="container">
        <h2>Edit Balance</h2>
        <input
          type="text"
          value={formatDisplay()}
          onChange={handleAmountChange}
          placeholder="£0.00"
        />
        <div className="modal-buttons">
          <button className="confirm" onClick={handleConfirm}>
            Confirm
          </button>
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CurrentBalance;