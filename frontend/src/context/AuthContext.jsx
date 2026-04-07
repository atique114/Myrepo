import React, { createContext, useEffect, useMemo, useState } from "react";
import {
  getStoredAuth,
  setStoredAuth,
  signup as signupApi,
  login as loginApi,
  me as meApi,
} from "../services/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const stored = getStoredAuth();
      if (!stored?.token) {
        if (mounted) setBooting(false);
        return;
      }
      try {
        const data = await meApi();
        if (mounted) setUser(data.user);
      } catch (error) {
        setStoredAuth(null);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setBooting(false);
      }
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  async function signup(payload) {
    const data = await signupApi(payload);
    setStoredAuth({ token: data.token, user: data.user });
    setUser(data.user);
    return data.user;
  }

  async function login(payload) {
    const data = await loginApi(payload);
    setStoredAuth({ token: data.token, user: data.user });
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setStoredAuth(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, booting, signup, login, logout, setUser }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
