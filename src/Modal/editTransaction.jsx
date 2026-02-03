import React, { useState } from "react";
import "./AddTransaction.css";
import "./editTransaction.css";

const EditTransaction = ({ transaction, onClose, onSave, onDelete }) => {
  const {
    id,
    type: initialType,
    date: initialDate,
    category: initialCategory,
    description: initialDescription,
    amount: initialAmount,
    studentFinancePayments = [],
  } = transaction;

  const [type, setType] = useState(initialType || "expense");
  const [date, setDate] = useState(initialDate || "");
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState(initialDescription || "");
  const [amountDigits, setAmountDigits] = useState(
    Math.round(Math.abs(initialAmount || 0) * 100).toString()
  );

  const [studentFinanceTerms, setStudentFinanceTerms] = useState(
    studentFinancePayments.length === 3
      ? studentFinancePayments.map(p => ({
          date: p.date || "",
          amountDigits: Math.round(Math.abs(p.amount || 0) * 100).toString(),
        }))
      : [
          { date: "", amountDigits: "" },
          { date: "", amountDigits: "" },
          { date: "", amountDigits: "" },
        ]
  );

  const today = new Date().toISOString().split("T")[0];
  const allowFutureDate =
    type === "subscription" || type === "house" || type === "studentFinance";

  const categories = {
    expense: ["Laundry", "Food", "Travel", "Nightlife / Social", "Groceries", "School Stuff", "Other"],
    income: ["Job", "Allowance", "Freelance", "Scholarship", "Gift", "Other"],
    house: ["House Rent", "Bills"],
    studentFinance: ["Student Finance"],
  }[type];

  // ====== FORMAT AMOUNT INPUT AS £0.00 ======
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

  // student finance
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

  const handleSave = () => {
    let payload;
    if (type === "studentFinance") {
      payload = {
        ...transaction,
        studentFinancePayments: studentFinanceTerms.map(t => ({
          date: t.date,
          amount: parseFloat(t.amountDigits) / 100 || 0,
        })),
        amount: studentFinanceTerms.reduce(
          (sum, t) => sum + (parseFloat(t.amountDigits) / 100 || 0),
          0
        ),
      };
    } else {
      const calculatedAmount = parseFloat(amountDigits) / 100;
      payload = {
        ...transaction,
        _id: transaction._id,
        type,
        date,
        category: selectedCategory === "Other" ? customCategory : selectedCategory,
        description,
        amount:
          type === "expense" || type === "subscription" || type === "house"
            ? -Math.abs(calculatedAmount)
            : Math.abs(calculatedAmount),
      };
    }
    onSave(payload);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Edit Transaction</h2>
        <button className="close-btn" onClick={onClose}>close</button>
        
        {/* Date & Type */}
        <div className="row-2">
          {type !== "studentFinance" && (
            <div className="input-group" style={{ width: "200px" }}>
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
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>

            {selectedCategory === "Other" && (
              <input
                type="text"
                placeholder="Custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                style={{ marginTop: "8px" }}
              />
            )}
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

            <div className="input-group" style={{ width: "87%", marginTop: "10px" }}>
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

        {/* Student Finance */}
        {type === "studentFinance" && (
          <div>
            <h3>Termly Payments</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map((term, index) => (
                <div key={term} style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="date"
                    value={studentFinanceTerms[index].date}
                    onChange={(e) => {
                      const copy = [...studentFinanceTerms];
                      copy[index].date = e.target.value;
                      setStudentFinanceTerms(copy);
                    }}
                  />
                  <input
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

        <div className="btn-row">
          <button
            type="button"
            className="confirm-btn"
            onClick={handleSave} 
          >
            Save
          </button>

          <button
            type="button"
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(transaction._id);
            }}
          >
            🗑 Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditTransaction;