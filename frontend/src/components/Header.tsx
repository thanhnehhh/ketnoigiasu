import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../css/Header.css';

const Header = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();

    const dashboardPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'TUTOR' ? '/tutor' : '/student';

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <div className="logo-icon">K</div>
                    <h1>Kết Nối Gia Sư</h1>
                </Link>

                <nav className="main-nav">
                    <Link to="/">Trang chủ</Link>
                    <Link to="/courses">Tìm khóa học</Link>
                    <Link to="/tutors">Gia sư</Link>
                </nav>

                <div className="auth-buttons">
                    {isAuthenticated ? (
                        <div className="user-logged-in">
                            <Link to={dashboardPath} className="btn-dashboard">
                                👤 {user?.fullName?.split(' ').pop()}
                            </Link>
                            <Link to="/profile" className="btn-dashboard" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                                ⚙️ Hồ sơ
                            </Link>
                            <button onClick={logout} className="btn-logout">Đăng xuất</button>
                        </div>
                    ) : (
                        <>
                            <Link to="/login" className="btn-login">Đăng nhập</Link>
                            <div
                                className="register-dropdown"
                                onMouseEnter={() => setShowDropdown(true)}
                                onMouseLeave={() => setShowDropdown(false)}
                            >
                                <button className="btn-register">Đăng ký</button>
                                {showDropdown && (
                                    <div className="dropdown-menu">
                                        <Link to="/register/student" className="dropdown-item">🎓 Đăng ký học viên</Link>
                                        <Link to="/register/tutor" className="dropdown-item">👨‍🏫 Đăng ký gia sư</Link>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
