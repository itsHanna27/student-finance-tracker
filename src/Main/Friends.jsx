import React, { useEffect, useState } from "react";
import "../css/Friends.css";

const Friends = () => {
  const [search, setSearch] = useState("");
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem("user"));

  // Fetch current user
  useEffect(() => {
    if (!storedUser?.id) {
      setLoading(false);
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/user/${storedUser.id}`
        );
        const data = await res.json();
        setCurrentUser(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch friends
  useEffect(() => {
    if (!currentUser?.friends) {
      setLoading(false);
      return;
    }

    const fetchFriends = async () => {
      try {
        const res = await fetch("http://localhost:5000/users");
        const users = await res.json();

        const friendsList = users.filter(user =>
          currentUser.friends.some(
            id => id.toString() === user._id.toString()
          )
        );

        setFriends(friendsList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [currentUser]);

  const unfriend = async (friendId) => {
    try {
      const res = await fetch("http://localhost:5000/remove-friend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id,
          friendId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCurrentUser(data.user);
        setFriends(prev =>
          prev.filter(friend => friend._id !== friendId)
        );
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFriends = friends.filter(friend =>
    `${friend.name} ${friend.surname}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="friends-page">Loading...</div>;
  }
   // Remove friend
  const removeFriend = async (friendId) => {
    // Custom confirmation with Yes/No
    const userConfirmed = window.confirm("Are you sure you want to remove this friend?\n\nClick OK for Yes, Cancel for No");
    
    if (!userConfirmed) {
      return;
    }
  }

  return (
    <div className="friends-page">
      <h2 className="friends-title">Your Friends List</h2>

      <input
        type="text"
        placeholder="Search for your friends here by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="friends-search"
      />

      <div className="friends-scroll">
        <div className="friends-grid">
          {filteredFriends.length === 0 ? (
            <p className="no-friends">No friends found</p>
          ) : (
            filteredFriends.map(friend => (
              <div key={friend._id} className="friend-card">
                <div className="friend-avatar">
                  {friend.avatar ? (
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    friend.name.charAt(0).toUpperCase()
                  )}
                </div>

                <div className="friend-info">
                  <div className="friend-name">
                    {friend.name} {friend.surname}
                  </div>
                  <div className="friend-id">
                    UserID: {friend._id}
                  </div>
                </div>

                <button
                  className="unfriend-btn"
                 onClick={() => {
                unfriend(friend._id);
                removeFriend();
                }}
                >
                  Unfriend
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
