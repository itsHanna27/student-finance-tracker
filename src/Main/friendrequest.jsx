import React, { useState, useEffect } from "react";
import "../css/friendRequest.css";


const FriendRequests = () => {
  const [requests, setRequests] = useState([]);
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
        setCurrentUser(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch incoming friend requests 
  useEffect(() => {
    if (!currentUser?.friendRequests) return;
    
    const fetchRequests = async () => {
      try {
        const res = await fetch(`http://localhost:5000/users-by-ids`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: currentUser.friendRequests }),
        });
        const data = await res.json();
        setRequests(data.users);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRequests();
  }, [currentUser]);

  const respondRequest = async (senderId, action) => {
    try {
      const res = await fetch(`http://localhost:5000/respond-request/${senderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: currentUser._id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(prev => prev.filter(r => r._id !== senderId));
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const acceptRequest = (id) => respondRequest(id, "accept");
  const declineRequest = (id) => respondRequest(id, "reject");

  if (loading) return <div className="friend-requests-page">Loading...</div>;
  if (!currentUser) return <div className="friend-requests-page">Please log in</div>;

  return (
    <div className="friend-requests-page">
      <h2 className="friend-requests-title">Friend Requests</h2>

      <div className="friend-requests-scroll">
        <div className="friend-requests-grid">
          {requests.length === 0 && <p className="no-requests">No pending friend requests</p>}

          {requests.map(user => (
            <div key={user._id} className="friend-request-card">
              <div className="friend-request-avatar">
                {user.avatar ? <img src={user.avatar} alt={user.name} /> : user.name.charAt(0)}
              </div>
              
              <div className="friend-request-info">
                <span className="friend-request-name">{user.name} {user.surname}</span>
                <span className="friend-request-id">UserID: {user._id}</span>

                <div className="friend-request-actions">
                  <button className="accept-btn" onClick={() => acceptRequest(user._id)}>Accept</button>
                  <button className="decline-btn" onClick={() => declineRequest(user._id)}>Decline</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendRequests;