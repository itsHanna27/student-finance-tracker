import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Main/Dashboard";
import Transactions from "./Main/Transactions";
import Login from "./Main/Login";
import Signup from "./Main/Signup";
import Account from "./Main/Account";
import Friends from "./Main/Friends";
import AddFriends from "./Main/addFriends";
import FriendRequest from "./Main/friendrequest";
import BudgetandSaving from "./Main/BudgetandSaving";
import Community from "./Main/Community";
import SharedWallet from "./Main/SharedWallet";
import Notification from "./Modal/Notification";

function App() {
  return (
    <Router>
      <Routes>
        {/* ✅ lowercase /signup — this was the bug */}
        <Route path="/" element={<Navigate to="/signup" />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/account" element={<Account />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/addfriends" element={<AddFriends />} />
        <Route path="/friendRequest" element={<FriendRequest />} />
        <Route path="/BudgetandSaving" element={<BudgetandSaving />} />
        <Route path="/SharedWallet" element={<SharedWallet />} />
        <Route path="/Notification" element={<Notification />} />
        <Route path="/Community" element={<Community />} />
      </Routes>
    </Router>
  );
}

export default App;