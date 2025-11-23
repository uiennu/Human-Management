const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export interface WFHRequest {
  id: number
  startDate: string
  endDate: string
  days: number
  status: "Approved" | "Pending" | "Rejected"
  reason: string
  submittedDate: string
}

export interface CreateWFHRequest {
  startDate: string
  endDate: string
  reason: string
}

// Get WFH requests
export async function getWFHRequests(): Promise<WFHRequest[]> {
  const response = await fetch(`${API_BASE_URL}/wfh/requests`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch WFH requests")
  }

  return response.json()
}

// Create new WFH request
export async function createWFHRequest(data: CreateWFHRequest): Promise<{ success: boolean; id: number }> {
  const response = await fetch(`${API_BASE_URL}/wfh/requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error("Failed to create WFH request")
  }

  return response.json()
}

// Helper function to get auth token
function getAuthToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("authToken") || ""
  }
  return ""
}
