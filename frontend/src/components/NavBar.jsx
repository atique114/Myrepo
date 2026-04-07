import React, { useContext } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import BrandLogo from "./BrandLogo";
import ThemeToggle from "./ThemeToggle";

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const linkClass = ({ isActive }) =>
    `nav-link ${isActive ? "font-semibold underline underline-offset-4" : ""}`;

  return (
    <header className="site-header shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-11 w-11" />
            <div>
              <h1 className="text-xl font-semibold leading-tight">DigiCoin Tracker</h1>
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/70">Live Crypto Intelligence</div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            <NavLink to="/" className={linkClass}>Dashboard</NavLink>
            <NavLink to="/alerts" className={linkClass}>Alerts</NavLink>
            <NavLink to="/profile" className={linkClass}>Profile</NavLink>
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <ThemeToggle />
          {user ? (
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <div className="text-sm break-all sm:break-normal sm:max-w-[240px] sm:truncate">{user.email}</div>
              <button onClick={handleLogout} className="text-sm bg-white/10 px-3 py-1 rounded hover:bg-white/20">Logout</button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link">Signup</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
