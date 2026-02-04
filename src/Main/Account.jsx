import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Navbar/Sidebar";
import Friends from "./Friends";
import AddFriends from "./addFriends";
import FriendRequest from "./friendrequest";
import BudgetandSaving from "./BudgetandSaving";
import Transactions from "./Transactions";
import "../css/Account.css";
import Bestie from "../Modal/bestie";

const ProfileSection = ({ user, avatar, setFile }) => {
  return (
    <>
      <h3 style={{ color: "#A78BFA", fontSize: "18px" }}>Profile</h3>
      <div className="profile-header">
        <div className="avatar">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: "50%",
              }}
            />
          ) : (
            user.name?.charAt(0).toUpperCase()
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
          <input
            type="file"
            accept="image/*"
            hidden
            id="avatarUpload"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <button
            className="upload-btn"
            onClick={() =>
              document.getElementById("avatarUpload").click()
            }
          >
            Upload new picture
          </button>
        </div>
      </div>
    <Bestie/>
      <div className="profile-info">
        <div>
          <span>Email</span>
          <p>{user.email}</p>
        </div>
        <div>
          <span>Name</span>
          <p>{user.name}</p>
        </div>
        <div>
          <span>Surname</span>
          <p>{user.surname}</p>
        </div>
        <div>
          <span>User ID</span>
          <p>{user.id}</p>
           <button
                      className="copy-btn"
                      style={{
                        borderRadius: "30px",
                        border: "none",
                        background: "#5d6079ff",
                        width: "60px",
                        height: "25px",
                        alignSelf: "center",
                      }}
                      onClick={() => {
                        navigator.clipboard.writeText(user.id);
                        alert("ID copied");
                      }}
                    >
                      copy
                    </button>
        </div>
      </div>
    </>
  );
};

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [avatar, setAvatar] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Check if navigated with a specific tab to open
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setAvatar(parsedUser.avatar || "");
    }
  }, []);

  useEffect(() => {
    if (file) uploadAvatar();
  }, [file]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const uploadAvatar = async () => {
    if (!file || !user) return;

    const formData = new FormData();
    formData.append("avatar", file);
    formData.append("userId", user.id);

    try {
      const res = await fetch("http://localhost:5000/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      if (data.avatar) {
        setAvatar(data.avatar);
        const updatedUser = { ...user, avatar: data.avatar };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  if (!user) return null;

  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          color: white;
          width: 100%;
          min-height: 100%;
          overflow-x: hidden;
        }
        body::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(100deg, #111827, #0F0F1A);
          z-index: -1;
        }
      `}</style>

      <Navbar />

      <div className="account-page">
        <h1 className="account-title" style={{ fontWeight: "600" }}>
          Account Settings
        </h1>

        <div className="account-container">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onLogout={handleLogout}
          />

          <div className="account-card">
            {activeTab === "profile" && (
              <ProfileSection user={user} avatar={avatar} setFile={setFile} />
            )}

            {activeTab === "friends" && <Friends />}
            {activeTab === "addFriends" && <AddFriends />}
            {activeTab === "friendrequest" && <FriendRequest />}
            {activeTab === "budget" && (
              <BudgetandSaving setActiveTab={setActiveTab} />
            )}
            {activeTab === "transactions" && (
              <Transactions setActiveTab={setActiveTab} />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;
