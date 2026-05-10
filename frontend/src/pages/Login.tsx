import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import '../css/Login.css';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const userData = await login(email, password);
            if (userData.role === 'ADMIN')      navigate('/admin',   { replace: true });
            else if (userData.role === 'TUTOR') navigate('/tutor',   { replace: true });
            else                                navigate('/student', { replace: true });
        } catch (err: any) {
            const data = err.response?.data;
            const msg = (typeof data === 'string' ? data : data?.message || data?.error)
                || err.message
                || 'Đăng nhập thất bại. Kiểm tra lại email và mật khẩu.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <Link to="/" className="login-logo">Kết Nối Gia Sư</Link>
                <p className="login-subtitle">Đăng nhập để tiếp tục</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="example@gmail.com"
                            autoComplete="email"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <PasswordInput
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <div className="forgot-link">
                        <Link to="/forgot-password">Quên mật khẩu?</Link>
                    </div>

                    <button type="submit" disabled={loading} className="login-button">
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="register-link">
                    Chưa có tài khoản?{' '}
                    <Link to="/register/student">Đăng ký học viên</Link>
                    {' · '}
                    <Link to="/register/tutor">Đăng ký gia sư</Link>
                </div>
            </div>
        </div>
    );
}
