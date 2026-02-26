import React from "react";
import "./filter.css";

const TYPE_OPTIONS = [
  { label: "Expense",            value: "expense"            },
  { label: "Income",             value: "income"             },
  { label: "Subscriptions",      value: "subscription"       },
  { label: "House / Bills",      value: "house"              },
  { label: "Balance Adjustment", value: "balance-adjustment" },
  { label: "Student Finance",    value: "studentfinance"     },
];

const Filter = ({
  onClose,
  onApply,
  onReset,
  selectedTypes,
  setSelectedTypes,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const toggleType = (value) => {
    setSelectedTypes((prev) =>
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    );
  };

  return (
    <div className="filter-modal">
      <button className="filter-close" onClick={onClose}>✕</button>

      <h2 className="filter-title">
        <span>Filter</span> Transactions
      </h2>

      <div className="filter-section-label">Filter by date range</div>
      <div className="filter-date-row">
        <div className="filter-date-group">
          <label>Start</label>
          <input type="date" className="filter-date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="filter-date-group">
          <label>End</label>
          <input type="date" className="filter-date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      <div className="filter-section-label">
        Filter by Type
        {selectedTypes.length > 0 && <span className="active-count">{selectedTypes.length}</span>}
      </div>
      <div className="type-grid">
        {TYPE_OPTIONS.map(({ label, value }) => (
          <button
            key={value}
            className={`filter-chip ${value} ${selectedTypes.includes(value) ? "chip-selected" : ""}`}
            onClick={() => toggleType(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="filter-actions">
        <button className="filter-btn-reset" onClick={onReset}>Reset</button>
        <button className="filter-btn-apply" onClick={onApply}>Apply Filters</button>
      </div>
    </div>
  );
};

export default Filter;