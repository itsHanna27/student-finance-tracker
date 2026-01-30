import React, { useEffect, useState } from 'react';
import { FaTrophy, FaStar, FaTimes } from 'react-icons/fa';
import './congrats.css';

const Congrats = ({ goalAmount, period, onClose, onCreateNew }) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Stop confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="congrats-overlay">
      <div className="congrats-modal">
        <button className="congrats-close" onClick={onClose}>
          <FaTimes />
        </button>

        {showConfetti && (
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  backgroundColor: ['#A78BFA', '#F5A6FF', '#C45BFF', '#FFD700'][
                    Math.floor(Math.random() * 4)
                  ],
                }}
              />
            ))}
          </div>
        )}

        <div className="trophy-icon">
          <FaTrophy />
        </div>

        <h1 className="congrats-title">🎉 Goal Achieved! 🎉</h1>

        <p className="congrats-message">
          You’ve successfully reached your {period} savings goal of
        </p>

        <p className="congrats-amount">£{goalAmount}</p>

        <div className="achievement-unlocked">
          <FaStar className="star-icon" />
          <span>Savings Milestone Unlocked</span>
        </div>

        <p className="congrats-subtext">
          Great consistency and discipline! Ready to set your next savings goal?
        </p>

        <div className="congrats-buttons">
          <button className="congrats-btn-secondary" onClick={onClose}>
            Continue
          </button>
          <button className="congrats-btn" onClick={onCreateNew}>
            Create New Goal
          </button>
        </div>
      </div>
    </div>
  );
};

export default Congrats;
