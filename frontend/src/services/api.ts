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

        if (status === 401) {
            console.warn('[401] URL bị từ chối:', url);

            const isPublic = url.includes('/public/') || url.includes('/auth/') || url.includes('/otp/');

            // Chỉ redirect khi token thực sự hết hạn, không phải lỗi permission
            if (!isPublic && !redirecting && isTokenExpired()) {
                redirecting = true;
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                setTimeout(() => window.location.replace('/login'), 1500);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
