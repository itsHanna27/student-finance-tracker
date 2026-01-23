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
  const [amount, setAmount] = useState(Math.abs(initialAmount || ""));

  const [studentFinanceTerms, setStudentFinanceTerms] = useState(
    studentFinancePayments.length === 3
      ? studentFinancePayments
      : [
          { date: "", amount: "" },
          { date: "", amount: "" },
          { date: "", amount: "" },
        ]
  );

  const today = new Date().toISOString().split("T")[0];
  const allowFutureDate =
    type === "subscription" || type === "house" || type === "studentFinance";

  const categories = {
    expense: ["Rent", "Food", "Travel", "Nightlife / Social", "Groceries", "School Stuff", "Other"],
    income: ["Job", "Allowance", "Freelance", "Scholarship", "Gift", "Other"],
    house: ["House Rent", "Bills"],
    studentFinance: ["Student Finance"],
  }[type];
  

  const handleSave = () => {
 let payload;
if (type === "studentFinance") {
  payload = {
    ...transaction,
    studentFinancePayments: studentFinanceTerms.map(t => ({
      date: t.date,
      amount: Number(t.amount),
    })),
    amount: studentFinanceTerms.reduce(
      (sum, t) => sum + Number(t.amount || 0),
      0
    ),
  };
} else {
  payload = {
    ...transaction,
    _id: transaction._id, 
    type,
    date,
    category: selectedCategory === "Other" ? customCategory : selectedCategory,
    description,
    amount:
      type === "expense" || type === "subscription" || type === "house"
        ? -Math.abs(Number(amount))
        : Math.abs(Number(amount)),
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
  {/* Date is hidden only for studentFinance */}
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
              <label>Amount (£)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
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
