import type { LeaveFilters, LeaveRequest } from '@/types/leave'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204/api'

function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || ''
  }
  return ''
}

export const leaveApi = {
  // Get leave balance summary
  async getBalance(): Promise<{
    totalDays: number
    usedDays: number
    remainingDays: number
    pendingRequests: number
  }> {
    const response = await fetch(`${API_BASE_URL}/leave/balances`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch leave balance')
    }

    return response.json()
  },

  // Get leave request history with filters
  async getHistory(filters: LeaveFilters): Promise<{
    data: LeaveRequest[]
    total: number
    page: number
    pageSize: number
  }> {
    const params = new URLSearchParams()

    if (filters.status && filters.status !== 'all') params.append('status', filters.status)
    if (filters.dateRange) params.append('dateRange', filters.dateRange)
    if (filters.leaveType && filters.leaveType !== 'all') params.append('leaveType', filters.leaveType)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString())

    const response = await fetch(`${API_BASE_URL}/leave/history?${params}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch leave history')
    }

    return response.json()
  },

  // Cancel a pending leave request
  async cancelRequest(requestId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/leave/${requestId}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to cancel leave request')
    }
  },

  // Get leave request details
  async getRequestDetails(requestId: number): Promise<LeaveRequest> {
    const response = await fetch(`${API_BASE_URL}/leave/${requestId}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch leave request details')
    }

    return response.json()
  },
}
