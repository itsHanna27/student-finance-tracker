import React, { useState } from "react";
import "./AddTransaction.css";
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

const AddTransaction = ({ onClose, onAddTransaction }) => {

  
  const [type, setType] = useState("expense");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  // Added states for all inputs
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  // House / Bills
  const [houseCategory, setHouseCategory] = useState("");
  const [houseFrequency, setHouseFrequency] = useState("");

  // Subscription
  const [subscriptionName, setSubscriptionName] = useState("");
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("");

  // Student Finance (3-term payments)
  const [studentFinanceTerms, setStudentFinanceTerms] = useState([
    { date: "", amount: "" },
    { date: "", amount: "" },
    { date: "", amount: "" },
  ]);

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

// Confirm button
const handleConfirm = async () => {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}"); // get logged-in user
  if (!currentUser.id) {
    alert("User not found. Please log in.");
    return;
  }

  let payload;

  if (type === "studentFinance") {
    payload = {
      type,
      studentFinancePayments: studentFinanceTerms,
      userId: currentUser.id, 
    };
  } else if (type === "house") {
    payload = {
      date,
      type,
      category: houseCategory,
      frequency: houseFrequency,
      description,
      amount: Number(amount),
      userId: currentUser.id,
    };
  } else if (type === "subscription") {
    payload = {
      date,
      type,
      category: subscriptionName, 
      frequency: subscriptionFrequency,
      amount: Number(amount),
      userId: currentUser.id,
    };
  } else {
    payload = {
      date,
      type,
      category: selectedCategory === "other" ? customCategory : selectedCategory,
      description,
      amount: Number(amount),
      userId: currentUser.id,
    };
  }

  try {
    const res = await fetch("http://localhost:5000/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const savedTransaction = await res.json();
    onAddTransaction(savedTransaction); 
    onClose();
  } catch (err) {
    console.error("Error saving transaction:", err);
    alert("Failed to save transaction");
  }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{modalTitle}</h2>

        <div className="row-2">
          <div className="input-group" style={{ width: "200px" }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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

        {/* Expense / Income */}
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

            {selectedCategory === "other" && (
              <input
                type="text"
                placeholder="Type your category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                style={{ marginTop: "8px", width: "310px", marginLeft: "35px", borderRadius: "15px" }}
              />
            )}
          </div>
        )}

        {/* House / Bills */}
        {type === "house" && (
          <>
            <div className="input-group" style={{ marginTop: "-15px", width: "385px" }}>
              <label>Category</label>
              <select value={houseCategory} onChange={(e) => setHouseCategory(e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c, i) => (
                  <option key={i} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginTop: "15px", width: "385px" }}>
              <label>Frequency</label>
              <select value={houseFrequency} onChange={(e) => setHouseFrequency(e.target.value)}>
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
            <div className="input-group" style={{ marginTop: "-15px", marginBottom: "10", width: "370px", marginRight: "12px" }}>
              <label>Subscription Name</label>
              <input
                type="text"
                placeholder="e.g., Spotify, Netflix"
                value={subscriptionName}
                onChange={(e) => setSubscriptionName(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginTop: "15px", width: "385px" }}>
              <label>Frequency</label>
              <select value={subscriptionFrequency} onChange={(e) => setSubscriptionFrequency(e.target.value)}>
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
              {[1, 2, 3].map((term, index) => (
                <div key={term} style={{ display: "flex", gap: "10px" }}>
                  <input
                    style={{ borderRadius: "5px", border: "1px solid #3b3d5c" }}
                    type="date"
                    placeholder={`Term ${term} Date`}
                    value={studentFinanceTerms[index].date}
                    onChange={(e) => {
                      const copy = [...studentFinanceTerms];
                      copy[index].date = e.target.value;
                      setStudentFinanceTerms(copy);
                    }}
                  />
                  <input
                    style={{ borderRadius: "5px", border: "1px solid #3b3d5c" }}
                    type="number"
                    placeholder={`Term ${term} Amount (£)`}
                    value={studentFinanceTerms[index].amount}
                    onChange={(e) => {
                      const copy = [...studentFinanceTerms];
                      copy[index].amount = e.target.value;
                      setStudentFinanceTerms(copy);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description & Amount */}
        {type !== "studentFinance" && (
          <>
            <div className="input-group" style={{ width: "385px", marginTop: "20px" }}>
              <label>Description</label>
              <textarea
                placeholder="Optional notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginTop: "18px", width: "87%", marginRight: "10px" }}>
              <label>Amount (£)</label>
              <input
                type="number"
                placeholder="e.g 90"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </>
        )}

        <div className="btn-row">
          <button className="confirm-btn" onClick={handleConfirm}>Confirm</button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AddTransaction;
