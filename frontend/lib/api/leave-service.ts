import type {
  LeaveType,
  LeaveBalance,
  CreateLeaveRequestDto,
  LeaveRequestListItem,
  LeaveRequestDetail,
  PagedResult,
  PrimaryApproverResponse,
} from '@/types/leave'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204/api'

function getAuthHeaders(isMultipart = false): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  }

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

export const leaveService = {
  async getLeaveTypes(): Promise<LeaveType[]> {
    const res = await fetch(`${API_URL}/leave/types`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch leave types')
    return res.json()
  },

  async getMyBalances(employeeId: number): Promise<LeaveBalance[]> {
    try {
      const res = await fetch(`${API_URL}/leave/balances/${employeeId}`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) {
        console.warn('Failed to fetch leave balances:', res.status, res.statusText)
        return [] // Return empty array instead of throwing
      }
      const data = await res.json()
      // Backend returns { employeeID, data: [...] } structure
      return data.data || data.Data || []
    } catch (error) {
      console.error('Error fetching leave balances:', error)
      return [] // Return empty array on error
    }
  },

  async createLeaveRequest(employeeId: number, data: CreateLeaveRequestDto) {
    const formData = new FormData()
    formData.append('leaveTypeID', data.leaveTypeID.toString())
    formData.append('startDate', data.startDate)
    formData.append('endDate', data.endDate)
    formData.append('isHalfDayStart', data.isHalfDayStart.toString())
    formData.append('isHalfDayEnd', data.isHalfDayEnd.toString())
    formData.append('totalDays', data.totalDays.toString())
    formData.append('reason', data.reason || '')

    if (data.attachments) {
      data.attachments.forEach((file: File) => {
        formData.append('attachments', file)
      })
    }

    const res = await fetch(`${API_URL}/leave/request?employeeId=${employeeId}`, {
      method: 'POST',
      headers: getAuthHeaders(true),
      body: formData,
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Failed to create request')
    }
    return res.json()
  },

  async getMyRequests(
    employeeId: number,
    options?: {
      status?: string
      dateRange?: string
      leaveTypeId?: string
      page?: number
      pageSize?: number
    }
  ): Promise<PagedResult<LeaveRequestListItem>> {
    const params = new URLSearchParams()
    params.append('employeeId', employeeId.toString())
    params.append('page', (options?.page || 1).toString())
    params.append('pageSize', (options?.pageSize || 10).toString())

    if (options?.status && options.status !== 'all') {
      params.append('status', options.status)
    }
    if (options?.dateRange) {
      params.append('dateRange', options.dateRange)
    }
    if (options?.leaveTypeId && options.leaveTypeId !== 'all') {
      params.append('leaveTypeId', options.leaveTypeId)
    }

    const res = await fetch(`${API_URL}/leave/requests?${params.toString()}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch requests')
    return res.json()
  },

  async getLeaveRequestDetail(requestId: number): Promise<LeaveRequestDetail> {
    const res = await fetch(`${API_URL}/leave/leave-requests/${requestId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) throw new Error('Failed to fetch request details')
    return res.json()
  },

  async cancelLeaveRequest(requestId: number) {
    const res = await fetch(`${API_URL}/leave/leave-requests/${requestId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || 'Failed to cancel request')
    }
    return res.json()
  },

  async getPrimaryApprover(employeeId: number): Promise<PrimaryApproverResponse> {
    const res = await fetch(`${API_URL}/leave/primary-approver?employeeId=${employeeId}`, {
      headers: getAuthHeaders(),
    })
    if (!res.ok) {
      if (res.status === 404) {
        return { managerName: null }
      }
      throw new Error('Failed to fetch primary approver')
    }
    return res.json()
  },
}
