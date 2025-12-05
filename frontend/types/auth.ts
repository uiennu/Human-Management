export interface AuthData {
  token: string
  role: string
  email: string
}

export interface AuthContextType {
  token: string | null
  role: string | null
  email: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (data: AuthData) => void
  logout: () => void
}
