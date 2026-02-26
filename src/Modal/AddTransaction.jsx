import React, { useState, useEffect } from "react";
import "./AddTransaction.css";

const SF_KEY = "unibudget_student_finance";

//Helpers 

/** Returns true if a recurring transaction is due within the next 3 days */
export const isDue = (startDateStr, frequency) => {
  if (!startDateStr || !frequency) return false;
  const start = new Date(startDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = (a, b) => Math.round((a - b) / 86400000);

  let next = new Date(start);

  // Advance `next` past today
  while (next <= today) {
    switch (frequency) {
      case "weekly":  next.setDate(next.getDate() + 7);   break;
      case "monthly": next.setMonth(next.getMonth() + 1); break;
      case "yearly":  next.setFullYear(next.getFullYear() + 1); break;
      default: return false;
    }
  }

  const daysUntil = diffDays(next, today);
  return daysUntil <= 3; // due within 3 days
};

/** Get all recurring transactions stored in localStorage and check if any are due */
export const getDueReminders = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("unibudget_recurring") || "[]");
    return stored.filter(t => isDue(t.date, t.frequency));
  } catch { return []; }
};

/** Save a recurring transaction to localStorage for reminder tracking */
const saveRecurring = (transaction) => {
  try {
    const stored = JSON.parse(localStorage.getItem("unibudget_recurring") || "[]");
    // Replace if same category+type already exists, else append
    const idx = stored.findIndex(
      t => t.category === transaction.category && t.type === transaction.type
    );
    if (idx >= 0) stored[idx] = transaction;
    else stored.push(transaction);
    localStorage.setItem("unibudget_recurring", JSON.stringify(stored));
  } catch {}
};

// Component

