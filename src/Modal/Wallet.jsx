import "./Wallet.css";
import { useState, useEffect } from "react";
import { FaComments } from "react-icons/fa";

const Wallet = ({ isOpen, wallet, onClose }) => {
  const [amountDigits, setAmountDigits] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [balanceLeft, setBalanceLeft] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setCurrentUser(storedUser);
    }
  }, []);

  // Fetch transactions when wallet opens
  useEffect(() => {
    if (isOpen && wallet?._id) {
      fetchTransactions();
    }
  }, [isOpen, wallet]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/wallets/${wallet._id}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data);
      calculateTotals(data);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setTransactions([]);
      calculateTotals([]);
    }
  };

  const calculateTotals = (txns) => {
    const total = txns.reduce((sum, t) => sum + t.amount, 0);
    setTotalSpent(total);
    
    if (wallet?.paid) {
      const budgetValue = parseFloat(wallet.paid.replace('£', ''));
      setBalanceLeft(budgetValue - total);
    } else if (wallet?.balanceLeft) {
      const budgetValue = parseFloat(wallet.balanceLeft.replace('£', ''));
      setBalanceLeft(budgetValue - total);
    }
  };

  const formatDisplay = () => {
    if (!amountDigits) return "0.00";
    return (parseFloat(amountDigits) / 100).toFixed(2);
  };

  const handleAmountChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setAmountDigits(value);
  };

  const handleLeaveWallet = async () => {
    if (!currentUser?.id) {
      alert("User not logged in");
      return;
    }

    const confirmLeave = window.confirm(
      wallet.members.length === 1 
        ? "You are the last member. Leaving will delete this wallet. Are you sure?"
        : "Are you sure you want to leave this wallet?"
    );

    if (!confirmLeave) return;

    try {
      const response = await fetch(`http://localhost:5000/wallet/${wallet._id}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });

      if (!response.ok) throw new Error('Failed to leave wallet');

      const result = await response.json();

      if (result.deleted) {
        alert("Wallet has been deleted as you were the last member.");
      } else {
        alert("You have left the wallet.");
      }

      onClose(); // Close the modal and refresh the parent component
    } catch (err) {
      console.error("Error leaving wallet:", err);
      alert("Failed to leave wallet");
    }
  };

  if (!isOpen || !wallet) return null;

  // Get member initials
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Determine if it's manual or equal split
  const isManualSplit = wallet.splitType === "manual";

  // Calculate totals for display
  const budgetAmount = wallet.paid || wallet.balanceLeft || "£0.00";
  const budgetValue = parseFloat(budgetAmount.replace('£', ''));

  // Calculate each person's share and what they've paid
  const calculateMemberBalances = () => {
    if (wallet.splitType !== "equal") return [];

    // Use the budget amount (the total bill) for splitting
    const totalBill = budgetValue;
    const perPersonShare = totalBill / wallet.members.length;

    return wallet.members.map(member => {
      // Calculate how much this person has paid
      const memberPaid = transactions
        .filter(t => t.paidBy === member.id)
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate what they still need to pay
      const stillOwes = Math.max(0, perPersonShare - memberPaid);
      const hasPaid = memberPaid >= perPersonShare;

      return {
        ...member,
        paid: memberPaid,
        share: perPersonShare,
        stillOwes: stillOwes,
        hasPaid: hasPaid
      };
    });
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (budgetValue === 0) return 0;
    return Math.min((totalSpent / budgetValue) * 100, 100);
  };

  const getMemberById = (memberId) => {
    return wallet?.members?.find(m => m.id === memberId);
  };

  const handleAddPayment = async () => {
    if (!amountDigits || parseFloat(amountDigits) === 0) {
      alert("Please enter an amount");
      return;
    }

    if (!description.trim()) {
      alert("Please enter a description");
      return;
    }

    if (!currentUser?.id) {
      alert("User not logged in");
      return;
    }

    try {
      const amount = parseFloat(amountDigits) / 100;
      
      const transaction = {
        walletId: wallet._id,
        description: description,
        amount: amount,
        paidBy: currentUser.id, 
        date: date,
        createdAt: new Date().toISOString()
      };

      const response = await fetch(`http://localhost:5000/wallets/${wallet._id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });

      if (!response.ok) throw new Error('Failed to add transaction');

      const savedTransaction = await response.json();
      
      // Add to local state
      const updatedTransactions = [...transactions, savedTransaction];
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);

      // Clear inputs
      setAmountDigits("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error("Error adding payment:", err);
      alert("Failed to add payment");
    }
  };

  const memberBalances = calculateMemberBalances();

  return (
    <div className="wallet-overlay">
      <div className="wallet-modal">
        {/* Header */}
        <div className="wallet-header">
          <div>
            <h2>{wallet.title}</h2>
            <p className="wallet-members">
              <span>Members:</span> {wallet.members.map(m => m.name.split(' ')[0]).join(', ')}
            </p>
          </div>

          <div className="wallet-actions">
            <button className="wallet-close" onClick={onClose}>close</button>
            <button className="wallet-leave" onClick={handleLeaveWallet}>leave</button>
          </div>
        </div>

        {/* Avatars */}
        <div className="wallet-avatars">
          {wallet.members.map((member, idx) => (
            <div 
              key={idx} 
              className="wallet-avatar"
              style={{ backgroundColor: member.color }}
              title={member.name}
            >
              {member.avatar ? (
                <img
                  src={member.avatar}
                  alt={member.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                getInitials(member.name)
              )}
            </div>
          ))}
        </div>

        {/* Totals - Different labels based on split type */}
        <div className="wallet-stats">
          <p>
            {isManualSplit ? "Budget:" : "Total Bill:"} 
            <span>{budgetAmount}</span>
          </p>
          <p>Total Paid: <span>£{totalSpent.toFixed(2)}</span></p>
          <p>
            {isManualSplit ? "Remaining Budget:" : "Still Need:"} 
            <span style={{ color: balanceLeft < 0 ? '#EF4444' : balanceLeft === 0 ? '#10B981' : 'white' }}>
              £{balanceLeft.toFixed(2)}
            </span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="wallet-progress">
          <div 
            className="wallet-progress-fill" 
            style={{ width: `${calculateProgress()}%` }} 
          />
        </div>

        {/* Equal Split Info - Show who paid and who still needs to pay */}
        {wallet.splitType === "equal" && (
          <div className="wallet-split-info">
            <h3>Payment Status</h3>
            
            {memberBalances.map((member, idx) => (
              <div key={idx} className="member-balance-card">
                <div className="member-balance-left">
                  <div 
                    className="wallet-avatar member-balance-avatar"
                    style={{ backgroundColor: member.color }}
                  >
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt={member.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>
                  <div className="member-balance-info">
                    <div className="member-balance-name">
                      {member.name.split(' ')[0]}
                    </div>
                    <div className="member-balance-share">
                      Share: £{member.share.toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <div className="member-balance-right">
                  {member.hasPaid ? (
                    <div className="member-status-paid">
                      ✓ Paid £{member.paid.toFixed(2)}
                    </div>
                  ) : member.paid > 0 ? (
                    <div>
                      <div className="member-status-partial">
                        Paid £{member.paid.toFixed(2)}
                      </div>
                      <div className="member-status-owes">
                        Needs £{member.stillOwes.toFixed(2)} more
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="member-status-not-paid">
                        Not paid yet
                      </div>
                      <div className="member-status-still-owes">
                        Needs £{member.stillOwes.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recent Payments */}
        <div className="wallet-section">
          <div className="wallet-section-header">
            <h3>Recent Payments</h3>
            <span className="link">View Transactions</span>
          </div>

          <div className="wallet-table">
            <div className="row header">
              <span>Date</span>
              <span>Member</span>
              <span>Description</span>
              <span>Amount (£)</span>
            </div>

            {transactions.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '20px', 
                color: '#7c6b9e',
                fontSize: '14px' 
              }}>
                No payments yet
              </div>
            ) : (
              transactions.slice().reverse().slice(0, 5).map((transaction) => {
                const payer = getMemberById(transaction.paidBy);
                return (
                  <div key={transaction._id} className="row">
                    <span>{new Date(transaction.date).toLocaleDateString()}</span>
                    <span>{payer?.name.split(' ')[0] || 'Unknown'}</span>
                    <span>{transaction.description}</span>
                    <span>{transaction.amount.toFixed(2)}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Add Payment */}
        <div className="wallet-section">
          <h3>Add Payment</h3>

          <div className="wallet-inputs">
            <input 
              placeholder="£0.00" 
              value={formatDisplay()}
              onChange={handleAmountChange}
            />
            <input 
              placeholder="Description" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="wallet-add">
            <button className="add-payment" onClick={handleAddPayment}>
              + Add payment
            </button>
            <button style={{color:"white"}} className="chat-btn">
              <FaComments /> 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;