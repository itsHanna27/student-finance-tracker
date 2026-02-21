import React, { useState, useEffect } from "react";
import { FaUserPlus, FaUserCheck, FaWallet } from "react-icons/fa";
import "./Notification.css";
import Navbar from "../Navbar/Navbar";

//notifications data
const typeConfig = {
  alert:             { icon: "⚠️",                 label: "Alert",       bg: "#2a1a3e", color: "#f87171" },
  transaction:       { icon: "💸",                 label: "Transaction",  bg: "#1a1535", color: "#a78bfa" },
  reminder:          { icon: "🔔",                 label: "Reminder",     bg: "#1e1542", color: "#c4b5fd" },
  friend_request:    { icon: "react:FaUserPlus",   label: "Friend",       bg: "#1e1542", color: "#9b7fd4" },
  friend_accepted:   { icon: "react:FaUserCheck",  label: "Friend",       bg: "#1e1542", color: "#9b7fd4" },
  wallet_transaction:{ icon: "react:FaWallet",     label: "Wallet",       bg: "#1a1535", color: "#d8b4fe" },
  wallet_added:      { icon: "react:FaWallet",     label: "Wallet",       bg: "#1a1535", color: "#d8b4fe" },
};
//icons
const renderIcon = (icon, color) => {
  if (icon === "react:FaUserPlus")  return <FaUserPlus size={16} color={color} />;
  if (icon === "react:FaUserCheck") return <FaUserCheck size={16} color={color} />;
  if (icon === "react:FaWallet")    return <FaWallet size={16} color={color} />;
  return icon;
};

const FILTERS = ["All", "Unread", "Transactions", "Reminders", "Friends", "Wallet"];

