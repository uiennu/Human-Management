// Hàm lấy token từ localStorage hoặc cookie (tùy cách bạn lưu)
const getAuthHeader = () => {
    // Giả sử bạn lưu token trong localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

const BASE_URL = 'http://localhost:5000/api'; // Thay port backend của bạn vào đây

export const employeeService = {
    // 1. Lấy thông tin profile
    getProfile: async () => {
        const res = await fetch(`${BASE_URL}/employees/me`, {
            headers: getAuthHeader(),
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
    },

    // 2. Cập nhật thông tin cơ bản
    updateBasicInfo: async (data: any) => {
        const res = await fetch(`${BASE_URL}/employees/me/basic-info`, {
            method: 'PUT',
            headers: getAuthHeader(),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update basic info');
        return res.json();
    },

    // 3. Yêu cầu cập nhật nhạy cảm (Gửi CMND/Bank mới để lấy requestId)
    requestSensitiveUpdate: async (data: any) => {
        const res = await fetch(`${BASE_URL}/employees/me/sensitive-update-requests`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify(data),
        });
        // Xử lý các lỗi 400, 401 tùy ý
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Error requesting update');
        }
        return res.json(); // Trả về { requestId, message, ... }
    },

    // 4. Xác thực OTP
    verifyOtp: async (requestId: string, otpCode: string) => {
        const res = await fetch(`${BASE_URL}/employees/me/sensitive-update-requests/verify`, {
            method: 'POST',
            headers: getAuthHeader(),
            body: JSON.stringify({ requestId, otpCode }),
        });
        if (!res.ok) throw new Error('OTP verification failed');
        return res.json();
    }
};