export enum UserRole {
  Employee = "Employee",
  Manager = "Manager",
  HR = "HR",
  CB = "C&B",
  Admin = "Admin"
}

export interface AuthData {
  token: string
  roles: string[]
  email: string
}

export interface AuthContextType {
  token: string | null
  roles: string[]
  email: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (data: AuthData) => void
  logout: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}