// localStorage helpers 
const getDismissed = () => {
  try { return new Set(JSON.parse(localStorage.getItem("unibudget_dismissed_notifs") || "[]")); }
  catch { return new Set(); }
};
const getRead = () => {
  try { return new Set(JSON.parse(localStorage.getItem("unibudget_read_notifs") || "[]")); }
  catch { return new Set(); }
};
const saveDismissed = (set) => localStorage.setItem("unibudget_dismissed_notifs", JSON.stringify([...set]));
const saveRead = (set) => localStorage.setItem("unibudget_read_notifs", JSON.stringify([...set]));

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => { buildNotifications(); }, []);

  const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();
  const isYesterday = (dateStr) => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return new Date(dateStr).toDateString() === y.toDateString();
  };
  const getDaysUntilNext = (startDateStr, frequency) => {
    if (!startDateStr || !frequency) return null;
    const start = new Date(startDateStr);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let next = new Date(start);
    while (next <= today) {
      if (frequency === "weekly") next.setDate(next.getDate() + 7);
      else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
      else if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
      else return null;
    }
    return Math.round((next - today) / 86400000);
  };

  const buildNotifications = async () => {
    setLoading(true);
    const dismissed = getDismissed();
    const read = getRead();
    const built = [];

    try {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);

      // DB notifications 
      try {
        const notifRes = await fetch(`http://localhost:5000/notifications/${currentUser.id}`);
        const dbNotifs = await notifRes.json();
        dbNotifs.forEach((n) => {
          if (dismissed.has(n._id)) return;
          built.push({
            id: n._id, dbId: n._id,
            type: n.type, title: n.title, message: n.message,
            time: new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
            date: isToday(n.createdAt) ? "Today" : isYesterday(n.createdAt) ? "Yesterday" : "Earlier",
            unread: !n.read,
            fromDB: true,
          });
        });
      } catch {}

      // recent transactions 
      try {
        const txRes = await fetch(`http://localhost:5000/transactions?userId=${currentUser.id}`);
        const transactions = await txRes.json();

        transactions
          .filter((t) => {
            if (!["expense", "income"].includes(t.type?.toLowerCase())) return false;
            if (!t.date) return false;
            return new Date(t.date) >= sevenDaysAgo;
          })
          .slice(0, 5)
          .forEach((t) => {
            const id = `tx-${t._id}`;
            if (dismissed.has(id)) return;
            const isIncome = t.amount > 0;
            built.push({
              id, type: "transaction",
              title: isIncome ? "Payment Received" : "Expense Logged",
              message: `${isIncome ? "+" : "-"}£${Math.abs(t.amount).toFixed(2)} — ${t.category || t.type}${t.description ? `: ${t.description}` : ""}`,
              time: new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
              date: isToday(t.date) ? "Today" : isYesterday(t.date) ? "Yesterday" : "Earlier",
              unread: !read.has(id),
            });
          });

        // subscriptions if due soon
        transactions
          .filter((t) => t.type?.toLowerCase() === "subscription" && t.date && t.frequency)
          .forEach((t) => {
            const id = `sub-${t._id}`;
            if (dismissed.has(id)) return;
            const daysUntil = getDaysUntilNext(t.date, t.frequency);
            if (daysUntil !== null && daysUntil <= 7) {
              built.unshift({
                id, type: "reminder",
                title: `${t.category || "Subscription"} Due Soon`,
                message: `Your ${t.frequency} payment of £${Math.abs(t.amount).toFixed(2)} is due in ${daysUntil === 0 ? "today" : `${daysUntil} day${daysUntil > 1 ? "s" : ""}`}.`,
                time: "Upcoming", date: "Today",
                unread: !read.has(id),
                recurring: true,
                recurringKey: `${t.category?.toLowerCase()}-subscription`,
              });
            }
          });

        // house/bills if due soon
        transactions
          .filter((t) => t.type?.toLowerCase() === "house" && t.date && t.frequency)
          .forEach((t) => {
            const id = `house-${t._id}`;
            if (dismissed.has(id)) return;
            const daysUntil = getDaysUntilNext(t.date, t.frequency);
            if (daysUntil !== null && daysUntil <= 7) {
              built.unshift({
                id, type: "reminder",
                title: `${t.category || "House"} Payment Due`,
                message: `Your ${t.frequency} payment of £${Math.abs(t.amount).toFixed(2)} is due in ${daysUntil === 0 ? "today" : `${daysUntil} day${daysUntil > 1 ? "s" : ""}`}.`,
                time: "Upcoming", date: "Today",
                unread: !read.has(id),
                recurring: true,
                recurringKey: `${t.category?.toLowerCase()}-house`,
              });
            }
          });

        // student finance upcoming
        try {
          const allRes = await fetch(`http://localhost:5000/transactions/all?userId=${currentUser.id}`);
          const allTransactions = await allRes.json();
          allTransactions
            .filter((t) => t.type?.toLowerCase() === "studentfinance" && t.studentFinancePayments)
            .forEach((t) => {
              (t.studentFinancePayments || []).forEach((payment, i) => {
                if (!payment.date) return;
                const id = `sf-${t._id}-${i}`;
                if (dismissed.has(id)) return;
                const payDate = new Date(payment.date);
                const diffDays = Math.ceil((payDate - today) / 86400000);
                if (diffDays > 0 && diffDays <= 30) {
                  built.unshift({
                    id, type: "reminder",
                    title: `Student Finance Term ${i + 1}`,
                    message: `£${Math.abs(payment.amount).toFixed(2)} arriving in ${diffDays} day${diffDays > 1 ? "s" : ""}.`,
                    time: payDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                    date: "Upcoming",
                    unread: !read.has(id),
                  });
                }
              });
            });
        } catch {}

      } catch {}

      // budget warning
      if (!dismissed.has("budget-alert")) {
        const budgetAlertRaw = localStorage.getItem("unibudget_budget_alert");
        if (budgetAlertRaw) {
          try {
            const alert = JSON.parse(budgetAlertRaw);
            built.unshift({
              id: "budget-alert", type: "alert",
              title: alert.exceeded ? "Budget Exceeded!" : "Budget Warning",
              message: alert.exceeded
                ? `You've exceeded your ${alert.period} budget by £${alert.exceededBy?.toFixed(2)}.`
                : `You've used over 80% of your ${alert.period} budget. £${alert.remaining?.toFixed(2)} remaining.`,
              time: "Now", date: "Today",
              unread: !read.has("budget-alert"),
            });
          } catch {}
        }
      }

      // reminders
      const recurring = JSON.parse(localStorage.getItem("unibudget_recurring") || "[]");
      recurring.forEach((t) => {
        const id = `due-${t.category}-${t.type}`;
        if (dismissed.has(id)) return;
        const daysUntil = getDaysUntilNext(t.date, t.frequency);
        if (daysUntil !== null && daysUntil <= 3) {
          built.unshift({
            id, type: "reminder",
            title: `${t.category} Due Soon`,
            message: `Your ${t.frequency} ${t.type} payment is due ${daysUntil === 0 ? "today" : `in ${daysUntil} day${daysUntil > 1 ? "s" : ""}`}.`,
            time: "Now", date: "Today",
            unread: !read.has(id),
            recurring: true,
            recurringKey: `${t.category?.toLowerCase()}-${t.type}`,
          });
        }
      });

    } catch (err) {
      console.error("Failed to build notifications:", err);
    }

    built.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
    setNotifications(built);
    setLoading(false);
  };

  //actions

  const markAllRead = async () => {
    const read = getRead();
    notifications.forEach(n => read.add(n.id));
    saveRead(read);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    try {
      await fetch(`http://localhost:5000/notifications/read-all/${currentUser.id}`, { method: "PUT" });
    } catch {}
  };

  const markRead = async (n) => {
    const read = getRead();
    read.add(n.id);
    saveRead(read);
    setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, unread: false } : item));
    if (n.fromDB) {
      try { await fetch(`http://localhost:5000/notifications/${n.dbId}/read`, { method: "PUT" }); } catch {}
    }
  };

  const dismiss = async (n) => {
    const dismissed = getDismissed();
    dismissed.add(n.id);
    saveDismissed(dismissed);
    setNotifications((prev) => prev.filter((item) => item.id !== n.id));
    if (n.fromDB) {
      try { await fetch(`http://localhost:5000/notifications/${n.dbId}`, { method: "DELETE" }); } catch {}
    }
  };

  const cancelRecurring = (n) => {
    try {
      const stored = JSON.parse(localStorage.getItem("unibudget_recurring") || "[]");
      const updated = stored.filter(
        (t) => `${t.category?.toLowerCase()}-${t.type}` !== n.recurringKey
      );
      localStorage.setItem("unibudget_recurring", JSON.stringify(updated));
    } catch {}
    dismiss(n);
  };

  // filter groups

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filtered = notifications.filter((n) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "Unread") return n.unread;
    if (activeFilter === "Transactions") return n.type === "transaction";
    if (activeFilter === "Reminders") return n.type === "reminder" || n.type === "alert";
    if (activeFilter === "Friends") return n.type === "friend_request" || n.type === "friend_accepted";
    if (activeFilter === "Wallet") return n.type === "wallet_transaction" || n.type === "wallet_added";
    return true;
  });

  const grouped = filtered.reduce((acc, n) => {
    const key = n.date || "Earlier";
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  //main page

  return (
    <>
      <style>{`
        html, body, #root {
          margin: 0; padding: 0;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          color: white; width: 100%; min-height: 100%; overflow-x: hidden;
        }
        body::after {
          content: ''; position: fixed; top: 0; left: 0;
          width: 100%; height: 100%;
          background: linear-gradient(100deg, #111827, #0F0F1A); z-index: -1;
        }
      `}</style>
      <Navbar />

      <div className="notif-page">
        <div className="notif-page-header">
          <div className="notif-page-title-row">
            <div>
              <h1 className="notif-page-title">Notifications</h1>
              <p className="notif-page-sub">
                {loading ? "Loading..."
                  : unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                  : "You're all caught up!"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button className="notif-mark-all-btn" onClick={markAllRead}>
                ✓ Mark all as read
              </button>
            )}
          </div>

          <div className="notif-filters">
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`notif-filter-chip ${activeFilter === f ? "active" : ""}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
                {f === "Unread" && unreadCount > 0 && (
                  <span className="chip-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="notif-page-body">
          {loading ? (
            <div className="notif-empty">
              <span className="notif-empty-icon">⏳</span>
              <p>Loading notifications...</p>
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="notif-empty">
              <p>No notifications here.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([date, items]) => (
              <div key={date} className="notif-group">
                <p className="notif-group-label">{date}</p>
                <div className="notif-cards">
                  {items.map((n) => {
                    const cfg = typeConfig[n.type] || typeConfig.reminder;
                    return (
                      <div
                        key={n.id}
                        className={`notif-card ${n.unread ? "notif-card-unread" : ""}`}
                        onClick={() => markRead(n)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="notif-card-icon" style={{ background: cfg.bg, color: cfg.color }}>
                          {renderIcon(cfg.icon, cfg.color)}
                        </div>

                        <div className="notif-card-content">
                          <div className="notif-card-top">
                            <span className="notif-card-title">{n.title}</span>
                            <span className="notif-card-time">{n.time}</span>
                          </div>
                          <p className="notif-card-msg">{n.message}</p>

                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span className="notif-type-tag" style={{ background: cfg.bg, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            {n.recurring && (
                              <button
                                className="notif-cancel-btn"
                                onClick={(e) => { e.stopPropagation(); cancelRecurring(n); }}
                              >
                                Cancel recurring
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="notif-card-actions">
                          {n.unread && <span className="notif-unread-dot" />}
                          <button
                            className="notif-dismiss-btn"
                            onClick={(e) => { e.stopPropagation(); dismiss(n); }}
                            title="Dismiss"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Notification;