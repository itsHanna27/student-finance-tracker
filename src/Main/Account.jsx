import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Navbar/Sidebar";
import Friends from "./Friends";
import AddFriends from "./addFriends";
import FriendRequest from "./friendrequest";
import BudgetandSaving from "./BudgetandSaving";
import Transactions from "./Transactions";
import DeleteAccount from "./DeleteAccount";
import "../css/Account.css";

const ProfileSection = ({ user, avatar, setFile, setUser }) => {
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [surname, setSurname] = useState(user.surname || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!name.trim() || !surname.trim()) {
      setError("Name and surname cannot be empty.");
      return;
    }

    if (password && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          name,
          surname,
          password: password || null,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        setError(msg);
        return;
      }

      const updatedUser = await res.json();
      const newUser = { ...user, name: updatedUser.name, surname: updatedUser.surname };
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      setSuccess("Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
      setEditMode(false);

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    }
  };

  const handleCancel = () => {
    setName(user.name);
    setSurname(user.surname);
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    setEditMode(false);
  };

  return (
    <>
      <h3 className="profile-title">Profile</h3>

      <div className="profile-header">
        <div className="avatar">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
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
            onClick={() => document.getElementById("avatarUpload").click()}
          >
            Upload new picture
          </button>
        </div>
      </div>

      <div className="profile-info">

        {/* Email — never editable */}
        <div>
          <span>Email</span>
          <p>{user.email}</p>
        </div>

        {/* Name */}
        <div>
          <span>Name</span>
          {editMode ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="profile-input"
            />
          ) : (
            <p>{user.name}</p>
          )}
        </div>

        {/* Surname */}
        <div>
          <span>Surname</span>
          {editMode ? (
            <input
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="profile-input"
            />
          ) : (
            <p>{user.surname}</p>
          )}
        </div>

        {/* Password — only shows in edit mode */}
        {editMode && (
          <>
            <div>
              <span>New Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="profile-input"
              />
            </div>
            <div>
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="profile-input"
              />
            </div>
          </>
        )}

        {/* User ID */}
        <div>
          <span>User ID</span>
          <p>{user.id}</p>
          <button
            className="copy-btn"
            onClick={() => {
              navigator.clipboard.writeText(user.id);
              alert("ID copied");
            }}
          >
            copy
          </button>
        </div>

      </div>

      {/* Error / Success messages */}
      {error && <p className="profile-error">{error}</p>}
      {success && <p className="profile-success">{success}</p>}

      {/* Edit / Save / Cancel buttons */}
      <div className="profile-buttons">
        {!editMode ? (
          <button onClick={() => setEditMode(true)} className="edit-btn">
            Edit Profile
          </button>
        ) : (
          <>
            <button onClick={handleSave} className="save-btn">
              Save Changes
            </button>
            <button onClick={handleCancel} className="cancel-btn">
              Cancel
            </button>
          </>
        )}
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
              <ProfileSection
                user={user}
                avatar={avatar}
                setFile={setFile}
                setUser={setUser}
              />
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
            {activeTab === "deleteAccount" && <DeleteAccount />}
          </div>
        </div>
      </div>
    </>
  );
};

export default Account;