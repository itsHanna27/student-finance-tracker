import { useState, useEffect } from "react";
import "../ModalCSS/Membercard.css";
import { FaUserPlus, FaUserCheck, FaUserMinus, FaCopy, FaCheck, FaCrown, FaUserFriends, FaTrash, FaRedo, FaChevronDown, FaChevronUp } from "react-icons/fa";

const isUrl = (str) => typeof str === "string" && str.startsWith("http");

export default function MemberCard({ member, wallet, currentUser, onClose, onKick, onWalletUpdated }) {
  const [copied, setCopied] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [sharedWallets, setSharedWallets] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  // Owner controls
  const [showOwnerControls, setShowOwnerControls] = useState(false);
  const [friends, setFriends] = useState([]);
  const [addMemberSearch, setAddMemberSearch] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [resetSchedule, setResetSchedule] = useState(wallet?.resetSchedule || "none");
  const [loadedSchedule, setLoadedSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  const isOwner = wallet?.createdBy === currentUser?.id;
  const isMemberOwner = wallet?.createdBy === member?.id;
  const isCurrentUser = member?.id === currentUser?.id;

  useEffect(() => {
    if (!member || !currentUser) return;
    fetchMemberData();
  }, [member]);

  const fetchMemberData = async () => {
    setLoadingData(true);
    try {
      const userRes = await fetch(`http://localhost:5000/user/${currentUser.id}`);
      const userData = await userRes.json();
      const friendIds = userData.friends?.map((f) => f.toString()) || [];
      setIsFriend(friendIds.includes(member.id));
      const sentIds = userData.sentRequests?.map((f) => f.toString()) || [];
      setRequestSent(sentIds.includes(member.id));

      // Load friends list for owner add-member feature
      if (isOwner && isCurrentUser && friendIds.length > 0) {
        const res = await fetch(`http://localhost:5000/users-by-ids`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: friendIds }),
        });
        const data = await res.json();
        // Filter out people already in the wallet
        const walletMemberIds = wallet.members.map((m) => m.id);
        setFriends((data.users || []).filter((u) => !walletMemberIds.includes(u._id.toString())));
      }

      // Fetch latest wallet data to get saved schedule
      if (isOwner && isCurrentUser) {
        try {
          const walletRes = await fetch(`http://localhost:5000/wallet/${wallet._id}`);
          const walletData = await walletRes.json();
          setResetSchedule(walletData.resetSchedule || "none");
          setLoadedSchedule(true);
        } catch {}
      }

      const walletsRes = await fetch(`http://localhost:5000/wallets/${currentUser.id}`);
      const allWallets = await walletsRes.json();
      const shared = allWallets.filter((w) =>
        w.members.some((m) => m.id === member.id) &&
        w.members.some((m) => m.id === currentUser.id)
      );
      setSharedWallets(shared.length);
    } catch (err) {
      console.error("MemberCard fetch error:", err);
    }
    setLoadingData(false);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(member.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddFriend = async () => {
    setFriendLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/send-friend-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, friendId: member.id }),
      });
      if (res.ok) setRequestSent(true);
    } catch (err) {
      console.error("Add friend error:", err);
    }
    setFriendLoading(false);
  };
