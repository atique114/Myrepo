import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, booting } = useContext(AuthContext);
  if (booting) return <div className="text-center py-10 text-slate-600">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
