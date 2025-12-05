const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5204"

export interface LeaveRequest {
  id: number
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  status: "Approved" | "Pending" | "Rejected" | "Cancelled"
  approver: string
  submittedDate: string
  reason?: string
}

export interface LeaveBalance {
  totalDays: number
  usedDays: number
  remainingDays: number
  pendingRequests: number
}

export interface LeaveFilters {
  status?: string
  dateRange?: string
  leaveType?: string
  page?: number
  pageSize?: number
}

// Get leave balance summary
export async function getLeaveBalance(): Promise<LeaveBalance> {
  const response = await fetch(`${API_BASE_URL}/leave/balance`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch leave balance")
  }

  return response.json()
}

// Get leave request history with filters
export async function getLeaveHistory(filters: LeaveFilters): Promise<{
  data: LeaveRequest[]
  total: number
  page: number
  pageSize: number
}> {
  const params = new URLSearchParams()

  if (filters.status && filters.status !== "all") params.append("status", filters.status)
  if (filters.dateRange) params.append("dateRange", filters.dateRange)
  if (filters.leaveType && filters.leaveType !== "all") params.append("leaveType", filters.leaveType)
  if (filters.page) params.append("page", filters.page.toString())
  if (filters.pageSize) params.append("pageSize", filters.pageSize.toString())

  const response = await fetch(`${API_BASE_URL}/leave/history?${params}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch leave history")
  }

  return response.json()
}

// Cancel a pending leave request
export async function cancelLeaveRequest(requestId: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/leave/${requestId}/cancel`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error("Failed to cancel leave request")
  }
}

// Get leave request details
export async function getLeaveRequestDetails(requestId: number): Promise<LeaveRequest> {
  const response = await fetch(`${API_BASE_URL}/leave/${requestId}`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch leave request details")
  }

  return response.json()
}

// Helper function to get auth token (implement based on your auth strategy)
function getAuthToken(): string {
  // TODO: Implement token retrieval from localStorage, cookies, or auth context
  return localStorage.getItem("authToken") || ""
}
