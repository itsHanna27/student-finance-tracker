import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./navbar.css";
import { FaWallet, FaBell, FaUserPlus, FaUserCheck } from "react-icons/fa";

const getNotifRoute = (type) => {
  if (type === "wallet_transaction" || type === "wallet_added") return "/SharedWallet";
  if (type === "transaction") return "/transactions";
  if (type === "reminder" || type === "alert") return "/transactions";
  return null;
};

const typeConfig = {
  alert:              { icon: "⚠️",                 bg: "#2a1a3e", color: "#f87171" },
  transaction:        { icon: "💸",                 bg: "#1a1535", color: "#a78bfa" },
  reminder:           { icon: "🔔",                 bg: "#1e1542", color: "#c4b5fd" },
  friend_request:     { icon: "react:FaUserPlus",   bg: "#1e1542", color: "#9b7fd4" },
  friend_accepted:    { icon: "react:FaUserCheck",  bg: "#1e1542", color: "#9b7fd4" },
  wallet_transaction: { icon: "react:FaWallet",     bg: "#1a1535", color: "#d8b4fe" },
  wallet_added:       { icon: "react:FaWallet",     bg: "#1a1535", color: "#d8b4fe" },
};

const renderIcon = (icon, color) => {
  if (icon === "react:FaUserPlus")  return <FaUserPlus size={14} color={color} />;
  if (icon === "react:FaUserCheck") return <FaUserCheck size={14} color={color} />;
  if (icon === "react:FaWallet")    return <FaWallet size={14} color={color} />;
  return icon;
};

