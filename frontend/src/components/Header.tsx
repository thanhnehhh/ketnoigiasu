import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../css/Header.css';

const Header = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState<{ name: string } | null>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setIsLoggedIn(true);
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        window.location.reload();
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <div className="logo-icon">K</div>
                    <h1>Kết Nối Gia Sư</h1>
                </Link>

                <nav className="main-nav">
                    <Link to="/">Trang chủ</Link>
                    <Link to="/search">Tìm gia sư</Link>
                    <Link to="/tutor/register">Trở thành gia sư</Link>
                </nav>

                <div className="auth-buttons">
                    {isLoggedIn ? (
                        <div className="user-logged-in">
                            <span className="welcome-msg">Chào, <strong>{user?.name}</strong></span>
                            <button onClick={handleLogout} className="btn-logout">Đăng xuất</button>
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
                                        <Link to="/register/student" className="dropdown-item">Đăng kí học viên</Link>
                                        <Link to="/register/tutor" className="dropdown-item">Đăng kí gia sư</Link>
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