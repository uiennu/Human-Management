export enum UserRole {
  ITEmployee = "IT Employee",
  ITManager = "IT Manager",
  HRManager = "HR Manager",
  HREmployee = "HR Employee",
  Admin = "Admin",
  SalesManager = "Sales Manager",
  SalesEmployee = "Sales Employee",
  FinanceManager = "Finance Manager",
  FinanceEmployee = "Finance Employee",
  BODAssistant = "BOD Assistant"
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
  user: { role: string; [key: string]: any } | null;
  setAuth: (data: AuthData) => void
  logout: () => void
  hasRole: (role: string) => boolean
  hasAnyRole: (roles: string[]) => boolean
}
