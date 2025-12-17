import type {
  EmployeeProfile,
  UpdateBasicInfoRequest,
  RequestSensitiveUpdateRequest,
  RequestSensitiveUpdateResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/profile'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5204/api'

function getAuthToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token') || ''
  }
  return ''
}

export const profileApi = {
  // Get current employee profile
  async getProfile(): Promise<EmployeeProfile> {
    const response = await fetch(`${API_BASE_URL}/employees/me`, {
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (response.status === 401) {
      // Có thể clear token ở đây hoặc throw lỗi để component xử lý redirect
      throw new Error("UNAUTHORIZED");
    }

    if (!response.ok) {
      let errorMessage = 'Failed to fetch employee profile';
      try {
        // Cố gắng đọc lỗi dạng JSON
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch (e) {
        // Nếu không phải JSON (body rỗng hoặc text), code sẽ nhảy vào đây
        // giúp app không bị crash. Ta có thể đọc dạng text hoặc bỏ qua.
        console.warn("API Error response is not JSON");
      }

      throw new Error(errorMessage);
    }
    return response.json()
  },

  // Update basic information (direct update, no approval needed)
  async updateBasicInfo(data: UpdateBasicInfoRequest): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/employees/me/basic-info`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update basic information')
    }

    return response.json()
  },

  // Request sensitive information update (generates OTP)
  async requestSensitiveUpdate(data: RequestSensitiveUpdateRequest): Promise<RequestSensitiveUpdateResponse> {
    const response = await fetch(`${API_BASE_URL}/employees/me/sensitive-update-requests`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to request sensitive update')
    }

    return response.json()
  },

  // Verify OTP and submit for HR approval
  async verifyOtp(data: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/employees/me/sensitive-update-requests/verify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to verify OTP')
    }

    return response.json()
  },

  // Resend OTP for a pending request
  async resendOtp(requestId: number): Promise<{ success: boolean; message: string; expiresInSeconds: number }> {
    const response = await fetch(`${API_BASE_URL}/employees/me/sensitive-update-requests/${requestId}/resend-otp`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to resend OTP')
    }

    return response.json()
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/employees/me/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getAuthToken()}` },
      body: formData,
    });

    if (!response.ok) {
        const errorData = await response.text(); 
        console.error("Backend Error:", errorData); 
        throw new Error(errorData || 'Failed to upload avatar');
    }
    return response.json();
  },
}
