// Định nghĩa cấu trúc dữ liệu trả về từ API Get My Profile
export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface BasicInfo {
  phoneNumber: string;
  address: string;
  personalEmail: string;
  emergencyContact: EmergencyContact;
}

export interface SensitiveInfo {
  isLocked: boolean;
  idNumber: string;
  bankAccount: string;
  pendingRequest: PendingRequest | null;
}

export interface UserProfile {
  employeeId: string;
  fullName: string;
  avatarUrl: string;
  basicInfo: BasicInfo;
  sensitiveInfo: SensitiveInfo;
}

// Định nghĩa body gửi đi cập nhật cơ bản
export interface UpdateBasicInfoRequest {
  phoneNumber: string;
  address: string;
  personalEmail: string;
  emergencyContact: EmergencyContact;
}

// Định nghĩa body gửi đi yêu cầu cập nhật nhạy cảm
export interface SensitiveUpdateRequest {
    idNumber: string;
    bankAccount: string;
}

export interface PendingRequest {
  requestId: string;
  status: string;
  createdAt: string;
}