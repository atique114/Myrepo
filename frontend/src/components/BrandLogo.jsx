import React from "react";

export default function BrandLogo({ className = "h-11 w-11" }) {
  return (
    <img
      src="/digicoin-logo.svg"
      alt="DigiCoin Tracker logo"
      className={`${className} rounded-2xl shadow-lg shadow-slate-950/10`}
    />
  );
}