const getDaysUntilNext = (startDateStr, frequency) => {
  if (!startDateStr || !frequency) return null;
  const start = new Date(startDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let next = new Date(start);
  while (next <= today) {
    if (frequency === "weekly")       next.setDate(next.getDate() + 7);
    else if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
    else if (frequency === "yearly")  next.setFullYear(next.getFullYear() + 1);
    else return null;
  }
  return Math.round((next - today) / 86400000);
};

const formatDays = (days) => {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
};

// ── localStorage helpers ──────────────────────────────────────────────────────
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

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [cancelConfirmId, setCancelConfirmId] = useState(null);
  const panelRef = useRef(null);
  const bellRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();

  const handleNotifClick = async (n) => {
    await markRead(n);
    setOpen(false);
    if (n.type === "friend_request") { navigate("/account", { state: { activeTab: "friendrequest" } }); return; }
    if (n.type === "friend_accepted") { navigate("/account", { state: { activeTab: "friends" } }); return; }
    const route = getNotifRoute(n.type);
    if (route) navigate(route);
  };

  const buildNotifications = async () => {
    const dismissed = getDismissed();
    const read = getRead();
    const built = [];

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      if (currentUser.id) {

        // ── 1. DB notifications (friend requests, wallet) ──────────────────
        try {
          const notifRes = await fetch(`http://localhost:5000/notifications/${currentUser.id}`);
          const dbNotifs = await notifRes.json();
          if (Array.isArray(dbNotifs)) {
            dbNotifs.forEach((n) => {
              if (dismissed.has(n._id)) return; // skip dismissed
              built.push({
                id: n._id,
                dbId: n._id,
                type: n.type,
                title: n.title,
                message: n.message,
                time: new Date(n.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                unread: !n.read,
                fromDB: true,
              });
            });
          }
        } catch (e) { console.error("Failed to fetch DB notifications:", e); }

        // ── 2. Transactions ────────────────────────────────────────────────
        try {
          const txRes = await fetch(`http://localhost:5000/transactions?userId=${currentUser.id}`);
          const transactions = await txRes.json();

          transactions
            .filter((t) => {
              if (!["expense", "income"].includes(t.type?.toLowerCase())) return false;
              if (!t.date) return false;
              return new Date(t.date) >= sevenDaysAgo;
            })
            .slice(0, 3)
            .forEach((t) => {
              const id = `tx-${t._id}`;
              if (dismissed.has(id)) return;
              const isIncome = t.amount > 0;
              built.push({
                id,
                type: "transaction",
                title: isIncome ? "Payment Received" : "Expense Logged",
                message: `${isIncome ? "+" : "-"}£${Math.abs(t.amount).toFixed(2)} — ${t.category || t.type}`,
                time: new Date(t.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                unread: !read.has(id),
              });
            });

          // subscriptions → due soon
          transactions
            .filter((t) => t.type?.toLowerCase() === "subscription" && t.date && t.frequency)
            .forEach((t) => {
              const id = `sub-${t._id}`;
              if (dismissed.has(id)) return;
              const daysUntil = getDaysUntilNext(t.date, t.frequency);
              if (daysUntil !== null && daysUntil <= 7) {
                built.unshift({
                  id,
                  type: "reminder",
                  title: `${t.category || "Subscription"} Due Soon`,
                  message: `Your ${t.frequency} payment of £${Math.abs(t.amount).toFixed(2)} is due ${formatDays(daysUntil)}.`,
                  time: "Upcoming",
                  unread: !read.has(id),
                  recurring: true,
                  recurringKey: `${t.category?.toLowerCase()}-subscription`,
                });
              }
            });

          // house/bills → due soon
          transactions
            .filter((t) => t.type?.toLowerCase() === "house" && t.date && t.frequency)
            .forEach((t) => {
              const id = `house-${t._id}`;
              if (dismissed.has(id)) return;
              const daysUntil = getDaysUntilNext(t.date, t.frequency);
              if (daysUntil !== null && daysUntil <= 7) {
                built.unshift({
                  id,
                  type: "reminder",
                  title: `${t.category || "House"} Payment Due`,
                  message: `Your ${t.frequency} payment of £${Math.abs(t.amount).toFixed(2)} is due ${formatDays(daysUntil)}.`,
                  time: "Upcoming",
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
                      id,
                      type: "reminder",
                      title: `Student Finance Term ${i + 1}`,
                      message: `£${Math.abs(payment.amount).toFixed(2)} arriving ${formatDays(diffDays)}.`,
                      time: payDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
                      unread: !read.has(id),
                    });
                  }
                });
              });
          } catch {}

        } catch (e) { console.error("Failed to fetch transactions:", e); }
      }

      // ── 3. Budget warning ──────────────────────────────────────────────
      const budgetAlertRaw = localStorage.getItem("unibudget_budget_alert");
      if (budgetAlertRaw && !dismissed.has("budget-alert")) {
        try {
          const alert = JSON.parse(budgetAlertRaw);
          built.unshift({
            id: "budget-alert",
            type: "alert",
            title: alert.exceeded ? "Budget Exceeded!" : "Budget Warning",
            message: alert.exceeded
              ? `You've exceeded your ${alert.period} budget by £${alert.exceededBy?.toFixed(2)}.`
              : `You've used over 80% of your ${alert.period} budget. £${alert.remaining?.toFixed(2)} remaining.`,
            time: "Now",
            unread: !read.has("budget-alert"),
          });
        } catch {}
      }

    } catch (err) { console.error("Failed to build navbar notifications:", err); }

    built.sort((a, b) => (b.unread ? 1 : 0) - (a.unread ? 1 : 0));
    setNotifications(built);
  };

  useEffect(() => { buildNotifications(); }, []);
  useEffect(() => { if (open) buildNotifications(); }, [open]);

  useEffect(() => {
    const handler = (e) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current && !bellRef.current.contains(e.target)
      ) {
        setOpen(false);
        setCancelConfirmId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

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
    setCancelConfirmId(null);
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

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <FaWallet /> UniBudget
      </div>

      <div className="navbar-right">
        <ul className="nav-list">
          <li><NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-active" : "nav-link"}>Dashboard</NavLink></li>
          <li><NavLink to="/transactions" className={({ isActive }) => isActive ? "nav-active" : "nav-link"}>Transactions</NavLink></li>
          <li><NavLink to="/SharedWallet" className={({ isActive }) => isActive ? "nav-active" : "nav-link"}>Shared Wallets</NavLink></li>
          <li><NavLink to="/community" className={({ isActive }) => isActive ? "nav-active" : "nav-link"}>Community</NavLink></li>
          <li><NavLink to="/account" className={({ isActive }) => isActive ? "nav-active" : "nav-link"}>Account</NavLink></li>
        </ul>

        <div className="bell-wrapper" ref={bellRef}>
          <button
            className="bell-btn"
            onClick={() => { setOpen((o) => !o); setCancelConfirmId(null); }}
            aria-label="Notifications"
          >
            <FaBell size={21} className="nav-bell" />
            {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
          </button>

          {open && (
            <div className="notif-dropdown" ref={panelRef}>
              <div className="notif-dropdown-header">
                <span className="notif-dropdown-title">
                  Notifications
                  {unreadCount > 0 && <span className="notif-count-pill">{unreadCount} new</span>}
                </span>
                {unreadCount > 0 && (
                  <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
                )}
              </div>

              <div className="notif-dropdown-list">
                {notifications.length === 0 ? (
                  <div className="notif-dropdown-empty">
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <>
                    {notifications.map((n) => {
                      const cfg = typeConfig[n.type] || typeConfig.reminder;
                      const isConfirming = cancelConfirmId === n.id;
                      return (
                        <div
                          key={n.id}
                          className={`notif-row ${n.unread ? "notif-row-unread" : ""}`}
                          onClick={() => handleNotifClick(n)}
                          style={{ cursor: "pointer" }}
                        >
                          <div className="notif-row-icon" style={{ background: cfg.bg, color: cfg.color }}>
                            {renderIcon(cfg.icon, cfg.color)}
                          </div>

                          <div className="notif-row-body">
                            <p className="notif-row-title">{n.title}</p>
                            <p className="notif-row-msg">{n.message}</p>
                            <span className="notif-row-time">{n.time}</span>

                            {n.recurring && (
                              <div className="notif-cancel-area" onClick={(e) => e.stopPropagation()}>
                                {!isConfirming ? (
                                  <button className="notif-cancel-btn" onClick={() => setCancelConfirmId(n.id)}>
                                    Cancel recurring
                                  </button>
                                ) : (
                                  <div className="notif-cancel-confirm">
                                    <span>Stop this recurring payment?</span>
                                    <div className="notif-cancel-confirm-btns">
                                      <button className="notif-cancel-yes" onClick={() => cancelRecurring(n)}>Yes, cancel</button>
                                      <button className="notif-cancel-no" onClick={() => setCancelConfirmId(null)}>Keep it</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="notif-row-right">
                            {n.unread && <span className="notif-blue-dot" />}
                            <button className="notif-x-btn" onClick={(e) => { e.stopPropagation(); dismiss(n); }}>×</button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="notif-dropdown-footer">
                      <button
                        className="notif-view-all-btn"
                        onClick={() => { setOpen(false); navigate("/Notification"); }}
                      >
                        View all notifications
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;