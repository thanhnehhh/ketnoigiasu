import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PasswordInput from '../components/PasswordInput';
import '../css/RegisterStudent.css';

/**
 * Flow đúng theo BE:
 * Bước 1 — Nhập email → POST /api/otp/send { email, role: "STUDENT" }
 * Bước 2 — Nhập OTP + thông tin + mật khẩu → POST /api/otp/verify/student
 *   body: { email, otp, password, confirmPassword,
 *           registerData: { fullName, phone, address, gradeLevel, learningGoals } }
 * Kết quả: BE trả { token, message } → lưu token → GET /auth/me → redirect /student
 */

type Step = 'email' | 'info';

export default function RegisterStudent() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Bước 1
    const [email, setEmail] = useState('');

    // Bước 2 — registerData + otp + password
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [learningGoals, setLearningGoals] = useState('');

    /* ---- BƯỚC 1: gửi OTP ---- */
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/otp/send', { email, role: 'STUDENT' });
            setSuccessMsg(res.data.message || 'OTP đã gửi! Kiểm tra hộp thư của bạn.');
            setStep('info');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không gửi được OTP. Thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    /* ---- BƯỚC 2: verify OTP + đăng ký ---- */
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }
        setLoading(true);
        try {
            const res = await api.post('/otp/verify/student', {
                email,
                otp,
                password,
                confirmPassword,
                registerData: { fullName, phone, address, gradeLevel, learningGoals },
            });

            // BE trả { token, message }
            const token: string = res.data.token;
            localStorage.setItem('token', token);
            const meRes = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            localStorage.setItem('user', JSON.stringify(meRes.data));

            setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
            setTimeout(() => navigate('/student'), 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại. Kiểm tra lại OTP hoặc thông tin.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-student-page">
            <div className="register-container">
                <Link to="/" className="back-to-home">← Trang chủ</Link>
                <h1 className="register-title">Đăng ký Học viên</h1>
                <p className="register-subtitle">Tạo tài khoản để tìm gia sư phù hợp</p>

                {/* Step indicator */}
                <div className="step-indicator">
                    <div className={`step ${step === 'email' ? 'active' : 'done'}`}>
                        <span>{step === 'email' ? '1' : '✓'}</span> Xác thực email
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'info' ? 'active' : ''}`}>
                        <span>2</span> Thông tin & OTP
                    </div>
                </div>

                {error   && <div className="alert alert-error">{error}</div>}
                {successMsg && step === 'email' && <div className="alert alert-success">{successMsg}</div>}

                {/* ===== BƯỚC 1: CHỈ NHẬP EMAIL ===== */}
                {step === 'email' && (
                    <form onSubmit={handleSendOtp}>
                        <div className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                            <label>Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="example@gmail.com"
                                autoFocus
                            />
                            <p className="field-hint">Mã OTP sẽ được gửi đến email này</p>
                        </div>
                        <button type="submit" className="register-button" disabled={loading}>
                            {loading ? 'Đang gửi OTP...' : '📧 Gửi mã OTP'}
                        </button>
                        <div className="back-link">
                            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                            {' · '}
                            <Link to="/register/tutor">Đăng ký gia sư</Link>
                        </div>
                    </form>
                )}

                {/* ===== BƯỚC 2: OTP + THÔNG TIN + MẬT KHẨU ===== */}
                {step === 'info' && (
                    <form onSubmit={handleRegister}>
                        <div className="otp-sent-notice">
                            📧 OTP đã gửi đến <strong>{email}</strong> — kiểm tra hộp thư (kể cả Spam)
                        </div>

                        <div className="form-section-title">Mã xác thực & Mật khẩu</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Mã OTP *</label>
                                <input
                                    className="otp-field"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    maxLength={6}
                                    placeholder="Nhập 6 chữ số"
                                    autoComplete="off"
                                    autoFocus
                                    inputMode="numeric"
                                />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu *</label>
                                <PasswordInput
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Tối thiểu 6 ký tự"
                                    autoComplete="new-password"
                                />
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu *</label>
                                <PasswordInput
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Nhập lại mật khẩu"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="form-section-title">Thông tin cá nhân</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Họ và tên *</label>
                                <input
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                    placeholder="Nguyễn Văn A"
                                    autoComplete="name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại *</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    required
                                    placeholder="0912345678"
                                    autoComplete="tel"
                                />
                            </div>
                            <div className="form-group">
                                <label>Cấp lớp *</label>
                                <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} required>
                                    <option value="">-- Chọn cấp lớp --</option>
                                    <optgroup label="Tiểu học">
                                        <option value="Lớp 1">Lớp 1</option>
                                        <option value="Lớp 2">Lớp 2</option>
                                        <option value="Lớp 3">Lớp 3</option>
                                        <option value="Lớp 4">Lớp 4</option>
                                        <option value="Lớp 5">Lớp 5</option>
                                    </optgroup>
                                    <optgroup label="THCS">
                                        <option value="Lớp 6">Lớp 6</option>
                                        <option value="Lớp 7">Lớp 7</option>
                                        <option value="Lớp 8">Lớp 8</option>
                                        <option value="Lớp 9">Lớp 9</option>
                                    </optgroup>
                                    <optgroup label="THPT">
                                        <option value="Lớp 10">Lớp 10</option>
                                        <option value="Lớp 11">Lớp 11</option>
                                        <option value="Lớp 12">Lớp 12</option>
                                    </optgroup>
                                    <optgroup label="Khác">
                                        <option value="Tiếng Anh giao tiếp">Tiếng Anh giao tiếp</option>
                                        <option value="Tiếng Trung">Tiếng Trung</option>
                                        <option value="Tiếng Nhật">Tiếng Nhật</option>
                                        <option value="IELTS/TOEIC">IELTS / TOEIC</option>
                                    </optgroup>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label>Địa chỉ *</label>
                                <input
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    required
                                    placeholder="Quận 1, TP.HCM"
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Mục tiêu học tập *</label>
                                <textarea
                                    value={learningGoals}
                                    onChange={e => setLearningGoals(e.target.value)}
                                    required
                                    rows={3}
                                    placeholder="Ví dụ: Cải thiện tiếng Anh giao tiếp, ôn thi IELTS 6.5..."
                                />
                            </div>
                        </div>

                        <button type="submit" className="register-button" disabled={loading}>
                            {loading ? 'Đang đăng ký...' : '✅ Hoàn tất đăng ký'}
                        </button>
                        <button
                            type="button"
                            className="btn-back"
                            onClick={() => { setStep('email'); setError(''); setSuccessMsg(''); setOtp(''); }}
                        >
                            ← Đổi email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
