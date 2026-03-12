import React, { useState, useEffect } from "react";
import "../css/Appearance.css";

const Appearance = () => {
  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("theme") !== "light";
    } catch {
      return true;
    }
  });

  const [colourBlind, setColourBlind] = useState(() => {
    try {
      return localStorage.getItem("colourBlind") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    console.log("Setting theme to:", theme);
    document.body.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // blocked, ignore
    }
  }, [darkMode]);

  useEffect(() => {
    document.body.setAttribute("data-colourblind", colourBlind ? "true" : "false");
    try {
      localStorage.setItem("colourBlind", colourBlind);
    } catch {
      // blocked, ignore
    }
  }, [colourBlind]);

  return (
    <div className="appearance-page">
      <h3 className="appearance-title">Appearance</h3>
      <p className="appearance-subtitle">Personalise how UniBudget looks for you.</p>

      <div className="appearance-card">
        <div className="appearance-card-left">
          <div className="appearance-icon">
            <i className="fa-solid fa-moon" />
          </div>
          <div className="appearance-card-text">
            <p className="appearance-card-title">Dark Mode</p>
            <p className="appearance-card-desc">
              Use a darker colour scheme — easier on the eyes at night.
            </p>
          </div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={darkMode} onChange={() => setDarkMode((p) => !p)} />
          <span className="toggle-slider" />
        </label>
      </div>

      <div className="appearance-card">
        <div className="appearance-card-left">
          <div className="appearance-icon">
            <i className="fa-solid fa-sun" />
          </div>
          <div className="appearance-card-text">
            <p className="appearance-card-title">Light Mode</p>
            <p className="appearance-card-desc">
              Switch to a bright, clean look for daytime use.
            </p>
          </div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={!darkMode} onChange={() => setDarkMode((p) => !p)} />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
};

export default Appearance;