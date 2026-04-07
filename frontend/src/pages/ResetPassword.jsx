import React, { useState } from "react";
import { resetPassword } from "../services/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await resetPassword({ token, newPassword });
      toast.success("Password reset successful. Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-slate-900 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-semibold mb-4">Reset Password</h2>
      <form onSubmit={submit} className="space-y-3">
        <input
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Reset token"
          className="input-field w-full"
        />
        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          minLength={6}
          placeholder="New password"
          className="input-field w-full"
        />
        <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg" disabled={loading} type="submit">
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
