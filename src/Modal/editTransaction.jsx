import React, { useState } from "react";
import { createPortal } from "react-dom";
import "../ModalCSS/AddTransaction.css";
import "../ModalCSS/editTransaction.css";

const detectActiveTerm = (payments) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let lastPassed = -1;
  payments.forEach((p, i) => {
    if (p.date && new Date(p.date) <= today) lastPassed = i;
  });
  if (lastPassed === -1) return 0;
  return lastPassed;
};

const fmt = (digits) => {
  if (!digits) return "£0.00";
  return "£" + (parseFloat(digits) / 100).toFixed(2);
};

const toDigits = (amount) => Math.round(Math.abs(amount || 0) * 100).toString();

const EditTransaction = ({ transaction, onClose, onSave, onDelete }) => {
  const {
    _id, id, _sfTermIndex,
    type: rawType,
    date: initialDate,
    category: initialCategory,
    description: initialDescription,
    amount: initialAmount,
    frequency: initialFrequency,
    studentFinancePayments = [],
  } = transaction;

  const normaliseType = (t) => {
    if (!t) return "expense";
    if (t.toLowerCase() === "studentfinance") return "studentFinance";
    return t;
  };

  const [type, setType] = useState(normaliseType(rawType));
  const [date, setDate] = useState(initialDate || "");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState(initialDescription || "");
  const [amountDigits, setAmountDigits] = useState(toDigits(initialAmount));
  const [frequency, setFrequency] = useState(initialFrequency || "");
  const [updateAllCopies, setUpdateAllCopies] = useState(false);

  const [sfTerms, setSfTerms] = useState(
    studentFinancePayments.length === 3
      ? studentFinancePayments.map((p) => ({ date: p.date || "", amountDigits: toDigits(p.amount) }))
      : [{ date: "", amountDigits: "" }, { date: "", amountDigits: "" }, { date: "", amountDigits: "" }]
  );

  const [activeTermIdx, setActiveTermIdx] = useState(() => {
    if (_sfTermIndex !== undefined) return _sfTermIndex;
    return detectActiveTerm(studentFinancePayments.length === 3 ? studentFinancePayments : [{ date: "" }, { date: "" }, { date: "" }]);
  });

  const today = new Date().toISOString().split("T")[0];
  const allowFutureDate = ["subscription", "house", "studentFinance"].includes(type);
  const frequencies = ["Weekly", "Monthly", "Yearly"];
  const isRecurring = ["subscription", "house"].includes(type);
  const trueOriginalId = transaction.parentId || _id;

  const categories = {
    expense: ["Laundry", "Food", "Travel", "Nightlife / Social", "Groceries", "School Stuff", "Other"],
    income: ["Job", "Allowance", "Freelance", "Scholarship", "Gift", "Other"],
    house: ["House Rent", "Bills"],
    studentFinance: ["Student Finance"],
  }[type] || [];

  const handleAmountChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10) v = v.slice(0, 10);
    setAmountDigits(v);
  };

  const handleSfAmountChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 10) v = v.slice(0, 10);
    const copy = [...sfTerms];
    copy[activeTermIdx] = { ...copy[activeTermIdx], amountDigits: v };
    setSfTerms(copy);
  };

  const handleSfDateChange = (e) => {
    const copy = [...sfTerms];
    copy[activeTermIdx] = { ...copy[activeTermIdx], date: e.target.value };
    setSfTerms(copy);
  };

  const sfTotal = sfTerms.reduce((sum, t) => sum + (parseFloat(t.amountDigits) / 100 || 0), 0);

  const updateExistingCopies = async (savedTransaction) => {
    try {
      await fetch(`http://localhost:5000/recurring/update-copies/${trueOriginalId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: savedTransaction.category,
          description: savedTransaction.description,
          amount: savedTransaction.amount,
          frequency: savedTransaction.frequency,
        }),
      });
    } catch (err) {
      console.error("Failed to update copies:", err);
    }
  };

  const handleSave = async () => {
    const { _sfTermIndex: _a, description: _b, category: _c, date: _d, amount: _e, frequency: _f, ...baseTransaction } = transaction;

    let payload;
    if (type === "studentFinance") {
      payload = {
        ...baseTransaction, _id,
        type: "studentfinance",
        studentFinancePayments: sfTerms.map((t) => ({ date: t.date, amount: parseFloat(t.amountDigits) / 100 || 0 })),
        amount: sfTotal,
      };
    } else {
      const calculatedAmount = parseFloat(amountDigits) / 100;
      payload = {
        ...baseTransaction, _id, type, date,
        category: selectedCategory === "Other" ? customCategory : selectedCategory,
        description,
        amount: ["expense", "subscription", "house"].includes(type) ? -Math.abs(calculatedAmount) : Math.abs(calculatedAmount),
        ...(isRecurring && { frequency: frequency.toLowerCase() }),
      };
    }

    onSave(payload);
    if (isRecurring && updateAllCopies) {
      await updateExistingCopies(payload);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    const transactionId = _id || id;
    if (!transactionId) { console.error("No transaction ID found for delete"); return; }
    if (updateAllCopies && isRecurring) {
      try {
        await fetch(`http://localhost:5000/recurring/delete-copies/${trueOriginalId}`, { method: "DELETE" });
      } catch {}
    }
    onDelete(transactionId);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Transaction</h2>
        <button className="close-btn" onClick={onClose}>close</button>

        <div className="row-2">
          {type !== "studentFinance" && (
            <div className="input-group" style={{ width: "200px" }}>
              <label>Date</label>
              <input type="date" value={date} max={allowFutureDate ? undefined : today} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}
          <div className="input-group">
            <label>Type</label>
            <select value={type} onChange={(e) => { setType(e.target.value); setSelectedCategory(""); setCustomCategory(""); setFrequency(""); }}>
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
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
            {selectedCategory === "Other" && (
              <input type="text" placeholder="Custom category" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} style={{ marginTop: "8px" }} />
            )}
          </div>
        )}

        {type === "house" && (
          <>
            <div className="input-group" style={{ marginTop: "-15px" }}>
              <label>Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="">Select category</option>
                {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ marginTop: "15px" }}>
              <label>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="">Select frequency</option>
                {frequencies.map((f, i) => <option key={i} value={f.toLowerCase()}>{f}</option>)}
              </select>
            </div>
          </>
        )}

        {type === "subscription" && (
          <>
            <div className="input-group" style={{ marginTop: "-5px", width: "86%" }}>
              <label>Subscription Name</label>
              <input type="text" placeholder="e.g., Spotify, Netflix" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Frequency</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="">Select frequency</option>
                {frequencies.map((f, i) => <option key={i} value={f.toLowerCase()}>{f}</option>)}
              </select>
            </div>
          </>
        )}

        {type !== "studentFinance" && (
          <>
            <div className="input-group description-group">
              <label>Description</label>
              <textarea placeholder="Optional notes..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="input-group" style={{ width: "87%", marginTop: "10px" }}>
              <label>Amount</label>
              <input type="text" placeholder="£0.00" value={fmt(amountDigits)} onChange={handleAmountChange} />
            </div>
          </>
        )}

        {isRecurring && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "14px", padding: "10px 35px", background: "rgba(155,127,212,0.08)", borderRadius: "8px", border: "1px solid rgba(155,127,212,0.2)" }}>
            <input
              type="checkbox"
              id="updateAllCopies"
              checked={updateAllCopies}
              onChange={(e) => setUpdateAllCopies(e.target.checked)}
              style={{ position:"absolute",accentColor: "#9b7fd4", width: "16px", height: "16px", cursor: "pointer",  top:"97.9vh", left:"40px"  }}
            />
            <label htmlFor="updateAllCopies" style={{ fontSize: "13px", color: "#c4b5fd", cursor: "pointer", userSelect: "none"}}>
              Update amount, description & category for all existing copies too
            </label>
          </div>
        )}

        {type === "studentFinance" && (
          <div style={{ marginTop: "4px" }}>
            {_sfTermIndex !== undefined ? (
              <p style={{ fontWeight: 700, color: "#9b7fd4", marginBottom: "16px", fontSize: "14px", letterSpacing: "0.3px" }}>Term {_sfTermIndex + 1}</p>
            ) : (
              <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
                {[0, 1, 2].map((idx) => (
                  <button key={idx} onClick={() => setActiveTermIdx(idx)} style={{ background: "none", border: "none", padding: "0 0 4px 0", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: activeTermIdx === idx ? "#9b7fd4" : "#3e4060", borderBottom: activeTermIdx === idx ? "2px solid #9b7fd4" : "2px solid transparent", transition: "all 0.15s" }}>
                    Term {idx + 1}
                  </button>
                ))}
              </div>
            )}
            <div className="input-group">
              <label>Payment Date</label>
              <input style={{ width: "400px" }} type="date" value={sfTerms[activeTermIdx].date} onChange={handleSfDateChange} />
            </div>
            <div className="input-group" style={{ marginTop: "10px", width: "87%" }}>
              <label>Amount</label>
              <input style={{ width: "400px" }} type="text" placeholder="£0.00" value={fmt(sfTerms[activeTermIdx].amountDigits)} onChange={handleSfAmountChange} />
            </div>
            {_sfTermIndex === undefined && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "10px 14px", background: "rgba(155,127,212,0.08)", borderRadius: "8px", border: "1px solid rgba(155,127,212,0.2)" }}>
                <span style={{ fontSize: "12px", color: "#6b6e85", fontWeight: 600 }}>Total across all terms</span>
                <span style={{ fontSize: "15px", fontWeight: 700, color: "#9b7fd4" }}>£{sfTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <div className="btn-row">
          <button type="button" className="confirm-btn" onClick={handleSave}>Save</button>
          <button type="button" className="delete-btn" onClick={handleDelete}>🗑 Delete</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditTransaction;