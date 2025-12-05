export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204',
  TIMEOUT: 30000,
} as const

export const AUTH_CONFIG = {
  TOKEN_KEY: 'token',
  ROLE_KEY: 'role',
  EMAIL_KEY: 'email',
  SESSION_DURATION: 60 * 60 * 8, // 8 hours in seconds
} as const

export const LEAVE_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  DRAFT: 'Draft',
} as const

export const REQUEST_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
} as const

export type LeaveStatus = (typeof LEAVE_STATUS)[keyof typeof LEAVE_STATUS]
export type RequestStatus = (typeof REQUEST_STATUS)[keyof typeof REQUEST_STATUS]
