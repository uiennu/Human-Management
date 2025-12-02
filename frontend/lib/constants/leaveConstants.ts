export const LeaveStatus = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    DRAFT: 'Draft',
} as const;

export type LeaveStatusType = typeof LeaveStatus[keyof typeof LeaveStatus];
