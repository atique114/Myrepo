import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword } from "../services/api";

const DEMO_EMAIL = "demo@digicoin.local";
const DEMO_PASSWORD = "demo123";

export default function Login() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      toast.success("Logged in");
      navigate("/");
    } catch (error) {
      const apiMessage = error.response?.data?.message || "Login failed.";
      if (error.response?.data?.demoCredentials) {
        setEmail(error.response.data.demoCredentials.email);
        setPassword(error.response.data.demoCredentials.password);
      }
      toast.error(apiMessage);
    } finally {
      setLoading(false);
    }
  }

  async function useDemoLogin() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setLoading(true);
    try {
      await login({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
      toast.success("Logged in with demo mode");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.message || "Demo login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      toast.error("Enter your email first.");
      return;
    }
    setSendingReset(true);
    try {
      const data = await forgotPassword({ email });
      if (data.devResetToken) {
        toast.info(`Dev reset token: ${data.devResetToken}`);
      }
      toast.success(data.message || "Password reset token sent.");
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not start reset flow.");
    } finally {
      setSendingReset(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-start">
      <section className="auth-hero-card">
        <div className="auth-glow" />
        <p className="auth-eyebrow">Streamlined Access</p>
        <h2 className="auth-title">Login and keep tracking the market, even when MongoDB is offline.</h2>
        <p className="auth-copy">
          The app now supports a demo sign-in so you can explore the dashboard and live coin data while the database layer is unavailable.
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
            <div className="auth-feature-label">Access</div>
            <div className="auth-feature-value">Dashboard + profile preview</div>
          </div>
        </div>
      </section>
      <div className="auth-form-card">
      <h2 className="text-3xl font-semibold mb-2">Welcome Back</h2>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
        Sign in with your account, or use the demo credentials for instant access.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input-field w-full" type="email" />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          className="input-field w-full"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="btn-primary w-full" disabled={loading} type="submit">
            {loading ? "Logging in..." : "Login"}
          </button>
          <button className="btn-secondary w-full" disabled={loading} onClick={useDemoLogin} type="button">
            Use Demo Login
          </button>
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button type="button" onClick={handleForgotPassword} disabled={sendingReset} className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            {sendingReset ? "Sending reset token..." : "Forgot password?"}
          </button>
        </div>
        <Link to="/signup" className="text-sm text-slate-600 dark:text-slate-300 inline-block hover:text-slate-900 dark:hover:text-white">
          Create account
        </Link>
      </form>
      </div>
    </div>
  );
}
