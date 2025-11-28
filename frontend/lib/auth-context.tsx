"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AuthContextType {
  token: string | null;
  role: string | null;
  email: string | null;
  isAuthenticated: boolean;
  setAuth: (data: { token: string; role: string; email: string }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // Lấy token/role/email từ localStorage khi load lại trang
    const t = localStorage.getItem("token");
    const r = localStorage.getItem("role");
    const e = localStorage.getItem("email");
    if (t && r && e) {
      setToken(t);
      setRole(r);
      setEmail(e);
    } else {
      setToken(null);
      setRole(null);
      setEmail(null);
    }
  }, []);

  const setAuth = ({ token, role, email }: { token: string; role: string; email: string }) => {
    setToken(token);
    setRole(role);
    setEmail(email);
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    localStorage.setItem("email", email);
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 8}`;
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setEmail(null);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
  };

  return (
    <AuthContext.Provider value={{ token, role, email, isAuthenticated: !!token, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
