import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import "../ModalCSS/bestie.css";

const STORAGE_KEY = "bestie_messages";
const MAX_STORED_MESSAGES = 20;
const HISTORY_TO_SEND = 4;

const Bestie = ({ balance = 0, transactions = [], savingGoals = {}, budgetGoals = {}, userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");

  const [messages, setMessages] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {}
    return [{
      id: 1,
      sender: "bestie",
      text: "Hey! I'm Bestie, your finance buddy! 💜 How can I help you today?",
      timestamp: new Date(),
    }];
  });

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    try {
      const toStore = messages.slice(-MAX_STORED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {}
  }, [messages]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserName(user.name || user.surname || "");
    }
  }, []);

  const getSpendingToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return transactions
      .filter(t => {
        if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return false;
        if (t.amount >= 0) return false;
        const tDate = new Date(t.date);
        return tDate >= today && tDate < tomorrow;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getSpendingThisWeek = () => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return transactions
      .filter(t => {
        if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return false;
        if (t.amount >= 0) return false;
        const tDate = new Date(t.date);
        return tDate >= weekAgo && tDate <= today;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const getTopCategory = () => {
    const categoryTotals = {};
    transactions.forEach(t => {
      if (t.amount >= 0) return;
      if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return;
      const category = t.category?.trim() || "Other";
      categoryTotals[category] = (categoryTotals[category] || 0) + Math.abs(t.amount);
    });
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  };

  const getSpendingByCategory = () => {
    const categoryTotals = {};
    let total = 0;
    transactions.forEach(t => {
      if (t.amount >= 0) return;
      if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return;
      const category = t.category?.trim() || "Other";
      const amount = Math.abs(t.amount);
      categoryTotals[category] = (categoryTotals[category] || 0) + amount;
      total += amount;
    });
    return Object.entries(categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, amount]) => ({ name, amount, percentage: total > 0 ? Math.round((amount / total) * 100) : 0 }));
  };

  const getSavingGoalProgress = (specificPeriod = null) => {
    const goals = [];
    if (savingGoals.weekly && savingGoals.weekly.amount) {
      const weeklyGoal = savingGoals.weekly;
      goals.push({ period: "weekly", progress: (weeklyGoal.currentSaved || 0) / weeklyGoal.amount, remaining: weeklyGoal.amount - (weeklyGoal.currentSaved || 0), current: weeklyGoal.currentSaved || 0, goal: weeklyGoal.amount });
    }
    if (savingGoals.monthly && savingGoals.monthly.amount) {
      const monthlyGoal = savingGoals.monthly;
      goals.push({ period: "monthly", progress: (monthlyGoal.currentSaved || 0) / monthlyGoal.amount, remaining: monthlyGoal.amount - (monthlyGoal.currentSaved || 0), current: monthlyGoal.currentSaved || 0, goal: monthlyGoal.amount });
    }
    if (goals.length === 0) return null;
    if (specificPeriod) return goals.find(g => g.period === specificPeriod) || null;
    return goals;
  };

  const getBudgetStatus = () => {
    const statuses = [];
    ['weekly', 'monthly'].forEach(period => {
      const budget = budgetGoals[period];
      if (!budget || !budget.amount) return;
      const startDate = new Date(budget.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + (period === "weekly" ? 7 : 30));
      const spent = transactions
        .filter(t => {
          if (t.type === "saving" || t.type === "budget") return false;
          if (t.amount >= 0) return false;
          const transactionDate = new Date(t.date);
          return transactionDate >= startDate && transactionDate <= endDate;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const percentSpent = (spent / budget.amount) * 100;
      const exceeded = spent > budget.amount;
      statuses.push({ period, budget: budget.amount, spent, percentSpent, exceeded, remaining: budget.amount - spent, exceededBy: exceeded ? spent - budget.amount : 0 });
    });
    return statuses.length > 0 ? statuses : null;
  };

  const getSpendingDaysAgo = (daysAgo = 0) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDay = new Date(today);
    targetDay.setDate(today.getDate() - daysAgo);
    const nextDay = new Date(targetDay);
    nextDay.setDate(targetDay.getDate() + 1);
    return transactions
      .filter(t => {
        if (t.type === "saving" || t.type === "budget" || t.type === "income" || t.type === "studentFinance") return false;
        if (t.amount >= 0) return false;
        const tDate = new Date(t.date);
        return tDate >= targetDay && tDate < nextDay;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const FAQ_POOL = [
    "How much did I spend today?",
    "How much did I spend this week?",
    "Where is most of my money going?",
    "Why is my balance low?",
    "Am I overspending?",
    "What can I afford right now?",
    "How do I set up a budget?",
    "How do I create a saving goal?",
    "How close am I to my saving goal?",
    "Help me save more money",
    "Is my spending healthy?",
    "How do I add a transaction?",
    "How do I edit or delete a transaction?",
    "Where can I see my recent transactions?",
    "How does budgeting work in this app?",
  ];

  const getRandomQuestions = (count = 4) => [...FAQ_POOL].sort(() => 0.5 - Math.random()).slice(0, count);
  const [suggestedQuestions, setSuggestedQuestions] = useState(getRandomQuestions());

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (isOpen) setSuggestedQuestions(getRandomQuestions()); }, [isOpen]);

  const generateResponse = (userText) => {
    const text = userText.toLowerCase().trim();
    const hasWord = (word) => new RegExp(`\\b${word}\\b`, 'i').test(text);

    if (text.includes("if i") || text.includes("would i") || text.includes("should i") || text.includes("can i afford")) return null;
    if (["hi", "hello", "hey", "hiya", "yo"].some((g) => text === g)) return "Hey there! 💜 I'm Bestie, your finance buddy! How can I help you today?";
    if (text.includes("how are you") || text.includes("how r u")) return "I'm doing great, thanks for asking! 😊 Ready to help you with your finances!";

    if (hasWord("afford")) {
      const avgDaily = getSpendingThisWeek() / 7;
      return `Based on your current balance of £${balance.toFixed(2)} and your average daily spending of £${avgDaily.toFixed(2)}, ${balance > avgDaily * 7 ? "you're in a good spot! Just keep an eye on your budget 😊" : "you might want to slow down on spending this week 💜"}`;
    }

    if (hasWord("spend") && text.match(/\d+ days ago/)) {
      const daysAgo = parseInt(text.match(/\d+/)[0], 10);
      const amount = getSpendingDaysAgo(daysAgo);
      return amount === 0 ? `You didn't spend anything ${daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}! 🎉` : `You spent £${amount.toFixed(2)} ${daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`}!`;
    }

    if (hasWord("spend") && (hasWord("today") || text.includes("2day"))) {
      const todaySpend = getSpendingToday();
      return todaySpend === 0 ? "You've spent £0 today so far! 🎉 A no-spend day keeps the budget healthy!" : `You've spent £${todaySpend.toFixed(2)} today. ${todaySpend > 20 ? "That's quite a bit! Try to take it easy for the rest of the day 😊" : "Looking good! Keep it up! 💜"}`;
    }

    if (hasWord("spend") && hasWord("week")) {
      const weekSpend = getSpendingThisWeek();
      const topCat = getTopCategory();
      return topCat ? `This week you've spent £${weekSpend.toFixed(2)}. Your biggest category is ${topCat.name} at £${topCat.amount.toFixed(2)}. ${topCat.name.toLowerCase().includes("food") ? "Maybe meal prep could help you save? 🍜" : "Keep an eye on that! 👀"}` : `This week you've spent £${weekSpend.toFixed(2)}. Great job tracking your expenses! 💜`;
    }

    if (hasWord("where") && (text.includes("money going") || hasWord("spending"))) {
      const categories = getSpendingByCategory();
      if (categories.length === 0) return "You haven't recorded any spending yet! Add some transactions to see where your money goes 😊";
      return `Most of your spending goes to ${categories.slice(0, 3).map(c => `${c.name} (${c.percentage}%)`).join(", ")}. Want some tips on cutting back?`;
    }

    if (text.includes("overspending") || text.includes("spending too much")) {
      const budgetStatus = getBudgetStatus();
      if (budgetStatus && budgetStatus.length > 0) {
        const exceeded = budgetStatus.filter(b => b.exceeded);
        if (exceeded.length > 0) return `${exceeded.map(b => `You exceeded your ${b.period} budget by £${b.exceededBy.toFixed(2)}! (£${b.spent.toFixed(2)}/£${b.budget.toFixed(2)})`).join(" ")} Let's work on cutting back together! 💜`;
        const closest = budgetStatus.sort((a, b) => b.percentSpent - a.percentSpent)[0];
        return `You're doing well! You've used ${Math.round(closest.percentSpent)}% of your ${closest.period} budget. Keep it up! 💜`;
      }
      const weekSpend = getSpendingThisWeek();
      const topCat = getTopCategory();
      return weekSpend > balance * 0.3 ? `You're spending quite a bit! This week's total is £${weekSpend.toFixed(2)}. ${topCat ? `Try checking your ${topCat.name} category — that seems to be the main one 👀` : "Keep an eye on your spending 💜"}` : "You're doing well! Your spending looks healthy. Keep it up! 💜";
    }

    if (hasWord("budget") && (hasWord("how") || text.includes("am i") || hasWord("doing"))) {
      const budgetStatus = getBudgetStatus();
      if (!budgetStatus || budgetStatus.length === 0) return "You haven't set a budget yet! Head to Account → Budget tab to create one and I'll help you track it 😊";
      return budgetStatus.map(b => b.exceeded ? `Your ${b.period} budget: Over by £${b.exceededBy.toFixed(2)} 😬 (£${b.spent.toFixed(2)}/£${b.budget.toFixed(2)})` : b.percentSpent >= 80 ? `Your ${b.period} budget: ${Math.round(b.percentSpent)}% used, £${b.remaining.toFixed(2)} left! Almost there! 👀` : `Your ${b.period} budget: ${Math.round(b.percentSpent)}% used, £${b.remaining.toFixed(2)} left! Looking good! 💜`).join(" ");
    }

    if (text.includes("exceeded") && hasWord("budget")) {
      const budgetStatus = getBudgetStatus();
      if (!budgetStatus || budgetStatus.length === 0) return "You haven't set a budget yet! Want to create one? Head to Account → Budget tab! 😊";
      const exceeded = budgetStatus.filter(b => b.exceeded);
      if (exceeded.length === 0) return "Good news! You haven't exceeded any budgets. Keep up the great work! 💜";
      return `You've exceeded your ${exceeded.map(b => `${b.period} by £${b.exceededBy.toFixed(2)}`).join(" and ")}. Don't worry though! Let's work on it together. Try cutting back on non-essentials 😊`;
    }

    if (text.includes("set up") && hasWord("budget")) return "Head to your Account page and click 'Budget' tab! You can set weekly or monthly budgets and I'll help you track them 😊";
    if (hasWord("create") && (hasWord("saving") || hasWord("goal"))) return "Go to Account → Budget tab! You can create a saving goal there and add money to it anytime. I'll cheer you on! 💪";

    if (hasWord("close") && hasWord("goal")) {
      const isWeekly = hasWord("weekly") || hasWord("week");
      const isMonthly = hasWord("monthly") || hasWord("month");
      let goalProgress;
      if (isWeekly) {
        goalProgress = getSavingGoalProgress("weekly");
        if (!goalProgress) return "You don't have a weekly saving goal yet! Want to create one? Head to Account → Budget tab! 💜";
      } else if (isMonthly) {
        goalProgress = getSavingGoalProgress("monthly");
        if (!goalProgress) return "You don't have a monthly saving goal yet! Want to create one? Head to Account → Budget tab! 💜";
      } else {
        goalProgress = getSavingGoalProgress();
        if (!goalProgress || goalProgress.length === 0) return "You don't have any active saving goals yet! Want to create one? Head to Account → Budget tab! 💜";
      }
      if (Array.isArray(goalProgress)) {
        return `Here's your progress: ${goalProgress.map(g => { const pct = Math.round(g.progress * 100); return g.remaining > 0 ? `${g.period.charAt(0).toUpperCase() + g.period.slice(1)}: ${pct}% complete, £${g.remaining.toFixed(2)} to go!` : `${g.period.charAt(0).toUpperCase() + g.period.slice(1)}: Goal reached! 🎉`; }).join(" ")} You're doing amazing! 💜`;
      }
      const percentage = Math.round(goalProgress.progress * 100);
      return goalProgress.remaining > 0 ? `You're doing amazing! You're at ${percentage}% of your ${goalProgress.period} saving goal. Just £${goalProgress.remaining.toFixed(2)} more to go! 🎯` : `OMG you did it!! You reached your ${goalProgress.period} goal of £${goalProgress.goal.toFixed(2)}! 🎉💜 Want to set a new one?`;
    }

    if (text.includes("save more") || text.includes("help me save")) return "Here's a tip: Try the 50/30/20 rule! 50% needs, 30% wants, 20% savings. Also, track your subscriptions — those add up fast! 💡";
    if (text.includes("spending healthy") || text.includes("doing ok")) {
      const weekSpend = getSpendingThisWeek();
      return weekSpend < balance * 0.3 ? "You're doing pretty well! Your spending is mostly on track. Keep it up! 💜" : "Your spending is a bit high this week, but don't worry! Let's work on it together. Try cutting back on non-essentials 😊";
    }
    if (hasWord("add") && hasWord("transaction")) return "Easy! Go to the Transactions page and click the 'Add Transaction' button. Fill in the amount, category, and description, and you're done! ✨";
    if ((hasWord("edit") || hasWord("delete")) && hasWord("transaction")) return "On the Transactions page, click the edit button (pencil icon) next to any transaction. You can update or delete it from there! 🖊️";
    if (hasWord("see") && hasWord("transaction")) return "All your recent transactions are on the Transactions page! You can search and filter them too 😊";
    if (text.includes("budgeting work") || text.includes("how does budget")) return "Budgeting here is simple! Set a weekly or monthly budget, and I'll track your spending against it. If you go over 80%, I'll give you a heads up! 🚨";
    if (hasWord("thank") || hasWord("thx") || text === "ty") return "You're so welcome! 💜 I'm always here if you need me!";
    if (hasWord("bye") || text === "cya" || text.includes("see you")) return `Bye ${userName}! Come back anytime you need help 😊💜`;

    return null;
  };

  const callGroqAPI = async (userMessage) => {
    try {
      const history = messages
        .slice(-HISTORY_TO_SEND)
        .map(m => ({ role: m.sender === "user" ? "user" : "assistant", content: m.text }));

      const response = await fetch("http://localhost:5000/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          conversationHistory: history,
          financialContext: {
            userName,
            balance,
            todaySpend: getSpendingToday(),
            weekSpend: getSpendingThisWeek(),
            topCategory: getTopCategory(),
            categories: getSpendingByCategory(),
            budgetStatus: getBudgetStatus(),
            savingsProgress: getSavingGoalProgress(),
            recentTransactions: transactions
              .filter(t => t.amount < 0 && t.type !== "saving" && t.type !== "budget" && t.type !== "income" && t.type !== "studentFinance")
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 10)
              .map(t => ({ description: t.description || t.category, amount: Math.abs(t.amount), category: t.category, date: new Date(t.date).toLocaleDateString() })),
          },
        }),
      });

      const data = await response.json();
      return data?.reply || "Hmm my brain lagged for a sec 😭 try again?";
    } catch (err) {
      console.error(err);
      return "I'm having connection issues rn 💔 Try again in a sec!";
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMessage = { id: Date.now(), sender: "user", text: inputValue, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);
    const smartResponse = generateResponse(currentInput);
    if (smartResponse) {
      setTimeout(() => {
        setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "bestie", text: smartResponse, timestamp: new Date() }]);
        setIsTyping(false);
      }, 800);
    } else {
      const aiResponse = await callGroqAPI(currentInput);
      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "bestie", text: aiResponse, timestamp: new Date() }]);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return createPortal(
    <>
      <div className={`bestie-chat-window ${isOpen ? "open" : ""}`}>
        <div className="bestie-header">
          <div className="bestie-header-left">
            <img src="/bestie-icon.png" alt="Bestie" className="bestie-header-icon" />
            <div>
              <h3>Bestie</h3>
              <p className="bestie-status">
                <span style={{ color: "rgb(72, 245, 9)" }}>Online</span> • Here to help!
              </p>
            </div>
          </div>
          <button className="bestie-close" onClick={() => setIsOpen(false)}>✕</button>
        </div>

        <div className="bestie-messages">
          {messages.map((msg) => (
            <div key={msg.id} className={`bestie-message ${msg.sender === "user" ? "user-message" : "bestie-message"}`}>
              {msg.sender === "bestie" && <img src="/bestie-icon.png" alt="Bestie" className="message-avatar" />}
              <div className="message-bubble">
                <p>{msg.text}</p>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="bestie-message bestie-message">
              <img src="/bestie-icon.png" alt="Bestie" className="message-avatar" />
              <div className="message-bubble typing-indicator"><span></span><span></span><span></span></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="bestie-suggestions">
          {suggestedQuestions.map((q, index) => (
            <button key={index} className="bestie-suggestion-chip" onClick={() => setInputValue(q)}>{q}</button>
          ))}
        </div>

        <div className="bestie-input-container">
          <input
            type="text"
            placeholder="Ask Bestie anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="bestie-input"
            disabled={isTyping}
          />
          <button onClick={handleSend} className="bestie-send-btn" disabled={isTyping}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      <button className={`bestie-float-btn ${isOpen ? "hidden" : ""}`} onClick={() => setIsOpen(true)}>
        <img src="/bestie-icon.png" alt="Bestie" />
        <span className="bestie-notification-badge">1</span>
      </button>
    </>,
    document.body
  );
};

export default Bestie;