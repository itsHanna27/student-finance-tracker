import React from "react";
import { LogOut } from "lucide-react";
import "./sidebar.css";


const Sidebar = ({ activeTab, setActiveTab, onLogout }) => {
  return (
    <div className="account-sidebar">
      <h3>Profile Settings</h3>

      <ul>
        <li
          className={activeTab === "profile" ? "active" : ""}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </li>

        <li
          className={activeTab === "friends" ? "active" : ""}
          onClick={() => setActiveTab("friends")}
        >
          Friends
        </li>

        <li
          className={activeTab === "addFriends" ? "active" : ""}
          onClick={() => setActiveTab("addFriends")}
        >
          Add Friends
        </li>

        <li
          className={activeTab === "friendrequest" ? "active" : ""}
          onClick={() => setActiveTab("friendrequest")}
        >
          Friend Requests
        </li>

        <li
          className={activeTab === "budgeting" ? "active" : ""}
          onClick={() => setActiveTab("budgeting")}
        >
          Budgeting and Saving
        </li>

        
      </ul>

      <button className="logout-btn" onClick={onLogout}>
        <LogOut size={18} style={{ marginBottom: "-3px", marginRight: "8px" }} />
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
