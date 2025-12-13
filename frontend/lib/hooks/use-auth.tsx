'use client'

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthContextType, AuthData } from '@/types/auth'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Utility to check if token is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp * 1000 // Convert to milliseconds
    return Date.now() >= exp
  } catch {
    return true
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get token/roles/email from localStorage on page load
    const t = localStorage.getItem('token')
    const r = localStorage.getItem('roles')
    const e = localStorage.getItem('email')

    if (t) {
      // Check if token is expired
      if (isTokenExpired(t)) {
        // Token expired, clear everything
        localStorage.removeItem('token')
        localStorage.removeItem('roles')
        localStorage.removeItem('email')
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      } else {
        setToken(t)
        setRoles(r ? JSON.parse(r) : [])
        setEmail(e || null)
      }
    }

    setIsLoading(false)
  }, [])

  // Periodic token expiration check (every minute)
  useEffect(() => {
    if (!token) return

    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        logout()
      }
    }, 60000) // Check every 60 seconds

    return () => clearInterval(interval)
  }, [token])

  const setAuth = ({ token, roles, email }: AuthData) => {
    setToken(token)
    setRoles(roles)
    setEmail(email)
    localStorage.setItem('token', token)
    localStorage.setItem('roles', JSON.stringify(roles))
    localStorage.setItem('email', email)
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 8}`
  }

  const logout = () => {
    setToken(null)
    setRoles([])
    setEmail(null)
    localStorage.removeItem('token')
    localStorage.removeItem('roles')
    localStorage.removeItem('email')
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
  }

  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  const hasAnyRole = (requiredRoles: string[]): boolean => {
    return requiredRoles.some(role => roles.includes(role))
  }

  return (
    <AuthContext.Provider 
      value={{ 
        token, 
        roles, 
        email, 
        isAuthenticated: !!token, 
        isLoading, 
        setAuth, 
        logout,
        hasRole,
        hasAnyRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
