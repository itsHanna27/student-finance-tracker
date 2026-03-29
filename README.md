# UniBudget
A full stack personal finance web app designed specifically for university students. Track income, expenses, budgets and saving goals - all in one place.

---

## Features

### ◆ Transactions
- Add, edit and delete transactions across multiple types: Expense, Income, Subscription, House/Bills, Student Finance, Balance Adjustment
- Recurring transactions with automatic copy generation via a daily cron job (weekly/monthly/yearly)
- Filter by type and date range
- Search by category, description or type
- Spending breakdown via pie chart and line chart (weekly/monthly/yearly views)

### ◆ Dashboard
- Live balance display
- Spending over time (line chart)
- Category breakdown (pie chart)
- Budget and saving goal progress

### ◆ Budgeting & Saving Goals
- Set weekly or monthly budgets with progress tracking
- Create saving goals and add money towards them
- Budget warning alerts at 80% and exceeded alerts
- Congrats modal when a saving goal is reached

### ◆ Shared Wallets
- Create shared wallets with friends
- Two split types: Equal Split and Manual Budget
- Add transactions, view full history, and filter by member
- Group chat inside each wallet with real-time polling
- Owner controls: add/remove members, reset transactions, set auto-reset schedule
- System messages when members join or leave

### ◆ Friends
- Search users by ID
- Send, accept and reject friend requests
- Remove friends
- View shared wallet count on member profiles

### ◆ Notifications
- Real-time notification bell with unread badge
- Alerts for: transactions, budget warnings, subscription/bill reminders, student finance upcoming payments, friend requests, community interactions
- Mark all as read, dismiss individual, delete all
- Cancel recurring directly from a notification

### ◆ Community
- Post budgeting tips and questions
- Like, dislike and comment on posts
- Filter by My Posts, Friends Posts, Community Posts
- Search posts by title, name or content

### ◆ Bestie (AI Chatbot)
- Context-aware finance assistant powered by Groq AI (Llama 3.3 70b)
- Personalised responses based on real spending, budget and saving data
- Smart local response system for common questions (no API call needed)
- Persistent conversation history across sessions
- Suggested questions for quick access

### ◆ Account & Profile
- Edit name, surname and password
- Upload and display profile avatar (stored via Cloudinary)
- Appearance settings (dark/light mode, colour blind mode)
- Delete account with password confirmation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, CSS, React Icons, Lucide React |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| File Storage | Cloudinary |
| Authentication | JWT & bcrypt |
| AI | Groq API (Llama 3.3 70b) |
| Charts | Recharts |
| Scheduling | node-cron |

---

## Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm
- MongoDB Atlas account
- Cloudinary account
- Groq API account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/itsHanna27/student-finance-tracker.git
cd student-finance-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend/root directory and add your credentials:
```env
MONGO_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=your_groq_api_key
```

> → Get a free Groq API key at https://console.groq.com
> → Never commit your `.env` file to GitHub

4. Open two terminals and run both together:

Terminal 1 — Backend:
```bash
cd src/backend
node server.js
```

Terminal 2 — Frontend:
```bash
npm start
```

5. Open `http://localhost:3000` in your browser.

---

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # Pages and UI components
│   │   ├── Modal/        # Modal components
│   │   ├── Navbar/       # Navbar and Sidebar
│   │   ├── css/          # Stylesheets
│   │   └── hooks/        # Custom React hooks
├── server/               # Node.js backend
│   ├── routes/           # Express route handlers
│   ├── models/           # Mongoose schemas
│   └── server.js         # Entry point
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `MONGO_URI` | MongoDB Atlas connection string |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `GROQ_API_KEY` | Groq AI API key |