//remove memeber(owner)
  const handleKick = async () => {
    if (!window.confirm(`Remove ${member.name} from this wallet?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/wallet/${wallet._id}/kick`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, memberId: member.id }),
      });
      if (res.ok) {
        onKick?.(member.id);
        onClose();
        onWalletUpdated?.();
      } else {
        alert("Failed to remove member.");
      }
    } catch (err) {
      console.error("Kick error:", err);
      alert("Failed to remove member.");
    }
  };

  // Owner: add a friend to the wallet
  const handleAddMember = async (friend) => {
    setAddingMember(friend._id);
    try {
      const newMember = {
        id: friend._id,
        name: `${friend.name} ${friend.surname}`,
        avatar: friend.avatar || "",
        color: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`,
      };
      const res = await fetch(`http://localhost:5000/wallet/${wallet._id}/add-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, newMember }),
      });
      if (res.ok) {
        wallet.members.push(newMember);
        setFriends((prev) => prev.filter((f) => f._id !== friend._id));
      } else {
        alert("Failed to add member.");
      }
    } catch (err) {
      console.error("Add member error:", err);
    }
    setAddingMember(null);
  };

  // Owner: reset all transactions
  const handleResetTransactions = async () => {
    if (!window.confirm("Reset all transactions for this wallet? This cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5000/wallet/${wallet._id}/reset-transactions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (res.ok) {
        alert("All transactions reset.");
        onWalletUpdated?.();
      } else {
        alert("Failed to reset transactions.");
      }
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  // Owner: save recurring reset schedule
  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      const res = await fetch(`http://localhost:5000/wallet/${wallet._id}/reset-schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, resetSchedule }),
      });
      if (res.ok) {
        setScheduleSuccess(true);
        setTimeout(() => setScheduleSuccess(false), 2000);
      } else {
        alert("Failed to save schedule.");
      }
    } catch (err) {
      console.error("Schedule error:", err);
    }
    setSavingSchedule(false);
  };

  if (!member) return null;

  const initials = member.name?.split(" ").map((n) => n[0]).join("").toUpperCase();
  const filteredFriends = friends.filter((f) =>
    `${f.name} ${f.surname}`.toLowerCase().includes(addMemberSearch.toLowerCase())
  );

  return (
    <div className="memberCardOverlay" onClick={onClose}>
      <div className="memberCardModal" onClick={(e) => e.stopPropagation()}>
        <button className="memberCardClose" onClick={onClose}>×</button>

        <p className={`memberCardLabel${isMemberOwner ? " memberCardLabelOwner" : ""}`}>
          {isMemberOwner ? "OWNER" : "MEMBER"}
        </p>

        <div className="memberCardBody">
          {/* Avatar */}
          <div className="memberCardAvatar">
            {isUrl(member.avatar) ? (
              <img src={member.avatar} alt={initials} />
            ) : (
              <span>{initials}</span>
            )}
          </div>

          {/* Info */}
          <div className="memberCardInfo">
            <h2 className="memberCardName">
              {member.name}
              {isMemberOwner && <FaCrown size={14} style={{ color: "#f59e0b", marginLeft: "8px", verticalAlign: "middle" }} />}
            </h2>

            {loadingData ? (
              <p className="memberCardLoading">Loading...</p>
            ) : (
              <p className="memberCardWallets">
                🗂 {sharedWallets} shared wallet{sharedWallets !== 1 ? "s" : ""} together
              </p>
            )}

            {/* ID row */}
            <div className="memberCardIdRow">
              <span className="memberCardIdLabel">ID:</span>
              <span className="memberCardId">{member.id}</span>
              <button className="memberCardCopyBtn" onClick={handleCopyId}>
                {copied ? <FaCheck size={12} /> : <FaCopy size={12} />}
                {copied ? "Copied!" : "copy"}
              </button>
            </div>

            {/* Actions for other members */}
            {!isCurrentUser && (
              <div className="memberCardActions">
                {isFriend ? (
                  <button className="memberCardBtn memberCardAlreadyFriend" disabled>
                    <FaUserCheck size={13} /> Friends
                  </button>
                ) : requestSent ? (
                  <button className="memberCardBtn memberCardRequestSent" disabled>
                    <FaUserCheck size={13} /> Request Sent
                  </button>
                ) : (
                  <button className="memberCardBtn memberCardAddFriend" onClick={handleAddFriend} disabled={friendLoading}>
                    <FaUserPlus size={13} />
                    {friendLoading ? "Sending..." : "Add Friend"}
                  </button>
                )}

                {isOwner && (
                  <>
                    <div className="memberCardDivider" />
                    <button className="memberCardBtn memberCardKick" onClick={handleKick}>
                      <FaUserMinus size={13} /> Kick from wallet
                    </button>
                  </>
                )}
              </div>
            )}

            {isCurrentUser && (
              <p className="memberCardYouBadge">This is you</p>
            )}
          </div>
        </div>

        {/* Owner Controls - only shown when owner views their own card */}
        {isOwner && isCurrentUser && (
          <div className="memberCardOwnerSection">
            <button
              className="memberCardOwnerToggle"
              onClick={() => setShowOwnerControls((v) => !v)}
            >
              <FaCrown size={12} style={{ color: "#b94aff" }} />
              Owner Controls
              {showOwnerControls ? <FaChevronUp size={11} /> : <FaChevronDown size={11} />}
            </button>

            {showOwnerControls && (
              <div className="memberCardOwnerControls">

                {/* Add Members */}
                <div className="ownerControlBlock">
                  <p className="ownerControlLabel"><FaUserFriends size={13} /> Add Members</p>
                  <input
                    className="ownerControlSearch"
                    placeholder="Search friends..."
                    value={addMemberSearch}
                    onChange={(e) => setAddMemberSearch(e.target.value)}
                  />
                  {addMemberSearch && (
                    <div className="ownerFriendList">
                      {filteredFriends.length === 0 ? (
                        <p className="ownerEmpty">No friends found</p>
                      ) : (
                        filteredFriends.map((f) => {
                          const fi = `${f.name?.[0] ?? ""}${f.surname?.[0] ?? ""}`.toUpperCase();
                          return (
                            <div key={f._id} className="ownerFriendRow">
                              <div className="ownerFriendAvatar">
                                {isUrl(f.avatar) ? <img src={f.avatar} alt={fi} /> : fi}
                              </div>
                              <span className="ownerFriendName">{f.name} {f.surname}</span>
                              <button
                                className="ownerAddBtn"
                                onClick={() => handleAddMember(f)}
                                disabled={addingMember === f._id}
                              >
                                {addingMember === f._id ? "Adding..." : "+ Add"}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="ownerControlDivider" />

                {/* Reset Transactions */}
                <div className="ownerControlBlock">
                  <p className="ownerControlLabel"><FaTrash size={12} /> Reset Transactions</p>
                  <p className="ownerControlSub">Permanently deletes all transactions in this wallet.</p>
                  <button className="ownerResetBtn" onClick={handleResetTransactions}>
                    Reset now
                  </button>
                </div>

                <div className="ownerControlDivider" />

                {/* Recurring Reset Schedule */}
                <div className="ownerControlBlock">
                  <p className="ownerControlLabel"><FaRedo size={12} /> Auto Reset Schedule</p>
                  <p className="ownerControlSub">Transactions will reset automatically on this schedule.</p>
                  <div className="ownerScheduleRow">
                    <select
                      className="ownerScheduleSelect"
                      value={resetSchedule}
                      onChange={(e) => setResetSchedule(e.target.value)}
                    >
                      <option value="none">No auto reset</option>
                      <option value="weekly">Every week</option>
                      <option value="monthly">Every month</option>
                      <option value="yearly">Every year</option>
                    </select>
                    <button
                      className="ownerSaveBtn"
                      onClick={handleSaveSchedule}
                      disabled={savingSchedule}
                    >
                      {scheduleSuccess ? <><FaCheck size={11} /> Saved!</> : savingSchedule ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}