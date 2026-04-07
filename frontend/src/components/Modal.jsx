import React, { useEffect } from "react";

export default function Modal({ open, onClose, children }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="coin-detail-modal">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-600 transition-colors hover:text-slate-900 dark:border-slate-700 dark:bg-slate-950/80 dark:text-slate-300 dark:hover:text-white"
          type="button"
        >
          X
        </button>
        <div className="max-h-[82vh] overflow-auto pr-1 md:pr-2">{children}</div>
      </div>
    </div>
  );
}
