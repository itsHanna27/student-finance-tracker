import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Main/Dashboard";
import Transactions from "./Main/Transactions";
import Login from "./Main/Login";
import Signup from "./Main/Signup";
import Account from "./Main/Account";
import Friends from "./Main/Friends";
import AddFriends from "./Main/addFriends";
import FriendRequest from "./Main/friendrequest";

function App() {
  return (
    <Router>
      <Routes>

        {/* Default route starts at Login */}
        <Route path="/" element={<Navigate to="/Signup" />} />

        {/* Pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/account" element={<Account/>} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/addfriends" element={<AddFriends />} />
        <Route path="/friendRequest" element={<FriendRequest />} />


      </Routes>
    </Router>
  );
}

export default App;