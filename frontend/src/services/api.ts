import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    withCredentials: false,
    headers: { 'Content-Type': 'application/json' },
});

// Gắn JWT token vào request nếu có
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Chỉ redirect login khi 401 VÀ đang ở trang cần auth (không phải public)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        const isPublic = url.includes('/public/') || url.includes('/auth/') || url.includes('/otp/');

        if (error.response?.status === 401 && !isPublic) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default api;
