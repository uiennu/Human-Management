// Types for HR Sensitive Request Management

export interface DocumentInfo {
  documentId: number
  documentPath: string
  documentName: string
  uploadedDate: string
}

export interface SensitiveFieldChange {
  changeId: number
  fieldName: string
  displayName: string
  oldValue: string | null
  newValue: string | null
  supportingDocuments: DocumentInfo[]
}

// Permission info for a specific request
export interface RequestPermission {
  canApprove: boolean
  canReject: boolean
  reason: string | null
  isSelfRequest: boolean
  requiresHigherAuthority: boolean
  suggestedApprover: string | null
}

export interface GroupedSensitiveRequest {
  requestGroupId: number
  employeeId: number
  employeeName: string
  employeeCode: string
  department: string
  status: string
  requestedDate: string
  approverName: string | null
  approvalDate: string | null
  changes: SensitiveFieldChange[]
  supportingDocuments: DocumentInfo[]
  permission?: RequestPermission
}

export interface SensitiveRequestStats {
  all: number
  pending: number
  approved: number
  rejected: number
}

// Current user's authorization info
export interface UserAuthorizationInfo {
  userId: number
  roles: string[]
  roleLevel: number
  roleLevelName: string
  canApproveAny: boolean
}

export interface SensitiveRequestListResponse {
  data: GroupedSensitiveRequest[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  stats: SensitiveRequestStats
  currentUserAuth?: UserAuthorizationInfo
}

export interface ProcessRequestResponse {
  success: boolean
  message: string
}
