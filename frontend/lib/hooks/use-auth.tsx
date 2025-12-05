'use client'

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthContextType, AuthData } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Lấy token/role/email từ localStorage khi load lại trang
    const t = localStorage.getItem('token')
    const r = localStorage.getItem('role')
    const e = localStorage.getItem('email')

    // Only require token to stay logged in (role and email are optional)
    if (t) {
      setToken(t)
      setRole(r || null)
      setEmail(e || null)
    }

    setIsLoading(false) // Done checking localStorage
  }, [])

  const setAuth = ({ token, role, email }: AuthData) => {
    setToken(token)
    setRole(role)
    setEmail(email)
    localStorage.setItem('token', token)
    localStorage.setItem('role', role)
    localStorage.setItem('email', email)
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 8}`
  }

  const logout = () => {
    setToken(null)
    setRole(null)
    setEmail(null)
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('email')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  }

  return (
    <AuthContext.Provider value={{ token, role, email, isAuthenticated: !!token, isLoading, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
