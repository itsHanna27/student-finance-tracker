import React, { useState } from "react";
import "./AddTransaction.css";
const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

const AddTransaction = ({ onClose, onAddTransaction, setTransactions, setShowEdit }) => {
  const [type, setType] = useState("expense");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");

  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amountDigits, setAmountDigits] = useState(""); // store raw digits

  // House / Bills
  const [houseCategory, setHouseCategory] = useState("");
  const [houseFrequency, setHouseFrequency] = useState("");

  // Subscription
  const [subscriptionName, setSubscriptionName] = useState("");
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("");

  // Student Finance (3-term payments)
  const [studentFinanceTerms, setStudentFinanceTerms] = useState([
    { date: "", amountDigits: "" },
    { date: "", amountDigits: "" },
    { date: "", amountDigits: "" },
  ]);

  const today = new Date().toISOString().split("T")[0];

  const allowFutureDate =
    type === "subscription" ||
    type === "house" ||
    type === "studentFinance";

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
    expense: ["Laundry", "Food", "Travel", "Nightlife / Social", "Groceries", "School Stuff", "Other"],
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

  //formatting the amount
  const formatAmountDisplay = () => {
    if (!amountDigits) return "£0.00";
    const num = parseFloat(amountDigits) / 100;
    return "£" + num.toFixed(2);
  };

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, ""); 
    if (value.length > 10) value = value.slice(0, 10);
    setAmountDigits(value);
  };

  // formatitng student finance amount
  const formatTermAmount = (digits) => {
    if (!digits) return "£0.00";
    const num = parseFloat(digits) / 100;
    return "£" + num.toFixed(2);
  };

  const handleTermAmountChange = (index, e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    const copy = [...studentFinanceTerms];
    copy[index].amountDigits = value;
    setStudentFinanceTerms(copy);
  };

  const handleDeleteTransaction = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setTransactions(prev => prev.filter(t => t._id !== id));
      setShowEdit(false);
    } catch (err) {
      console.error(err);
      alert("Could not delete transaction. Please try again.");
    }
  };

  const handleConfirm = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    if (!currentUser.id) {
      alert("User not found. Please log in.");
      return;
    }

    const normaliseAmount = (type, digitValue) => {
      const amt = parseFloat(digitValue) / 100;
      if (isNaN(amt)) return 0;
      return type === "expense" || type === "subscription" || type === "house" ? -Math.abs(amt) : Math.abs(amt);
    };

    //validation
    if (type !== "studentFinance" && !date) {
      alert("Please select a date.");
      return;
    }

    if ((type === "expense" || type === "income") && !selectedCategory) {
      alert("Please select a category.");
      return;
    }

    if (type === "house" && !houseCategory) {
      alert("Please select a house/bills category.");
      return;
    }

    if (type === "subscription" && !subscriptionName) {
      alert("Please enter a subscription name.");
      return;
    }

    if (type !== "studentFinance" && (!amountDigits || parseFloat(amountDigits) === 0)) {
      alert("Please enter a valid amount.");
      return;
    }

    if (type === "studentFinance") {
      const invalidTerm = studentFinanceTerms.some(
        (t) => !t.date || !t.amountDigits
      );
      if (invalidTerm) {
        alert("Please complete all student finance term dates and amounts.");
        return;
      }
    }

    if (date && !allowFutureDate && new Date(date) > new Date()) {
      alert("Date cannot be in the future for this transaction type.");
      return;
    }

    let payload;
    switch (type) {
      case "studentFinance":
        payload = {
          type,
          studentFinancePayments: studentFinanceTerms.map(t => ({
            date: t.date,
            amount: normaliseAmount("income", t.amountDigits),
          })),
          amount: studentFinanceTerms.reduce(
            (sum, t) => sum + (parseFloat(t.amountDigits) / 100 || 0),
            0
          ),
          userId: currentUser.id,
        };
        break;

      case "house":
        payload = {
          date,
          type,
          category: houseCategory,
          frequency: houseFrequency,
          description,
          amount: normaliseAmount(type, amountDigits),
          userId: currentUser.id,
        };
        break;

      case "subscription":
        payload = {
          date,
          type,
          category: subscriptionName,
          frequency: subscriptionFrequency,
          amount: normaliseAmount(type, amountDigits),
          userId: currentUser.id,
        };
        break;

      default:
        payload = {
          date,
          type,
          category: selectedCategory === "other" ? customCategory : selectedCategory,
          description,
          amount: normaliseAmount(type, amountDigits),
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
          {type !== "studentFinance" && (
            <div className="input-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                max={allowFutureDate ? undefined : today}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          )}

          <div className="input-group">
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
                style={{ marginTop: "15px", width: "97%" }}
              />
            )}
          </div>
        )}

        {/* House / Bills */}
        {type === "house" && (
          <>
            <div className="input-group" style={{ marginTop: "-15px" }}>
              <label>Category</label>
              <select value={houseCategory} onChange={(e) => setHouseCategory(e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c, i) => (
                  <option key={i} value={c.toLowerCase()}>{c}</option>
                ))}
              </select>
            </div>
            <div className="input-group" style={{ marginTop: "15px" }}>
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
            <div className="input-group" style={{ marginTop: "-5px", width: "86%" }}>
              <label>Subscription Name</label>
              <input
                type="text"
                placeholder="e.g., Spotify, Netflix"
                value={subscriptionName}
                onChange={(e) => setSubscriptionName(e.target.value)}
              />
            </div>
            <div className="input-group">
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
          <div>
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
                    type="text"
                    placeholder="£0.00"
                    value={formatTermAmount(studentFinanceTerms[index].amountDigits)}
                    onChange={(e) => handleTermAmountChange(index, e)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description & Amount */}
        {type !== "studentFinance" && (
          <>
            <div className="input-group description-group">
              <label>Description</label>
              <textarea
                placeholder="Optional notes..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ marginTop: "18px", width: "87%", marginRight: "10px" }}>
              <label>Amount</label>
              <input
                type="text"
                placeholder="£0.00"
                value={formatAmountDisplay()}
                onChange={handleAmountChange}
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