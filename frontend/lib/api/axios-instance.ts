import axios from 'axios';

// Lấy URL API từ biến môi trường hoặc mặc định là localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204/api';

export const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// --- REQUEST INTERCEPTOR ---
// Tự động gắn Token vào mỗi request gửi đi
axiosInstance.interceptors.request.use(
    (config) => {
        // Kiểm tra xem code có đang chạy ở trình duyệt không (để tránh lỗi khi render server-side)
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- RESPONSE INTERCEPTOR (Tùy chọn) ---
// Xử lý lỗi chung (ví dụ: Token hết hạn -> tự logout)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Ví dụ: Nếu lỗi 401 (Unauthorized), có thể redirect về trang login
        if (error.response && error.response.status === 401) {
            console.error("Unauthorized! Token might be expired.");
            // window.location.href = '/login'; // Bỏ comment nếu muốn tự động đá về login
        }
        return Promise.reject(error);
    }
);