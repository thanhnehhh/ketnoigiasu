import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PasswordInput from '../components/PasswordInput';
import '../css/RegisterStudent.css';

/**
 * Quên mật khẩu — 2 bước:
 * Bước 1: Nhập email → POST /api/otp/forgot-password/send { email }
 * Bước 2: Nhập OTP + mật khẩu mới → POST /api/otp/forgot-password/reset
 *   body: { email, otp, newPassword }
 */
type Step = 'email' | 'reset';

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNew, setConfirmNew] = useState('');

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const res = await api.post('/otp/forgot-password/send', { email });
            setSuccessMsg(res.data.message || 'OTP đã gửi! Kiểm tra hộp thư.');
            setStep('reset');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email không tồn tại trong hệ thống.');
        } finally { setLoading(false); }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirmNew) { setError('Mật khẩu xác nhận không khớp!'); return; }
        if (newPassword.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự!'); return; }
        setLoading(true);
        try {
            // POST /api/otp/forgot-password/reset body: { email, otp, newPassword }
            const res = await api.post('/otp/forgot-password/reset', { email, otp, newPassword });
            setSuccessMsg(res.data.message || 'Đặt lại mật khẩu thành công!');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err: any) {
            setError(err.response?.data?.message || 'OTP không đúng hoặc đã hết hạn.');
        } finally { setLoading(false); }
    };

    return (
        <div className="register-student-page">
            <div className="register-container" style={{ maxWidth: 480 }}>
                <Link to="/login" className="back-to-home">← Quay lại đăng nhập</Link>
                <h1 className="register-title">Quên mật khẩu</h1>
                <p className="register-subtitle">Nhập email để nhận mã OTP đặt lại mật khẩu</p>

                <div className="step-indicator">
                    <div className={`step ${step === 'email' ? 'active' : 'done'}`}>
                        <span>{step === 'email' ? '1' : '✓'}</span> Xác thực email
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'reset' ? 'active' : ''}`}>
                        <span>2</span> Đặt lại mật khẩu
                    </div>
                </div>

                {error      && <div className="alert alert-error">{error}</div>}
                {successMsg && <div className="alert alert-success">{successMsg}</div>}

                {step === 'email' && (
                    <form onSubmit={handleSendOtp}>
                        <div className="form-group full-width" style={{ marginBottom: '1.5rem' }}>
                            <label>Email đã đăng ký *</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                required placeholder="example@gmail.com" autoFocus />
                        </div>
                        <button type="submit" className="register-button" disabled={loading}>
                            {loading ? 'Đang gửi...' : '📧 Gửi mã OTP'}
                        </button>
                    </form>
                )}

                {step === 'reset' && (
                    <form onSubmit={handleReset}>
                        <div className="otp-sent-notice">
                            📧 OTP đã gửi đến <strong>{email}</strong>
                        </div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Mã OTP *</label>
                                <input className="otp-field" value={otp} onChange={e => setOtp(e.target.value)}
                                    required maxLength={6} placeholder="_ _ _ _ _ _" autoFocus />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu mới *</label>
                                <PasswordInput value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                    required minLength={6} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu *</label>
                                <PasswordInput value={confirmNew} onChange={e => setConfirmNew(e.target.value)}
                                    required placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
                            </div>
                        </div>
                        <button type="submit" className="register-button" disabled={loading}>
                            {loading ? 'Đang xử lý...' : '🔑 Đặt lại mật khẩu'}
                        </button>
                        <button type="button" className="btn-back"
                            onClick={() => { setStep('email'); setError(''); setSuccessMsg(''); }}>
                            ← Đổi email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
