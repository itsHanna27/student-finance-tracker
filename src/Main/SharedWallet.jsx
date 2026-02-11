import React, { useState, useEffect } from "react";
import Navbar from "../Navbar/Navbar";
import "../Navbar/navbar.css";
import "../css/sharedWallet.css";
import { FaSearch } from "react-icons/fa";
import CreateWalletModal from "../Modal/createWallet";
import Wallet from "../Modal/Wallet";
import useFinanceData from "../hooks/FinanceData";
import Bestie from "../Modal/bestie";

export default function SharedWallet() {
  const [wallets, setWallets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateWallet, setShowCreateWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);

  const {
    transactions,
    savingGoals,
    budgetGoals,
    balance,
    userId,
  } = useFinanceData();

  // Fetch wallets from backend
  const fetchWallets = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser?.id) {
        setLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/wallets/${storedUser.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallets');
      }
      
      const data = await response.json();
      console.log("Fetched wallets:", data);
      setWallets(data);
    } catch (err) {
      console.error("Error fetching wallets:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  // Handle wallet creation
  const handleWalletCreated = (newWallet) => {
    setWallets([newWallet, ...wallets]);
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredWallets = wallets.filter(wallet =>
    wallet.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle opening a wallet
  const handleOpenWallet = (wallet) => {
    setSelectedWallet(wallet);
    setIsWalletOpen(true);
  };

  // Handle closing wallet and refresh data
  const handleCloseWallet = () => {
    setIsWalletOpen(false);
    setSelectedWallet(null);
    fetchWallets(); 
  };

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
          overflow-x: hidden !important;
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
    
      <CreateWalletModal
        isOpen={showCreateWallet}
        onClose={() => setShowCreateWallet(false)}
        onWalletCreated={handleWalletCreated}
      />

      <Wallet
        isOpen={isWalletOpen}
        wallet={selectedWallet}
        onClose={handleCloseWallet}
      />

      <div className="shared-wallet">
        {/* Page Header */}
        <div className="shared-wallet-header">
          <h1>Shared Wallet</h1>
          <p>Keep your house bills and trip costs fair and stress-free.</p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "10px",
              flexWrap: "wrap",
              gap: "15px",
              width: "100%",
              padding: "10px"
            }}
          >
            <div
              style={{ 
                position: "relative",
                flex: 1,
                minWidth: "250px",
                maxWidth: "800px"
              }}
            >
              <FaSearch 
                style={{
                  position: "absolute",
                  left: "18px",
                  top: "35%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  fontSize: "16px",
                  pointerEvents: "none",
                  zIndex: 1
                }}
              />  
              <input
                placeholder="Search wallet by name"
                value={searchTerm}
                onChange={handleSearch}
                style={{
                  width: "100%",
                  padding: "12px 15px 12px 45px",
                  borderRadius: "10px",
                  border: "1px solid #334155",
                  background: "rgba(30, 41, 59, 0.6)",
                  color: "white",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>
        </div>

        {/* Bot */}
        <Bestie
          balance={balance}
          transactions={transactions}
          savingGoals={savingGoals}
          budgetGoals={budgetGoals}
          userId={userId}
        />

        {/* Wallet Grid */}
        <div className="wallet-grid">
          {loading ? (
            <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#94A3B8" }}>
              Loading wallets...
            </p>
          ) : filteredWallets.length === 0 && searchTerm === "" ? (
            <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#94A3B8" }}>
              No wallets yet. Create your first wallet!
            </p>
          ) : filteredWallets.length === 0 ? (
            <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#94A3B8" }}>
              No wallets found matching "{searchTerm}"
            </p>
          ) : (
            filteredWallets.map((wallet) => (
              <div key={wallet._id} className="wallet-card">
                <h3>{wallet.title}</h3>

                <div className="members-section">
                  <span className="members-label">Members:</span>
                  <div className="avatar-group">
                    {wallet.members.map((member, idx) => (
                      <div 
                        key={idx} 
                        className="useravatar"
                        style={{ backgroundColor: member.color }}
                        title={member.name}
                      >
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt={member.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          getInitials(member.name)
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Show last activity if exists */}
                {wallet.lastActivity && (
                  <p className="wallet-info">
                    <span className="info-label">Last Activity:</span> {wallet.lastActivity}
                  </p>
                )}

                {/* Manual Split - Show Budget and Remaining */}
                {wallet.splitType === "manual" && (
                  <>
                    <p className="wallet-info">
                      <span className="info-label">Budget:</span> {wallet.budgetValue || wallet.paid || "£0.00"}
                    </p>
                    <p className="wallet-info">
                      <span className="info-label">Remaining:</span> 
                      <span style={{ 
                        color: parseFloat((wallet.currentBalance || "£0.00").replace('£', '')) < 0 ? '#EF4444' : '#10B981' 
                      }}>
                        {wallet.currentBalance || "£0.00"}
                      </span>
                    </p>
                  </>
                )}

                {/* Equal Split - Show Total Amount and Per Person */}
                {wallet.splitType === "equal" && (
                  <>
                    <p className="wallet-info">
                      <span className="info-label">Total Amount:</span> {wallet.totalAmount || wallet.balanceLeft || wallet.budgetValue || "£0.00"}
                    </p>
                    <p className="wallet-info">
                      <span className="info-label">Per Person:</span> £
                      {(() => {
                        const amount = wallet.totalAmount || wallet.balanceLeft || wallet.budgetValue || "£0.00";
                        const numericAmount = parseFloat(amount.replace('£', ''));
                        return (numericAmount / wallet.members.length).toFixed(2);
                      })()}
                    </p>
                  </>
                )}

                <button
                  onClick={() => handleOpenWallet(wallet)} 
                  className="open-wallet-btn"
                >
                  Open
                </button>
              </div>
            ))
          )}

          {/* Create new wallet */}
          <div
            className="wallet-card create-wallet"
            onClick={() => setShowCreateWallet(true)}
          >
            <div className="plus-icon">+</div>
            <p>Make new wallet</p>
          </div>
        </div>
      </div>
    </>
  );
}