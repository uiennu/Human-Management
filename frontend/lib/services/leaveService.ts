const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204');

const getAuthHeaders = (isMultipart = false) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    
    // --- DEBUG LOG: Kiểm tra token trước khi gửi ---
    console.log("DEBUG - Token trong localStorage:", token ? token.substring(0, 20) + "..." : "KHÔNG CÓ TOKEN");
    
    const headers: any = {
        'Authorization': `Bearer ${token}`,
    };

    if (!isMultipart) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
};

export interface LeaveType {
    leaveTypeID: number;
    name: string;
    description: string;
    defaultQuota: number;
}

export interface LeaveBalance {
    leaveTypeID: number;
    name: string;
    balanceDays: number;
    defaultQuota: number;
}

export interface CreateLeaveRequestDto {
    leaveTypeID: number;
    startDate: string;
    endDate: string;
    isHalfDayStart: boolean;
    isHalfDayEnd: boolean;
    totalDays: number;
    reason: string;
    attachments?: File[];
}

export interface LeaveRequestListItem {
    leaveRequestID: number;
    leaveTypeID: number;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    status: string;
    requestedDate: string;
}

export interface PagedResult<T> {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    data: T[];
}

export interface LeaveRequestDetail extends LeaveRequestListItem {
    employeeID: number;
    isHalfDayStart: boolean;
    isHalfDayEnd: boolean;
    reason: string;
    attachments: string[];
    leaveType: LeaveType;
}

export interface PrimaryApproverResponse {
    managerName: string;
}

export const leaveService = {
    async getLeaveTypes(): Promise<LeaveType[]> {
        const res = await fetch(`${API_URL}/leave/types`,{
            headers: getAuthHeaders()});
        if (!res.ok) throw new Error('Failed to fetch leave types');
        return res.json();
    },

    async getMyBalances(employeeId: number): Promise<LeaveBalance[]> {
        const res = await fetch(`${API_URL}/leave/balances/${employeeId}`,{
            headers: getAuthHeaders()});
        if (!res.ok) throw new Error('Failed to fetch balances');
        const data = await res.json();
        return data.data;
    },

    async createLeaveRequest(employeeId: number, data: CreateLeaveRequestDto) {
        const formData = new FormData();
        formData.append('leaveTypeID', data.leaveTypeID.toString());
        formData.append('startDate', data.startDate);
        formData.append('endDate', data.endDate);
        formData.append('isHalfDayStart', data.isHalfDayStart.toString());
        formData.append('isHalfDayEnd', data.isHalfDayEnd.toString());
        formData.append('totalDays', data.totalDays.toString());
        formData.append('reason', data.reason || '');

        if (data.attachments) {
            data.attachments.forEach((file: File) => {
                formData.append('attachments', file);
            });
        }

        const res = await fetch(`${API_URL}/leave/request?employeeId=${employeeId}`, {
            method: 'POST',
            headers: getAuthHeaders(true),
            body: formData,
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to create request');
        }
        return res.json();
    },

    async getMyRequests(employeeId: number, options?: {
        status?: string;
        dateRange?: string;
        leaveTypeId?: string;
        page?: number;
        pageSize?: number;
    }): Promise<PagedResult<LeaveRequestListItem>> {
        const params = new URLSearchParams();
        params.append('employeeId', employeeId.toString());
        params.append('page', (options?.page || 1).toString());
        params.append('pageSize', (options?.pageSize || 10).toString());

        if (options?.status && options.status !== 'all') {
            params.append('status', options.status);
        }
        if (options?.dateRange) {
            params.append('dateRange', options.dateRange);
        }
        if (options?.leaveTypeId && options.leaveTypeId !== 'all') {
            params.append('leaveTypeId', options.leaveTypeId);
        }

        const res = await fetch(`${API_URL}/leave/requests?${params.toString()}`,{
            headers: getAuthHeaders()});
        if (!res.ok) throw new Error('Failed to fetch requests');
        return res.json();
    },

    async getLeaveRequestDetail(requestId: number): Promise<LeaveRequestDetail> {
        const res = await fetch(`${API_URL}/leave/leave-requests/${requestId}`,{
            headers: getAuthHeaders()});
        if (!res.ok) throw new Error('Failed to fetch request details');
        return res.json();
    },

    async cancelLeaveRequest(requestId: number) {
        const res = await fetch(`${API_URL}/leave/leave-requests/${requestId}/cancel`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to cancel request');
        }
        return res.json();
    },

    async getPrimaryApprover(employeeId: number): Promise<PrimaryApproverResponse> {
        const res = await fetch(`${API_URL}/leave/primary-approver?employeeId=${employeeId}`,{
            headers: getAuthHeaders()});
        if (!res.ok) {
            throw new Error('Failed to fetch primary approver');
        }
        return res.json();
    }
};
