import { useState } from "react";
import "./ViewTransactions.css";
import { FaEdit, FaTrash, FaTimes, FaCheck } from "react-icons/fa";

const ViewTransactions = ({ isOpen, onClose, wallet, transactions, onTransactionsChange, currentUser }) => {
  const [filterMember, setFilterMember] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ description: "", date: "" });
  const [editAmountDigits, setEditAmountDigits] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const formatEditAmount = () => {
    if (!editAmountDigits) return "0.00";
    return (parseFloat(editAmountDigits) / 100).toFixed(2);
  };

  const handleEditAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setEditAmountDigits(value);
  };

  const getMemberById = (memberId) => {
    return wallet?.members?.find(m => m.id === memberId);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredTransactions = transactions
    .slice()
    .reverse()
    .filter(t => {
      if (filterMember !== "all" && t.paidBy !== filterMember) return false;
      return true;
    });

  const handleEditStart = (transaction) => {
    setEditingId(transaction._id);
    // Convert existing amount to digits (e.g. 10.50 -> "1050")
    setEditAmountDigits(Math.round(transaction.amount * 100).toString());
    setEditForm({
      description: transaction.description,
      date: transaction.date?.split('T')[0] || new Date().toISOString().split('T')[0]
    });
  };

  const handleEditSave = async (transactionId) => {
    try {
      const amount = parseFloat(editAmountDigits) / 100;
      const response = await fetch(
        `http://localhost:5000/wallets/${wallet._id}/transactions/${transactionId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description: editForm.description,
            amount: amount,
            date: editForm.date
          })
        }
      );

      if (!response.ok) throw new Error('Failed to update transaction');

      const updated = await response.json();
      onTransactionsChange(
        transactions.map(t => t._id === transactionId ? updated : t)
      );
      setEditingId(null);
    } catch (err) {
      console.error("Error updating transaction:", err);
      alert("Failed to update transaction");
    }
  };

  const handleDelete = async (transactionId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/wallets/${wallet._id}/transactions/${transactionId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete transaction');

      onTransactionsChange(transactions.filter(t => t._id !== transactionId));
      setDeletingId(null);
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction");
    }
  };

  if (!isOpen || !wallet) return null;

  return (
    <div className="transactionOverlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="transactionModal">
        {/* Header */}
        <div className="transactionHeader">
          <div>
            <h2>Transactions</h2>
            <p className="transactionSubtitle">{wallet.title} · {transactions.length} total</p>
          </div>
          <button className="transactionClose" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Member Filter */}
        <div className="transactionFilters">
          <div className="transactionFilterGroup">
            <label>Filter by Member</label>
            <select
              value={filterMember}
              onChange={e => setFilterMember(e.target.value)}
            >
              <option value="all">All members</option>
              {wallet.members.map(m => (
                <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        {filterMember !== "all" && (
          <p className="transactionResultsCount">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
        )}

        {/* Transaction List */}
        <div className="transactionList">
          {filteredTransactions.length === 0 ? (
            <div className="transactionEmpty">No transactions found</div>
          ) : (
            filteredTransactions.map(transaction => {
              const payer = getMemberById(transaction.paidBy);
              const isEditing = editingId === transaction._id;
              const isDeleting = deletingId === transaction._id;

              return (
                <div key={transaction._id} className={`transactionItem ${isEditing ? 'transactionItem--editing' : ''}`}>
                  {isEditing ? (
                    <div className="transactionEditForm">
                      <div  className="transactionEditRow">
                        <div className="transactionEditField">
                          <label>Description</label>
                          <input
                            value={editForm.description}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                            placeholder="Description"
                             style={{ width: "80%" }}
                          />
                        </div>
                        <div className="transactionEditField transactionEditFieldSm">
                          <label style={{ marginLeft:"-50px" }}>Amount (£)</label>
                          <input
                            value={formatEditAmount()}
                            onChange={handleEditAmountChange}
                            placeholder="0.00"
                             style={{ marginLeft:"-45px" }}
                          />
                        </div>
                        <div className="transactionEditField transactionEditFieldSm">
                          <label style={{ marginLeft:"-30px" }}>Date</label>
                          <input
                            type="date"
                            value={editForm.date}
                            onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                            style={{ marginLeft:"-30px" }}
                          />
                        </div>
                      </div>
                      <div className="transactionEditActions">
                        <button className="transactionBtnSave" onClick={() => handleEditSave(transaction._id)}>
                          Save
                        </button>
                        <button className="transactionBtnCancel" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : isDeleting ? (
                    <div className="transactionDeleteConfirm">
                      <p>{transaction.description} (£{transaction.amount.toFixed(2)})</p>
                      <div className="transactionEditActions">
                        <button className="transactionBtnDeleteConfirm" onClick={() => handleDelete(transaction._id)}>
                         Yes, delete
                        </button>
                        <button className="transactionBtnCancel" onClick={() => setDeletingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="transactionItemLeft">
                        <div
                          className="transactionAvatar"
                          style={{ backgroundColor: payer?.color || '#7c6b9e' }}
                          title={payer?.name}
                        >
                          {payer?.avatar ? (
                            <img src={payer.avatar} alt={payer.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            getInitials(payer?.name || "?")
                          )}
                        </div>
                        <div className="transactionItemInfo">
                          <span className="transactionItemDesc">{transaction.description}</span>
                          <span className="transactionItemMeta">
                            {payer?.name?.split(' ')[0] || 'Unknown'} · {new Date(transaction.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="transactionItemRight">
                        <span className="transactionItemAmount">£{transaction.amount.toFixed(2)}</span>
                      </div>
                      <div className="transactionItemBtns">
                        {transaction.paidBy === currentUser?.id && (
                          <>
                            <button className="transactionBtnEdit" onClick={() => handleEditStart(transaction)} title="Edit">
                              <FaEdit />
                            </button>
                            <button className="transactionBtnDelete" onClick={() => setDeletingId(transaction._id)} title="Delete">
                              <FaTrash />
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer total */}
        <div className="transactionFooter">
          <span>{filterMember !== "all" ? "Filtered total" : "Total paid"}</span>
          <span className="transactionFooterAmount">
            £{filteredTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ViewTransactions;