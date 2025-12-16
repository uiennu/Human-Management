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
  avatarUrl: string
  basicInfo: {
    phoneNumber: string
    address: string
    personalEmail: string
    emergencyContacts: Array<{
      name: string
      phone: string
      relation: string
    }>
  }
  sensitiveInfo: {
    isLocked: boolean
    idNumber: string | null
    bankAccount: string | null
    pendingRequest: {
      requestId: number
      status: string
      createdAt: string
    } | null
  }
  leaveBalance: {
    annual: number
    sick: number
    personal: number
  }
}

export interface UpdateBasicInfoRequest {
  phoneNumber: string
  address: string
  personalEmail: string
  emergencyContacts: Array<{
    name: string
    phone: string
    relation: string
  }>
}

export interface RequestSensitiveUpdateRequest {
  idNumber: string
  bankAccount: string
  firstName?: string
  lastName?: string
}

export interface RequestSensitiveUpdateResponse {
  requestId: number
  message: string
  expiresInSeconds: number
}

export interface VerifyOtpRequest {
  requestId: number
  otpCode: string
}

export interface VerifyOtpResponse {
  success: boolean
  message: string
}
