import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

type Role = 'ADMIN' | 'TUTOR' | 'STUDENT';

export type User = {
    id: number;
    email: string;
    fullName: string;
    role: Role;
    phone?: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    refreshUser: () => Promise<void>; // cập nhật lại user từ BE
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function decodeJwt(token: string): any {
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch {
        return null;
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<User> => {
        const loginRes = await api.post('/auth/login', { email, password });
        const token: string = loginRes.data.token;
        if (!token) {
            throw new Error(loginRes.data.message || 'Đăng nhập thất bại');
        }

        const claims = decodeJwt(token);
        if (!claims || !claims.role) {
            throw new Error('Token không hợp lệ');
        }

        // Tạm thời dùng email làm fullName, sẽ fetch /auth/me để lấy tên thật
        let userData: User = {
            id: Number(claims.userId),
            email: claims.sub,
            fullName: claims.sub, // email tạm
            role: claims.role as Role,
        };

        localStorage.setItem('token', token);

        // Fetch fullName thật từ /auth/me — truyền token trực tiếp
        try {
            const meRes = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            userData = { ...userData, ...meRes.data };
        } catch {
            // Nếu fail thì vẫn dùng userData từ token
        }

        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.replace('/login');
    };

    // Fetch lại thông tin user từ BE và cập nhật localStorage + state
    const refreshUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const updated: User = res.data;
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
        } catch (e) {
            console.error('refreshUser failed:', e);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};
