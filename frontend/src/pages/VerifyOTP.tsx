import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../css/VerifyOTP.css';

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(60);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email || 'example@email.com';   // Nhận email từ trang đăng ký

    // Đếm ngược thời gian
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Giả lập kiểm tra OTP (sau này sẽ gọi API)
        setTimeout(() => {
            if (otp === '123456') {
                alert("Xác thực thành công! Chào mừng bạn đến với Kết Nối Gia Sư.");
                navigate('/');   // Về trang Home
            } else {
                setError('Mã xác nhận không đúng hoặc đã hết hạn!');
            }
            setLoading(false);
        }, 800);
    };

    const handleResend = () => {
        setTimer(60);
        setOtp('');
        setError('');
        alert(`Đã gửi lại mã xác nhận đến ${email}`);
    };

    return (
        <div className="verify-otp-page">
            <div className="verify-container">
                <h1 className="verify-title">Xác nhận Email</h1>
                <p className="verify-subtitle">
                    Chúng tôi đã gửi mã xác nhận 6 số đến<br />
                    <strong>{email}</strong>
                </p>

                <div className="email-info">
                    Vui lòng kiểm tra hộp thư đến hoặc thư rác
                </div>

                {error && <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

                <form onSubmit={handleVerify}>
                    <input
                        type="text"
                        className="otp-input"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        placeholder="Nhập 6 số"
                        required
                    />

                    <div className="timer">
                        Mã có hiệu lực trong: <strong>{timer} giây</strong>
                    </div>

                    <button
                        type="submit"
                        className="verify-button"
                        disabled={loading || timer === 0}
                    >
                        {loading ? 'Đang xác thực...' : 'Xác nhận'}
                    </button>
                </form>

                {timer === 0 && (
                    <p className="resend-btn" onClick={handleResend}>
                        Gửi lại mã xác nhận
                    </p>
                )}

                <p style={{ marginTop: '2rem', color: '#6b7280' }}>
                    Chưa nhận được mã? Kiểm tra thư rác hoặc{' '}
                    <span className="resend-btn" onClick={handleResend}>gửi lại</span>
                </p>
            </div>
        </div>
    );
};

export default VerifyOTP;