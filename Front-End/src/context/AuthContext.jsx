/* eslint react-refresh/only-export-components: ["warn", { "allowExportNames": ["useAuth"] }] */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthAPI } from "../lib/auth";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | authed | guest

  
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const hasToken = typeof AuthAPI.getToken === 'function' ? AuthAPI.getToken() : null;
        if (!hasToken) {
          if (alive) { setUser(null); setStatus("guest"); }
          return;
        }
        setStatus("loading");
        const u = await AuthAPI.me();
        if (!alive) return;
        setUser(u);
        setStatus("authed");
      } catch {
        if (!alive) return;
        setUser(null);
        setStatus("guest");
      }
    })();
    return () => { alive = false; };
  }, []);

  const value = useMemo(() => ({
    user,
    status,
    isAuthenticated: !!user,
    async login({ email, password }, remember) {
      await AuthAPI.login({ email, password }, remember);
      const u = await AuthAPI.me();
      setUser(u);
      setStatus("authed");
    },
   async register({ name, email, password }) {
  await AuthAPI.register({ name, email, password });
  setUser(null);
  setStatus("guest");
},

    async logout() {
      await AuthAPI.logout();
      setUser(null);
      setStatus("guest");
    },
  }), [user, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      status: "guest",
      isAuthenticated: false,
      async login() { throw new Error("AuthProvider ausente"); },
      async register() { throw new Error("AuthProvider ausente"); },
      async logout() {},
    };
  }
  return ctx;
}
