export interface LeaveType {
  leaveTypeID: number
  name: string
  description: string
  defaultQuota: number
}

export interface LeaveBalance {
  leaveTypeID: number
  name: string
  balanceDays: number
  defaultQuota: number
}

export interface LeaveRequest {
  id: number
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  status: "Approved" | "Pending" | "Rejected" | "Cancelled"
  approver: string
  submittedDate: string
  reason?: string
}

export interface CreateLeaveRequestDto {
  leaveTypeID: number
  startDate: string
  endDate: string
  isHalfDayStart: boolean
  isHalfDayEnd: boolean
  totalDays: number
  reason: string
  attachments?: File[]
}

export interface LeaveRequestListItem {
  leaveRequestID: number
  leaveTypeID: number
  leaveTypeName: string
  startDate: string
  endDate: string
  totalDays: number
  status: string
  requestedDate: string
}

export interface LeaveRequestDetail extends LeaveRequestListItem {
  employeeID: number
  isHalfDayStart: boolean
  isHalfDayEnd: boolean
  reason: string
  attachments: string[]
  leaveType: LeaveType
}

export interface LeaveFilters {
  status?: string
  dateRange?: string
  leaveType?: string
  page?: number
  pageSize?: number
}

export interface PagedResult<T> {
  totalItems: number
  totalPages: number
  currentPage: number
  data: T[]
}

export interface PrimaryApproverResponse {
  managerName: string
}

export const LeaveStatus = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
} as const

export type LeaveStatusType = typeof LeaveStatus[keyof typeof LeaveStatus]
