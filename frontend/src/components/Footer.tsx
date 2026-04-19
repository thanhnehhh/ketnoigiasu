import '../css/Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-logo">Kết Nối Gia Sư</div>

                <div className="footer-links">
                    <a href="#">Điều khoản</a>
                    <a href="#">Bảo mật</a>
                    <a href="#">Liên hệ</a>
                    <a href="#">Hỗ trợ</a>
                </div>

                <div className="footer-copyright">
                    © 2026 Kết Nối Gia Sư - Trao tri thức, gửi niềm tin. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;