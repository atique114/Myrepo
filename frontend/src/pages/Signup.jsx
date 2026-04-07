import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const DEMO_EMAIL = "demo@digicoin.local";
const DEMO_PASSWORD = "demo123";

export default function Signup() {
  const { signup } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await signup({ email, password });
      toast.success("Account created");
      navigate("/");
    } catch (error) {
      const demo = error.response?.data?.demoCredentials;
      if (demo) {
        toast.info(`MongoDB is offline. Use demo login: ${demo.email} / ${demo.password}`);
      } else {
        toast.error(error.response?.data?.message || "Signup failed.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[0.95fr_1.05fr] items-start">
      <div className="auth-form-card">
      <h2 className="text-3xl font-semibold mb-2">Create Account</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
        When MongoDB is running, you can create a normal account here. If the database is offline, use the demo login on the right.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-field w-full" type="email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password (min 6 chars)"
          className="input-field w-full"
          minLength={6}
        />
        <div className="flex items-center justify-between">
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Creating..." : "Sign up"}
          </button>
          <Link to="/login" className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            Already have an account?
          </Link>
        </div>
      </form>
      </div>
      <section className="auth-hero-card auth-hero-alt">
        <p className="auth-eyebrow">Database-Aware Access</p>
        <h3 className="auth-title">Need to get inside the app right now?</h3>
        <p className="auth-copy">
          Use the demo login while MongoDB is unavailable, then switch to your own account later without losing access to the market dashboard.
        </p>
        <div className="auth-feature-grid">
          <div className="auth-feature-card">
            <div className="auth-feature-label">Demo Email</div>
            <div className="auth-feature-value">{DEMO_EMAIL}</div>
          </div>
          <div className="auth-feature-card">
            <div className="auth-feature-label">Demo Password</div>
            <div className="auth-feature-value">{DEMO_PASSWORD}</div>
          </div>
          <div className="auth-feature-card">
            <div className="auth-feature-label">Tip</div>
            <div className="auth-feature-value">Start MongoDB to enable real signup and alerts.</div>
          </div>
        </div>
      </section>
    </div>
  );
}
