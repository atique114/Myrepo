import React, { useEffect, useState } from "react";
import {
  createAlert,
  fetchAlertHistory,
  fetchAlerts,
  fetchCoins,
  removeAlert,
  updateAlert,
} from "../services/api";
import { toast } from "react-toastify";

function formatCurrency(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "-";
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: amount < 1 ? 2 : 0,
    maximumFractionDigits: amount < 1 ? 4 : 2,
  })}`;
}

export default function Alerts() {
  const [coinOptions, setCoinOptions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [history, setHistory] = useState([]);
  const [demoNotice, setDemoNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    coinId: "",
    coinName: "",
    symbol: "",
    direction: "ABOVE",
    targetPrice: "",
    cooldownMinutes: 30,
  });

  async function loadPageData() {
    setLoading(true);
    try {
      const [alertsData, historyData, coinsData] = await Promise.all([
        fetchAlerts(),
        fetchAlertHistory(),
        fetchCoins({ page: 1, perPage: 15 }),
      ]);
      setAlerts(alertsData);
      setHistory(historyData);
      setCoinOptions(coinsData);
      setDemoNotice("");
      if (!form.coinId && coinsData.length) {
        const first = coinsData[0];
        setForm((prev) => ({
          ...prev,
          coinId: first.id,
          coinName: first.name,
          symbol: first.symbol,
        }));
      }
    } catch (error) {
      const message = error.response?.data?.message || "Failed to load alerts.";
      if (error.response?.status === 503) {
        setDemoNotice("Alerts need MongoDB. You can still browse the live market in demo mode.");
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPageData();
  }, []);

  function onCoinChange(id) {
    const coin = coinOptions.find((item) => item.id === id);
    if (!coin) return;
    setForm((prev) => ({
      ...prev,
      coinId: coin.id,
      coinName: coin.name,
      symbol: coin.symbol,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.coinId || !form.targetPrice) {
      toast.error("Select a coin and target price.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createAlert({
        coinId: form.coinId,
        coinName: form.coinName,
        symbol: form.symbol,
        direction: form.direction,
        targetPrice: Number(form.targetPrice),
        cooldownMinutes: Number(form.cooldownMinutes),
      });
      if (result?.triggered && !result?.alert) {
        if (result.deliveryStatus === "FAILED") {
          toast.error(result.deliveryError || result.message || "Alert triggered, but email delivery failed.");
        } else if (result.deliveryStatus === "SIMULATED") {
          toast.info(result.message || "Alert triggered and was removed, but email is still in simulated mode.");
        } else {
          toast.success(result.message || "Target already hit. Email sent and alert removed.");
        }
      } else if (result?.triggered) {
        toast.success("Alert created and checked against the latest market price.");
      } else {
        toast.success("Alert created.");
      }
      setForm((prev) => ({ ...prev, targetPrice: "" }));
      await loadPageData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create alert.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleAlert(alert) {
    try {
      const result = await updateAlert(alert.id, { isActive: !alert.isActive });
      if (result?.triggered && !result?.alert) {
        if (result.deliveryStatus === "FAILED") {
          toast.error(result.deliveryError || result.message || "Alert triggered, but email delivery failed.");
        } else if (result.deliveryStatus === "SIMULATED") {
          toast.info(result.message || "Alert triggered and was removed, but email is still in simulated mode.");
        } else {
          toast.success(result.message || "Alert triggered immediately and was removed.");
        }
      }
      await loadPageData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update alert.");
    }
  }

  async function deleteAlert(id) {
    try {
      await removeAlert(id);
      toast.info("Alert deleted.");
      await loadPageData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete alert.");
    }
  }

  const selectedCoin = coinOptions.find((item) => item.id === form.coinId);
  const activeAlerts = alerts.filter((item) => item.isActive).length;
  const pausedAlerts = alerts.length - activeAlerts;
  const latestTrigger = history[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="alert-hero">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-slate-100/70">Alert Studio</p>
          <h2 className="text-3xl md:text-4xl font-semibold mt-2">Build price alerts that feel live, not buried.</h2>
          <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-100/85">
            Track upside breakouts, downside slips, and cooldown windows from one place. Your alert engine is now backed by MongoDB, so saved alerts and history stay online.
          </p>
        </div>
        <div className="alert-hero-metrics">
          <div className="alert-hero-card">
            <div className="alert-hero-label">Active</div>
            <div className="alert-hero-value">{activeAlerts}</div>
          </div>
          <div className="alert-hero-card">
            <div className="alert-hero-label">Paused</div>
            <div className="alert-hero-value">{pausedAlerts}</div>
          </div>
          <div className="alert-hero-card">
            <div className="alert-hero-label">Latest Trigger</div>
            <div className="alert-hero-value text-lg">{latestTrigger ? latestTrigger.symbol.toUpperCase() : "None"}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="stat-label">Total Alerts</div>
          <div className="stat-value">{alerts.length}</div>
          <div className="stat-subvalue">Saved rules connected to your account</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Trigger History</div>
          <div className="stat-value">{history.length}</div>
          <div className="stat-subvalue">Recent alert deliveries recorded in MongoDB</div>
        </div>
        <div className="stat-card stat-card-featured">
          <div className="stat-label">Selected Coin</div>
          <div className="stat-value text-lg">{selectedCoin ? selectedCoin.symbol.toUpperCase() : "--"}</div>
          <div className="stat-subvalue">
            {selectedCoin ? `${selectedCoin.name} at ${formatCurrency(selectedCoin.current_price)}` : "Pick a market to start"}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_minmax(320px,0.85fr)]">
        <section className="card-panel">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-semibold">Create Price Alert</h2>
              <p className="text-sm text-slate-500 mt-1">Choose a market, direction, target, and cooldown in one streamlined form.</p>
            </div>
            {selectedCoin ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2 max-w-full">
                <img src={selectedCoin.image} alt={selectedCoin.symbol} className="w-10 h-10 rounded-full" />
                <div className="min-w-0">
                  <div className="font-medium truncate">{selectedCoin.name}</div>
                  <div className="text-xs text-slate-500 truncate">{formatCurrency(selectedCoin.current_price)}</div>
                </div>
              </div>
            ) : null}
          </div>
          {demoNotice ? (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200">
              {demoNotice}
            </div>
          ) : null}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Coin</span>
              <select value={form.coinId} onChange={(e) => onCoinChange(e.target.value)} className="input-field w-full">
                {coinOptions.map((coin) => (
                  <option key={coin.id} value={coin.id}>
                    {coin.name} ({coin.symbol.toUpperCase()})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Direction</span>
              <select
                value={form.direction}
                onChange={(e) => setForm((prev) => ({ ...prev, direction: e.target.value }))}
                className="input-field w-full"
              >
                <option value="ABOVE">Price Above</option>
                <option value="BELOW">Price Below</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Target Price</span>
              <input
                value={form.targetPrice}
                onChange={(e) => setForm((prev) => ({ ...prev, targetPrice: e.target.value }))}
                placeholder="Target price (USD)"
                className="input-field w-full"
                type="number"
                min="0"
                step="0.0001"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Cooldown (minutes)</span>
              <input
                value={form.cooldownMinutes}
                onChange={(e) => setForm((prev) => ({ ...prev, cooldownMinutes: e.target.value }))}
                className="input-field w-full"
                type="number"
                min="1"
                max="1440"
                title="Cooldown minutes"
              />
            </label>

            <div className="md:col-span-2 alert-preview-card">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-white">Live rule preview</div>
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Notify me when {selectedCoin?.name || "this coin"} moves {form.direction === "ABOVE" ? "above" : "below"}{" "}
                  {formatCurrency(form.targetPrice || selectedCoin?.current_price)} with a {form.cooldownMinutes}-minute cooldown.
                </div>
              </div>
              <button className="btn-primary w-full md:w-auto" disabled={submitting || loading} type="submit">
                {submitting ? "Saving..." : "Save Alert"}
              </button>
            </div>
          </form>
        </section>

        <section className="card-panel">
          <h3 className="text-xl font-semibold mb-3">Alert Workflow</h3>
          <div className="space-y-3">
            <div className="workflow-step">
              <span className="workflow-index">1</span>
              <div>
                <div className="font-medium">Select a tracked coin</div>
                <div className="text-sm text-slate-500">Use the live market list already loaded from your dashboard data source.</div>
              </div>
            </div>
            <div className="workflow-step">
              <span className="workflow-index">2</span>
              <div>
                <div className="font-medium">Define a clean threshold</div>
                <div className="text-sm text-slate-500">Choose whether you care about breakouts above or drops below a target price.</div>
              </div>
            </div>
            <div className="workflow-step">
              <span className="workflow-index">3</span>
              <div>
                <div className="font-medium">Avoid alert spam</div>
                <div className="text-sm text-slate-500">Cooldown keeps repeated triggers under control during fast market swings.</div>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="card-panel">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold">Your Alerts</h3>
            <p className="text-sm text-slate-500 mt-1">Toggle, review, or remove live rules from a cleaner control board.</p>
          </div>
        </div>
        {loading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="card-skeleton h-32" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <p className="text-slate-600">No alerts yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="alert-item-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-lg">
                      {alert.coinName} ({alert.symbol.toUpperCase()})
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      Trigger when price goes {alert.direction === "ABOVE" ? "above" : "below"} {formatCurrency(alert.targetPrice)}
                    </div>
                  </div>
                  <span className={`alert-status-pill ${alert.isActive ? "alert-status-on" : "alert-status-off"}`}>
                    {alert.isActive ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="alert-meta-grid">
                  <div>
                    <div className="alert-meta-label">Cooldown</div>
                    <div className="alert-meta-value">{alert.cooldownMinutes} min</div>
                  </div>
                  <div>
                    <div className="alert-meta-label">Updated</div>
                    <div className="alert-meta-value">{new Date(alert.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2">
                  <button
                    onClick={() => toggleAlert(alert)}
                    type="button"
                    className={`${alert.isActive ? "btn-secondary" : "btn-primary"} w-full sm:w-auto`}
                  >
                    {alert.isActive ? "Pause Alert" : "Resume Alert"}
                  </button>
                  <button onClick={() => deleteAlert(alert.id)} type="button" className="alert-delete-btn w-full sm:w-auto">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card-panel">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-xl font-semibold">Alert History</h3>
            <p className="text-sm text-slate-500 mt-1">Recent deliveries and trigger events from your saved rules.</p>
          </div>
        </div>
        {history.length === 0 ? (
          <p className="text-slate-600">No triggered alerts yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="history-row">
                <div>
                  <div className="font-medium">{item.symbol.toUpperCase()}</div>
                  <div className="text-xs text-slate-500">{new Date(item.triggeredAt).toLocaleString()}</div>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  {item.direction === "ABOVE" ? "Breakout above" : "Drop below"} {formatCurrency(item.targetPrice)}
                </div>
                <div className="text-sm font-medium">{formatCurrency(item.triggerPrice)}</div>
                <div className={`alert-status-pill ${item.deliveryStatus === "SENT" ? "alert-status-on" : "alert-status-off"}`}>
                  {item.deliveryStatus}
                </div>
                {item.deliveryError ? (
                  <div className="text-xs text-rose-600 dark:text-rose-300">
                    {item.deliveryError}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
