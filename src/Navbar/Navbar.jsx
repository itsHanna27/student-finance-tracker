import React from "react";
import { NavLink } from "react-router-dom";
import "./navbar.css";

import { 
  FaWallet, 
  FaBell
} from "react-icons/fa";

const Navbar = () => {
  return (
    <nav className="navbar">
      {/* Logo */}
      <div className="navbar-logo">
        <FaWallet /> UniBudget
      </div>

      {/* Right Side */}
      <div className="navbar-right">
        <ul className="nav-list">
          <li>
            <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "nav-active" : "nav-link")}>
              Dashboard
            </NavLink>
          </li>

          <li>
            <NavLink to="/transactions" className={({ isActive }) => (isActive ? "nav-active" : "nav-link")}>
              Transactions
            </NavLink>
          </li>

          <li>
            <NavLink to="/shared-wallets" className={({ isActive }) => (isActive ? "nav-active" : "nav-link")}>
              Shared Wallets
            </NavLink>
          </li>

          <li>
            <NavLink to="/community" className={({ isActive }) => (isActive ? "nav-active" : "nav-link")}>
              Community
            </NavLink>
          </li>

          <li>
            <NavLink to="/account" className={({ isActive }) => (isActive ? "nav-active" : "nav-link")}>
              Account
            </NavLink>
          </li>
        </ul>

        <FaBell size={21} className="nav-bell" />
      </div>
    </nav>
  );
};

export default Navbar;
