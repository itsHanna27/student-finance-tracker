import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExclamationTriangle } from "react-icons/fa";
import "../css/DeleteAccount.css";

const DeleteAccount = () => {
  const [confirmed, setConfirmed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const storedUser = JSON.parse(localStorage.getItem("user"));

  const handleDelete = async () => {
    if (!confirmed) {
      setError("Please check the confirmation box first.");
      return;
    }
    if (!password) {
      setError("Please enter your password to confirm.");
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/delete-account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: storedUser.id, password }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg);
        return;
      }

      localStorage.removeItem("user");
      navigate("/signup");

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="delete-page">
      <h3 className="delete-title">Delete Account</h3>
      <p className="delete-subtitle">
        This action is permanent and cannot be undone. All your data including
        transactions, friends, and goals will be deleted forever.
      </p>

      <div className="delete-card">

        <div className="delete-warning-box">
          <FaExclamationTriangle className="delete-warning-icon" />
          <p className="delete-warning-text">
            Deleting your account will permanently remove all your transactions,
            saving goals, friends, and shared wallets. This cannot be recovered.
          </p>
        </div>

        <div className="delete-field">
          <label className="delete-label">Confirm your password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="delete-input"
          />
        </div>

        <div className="delete-checkbox-row">
          <input
            type="checkbox"
            id="confirm"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="delete-checkbox"
          />
          <label htmlFor="confirm" className="delete-checkbox-label">
            I understand this will permanently delete my account and all my data.
          </label>
        </div>

        {error && <p className="delete-error">{error}</p>}

        <button
          onClick={handleDelete}
          className={`delete-btn ${confirmed ? "active" : ""}`}
        >
          Permanently Delete Account
        </button>

      </div>
    </div>
  );
};

export default DeleteAccount;