import type { WFHRequest, CreateWFHRequest } from '@/types/wfh'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || ''
  }
  return ''
}

export const wfhApi = {
  // Get WFH requests
  async getRequests(): Promise<WFHRequest[]> {
    const response = await fetch(`${API_BASE_URL}/wfh/requests`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch WFH requests')
    }

    return response.json()
  },

  // Create new WFH request
  async createRequest(data: CreateWFHRequest): Promise<{ success: boolean; id: number }> {
    const response = await fetch(`${API_BASE_URL}/wfh/requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error('Failed to create WFH request')
    }

    return response.json()
  },
}
