export interface Employee {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  managerId: number
  managerName: string
  location: string
  joinDate: string
  avatar?: string
}

export interface TimesheetUpdateRequest {
  id: number
  employeeId: number
  date: string
  currentTime: string
  requestedTime: string
  status: "Approved" | "Pending" | "Rejected"
  reason: string
  submittedDate: string
  approver?: string
}

export interface CheckInRequest {
  id: number
  employeeId: number
  type: "Check-In" | "Check-Out"
  date: string
  time: string
  location: string
  status: "Approved" | "Pending" | "Rejected"
  reason: string
  submittedDate: string
  approver?: string
}

export interface DashboardStats {
  leaveBalance: number
  leaveUsed: number
  pendingRequests: number
  overtimeHours: number
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
