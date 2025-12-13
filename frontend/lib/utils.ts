import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// JWT Token utilities
export interface DecodedToken {
  employeeId: string
  email: string
  roles: string[]
  exp: number
  [key: string]: any
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    
    // Extract roles from claims (backend sends role as array)
    const roles: string[] = []
    if (payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']) {
      const roleClaim = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      if (Array.isArray(roleClaim)) {
        roles.push(...roleClaim)
      } else {
        roles.push(roleClaim)
      }
    }
    
    return {
      employeeId: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || payload['EmployeeID'] || '',
      email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '',
      roles,
      exp: payload.exp || 0,
      ...payload
    }
  } catch (error) {
    console.error('Failed to decode token:', error)
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  return Date.now() >= decoded.exp * 1000
}

export function getUserRolesFromToken(token: string): string[] {
  const decoded = decodeToken(token)
  return decoded?.roles || []
}

export function hasRole(token: string, role: string): boolean {
  const roles = getUserRolesFromToken(token)
  return roles.includes(role)
}

export function hasAnyRole(token: string, requiredRoles: string[]): boolean {
  const roles = getUserRolesFromToken(token)
  return requiredRoles.some(role => roles.includes(role))
}