const AddTransaction = ({ onClose, onAddTransaction, setTransactions, setShowEdit }) => {
  const [type, setType] = useState("expense");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [amountDigits, setAmountDigits] = useState("");

  // House / Bills
  const [houseCategory, setHouseCategory] = useState("");
  const [houseFrequency, setHouseFrequency] = useState("");

  // Subscription
  const [subscriptionName, setSubscriptionName] = useState("");
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("");

  // Student Finance — pre-fill from localStorage
  const [studentFinanceTerms, setStudentFinanceTerms] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(SF_KEY));
      if (Array.isArray(cached) && cached.length === 3) return cached;
    } catch {}
    return [
      { date: "", amountDigits: "" },
      { date: "", amountDigits: "" },
      { date: "", amountDigits: "" },
    ];
  });

  // Persist student finance to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(SF_KEY, JSON.stringify(studentFinanceTerms));
  }, [studentFinanceTerms]);

  const today = new Date().toISOString().split("T")[0];
  const allowFutureDate = ["subscription", "house", "studentFinance"].includes(type);

  const modalTitle = {
    expense: "Add Expense",
    income: "Add Income",
    subscription: "Add Subscription",
    house: "Add House / Bills",
    studentFinance: "Add Student Finance",
  }[type];

  const categories = {
    expense: ["Laundry", "Food", "Travel", "Nightlife / Social", "Groceries", "School Stuff", "Other"],
    income: ["Job", "Allowance", "Freelance", "Scholarship", "Gift", "Other"],
    house: ["House Rent", "Bills"],
    studentFinance: ["Student Finance"],
  }[type] || [];

  const frequencies = ["Weekly", "Monthly", "Yearly"];

  // Formatting

  const formatDisplay = (digits) => {
    if (!digits) return "£0.00";
    return "£" + (parseFloat(digits) / 100).toFixed(2);
  };

  const handleAmountChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10) v = v.slice(0, 10);
    setAmountDigits(v);
  };

  const handleTermAmountChange = (index, e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10) v = v.slice(0, 10);
    const copy = [...studentFinanceTerms];
    copy[index] = { ...copy[index], amountDigits: v };
    setStudentFinanceTerms(copy);
  };

  const handleTermDateChange = (index, e) => {
    const copy = [...studentFinanceTerms];
    copy[index] = { ...copy[index], date: e.target.value };
    setStudentFinanceTerms(copy);
  };

  // ─ Normalise amount sign 

  const normaliseAmount = (txType, digits) => {
    const amt = parseFloat(digits) / 100;
    if (isNaN(amt)) return 0;
    return ["expense", "subscription", "house"].includes(txType)
      ? -Math.abs(amt)
      : Math.abs(amt);
  };

  // Validation 

  const validate = () => {
    if (type !== "studentFinance" && !date) {
      alert("Please select a date."); return false;
    }
    if ((type === "expense" || type === "income") && !selectedCategory) {
      alert("Please select a category."); return false;
    }
    if (selectedCategory === "other" && !customCategory.trim()) {
      alert("Please enter a custom category."); return false;
    }
    if (type === "house" && !houseCategory) {
      alert("Please select a house/bills category."); return false;
    }
    if (type === "house" && !houseFrequency) {
      alert("Please select a frequency."); return false;
    }
    if (type === "subscription" && !subscriptionName.trim()) {
      alert("Please enter a subscription name."); return false;
    }
    if (type === "subscription" && !subscriptionFrequency) {
      alert("Please select a frequency."); return false;
    }
    if (type !== "studentFinance" && (!amountDigits || parseFloat(amountDigits) === 0)) {
      alert("Please enter a valid amount."); return false;
    }
    if (date && !allowFutureDate && new Date(date) > new Date()) {
      alert("Date cannot be in the future for this transaction type."); return false;
    }
    if (type === "studentFinance") {
      const invalid = studentFinanceTerms.some(t => !t.date || !t.amountDigits);
      if (invalid) {
        alert("Please complete all student finance term dates and amounts."); return false;
      }
    }
    return true;
  };

  // Submit

  const handleConfirm = async () => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (!currentUser.id) { alert("User not found. Please log in."); return; }
    if (!validate()) return;

    let payload;

    switch (type) {
      case "studentFinance":
        payload = {
          type,
          studentFinancePayments: studentFinanceTerms.map(t => ({
            date: t.date,
            amount: Math.abs(parseFloat(t.amountDigits) / 100),
          })),
          amount: studentFinanceTerms.reduce(
            (sum, t) => sum + (parseFloat(t.amountDigits) / 100 || 0), 0
          ),
          userId: currentUser.id,
        };
        // Keep localStorage so form stays pre-filled for reference
        break;

      case "house":
        payload = {
          date, type,
          category: houseCategory,
          frequency: houseFrequency,
          description,
          amount: normaliseAmount(type, amountDigits),
          userId: currentUser.id,
        };
        // Save for due-date reminders
        saveRecurring({ date, type, category: houseCategory, frequency: houseFrequency });
        break;

      case "subscription":
        payload = {
          date, type,
          category: subscriptionName,
          frequency: subscriptionFrequency,
          amount: normaliseAmount(type, amountDigits),
          userId: currentUser.id,
        };
        saveRecurring({ date, type, category: subscriptionName, frequency: subscriptionFrequency });
        break;

      default:
        payload = {
          date, type,
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
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      onAddTransaction(saved);
      onClose();
    } catch (err) {
      // Fallback: save to localStorage if backend fails
      console.warn("Backend failed, saving locally:", err);
      const fallback = { ...payload, _id: Date.now().toString(), _local: true };
      const local = JSON.parse(localStorage.getItem("unibudget_local_tx") || "[]");
      local.push(fallback);
      localStorage.setItem("unibudget_local_tx", JSON.stringify(local));
      onAddTransaction(fallback);
      onClose();
    }
  };

  // Render

  const isRecurring = type === "subscription" || type === "house";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{modalTitle}</h2>

        {/* Date + Type row */}
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

        {/* Recurring notice */}
        {isRecurring && (
          <div className="recurring-notice">
            🔔 You'll get a reminder notification when this is due again.
          </div>
        )}

        {/* Expense / Income category */}
        {(type === "expense" || type === "income") && (
          <div className="input-group" style={{ marginTop: "-15px" }}>
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => {
              setSelectedCategory(e.target.value);
              if (e.target.value !== "other") setCustomCategory("");
            }}>
              <option value="">Select category</option>
              {categories.map((c, i) => (
                <option key={i} value={c.toLowerCase() === "other" ? "other" : c}>{c}</option>
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

        {/* Student Finance — pre-filled, persisted */}
        {type === "studentFinance" && (
          <div>
            <h3 style={{ color: "#9b7fd4", marginBottom: "12px" }}>Termly Payments</h3>
            <p style={{ fontSize: "12px", color: "#a0a3b1", marginBottom: "12px", marginTop: "-8px" }}>
              Your entries are saved automatically and will be here next time.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[1, 2, 3].map((term, index) => (
                <div key={term}>
                  <p style={{ fontSize: "12px", color: "#9b7fd4", fontWeight: 600, marginBottom: "6px", marginTop:"-10px" }}>
                    Term {term}
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      style={{ borderRadius: "8px", border: "1px solid #3b3d5c", background: "#1e2035", color: "#fff", padding: "8px 10px", flex: 1 }}
                      type="date"
                      value={studentFinanceTerms[index].date}
                      onChange={(e) => handleTermDateChange(index, e)}
                    />
                    <input
                      style={{ borderRadius: "8px", border: "1px solid #3b3d5c", background: "#1e2035", color: "#fff", padding: "8px 10px", flex: 1 }}
                      type="text"
                      placeholder="£0.00"
                      value={formatDisplay(studentFinanceTerms[index].amountDigits)}
                      onChange={(e) => handleTermAmountChange(index, e)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              style={{ marginTop: "12px", background: "none", border: "none", color: "#5c5f73", fontSize: "12px", cursor: "pointer" }}
              onClick={() => {
                setStudentFinanceTerms([
                  { date: "", amountDigits: "" },
                  { date: "", amountDigits: "" },
                  { date: "", amountDigits: "" },
                ]);
                localStorage.removeItem(SF_KEY);
              }}
            >
              ✕ Clear saved data
            </button>
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
                value={formatDisplay(amountDigits)}
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