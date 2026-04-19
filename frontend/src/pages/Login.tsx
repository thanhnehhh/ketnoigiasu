import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import '../css/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-logo">Kết Nối Gia Sư</div>
                <p className="login-subtitle">Đăng nhập để tiếp tục</p>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-button"
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>

                <div className="register-link">
                    Chưa có tài khoản?{' '}
                    <Link to="/register">Đăng ký ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;