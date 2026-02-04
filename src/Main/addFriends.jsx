import React, { useState, useEffect } from "react";
import "../css/addFriends.css";
import "../css/Friends.css";
import Bestie from "../Modal/bestie";

const AddFriends = () => {
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const userFromStorage = JSON.parse(localStorage.getItem("user"));

  // Fetch current user
  useEffect(() => {
    if (!userFromStorage?.id) {
      setLoading(false);
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(`http://localhost:5000/user/${userFromStorage.id}`);
        const data = await res.json();
        console.log("Initial user data:", data); // DEBUG
        setCurrentUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch all users
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/users");
        const data = await res.json();
        setAllUsers(data.filter(u => u._id !== currentUser._id));
      } catch (err) {
        console.error(err);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Filter by STARTS WITH
  const filteredFriends = search.trim()
    ? allUsers
        .filter(friend =>
          friend.name?.toLowerCase().startsWith(search.toLowerCase()) ||
          friend.surname?.toLowerCase().startsWith(search.toLowerCase()) ||
          friend._id?.toLowerCase().startsWith(search.toLowerCase())
        )
        .sort((a, b) => {
          const s = search.toLowerCase();
          const aName = a.name?.toLowerCase().startsWith(s);
          const bName = b.name?.toLowerCase().startsWith(s);
          const aSurname = a.surname?.toLowerCase().startsWith(s);
          const bSurname = b.surname?.toLowerCase().startsWith(s);
          const aId = a._id?.toLowerCase().startsWith(s);
          const bId = b._id?.toLowerCase().startsWith(s);

          if (aName && !bName) return -1;
          if (!aName && bName) return 1;
          if (aSurname && !bSurname) return -1;
          if (!aSurname && bSurname) return 1;
          if (aId && !bId) return -1;
          if (!aId && bId) return 1;
          return 0;
        })
    : [];

    
  // Send friend request
  const sendFriendRequest = async (friendId) => {
    console.log("Clicked Add button for friend:", friendId);
    console.log("Current User before request:", currentUser);

    try {
      const res = await fetch("http://localhost:5000/send-friend-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id, friendId }),
      });
      const data = await res.json();
      console.log("Backend response:", data);
      console.log("Updated user from backend:", data.user);
      console.log("sentRequests array:", data.user?.sentRequests);

       if (res.ok) {
      setCurrentUser(data.user);
    }
  } catch (err) {
    console.error("Error sending friend request:", err);
  }

  };

  // Remove friend
  const removeFriend = async (friendId) => {
    // Custom confirmation with Yes/No
    const userConfirmed = window.confirm("Are you sure you want to remove this friend?\n\nClick OK for Yes, Cancel for No");
    
    if (!userConfirmed) {
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/remove-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser._id, friendId }),
      });
      const data = await res.json();
     if (res.ok) {
      setCurrentUser(data.user);
    }
  } catch (err) {
    console.error("Error sending friend request:", err);
  }
};

  if (loading) return <div className="add-friends-page">Loading...</div>;
  if (!currentUser) return <div className="add-friends-page">Please log in</div>;

  console.log("Rendering with currentUser:", currentUser); // DEBUG

  return (
    <div className="add-friends-page">
      <h2 className="friends-title">Add Friends</h2>

      <div className="search-wrapper">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search for friends here by name or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      <Bestie/>

      {search.trim() === "" ? (
        <p className="search-hint"></p>
      ) : filteredFriends.length === 0 ? (
        <p className="no-results">No users found starting with "{search}"</p>
      ) : (
        <div className="user-cards-container">
          {filteredFriends.map((friend) => {
            const isFriend = currentUser.friends?.includes(friend._id);
            const isPending = currentUser.sentRequests?.includes(friend._id);
            
            console.log(`Friend ${friend._id}: isFriend=${isFriend}, isPending=${isPending}`); // DEBUG
            
            return (
              <div key={friend._id} className="user-card">
                <div className="user-info">
                  <div className="user-avatar">
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.name} />
                    ) : (
                      <span className="avatar-letter">{friend.name?.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="user-details">
                    <h3 className="user-name">{friend.name} {friend.surname}</h3>
                    <p className="user-id">UserID: {friend._id}</p>
                  </div>
                </div>

                {isFriend ? (
                  <button
                    style={{
                      background: "#01041E",
                      color: "white",
                      border: "1px solid #A78BFA",
                      borderRadius: "6px",
                      padding: "10px 24px",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      width: "100%",
                      textAlign: "center",
                    }}
                    onClick={() => removeFriend(friend._id)}
                    className="remove-btn"
                  >
                    Remove
                  </button>
                ) : isPending ? (
                  <button
                    style={{ cursor: "not-allowed", opacity: 0.6, width: "100%" }}
                    className="add-btn"
                    disabled
                  >
                    Pending
                  </button>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(friend._id)}
                    className="add-btn"
                  >
                    Add
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AddFriends;