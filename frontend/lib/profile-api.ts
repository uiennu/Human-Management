const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5204/api"

export interface EmployeeProfile {
  id: number
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  department: string
  manager: string
  location: string
  joinDate: string
  leaveBalance: {
    annual: number
    sick: number
    personal: number
  }
}

export interface UpdateProfileRequest {
  phone?: string
  location?: string
  personalEmail?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  address?: string
}

// Get current employee profile
export async function getEmployeeProfile(): Promise<EmployeeProfile> {
  const response = await fetch(`${API_BASE_URL}/employees/me`, {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch employee profile")
  }

  return response.json()
}

// Update employee profile
export async function updateEmployeeProfile(data: UpdateProfileRequest): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${API_BASE_URL}/employees/me/basic-info`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to update employee profile")
  }

  return response.json()
}

// Helper function to get auth token
function getAuthToken(): string {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") || ""
  }
  return ""
}
