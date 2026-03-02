import { useState, useEffect } from "react";
import "../ModalCSS/Membercard.css";
import { FaUserPlus, FaUserCheck, FaUserMinus, FaCopy, FaCheck, FaCrown, FaClock, FaFolder } from "react-icons/fa";

const isUrl = (str) => typeof str === "string" && str.startsWith("http");

export default function MemberCardModal({ member, wallet, currentUser, onClose, onKick, onWalletUpdated }) {
  const [copied, setCopied] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [sharedWallets, setSharedWallets] = useState(0);
  const [loadingData, setLoadingData] = useState(true);

  const isOwner = wallet?.createdBy === currentUser?.id;       // checks if wallet owner
  const isMemberOwner = wallet?.createdBy === member?.id;        // checks if owner
  const isCurrentUser = member?.id === currentUser?.id;

  useEffect(() => {
    if (!member || !currentUser) return;
    fetchMemberData();
  }, [member]);

  const fetchMemberData = async () => {
    setLoadingData(true);
    try {
      // Check if already friends
      const userRes = await fetch(`http://localhost:5000/user/${currentUser.id}`);
      const userData = await userRes.json();
      const friendIds = userData.friends?.map((f) => f.toString()) || [];
      setIsFriend(friendIds.includes(member.id));
      const sentIds = userData.sentRequests?.map((f) => f.toString()) || [];
      setRequestSent(sentIds.includes(member.id));

      // Count shared wallets
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

  if (!member) return null;

  const initials = member.name?.split(" ").map((n) => n[0]).join("").toUpperCase();

  return (
    <div className="memberCardOverlay" onClick={onClose}>
      <div className="memberCardModal" onClick={(e) => e.stopPropagation()}>
        <button className="memberCardClose" onClick={onClose}>×</button>

        <p className={`memberCardLabel${isMemberOwner ? " memberCardLabelOwner" : ""}`}>{isMemberOwner ? "OWNER" : "MEMBER"}</p>

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
              {isMemberOwner && <FaCrown size={28} style={{ color: "#f59e0b", marginLeft: "8px", verticalAlign: "middle" }} />}
            </h2>

            {loadingData ? (
              <p className="memberCardLoading">Loading...</p>
            ) : (
              <p className="memberCardWallets">
                <FaFolder/> {sharedWallets} shared wallet{sharedWallets !== 1 ? "s" : ""} together
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

            {/* Actions */}
            {!isCurrentUser && (
              <div className="memberCardActions">
                {isFriend ? (
                  <button className="memberCardBtn memberCardAlreadyFriend" disabled>
                    <FaUserCheck size={13} /> Friends
                  </button>
                ) : requestSent ? (
                  <button className="memberCardBtn memberCardRequestSent" disabled>
                    <FaClock size={13} /> Pending
                  </button>
                ) : (
                  <button
                    className="memberCardBtn memberCardAddFriend"
                    onClick={handleAddFriend}
                    disabled={friendLoading}
                  >
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
      </div>
    </div>
  );
}