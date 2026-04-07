import React, { useEffect, useMemo, useState } from "react";
import CryptoCard from "../components/CryptoCard";
import CoinCandlestickChart from "../components/CoinCandlestickChart";
import Modal from "../components/Modal";
import { fetchCoinDetails, fetchCoins, fetchTopMovers } from "../services/api";
import { toast } from "react-toastify";

function currency(value) {
  if (typeof value !== "number") return "-";
  if (value >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function percent(value) {
  if (typeof value !== "number") return "-";
  return `${value.toFixed(2)}%`;
}

function compactCurrency(value) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatSupply(value) {
  if (typeof value !== "number") return "-";
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1_000_000 ? 2 : 0,
  }).format(value);
}

export default function Dashboard() {
  const [coins, setCoins] = useState([]);
  const [movers, setMovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [refreshIn, setRefreshIn] = useState(60);

  async function loadData(showLoader = false) {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const [coinsData, moversData] = await Promise.all([
        fetchCoins({ page: 1, perPage: 15 }),
        fetchTopMovers(6),
      ]);
      setCoins(coinsData || []);
      setMovers(moversData || []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Failed to fetch market data.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshIn(60);
    }
  }

  useEffect(() => {
    loadData(true);
    const marketInterval = setInterval(() => loadData(false), 60000);
    const timerInterval = setInterval(() => {
      setRefreshIn((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => {
      clearInterval(marketInterval);
      clearInterval(timerInterval);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return coins;
    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(q) ||
        coin.symbol.toLowerCase().includes(q) ||
        coin.id.toLowerCase().includes(q)
    );
  }, [coins, query]);

  const stats = useMemo(() => {
    const totalMarketCap = coins.reduce((sum, coin) => sum + (coin.market_cap || 0), 0);
    const avgChange = coins.length
      ? coins.reduce((sum, coin) => sum + (coin.price_change_percentage_24h || 0), 0) / coins.length
      : 0;
    const upCount = coins.filter((coin) => (coin.price_change_percentage_24h || 0) >= 0).length;
    const highestVolumeCoin = [...coins].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))[0] || null;
    const gainLeader = [...coins].sort(
      (a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
    )[0] || null;
    return { totalMarketCap, avgChange, upCount, total: coins.length, highestVolumeCoin, gainLeader };
  }, [coins]);

  async function openDetails(coin) {
    setSelected(coin);
    setLoadingDetails(true);
    try {
      const full = await fetchCoinDetails(coin.id);
      setDetails(full);
    } catch (error) {
      toast.error("Could not load coin details.");
      setDetails(null);
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDetails() {
    setSelected(null);
    setDetails(null);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="hero-panel">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-100/80">Live Intelligence</p>
          <h2 className="text-3xl md:text-4xl font-bold mt-2">DigiCoin Market Overview</h2>
          <p className="text-slate-100/90 mt-2">Live prices, rapid filtering, and high-volatility highlights every 60 seconds.</p>
        </div>
        <button onClick={() => loadData(true)} className="hero-btn" type="button">
          Refresh Now ({refreshIn}s)
        </button>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-label">Tracked Coins</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Coins Up (24h)</div>
          <div className="stat-value">{stats.upCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg Change (24h)</div>
          <div className="stat-value">{percent(stats.avgChange)}</div>
        </div>
        <div className="stat-card stat-card-featured">
          <div className="stat-label">Highest Volume</div>
          <div className="stat-value text-lg">
            {stats.highestVolumeCoin ? stats.highestVolumeCoin.symbol.toUpperCase() : "-"}
          </div>
          <div className="stat-subvalue">
            {stats.highestVolumeCoin
              ? `${stats.highestVolumeCoin.name} - ${currency(stats.highestVolumeCoin.total_volume)}`
              : "Waiting for live data"}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-4">
        <div className="insight-panel">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/75">Market Pulse</p>
            <h3 className="text-2xl font-semibold mt-2">Session momentum is {stats.avgChange >= 0 ? "leaning bullish" : "mixed"}.</h3>
            <p className="text-cyan-50/85 mt-2 text-sm">
              {stats.upCount} of {stats.total} tracked assets are positive in the last 24 hours, with total tracked value near {currency(stats.totalMarketCap)}.
            </p>
          </div>
          <div className="insight-badges">
            <span className="insight-chip">
              Leader: {stats.gainLeader ? `${stats.gainLeader.symbol.toUpperCase()} ${percent(stats.gainLeader.price_change_percentage_24h || 0)}` : "n/a"}
            </span>
            <span className="insight-chip">Refresh cycle: {refreshIn}s</span>
          </div>
        </div>
        <div className="card-panel">
          <h3 className="text-xl font-semibold mb-3">Quick Snapshot</h3>
          <div className="space-y-3">
            {coins.slice(0, 3).map((coin) => (
              <button key={coin.id} className="snapshot-row" onClick={() => openDetails(coin)} type="button">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={coin.image} alt={coin.symbol} className="w-9 h-9 rounded-full" />
                  <div className="min-w-0 text-left">
                    <div className="font-medium truncate">{coin.name}</div>
                    <div className="text-xs text-slate-500 uppercase">{coin.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{currency(coin.current_price)}</div>
                  <div className={coin.price_change_percentage_24h >= 0 ? "price-up text-xs" : "price-down text-xs"}>
                    {percent(coin.price_change_percentage_24h || 0)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="card-panel">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-xl font-semibold">Track Cryptocurrencies</h3>
          <input
            placeholder="Search by name, symbol, or id"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full sm:w-80 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg"
          />
        </div>

        {error ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded"> 
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-rose-700 dark:text-rose-300">{error}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => loadData(true)} className="btn-primary">Retry</button>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card-skeleton" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full text-center py-8 text-sm text-slate-600">No coins found. Try a different search or refresh.</div>
            ) : (
              filtered.map((coin) => (
                <CryptoCard key={coin.id} coin={coin} onClick={() => openDetails(coin)} />
              ))
            )}
          </div>
        )}
      </section>

      <section className="card-panel">
        <h3 className="text-xl font-semibold mb-3">Top Movers (24h)</h3>
        <div className="space-y-3">
          {movers.length === 0 ? (
            <div className="text-sm text-slate-600">No movers available.</div>
          ) : (
            movers.map((coin) => {
            const change = coin.price_change_percentage_24h || 0;
            const width = Math.min(Math.abs(change) * 2, 100);
            return (
              <div key={coin.id} className="mover-row">
                <div className="w-32 font-medium truncate">{coin.name}</div>
                <div className="flex-1 h-2 rounded bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className={`h-full ${change >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} style={{ width: `${width}%` }} />
                </div>
                <div className={`w-20 text-right font-semibold ${change >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {percent(change)}
                </div>
              </div>
            );
            })
          )}
        </div>
      </section>

      <Modal open={Boolean(selected)} onClose={closeDetails}>
        {loadingDetails ? (
          <div>Loading...</div>
        ) : details ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
              <img src={details.image?.large} alt={details.symbol} className="w-12 h-12 rounded-full" />
              <div>
                <div className="text-xl font-semibold">
                  {details.name} ({details.symbol?.toUpperCase()})
                </div>
                <div className="text-sm text-slate-500">Rank #{details.market_cap_rank}</div>
              </div>
              </div>
              <div className={`text-sm font-semibold ${((details.market_data?.price_change_percentage_24h || 0) >= 0) ? "price-up" : "price-down"}`}>
                24h Change {percent(details.market_data?.price_change_percentage_24h || 0)}
              </div>
            </div>

            <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-4">
              <CoinCandlestickChart prices={details.market_chart?.prices} />

              <div className="grid grid-cols-2 gap-3">
                <div className="detail-stat">
                  <div className="detail-stat-label">Current Price</div>
                  <div className="detail-stat-value">{currency(details.market_data?.current_price?.usd)}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">24h High / Low</div>
                  <div className="detail-stat-value text-base">
                    {currency(details.market_data?.high_24h?.usd)} / {currency(details.market_data?.low_24h?.usd)}
                  </div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Market Cap</div>
                  <div className="detail-stat-value">{compactCurrency(details.market_data?.market_cap?.usd)}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">24h Volume</div>
                  <div className="detail-stat-value">{compactCurrency(details.market_data?.total_volume?.usd)}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Circulating Supply</div>
                  <div className="detail-stat-value">{formatSupply(details.market_data?.circulating_supply)}</div>
                </div>
                <div className="detail-stat">
                  <div className="detail-stat-label">Max Supply</div>
                  <div className="detail-stat-value">{formatSupply(details.market_data?.max_supply)}</div>
                </div>
                <div className="detail-stat col-span-2">
                  <div className="detail-stat-label">Fully Diluted Value</div>
                  <div className="detail-stat-value">{compactCurrency(details.market_data?.fully_diluted_valuation?.usd)}</div>
                </div>
              </div>
            </div>

            <section>
              <h4 className="font-medium mb-2">About</h4>
              <div
                className="prose max-w-none text-sm text-slate-700 dark:text-slate-300"
                dangerouslySetInnerHTML={{
                  __html: details.description?.en || "<p>No description available.</p>",
                }}
              />
            </section>
          </div>
        ) : (
          <div className="text-sm text-slate-600">No details available.</div>
        )}
      </Modal>
    </div>
  );
}
