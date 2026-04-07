import React from "react";

function formatCurrency(value) {
  if (typeof value !== "number") return "-";
  return `$${value.toLocaleString()}`;
}

export default function CryptoCard({ coin, onClick }) {
  const change24h = coin.price_change_percentage_24h || 0;
  const up = change24h >= 0;
  const intensity = Math.min(Math.abs(change24h), 12);

  return (
    <button onClick={onClick} className="crypto-card text-left w-full" type="button">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {coin.image ? <img src={coin.image} alt={coin.symbol} className="w-10 h-10 rounded-full" /> : null}
          <div className="min-w-0">
            <div className="text-lg font-medium truncate">{coin.name}</div>
            <div className="text-xs uppercase tracking-wide text-slate-500">{coin.symbol}</div>
          </div>
        </div>
        <div className={`font-semibold text-sm ${up ? "price-up" : "price-down"}`}>
          {up ? "UP" : "DOWN"} {Math.abs(change24h).toFixed(2)}%
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          <div className="text-xs text-slate-500">Current Price</div>
          <div className="text-xl font-semibold">{formatCurrency(coin.current_price)}</div>
          <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={up ? "h-full bg-emerald-500" : "h-full bg-rose-500"}
              style={{ width: `${Math.max(12, intensity * 8)}%` }}
            />
          </div>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div>Market Cap Rank #{coin.market_cap_rank || "-"}</div>
          <div>Volume {formatCurrency(coin.total_volume)}</div>
          <div className="mt-3 crypto-card-link">Open coin details</div>
        </div>
      </div>
    </button>
  );
}
