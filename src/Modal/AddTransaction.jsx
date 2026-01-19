import React, { useState } from "react";
import "./AddTransaction.css";

const AddTransaction = ({ onClose }) => {
const [type, setType] = useState("expense");
const [selectedCategory, setSelectedCategory] = useState("");
const [customCategory, setCustomCategory] = useState("");

const modalTitle = {
expense: "Add Expense",
income: "Add Income",
subscription: "Add Subscription",
house: "Add House / Bills",
studentFinance: "Add Student Finance",
}[type];

const categoryLabel = {
expense: "Category",
income: "Category",
house: "Category",
studentFinance: "Student Finance",
}[type];

const categories = {
expense: ["Rent", "Food", "Travel", "Nightlife / Social", "Groceries", "School Stuff", "Other"],
income: ["Job", "Allowance", "Freelance", "Scholarship", "Gift", "Other"],
house: ["House Rent", "Bills"],
studentFinance: ["Student Finance"],
}[type];

const frequencies = ["Weekly", "Monthly", "Yearly"];

const handleCategoryChange = (e) => {
const val = e.target.value;
setSelectedCategory(val);
if (val !== "other") setCustomCategory("");
};

return ( <div className="modal-overlay" onClick={onClose}>
<div className="modal-content" onClick={(e) => e.stopPropagation()}> <h2 className="modal-title">{modalTitle}</h2>


    <div className="row-2">
      <div className="input-group" style={{ width: "200px" }}>
        <label>Date</label>
        <input type="date" />
      </div>

      <div className="input-group" style={{ width: "200px" }}>
        <label>Type</label>
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value);
            setSelectedCategory("");
            setCustomCategory("");
          }}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="subscription">Subscription</option>
          <option value="house">House / Bills</option>
          <option value="studentFinance">Student Finance</option>
        </select>
      </div>
    </div>

    {(type === "expense" || type === "income") && (
      <div className="input-group" style={{ marginTop: "-15px" }}>
        <label>{categoryLabel}</label>
        <select value={selectedCategory} onChange={handleCategoryChange}>
          <option value="">Select {categoryLabel.toLowerCase()}</option>
          {categories.map((c, i) => (
            <option key={i} value={c.toLowerCase() === "other" ? "other" : c}>
              {c}
            </option>
          ))}
        </select>

        {/* shows when "Other" is selected */}
        {selectedCategory === "other" && (
          <input
            type="text"
            placeholder="Type your category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            style={{ marginTop: "8px", width:"310px", marginLeft:"35px", borderRadius:"15px" }}
          />
        )}
      </div>
    )}

    {/* House / Bills */}
    {type === "house" && (
      <>
        <div className="input-group" style={{ marginTop: "-15px", width: "385px" }}>
          <label>Category</label>
          <select>
            <option value="">Select category</option>
            {categories.map((c, i) => (
              <option key={i} value={c.toLowerCase()}>{c}</option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{ marginTop: "15px", width: "385px" }}>
          <label>Frequency</label>
          <select>
            <option value="">Select frequency</option>
            {frequencies.map((f, i) => (
              <option key={i} value={f.toLowerCase()}>{f}</option>
            ))}
          </select>
        </div>
      </>
    )}

    {/* Subscription */}
    {type === "subscription" && (
      <>
        <div className="input-group" style={{ marginTop: "-15px", marginBottom:"-15px" ,width:"370px", marginRight:"12px" }}>
          <label>Subscription Name</label>
          <input type="text" placeholder="e.g., Spotify, Netflix" />
        </div>
        <div className="input-group" style={{ marginTop: "15px", width:"385px" }}>
          <label>Frequency</label>
          <select>
            <option value="">Select frequency</option>
            {frequencies.map((f, i) => (
              <option key={i} value={f.toLowerCase()}>{f}</option>
            ))}
          </select>
        </div>
      </>
    )}

    {/* Student Finance */}
    {type === "studentFinance" && (
      <div style={{ marginTop: "15px" }}>
        <h3>Termly Payments</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {[1,2,3].map(term => (
            <div key={term} style={{ display: "flex", gap: "10px" }}>
              <input style={{borderRadius:"5px", border: "1px solid #3b3d5c"}} type="date" placeholder={`Term ${term} Date`} />
              <input style={{borderRadius:"5px", border: "1px solid #3b3d5c"}} type="number" placeholder={`Term ${term} Amount (£)`} />
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Description & Amount */}
    {(type !== "studentFinance") && (
      <>
        <div className="input-group" style={{ width: "385px", marginTop: "20px" }}>
          <label>Description</label>
          <textarea placeholder="Optional notes..." />
        </div>
        <div className="input-group" style={{ marginTop: "18px", width: "87%", marginRight: "10px" }}>
          <label>Amount (£)</label>
          <input type="number" placeholder="e.g 90" />
        </div>
      </>
    )}

    <div className="btn-row">
      <button className="confirm-btn">Confirm</button>
      <button className="cancel-btn" onClick={onClose}>Cancel</button>
    </div>
  </div>
</div>

);
};

export default AddTransaction;
