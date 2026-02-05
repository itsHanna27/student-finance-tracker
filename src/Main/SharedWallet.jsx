import React, { useState } from "react";
import Navbar from "../Navbar/Navbar";
import "../Navbar/navbar.css";
import "../css/sharedWallet.css";
import { FaSearch } from "react-icons/fa";
import CreateWalletModal from "../Modal/createWallet";

export default function SharedWallet() {
  const [wallets, setWallets] = useState([
    {
      id: 1,
      title: "House Bill",
      members: [
        { name: "Hanna", color: "#8B5CF6" },
        { name: "Linda", color: "#EC4899" },
        { name: "Esther", color: "#3B82F6" },
        { name: "Thelma", color: "#10B981" }
      ],
      last: "Under - £200.00(Electricity)",
      balanceLeft: "£637.00",
    },
    {
      id: 2,
      title: "Trip to Ghana",
      members: [
        { name: "Hanna", color: "#8B5CF6" },
        { name: "Sylvia", color: "#F59E0B" },
        { name: "Thelma", color: "#10B981" }
      ],
      last: "Hanna - £80.00(Hotel)",
      paid: "£637.00",
    },
    {
      id: 3,
      title: "Weekend out",
      members: [
        { name: "Hanna", color: "#8B5CF6" },
        { name: "John", color: "#EF4444" },
        { name: "Jonah", color: "#06B6D4" },
        { name: "Bryan", color: "#F59E0B" }
      ],
      last: "Bryan - £30.00(Breakfast)",
      paid: "£147.00",
    },
    {
      id: 4,
      title: "Study session",
      members: [
        { name: "Hanna", color: "#8B5CF6" },
        { name: "John", color: "#EF4444" },
        { name: "Jonah", color: "#06B6D4" },
        { name: "Bryan", color: "#F59E0B" },
        { name: "Kristina Sylvia", color: "#EC4899" }
      ],
      last: "Bryan - £3.00(Snacks)",
      paid: "£25.00",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
    const [showCreateWallet, setShowCreateWallet] = useState(false);

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

        {/* Wallet Grid */}
        <div className="wallet-grid">
          {wallets.map((wallet) => (
            <div key={wallet.id} className="wallet-card">
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
                      {getInitials(member.name)}
                    </div>
                  ))}
                </div>
              </div>

              {wallet.last && (
                <p className="wallet-info">
                  <span className="info-label">Last:</span> {wallet.last}
                </p>
              )}

              {wallet.balanceLeft && (
                <p className="wallet-info">
                  <span className="info-label">Balance Left:</span> {wallet.balanceLeft}
                </p>
              )}

              {wallet.paid && (
                <p className="wallet-info">
                  <span className="info-label">Paid:</span> {wallet.paid}
                </p>
              )}

              <button className="open-wallet-btn">Open</button>
            </div>
          ))}

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