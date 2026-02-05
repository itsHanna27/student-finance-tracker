import React, { useState } from "react";
import "./createwallet.css";

export default function CreateWalletModal({ isOpen, onClose }) {
  const [walletName, setWalletName] = useState("");
  const [splitType, setSplitType] = useState("manual");
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="create-wallet-modal">
        <button className="close-btn" onClick={onClose}>
            Close
          </button>
        {/* Header */}
        <div className="modal-header">
          <h2>Make Wallet</h2>
        </div>

        {/* Wallet Name */}
        <div className="modal-section">
          <label>Wallet Name</label>
          <input
            type="text"
            placeholder="e.g House Rent"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
          />
        </div>

        {/* Participants */}
        <div className="modal-section">
          <label>Add Participants</label>
          <div className="participants">
            <div className="useravatar">H</div>
            <button className="add-user">+</button>
          </div>
        </div>

        {/* Options */}
        <div className="modal-section">
          <label>Options</label>
          <div className="radio-group">
            <label>
              <input style={{marginTop: "28px"}}
                type="radio"
                name="split"
                checked={splitType === "manual"}
                onChange={() => setSplitType("manual")}
              />
              Split Manually
            </label>
            <label>
              <input style={{marginTop: "28px"}}
                type="radio"
                name="split"
                checked={splitType === "equal"}
                onChange={() => setSplitType("equal")}
              />
              Split Equally
            </label>
          </div>
        </div>

       {/* Optional Settings */}
        <div className="modal-section">

        <div className="optional-settings">
            <input
            type="text"
            placeholder="Set Budget (optional)"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            />
        </div>
        </div>

        {/* Action */}
        <button className="create-btn">Create Wallet</button>
      </div>
    </div>
  );
}