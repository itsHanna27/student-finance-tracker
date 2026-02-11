import React, { useState, useEffect } from "react";
import "./createwallet.css";


export default function CreateWalletModal({ isOpen, onClose, onWalletCreated }) {
  const [walletName, setWalletName] = useState("");
  const [splitType, setSplitType] = useState("manual");
  const [budgetDigits, setBudgetDigits] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [friends, setFriends] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user and their friends
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!storedUser?.id) {
      setLoading(false);
      return;
    }

    const fetchUserAndFriends = async () => {
      try {
        // Fetch current user
        const userRes = await fetch(`http://localhost:5000/user/${storedUser.id}`);
        const userData = await userRes.json();
        setCurrentUser(userData);

        // Fetch all users
        const usersRes = await fetch("http://localhost:5000/users");
        const allUsers = await usersRes.json();

        // Filter to get only friends
        const friendsList = allUsers.filter(user =>
          userData.friends?.some(
            id => id.toString() === user._id.toString()
          )
        );

        // Format friends for the component
        const formattedFriends = friendsList.map(friend => ({
          id: friend._id,
          name: `${friend.name} ${friend.surname}`,
          avatar: friend.avatar || friend.name.charAt(0).toUpperCase(),
          isImage: !!friend.avatar,
          fullName: `${friend.name} ${friend.surname}`
        }));

        setFriends(formattedFriends);
      } catch (err) {
        console.error("Error fetching friends:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUserAndFriends();
    }
  }, [isOpen]);

  // formatting
  const formatBudgetDisplay = () => {
    if (!budgetDigits) return "0.00";
    return (parseFloat(budgetDigits) / 100).toFixed(2);
  };

  const handleBudgetChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 10) value = value.slice(0, 10);
    setBudgetDigits(value);
  };

  const toggleFriendsList = () => {
    setShowFriendsList(!showFriendsList);
  };

  const addParticipant = (friend) => {
    if (!selectedParticipants.find(p => p.id === friend.id)) {
      setSelectedParticipants([...selectedParticipants, friend]);
    }
    setShowFriendsList(false);
  };

  const removeParticipant = (friendId) => {
    setSelectedParticipants(selectedParticipants.filter(p => p.id !== friendId));
  };

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      alert("Please enter a wallet name");
      return;
    }

    if (selectedParticipants.length === 0) {
      alert("Please add at least one participant");
      return;
    }

    try {
      // Get actual budget value
      const budgetValue = budgetDigits ? parseFloat(budgetDigits) / 100 : null;

      // Create members array with current user and selected participants
      const members = [
        {
          id: currentUser._id,
          name: `${currentUser.name} ${currentUser.surname}`,
          avatar: currentUser.avatar || null,
          color: "#8B5CF6"
        },
        ...selectedParticipants.map((p, idx) => {
          const colors = ["#EC4899", "#3B82F6", "#9a10b9", "#F59E0B", "#EF4444", "#06B6D4"];
          return {
            id: p.id,
            name: p.fullName,
            avatar: p.isImage ? p.avatar : null,
            color: colors[idx % colors.length]
          };
        })
      ];

      const newWallet = {
        title: walletName,
        members: members,
        splitType: splitType,
        last: null,
        balanceLeft: splitType === "equal" && budgetValue ? `£${budgetValue.toFixed(2)}` : null,
        paid: splitType === "manual" && budgetValue ? `£${budgetValue.toFixed(2)}` : null,
        budgetValue: budgetValue ? `£${budgetValue.toFixed(2)}` : null,
        totalAmount: splitType === "equal" && budgetValue ? `£${budgetValue.toFixed(2)}` : "£0.00",
        totalSpent: "£0.00",
        currentBalance: splitType === "manual" && budgetValue ? `£${budgetValue.toFixed(2)}` : "£0.00",
        createdBy: currentUser._id,
        createdAt: new Date().toISOString()
      };

      console.log("Creating wallet with data:", newWallet);

      const response = await fetch('http://localhost:5000/create-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWallet)
      });

      if (!response.ok) {
        throw new Error('Failed to create wallet');
      }

      const savedWallet = await response.json();
      console.log("Saved wallet from backend:", savedWallet);

      if (onWalletCreated) {
        onWalletCreated(savedWallet);
      }

      // Reset form
      setWalletName("");
      setSplitType("manual");
      setBudgetDigits("");
      setSelectedParticipants([]);
      
      onClose();
    } catch (err) {
      console.error("Error creating wallet:", err);
      alert("Failed to create wallet");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-modal-overlay overlay">
      <div className="create-wallet-modal">
        <button className="wallet-modal-close-btn close-btn" onClick={onClose}>
          Close
        </button>
        
        {/* Header */}
        <div className="wallet-modal-header modal-header">
          <h2>Make Wallet</h2>
        </div>

        {/* Wallet Name */}
        <div className="wallet-modal-section modal-section">
          <label>Wallet Name</label>
          <input
            type="text"
            placeholder="e.g House Rent"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
          />
        </div>

        {/* Participants */}
        <div className="wallet-modal-section modal-section">
          <label>Add Participants</label>
          <div className="wallet-participants participants">
            <div className="wallet-useravatar useravatar">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="wallet-avatar-img avatar-img"
                />
              ) : (
                currentUser?.name?.charAt(0).toUpperCase() || "H"
              )}
            </div>

            {/* Display selected participants */}
            {selectedParticipants.map((participant) => (
              <div 
                key={participant.id} 
                className="wallet-useravatar useravatar wallet-participant-avatar participant-avatar"
                onClick={() => removeParticipant(participant.id)}
                title={`${participant.name} - Click to remove`}
              >
                {participant.isImage ? (
                  <img
                    src={participant.avatar}
                    alt={participant.name}
                    className="wallet-avatar-img avatar-img"
                  />
                ) : (
                  participant.avatar
                )}
              </div>
            ))}

            <div className="wallet-add-user-wrapper add-user-wrapper">
              <button className="wallet-add-user add-user" onClick={toggleFriendsList}>+</button>
              
              {/* Friends dropdown */}
              {showFriendsList && (
                <div className="wallet-friends-dropdown friends-dropdown">
                  <div className="wallet-friends-dropdown-header friends-dropdown-header">
                    Select Friends
                  </div>
                  {loading ? (
                    <div className="wallet-dropdown-message dropdown-message">Loading friends...</div>
                  ) : friends.length === 0 ? (
                    <div className="wallet-dropdown-message dropdown-message">No friends available</div>
                  ) : (
                    <>
                      {friends
                        .filter(friend => !selectedParticipants.find(p => p.id === friend.id))
                        .map((friend) => (
                          <div
                            key={friend.id}
                            className="wallet-friend-item friend-item"
                            onClick={() => addParticipant(friend)}
                          >
                            <div className="wallet-friend-avatar friend-avatar">
                              {friend.isImage ? (
                                <img
                                  src={friend.avatar}
                                  alt={friend.name}
                                  className="wallet-avatar-img avatar-img"
                                />
                              ) : (
                                friend.avatar
                              )}
                            </div>
                            <span>{friend.name}</span>
                          </div>
                        ))
                      }
                      {friends.filter(friend => !selectedParticipants.find(p => p.id === friend.id)).length === 0 && (
                        <div className="wallet-dropdown-message dropdown-message">All friends added!</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="wallet-modal-section modal-section">
          <label>Options</label>
          <div className="wallet-radio-group radio-group">
            <label>
              <input style={{marginTop: "28px"}}
                type="radio"
                name="split"
                checked={splitType === "manual"}
                onChange={() => setSplitType("manual")}
              />
              Split Manually
            </label>
            <label>
              <input style={{marginTop: "28px"}}
                type="radio"
                name="split"
                checked={splitType === "equal"}
                onChange={() => setSplitType("equal")}
              />
              Split Equally
            </label>
          </div>
        </div>

       {/* Optional Settings */}
        <div className="wallet-modal-section modal-section">
          <div className="wallet-optional-settings optional-settings">
            <label style={{display: "flex", flexDirection: "column", gap: "8px"}}>
              {splitType === "equal" ? "Set Amount" : "Set Budget (Optional)"}
              <input
                type="text"
                placeholder={splitType === "equal" ? "Enter amount" : "Set Budget (optional)"}
                value={formatBudgetDisplay()}
                onChange={handleBudgetChange}
              />
            </label>
          </div>
        </div>

        {/* Action */}
        <button className="wallet-create-btn create-btn" onClick={handleCreateWallet}>
          Create Wallet
        </button>
      </div>
    </div>
  );
}