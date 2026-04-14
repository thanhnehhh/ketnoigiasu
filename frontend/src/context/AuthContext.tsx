import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

type Role = 'ADMIN' | 'TUTOR' | 'STUDENT';

type User = {
    id: number;
    email: string;
    fullName: string;
    role: Role;
    phone?: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user từ localStorage khi app khởi động
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (e) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const res = await api.post('/auth/login', { email, password });

            const { token, ...userData } = res.data;

            // Lưu vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);

            // Redirect theo role
            if (userData.role === 'ADMIN') {
                window.location.href = '/admin';
            } else if (userData.role === 'TUTOR') {
                window.location.href = '/tutor';
            } else {
                window.location.href = '/student';
            }
        } catch (error: any) {
            console.error("Login error:", error.response?.data || error.message);
            throw error;
        }
    };

    const register = async (data: any) => {
        try {
            await api.post('/auth/register', data);
            // Sau khi đăng ký thành công → chuyển sang trang login
            window.location.href = '/login';
        } catch (error: any) {
            console.error("Register error:", error.response?.data || error.message);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};