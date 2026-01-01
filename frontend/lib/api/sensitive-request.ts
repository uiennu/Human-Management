import type {
  SensitiveRequestListResponse,
  GroupedSensitiveRequest,
  ProcessRequestResponse,
} from '@/types/sensitive-request'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5204/api'

function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || ''
  }
  return ''
}

export const sensitiveRequestApi = {
  /**
   * Get all sensitive update requests (for HR)
   */
  async getAll(params?: {
    status?: string
    page?: number
    pageSize?: number
    search?: string
  }): Promise<SensitiveRequestListResponse> {
    const queryParams = new URLSearchParams()
    
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status)
    }
    if (params?.page) {
      queryParams.append('page', params.page.toString())
    }
    if (params?.pageSize) {
      queryParams.append('pageSize', params.pageSize.toString())
    }
    if (params?.search) {
      queryParams.append('search', params.search)
    }

    const url = `${API_BASE_URL}/hr/sensitive-requests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    }

    if (response.status === 403) {
      throw new Error('FORBIDDEN')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch sensitive requests')
    }

    return response.json()
  },

  /**
   * Get a specific sensitive request by ID
   */
  async getById(id: number): Promise<GroupedSensitiveRequest> {
    const response = await fetch(`${API_BASE_URL}/hr/sensitive-requests/${id}`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    }

    if (response.status === 403) {
      throw new Error('FORBIDDEN')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to fetch sensitive request')
    }

    return response.json()
  },

  /**
   * Approve a sensitive update request
   */
  async approve(id: number, reason?: string): Promise<ProcessRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/hr/sensitive-requests/${id}/approve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    }

    if (response.status === 403) {
      throw new Error('FORBIDDEN')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to approve request')
    }

    return response.json()
  },

  /**
   * Reject a sensitive update request
   */
  async reject(id: number, reason: string): Promise<ProcessRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/hr/sensitive-requests/${id}/reject`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason }),
    })

    if (response.status === 401) {
      throw new Error('UNAUTHORIZED')
    }

    if (response.status === 403) {
      throw new Error('FORBIDDEN')
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || 'Failed to reject request')
    }

    return response.json()
  },

  /**
   * Get the URL to view/download a supporting document
   * @param documentPath - The path to the document (e.g., /uploads/sensitive-documents/...)
   * @returns Full URL to access the document
   */
  getDocumentUrl(documentPath: string): string {
    const baseUrl = API_BASE_URL.replace('/api', '')
    return `${baseUrl}${documentPath}`
  },
}
