import "../ModalCSS/Wallet.css";
import "../ModalCSS/Chat.css";
import { useState, useEffect, useRef } from "react";
import { FaComments, FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import ViewTransactions from "./ViewTransactions";
import MemberCard from "./Membercard";

const Wallet = ({ isOpen, wallet, onClose }) => {
  const [amountDigits, setAmountDigits] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactions, setTransactions] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [balanceLeft, setBalanceLeft] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isViewTransactionsOpen, setIsViewTransactionsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Chat state
  const [view, setView] = useState("wallet"); // "wallet" | "chat"
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) setCurrentUser(storedUser);
  }, []);

  useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  console.log("currentUser:", storedUser); 
  if (storedUser) setCurrentUser(storedUser);
}, []);
  useEffect(() => {
    if (isOpen && wallet?._id) fetchTransactions();
  }, [isOpen, wallet]);

  // Start/stop polling when chat view is active
  useEffect(() => {
    if (view === "chat" && wallet?._id) {
      fetchMessages();
      pollingRef.current = setInterval(fetchMessages, 3000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [view, wallet?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (view === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view]);

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

  const fetchMessages = async () => {
    if (!wallet?._id) return;
    try {
      const response = await fetch(`http://localhost:5000/wallets/${wallet._id}/messages`);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const handleSendMessage = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || !currentUser?.id) return;

    const member = wallet?.members?.find(m => m.id === currentUser.id);

    const message = {
      walletId: wallet._id,
      senderId: currentUser.id,
      senderName: currentUser.name || "You",
      senderAvatar: member?.avatar || null,
      senderColor: member?.color || "#7c6b9e",
      text: trimmed,
    };

    setIsSending(true);
    try {
      const response = await fetch(`http://localhost:5000/wallets/${wallet._id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
      if (!response.ok) throw new Error("Failed to send");
      const saved = await response.json();
      setMessages(prev => [...prev, saved]);
      setInputText("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const calculateTotals = (txns) => {
    const total = txns.reduce((sum, t) => sum + t.amount, 0);
    setTotalSpent(total);
    if (wallet?.paid) {
      setBalanceLeft(parseFloat(wallet.paid.replace('£', '')) - total);
    } else if (wallet?.balanceLeft) {
      setBalanceLeft(parseFloat(wallet.balanceLeft.replace('£', '')) - total);
    }
  };

  const handleTransactionsChange = (updatedTransactions) => {
    setTransactions(updatedTransactions);
    calculateTotals(updatedTransactions);
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
  if (!currentUser?.id) { alert("User not logged in"); return; }
  const confirmLeave = window.confirm(
    wallet.members.length === 1
      ? "You are the last member. Leaving will delete this wallet. Are you sure?"
      : "Are you sure you want to leave this wallet?"
  );
  if (!confirmLeave) return;

  try {
    // notifies wallet when user leaves1
    await fetch(`http://localhost:5000/wallets/${wallet._id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletId: wallet._id,
        senderId: "system",
        senderName: "system",
        text: `${currentUser.name} has left the wallet`,
        type: "system",
      }),
    });

    // Then leave the wallet
    const response = await fetch(`http://localhost:5000/wallet/${wallet._id}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id })
    });
    if (!response.ok) throw new Error('Failed to leave wallet');
    const result = await response.json();
    if (result.deleted) alert("Wallet has been deleted as you were the last member.");
    else alert("You have left the wallet.");
    onClose();
  } catch (err) {
    console.error("Error leaving wallet:", err);
    alert("Failed to leave wallet");
  }
};
  if (!isOpen || !wallet) return null;

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  const isManualSplit = wallet.splitType === "manual";
  const budgetAmount = wallet.paid || wallet.balanceLeft || "£0.00";
  const budgetValue = parseFloat(budgetAmount.replace('£', ''));

  const calculateMemberBalances = () => {
    if (wallet.splitType !== "equal") return [];
    const perPersonShare = budgetValue / wallet.members.length;
    return wallet.members.map(member => {
      const memberPaid = transactions.filter(t => t.paidBy === member.id).reduce((sum, t) => sum + t.amount, 0);
      const stillOwes = Math.max(0, perPersonShare - memberPaid);
      return { ...member, paid: memberPaid, share: perPersonShare, stillOwes, hasPaid: memberPaid >= perPersonShare };
    });
  };

  const calculateProgress = () => {
    if (budgetValue === 0) return 0;
    return Math.min((totalSpent / budgetValue) * 100, 100);
  };

  const getMemberById = (memberId) => wallet?.members?.find(m => m.id === memberId);

  const handleAddPayment = async () => {
    if (!amountDigits || parseFloat(amountDigits) === 0) { alert("Please enter an amount"); return; }
    if (!description.trim()) { alert("Please enter a description"); return; }
    if (!currentUser?.id) { alert("User not logged in"); return; }
    try {
      const amount = parseFloat(amountDigits) / 100;
      const transaction = { walletId: wallet._id, description, amount, paidBy: currentUser.id, date, createdAt: new Date().toISOString() };
      const response = await fetch(`http://localhost:5000/wallets/${wallet._id}/transactions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(transaction)
      });
      if (!response.ok) throw new Error('Failed to add transaction');
      const savedTransaction = await response.json();
      const updatedTransactions = [...transactions, savedTransaction];
      setTransactions(updatedTransactions);
      calculateTotals(updatedTransactions);
      setAmountDigits("");
      setDescription("");
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error("Error adding payment:", err);
      alert("Failed to add payment");
    }
  };

  const handleKick = (kickedId) => {
    wallet.members = wallet.members.filter(m => m.id !== kickedId);
    setSelectedMember(null);
  };

  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDateDivider = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  };

  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  const memberBalances = calculateMemberBalances();

  return (
    <>
      <div className="wallet-overlay">
        <div className="wallet-modal wallet-modal-clipped">

          {/* wallet*/}
          <div className={`wallet-panel ${view === "wallet" ? "panel-active" : "panel-slide-left"}`}>

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
                <div key={idx} className="wallet-avatar" style={{ backgroundColor: member.color, cursor: "pointer" }} title={`View ${member.name}`} onClick={() => setSelectedMember(member)}>
                  {member.avatar ? <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : getInitials(member.name)}
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="wallet-stats">
              <p>{isManualSplit ? "Budget:" : "Total Bill:"} <span>{budgetAmount}</span></p>
              <p>Total Paid: <span>£{totalSpent.toFixed(2)}</span></p>
              <p>
                {isManualSplit ? "Remaining Budget:" : "Still Need:"}
                <span style={{ color: balanceLeft < 0 ? '#EF4444' : balanceLeft === 0 ? '#10B981' : 'white' }}>
                  {isManualSplit ? (balanceLeft < 0 ? `Over by £${Math.abs(balanceLeft).toFixed(2)}` : `£${balanceLeft.toFixed(2)}`) : `£${Math.max(0, balanceLeft).toFixed(2)}`}
                </span>
              </p>
            </div>

            {/* Progress bar */}
            <div className="wallet-progress">
              <div className="wallet-progress-fill" style={{ width: `${calculateProgress()}%` }} />
            </div>

            {/* Equal Split Info */}
            {wallet.splitType === "equal" && (
              <div className="wallet-split-info">
                <h3>Payment Status</h3>
                {memberBalances.map((member, idx) => (
                  <div key={idx} className="member-balance-card">
                    <div className="member-balance-left">
                      <div className="wallet-avatar member-balance-avatar" style={{ backgroundColor: member.color, cursor: "pointer" }} onClick={() => setSelectedMember(member)}>
                        {member.avatar ? <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : getInitials(member.name)}
                      </div>
                      <div className="member-balance-info">
                        <div className="member-balance-name">{member.name.split(' ')[0]}</div>
                        <div className="member-balance-share">Share: £{member.share.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="member-balance-right">
                      {member.hasPaid ? (
                        <div className="member-status-paid">✓ Paid £{member.paid.toFixed(2)}</div>
                      ) : member.paid > 0 ? (
                        <div>
                          <div className="member-status-partial">Paid £{member.paid.toFixed(2)}</div>
                          <div className="member-status-owes">Needs £{member.stillOwes.toFixed(2)} more</div>
                        </div>
                      ) : (
                        <div>
                          <div className="member-status-not-paid">Not paid yet</div>
                          <div className="member-status-still-owes">Needs £{member.stillOwes.toFixed(2)}</div>
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
                <span className="link" onClick={() => setIsViewTransactionsOpen(true)}>View Transactions</span>
              </div>
              <div className="wallet-table">
                <div className="row header">
                  <span>Date</span><span>Member</span><span>Description</span><span>Amount (£)</span>
                </div>
                {transactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#7c6b9e', fontSize: '14px' }}>No payments yet</div>
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
                <input placeholder="£0.00" value={formatDisplay()} onChange={handleAmountChange} />
                <input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="wallet-add">
                <button className="add-payment" onClick={handleAddPayment}>+ Add payment</button>
                <button className="chat-btn" onClick={() => setView("chat")}>
                  <FaComments />
                </button>
              </div>
            </div>
          </div>

          {/* chat */}
          <div className={`wallet-panel chat-panel ${view === "chat" ? "panel-active" : "panel-slide-right"}`}>

            {/* Chat Header */}
            <div className="wallet-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <button style={{position:"relative",bottom:"30px"}} className="chat-back-btn" onClick={() => setView("wallet")}>
                  <FaArrowLeft />
                </button>
                <div>
                  <h2>{wallet.title}</h2>
                  <p className="wallet-members"><span>Group Chat</span> · {wallet.members.length} members</p>
                </div>
              </div>
              <div className="wallet-actions">
                <button className="wallet-close" onClick={onClose}>close</button>
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages-area">
              {messages.length === 0 ? (
                <div className="chat-empty-state">
                  <p>No messages yet. Say something!</p>
                </div>
              ) : (
                Object.entries(groupedMessages).map(([dateKey, msgs]) => (
                  <div key={dateKey}>
                    <div className="chat-date-divider">
                      <span>{formatDateDivider(msgs[0].createdAt)}</span>
                    </div>
                    {msgs.map((msg, idx) => {
                       if (msg.type === "system") {
                        return (
                          <div key={msg._id || idx} className="chat-system-message">
                            <span>{msg.text}</span>
                            <span className="chat-system-time">{formatTime(msg.createdAt)}</span>
                          </div>
                        );
                      }
                      const isMe = msg.senderId === currentUser?.id;
                      const showAvatar = idx === 0 || msgs[idx - 1]?.senderId !== msg.senderId;
                      return (
                        <div key={msg._id || idx} className={`chat-row ${isMe ? "chat-row-me" : "chat-row-them"}`}>
                          {!isMe && (
                            <div className="chat-avatar-slot">
                              {showAvatar ? (
                                <div className="chat-inline-avatar" style={{ backgroundColor: msg.senderColor }}>
                                  {msg.senderAvatar ? <img src={msg.senderAvatar} alt={msg.senderName} /> : getInitials(msg.senderName)}
                                </div>
                              ) : <div style={{ width: 32 }} />}
                            </div>
                          )}
                          <div className={`chat-bubble-group ${isMe ? "chat-bubble-group-me" : ""}`}>
                            {!isMe && showAvatar && <span className="chat-sender-label">{msg.senderName.split(" ")[0]}</span>}
                            <div className={`chat-bubble ${isMe ? "chat-bubble-me" : "chat-bubble-them"}`}>
                              <p>{msg.text}</p>
                              <span className="chat-time">{formatTime(msg.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="chat-input-row">
              <input
                className="chat-text-input"
                placeholder="Type a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
              />
              <button className="chat-send-btn" onClick={handleSendMessage} disabled={isSending || !inputText.trim()}>
                 <FaPaperPlane />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* View Transactions Modal */}
      <ViewTransactions
        isOpen={isViewTransactionsOpen}
        onClose={() => setIsViewTransactionsOpen(false)}
        wallet={wallet}
        transactions={transactions}
        onTransactionsChange={handleTransactionsChange}
        currentUser={currentUser}
      />

      {/* Member Card Modal */}
      {selectedMember && (
        <MemberCard
          member={selectedMember}
          wallet={wallet}
          currentUser={currentUser}
          onClose={() => setSelectedMember(null)}
          onKick={handleKick}
          onWalletUpdated={() => setSelectedMember(null)}
        />
      )}
    </>
  );
};

export default Wallet;