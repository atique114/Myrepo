import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { changePassword, fetchProfileSummary } from "../services/api";
import { toast } from "react-toastify";

function formatJoinDate(value) {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function Profile() {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadSummary() {
    setLoading(true);
    try {
      const data = await fetchProfileSummary();
      setSummary(data.stats);
    } catch (error) {
      setSummary({ activeAlerts: 0, totalAlerts: 0, triggeredAlerts: 0 });
      toast.error(error.response?.data?.message || "Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSummary();
  }, []);

  async function onChangePassword(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await changePassword(form);
      toast.success("Password updated.");
      setForm({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <section className="profile-hero">
        <div className="flex items-start gap-4">
          <div className="profile-avatar">{user.email?.slice(0, 1).toUpperCase()}</div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">Account Center</p>
            <h2 className="text-3xl md:text-4xl font-semibold mt-2">{user.email}</h2>
            <p className="mt-3 text-sm md:text-base text-white/85 max-w-2xl">
              Review your tracking activity, see how many alerts are active, and keep your account secure from one cleaner profile dashboard.
            </p>
          </div>
        </div>
        <div className="profile-hero-badges">
          <span className="insight-chip">{user.isDemo ? "Demo Account" : "Database Account"}</span>
          <span className="insight-chip">Member since {formatJoinDate(user.createdAt)}</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="stat-card stat-card-featured md:col-span-2">
          <div className="stat-label">Account Status</div>
          <div className="stat-value text-lg">{user.isDemo ? "Explore Mode" : "Connected to MongoDB"}</div>
          <div className="stat-subvalue">
            {user.isDemo
              ? "You can browse the app, but persistence features stay limited."
              : "Your account data and alert activity are stored in the local database."}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Alerts</div>
          <div className="stat-value">{loading ? "..." : summary?.activeAlerts ?? 0}</div>
          <div className="stat-subvalue">Rules currently monitoring price moves</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Triggered Alerts</div>
          <div className="stat-value">{loading ? "..." : summary?.triggeredAlerts ?? 0}</div>
          <div className="stat-subvalue">Historical deliveries recorded so far</div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="card-panel">
          <h3 className="text-2xl font-semibold mb-3">Profile Snapshot</h3>
          <div className="space-y-4">
            <div className="profile-detail-row">
              <span className="profile-detail-label">Email</span>
              <span className="profile-detail-value">{user.email}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Joined</span>
              <span className="profile-detail-value">{formatJoinDate(user.createdAt)}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Total Alerts</span>
              <span className="profile-detail-value">{loading ? "Loading..." : summary?.totalAlerts ?? 0}</span>
            </div>
            <div className="profile-detail-row">
              <span className="profile-detail-label">Experience</span>
              <span className="profile-detail-value">{user.isDemo ? "Preview mode" : "Live portfolio monitoring"}</span>
            </div>
          </div>
          {user.isDemo ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200">
              Demo mode is active. Alerts and password changes need MongoDB, but you can still explore the market dashboard and profile layout.
            </div>
          ) : null}
        </section>

        <section className="card-panel">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-2xl font-semibold">Security</h3>
              <p className="text-sm text-slate-500 mt-1">Keep your account protected with a stronger password rotation flow.</p>
            </div>
            <div className="hidden sm:block rounded-2xl bg-slate-100 dark:bg-slate-950 px-4 py-2 text-sm text-slate-600 dark:text-slate-300">
              {user.isDemo ? "Password changes disabled in demo mode" : "Database-backed credentials active"}
            </div>
          </div>
          <form className="space-y-3" onSubmit={onChangePassword}>
            <input
              value={form.currentPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              type="password"
              placeholder="Current password"
              className="input-field w-full"
            />
            <input
              value={form.newPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
              type="password"
              placeholder="New password"
              className="input-field w-full"
              minLength={6}
            />
            <button className="btn-primary" disabled={saving || user.isDemo} type="submit">
              {saving ? "Updating..." : "Update Password"}
            </button>
          </form>
        </section>
      </section>
    </div>
  );
}
