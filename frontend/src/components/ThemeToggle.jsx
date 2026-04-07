import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("digicoin_theme");
    if (stored) setDark(stored === "dark");
    else setDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (dark) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("digicoin_theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button onClick={() => setDark((d) => !d)} title="Toggle theme" className="px-3 py-1 rounded bg-white/10 hover:bg-white/20">
      {dark ? "Moon" : "Sun"}
    </button>
  );
}
