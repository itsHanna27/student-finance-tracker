import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Navbar/Sidebar";
import Friends from "./Friends";
import AddFriends from "./addFriends";
import FriendRequest from "./friendrequest";
import BudgetandSaving from "./BudgetandSaving";
import "../css/Account.css";

const Account = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [avatar, setAvatar] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

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

                    <button
  className="remove-btn"
  onClick={async () => {
    try {
      const res = await fetch("http://localhost:5000/remove-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!res.ok) throw new Error("Remove failed");

      const data = await res.json();

      setAvatar("");
      const updatedUser = { ...user, avatar: "" };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Failed to remove avatar:", err);
    }
  }}
>
  Remove
</button>

                  </div>
                </div>

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
                  style={{ borderRadius: "30px", border: "none", background: "#5d6079ff", width: "60px", height: "25px", alignSelf: "center" }}
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
            )}

            {activeTab === "friends" && <Friends />}
{activeTab === "addFriends" && <AddFriends />}
{activeTab === "friendrequest" && <FriendRequest />}
{activeTab === "budget" && <BudgetandSaving />}


          </div>
        </div>
      </div>
    </>
  );
};

export default Account;
