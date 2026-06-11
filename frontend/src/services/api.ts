import axios from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = 'http://localhost:8080';

const api = axios.create({
    baseURL: BASE_URL + '/api',
    withCredentials: false,
    headers: { 'Content-Type': 'application/json' },
});

/** Chuyển URL tương đối từ backend thành URL đầy đủ */
export function toFullUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return BASE_URL + url;
}

// Gắn JWT token vào request nếu có
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

/** Kiểm tra token có hết hạn chưa */
function isTokenExpired(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // exp tính bằng giây, Date.now() tính bằng ms
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

let redirecting = false; // tránh redirect nhiều lần cùng lúc

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        const status = error.response?.status;
        const message = error.response?.data?.message || error.response?.data || '';

        if (status === 401) {
            console.warn('[401] URL bị từ chối:', url, '| message:', message);

            const isPublic = url.includes('/public/') || url.includes('/auth/') || url.includes('/otp/');
            const hasToken = !!localStorage.getItem('token');

            // Clear token nếu:
            // 1. Token đã hết hạn theo thời gian
            // 2. Hoặc có token nhưng server không nhận (user bị xóa, token invalid...)
            // Không redirect nếu là public endpoint
            if (!isPublic && !redirecting && hasToken) {
                redirecting = true;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
                setTimeout(() => { redirecting = false; window.location.replace('/login'); }, 1500);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
