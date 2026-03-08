import React, { useState, useEffect } from "react";
import "../css/Appearance.css";


const Appearance = () => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") !== "light");
  const [colourBlind, setColourBlind] = useState(() => localStorage.getItem("colourBlind") === "true");

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.body.setAttribute("data-colourblind", colourBlind ? "true" : "false");
    localStorage.setItem("colourBlind", colourBlind);
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

      <div className="appearance-card">
        <div className="appearance-card-left">
          <div className="appearance-icon">
            <i className="fa-solid fa-eye" />
          </div>
          <div className="appearance-card-text">
            <p className="appearance-card-title">Colour Blind Mode</p>
            <p className="appearance-card-desc">
              Replaces red &amp; green with orange &amp; blue for better visibility.
            </p>
          </div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={colourBlind} onChange={() => setColourBlind((p) => !p)} />
          <span className="toggle-slider" />
        </label>
      </div>
    </div>
  );
};

export default Appearance;