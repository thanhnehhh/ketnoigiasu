import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import PasswordInput from '../components/PasswordInput';
import { VIETNAM_PROVINCES, getDistricts } from '../data/vietnamDistricts';
import '../css/RegisterTutor.css';

/**
 * Flow đúng theo BE:
 * Bước 1 — Nhập email → POST /api/otp/send { email, role: "TUTOR" }
 * Bước 2 — Nhập OTP + thông tin + mật khẩu → POST /api/otp/verify/tutor
 *   body: { email, otp, password, confirmPassword,
 *           registerData: { fullName, gender, dateOfBirth, cccd, cccdIssuedPlace,
 *                           address, phone, school, major, graduationYear,
 *                           currentOccupation, strengths, subjects[], grades[] } }
 */

type Step = 'email' | 'info';

const SUBJECTS = ['Toán', 'Lý', 'Hóa', 'Văn', 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'IELTS', 'TOEIC', 'Lịch sử', 'Địa lý', 'Sinh học', 'Tin học'];
const GRADES   = [...Array.from({ length: 12 }, (_, i) => `Lớp ${i + 1}`), 'Ngoại ngữ'];

export default function RegisterTutor() {
    const navigate = useNavigate();
    const [step, setStep]       = useState<Step>('email');
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Bước 1
    const [email, setEmail] = useState('');

    // Bước 2 — credentials
    const [otp, setOtp]                       = useState('');
    const [password, setPassword]             = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Bước 2 — registerData (khớp RegisterTutorRequest)
    const [fullName, setFullName]               = useState('');
    const [gender, setGender]                   = useState('');
    const [dateOfBirth, setDateOfBirth]         = useState('');
    const [cccd, setCccd]                       = useState('');
    const [cccdIssuedPlace, setCccdIssuedPlace] = useState('');
    const [addrProvince, setAddrProvince]       = useState('');
    const [addrDistrict, setAddrDistrict]       = useState('');
    const [addrDetail, setAddrDetail]           = useState('');
    const [phone, setPhone]                     = useState('');
    const [school, setSchool]                   = useState('');
    const [major, setMajor]                     = useState('');
    const [graduationYear, setGraduationYear]   = useState('');
    const [currentOccupation, setCurrentOccupation] = useState('');
    const [strengths, setStrengths]             = useState('');
    const [subjects, setSubjects]               = useState<string[]>([]);
    const [grades, setGrades]                   = useState<string[]>([]);
    const [teachingMode, setTeachingMode]       = useState('BOTH');

    const toggle = (list: string[], setList: (v: string[]) => void, val: string) => {
        setList(list.includes(val) ? list.filter(v => v !== val) : [...list, val]);
    };

    /* ---- BƯỚC 1 ---- */
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/otp/send', { email, role: 'TUTOR' });
            setSuccessMsg(res.data.message || 'OTP đã gửi! Kiểm tra hộp thư.');
            setStep('info');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không gửi được OTP.');
        } finally {
            setLoading(false);
        }
    };

    /* ---- BƯỚC 2 ---- */
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) { setError('Mật khẩu xác nhận không khớp!'); return; }
        if (subjects.length === 0) { setError('Chọn ít nhất 1 môn dạy'); return; }
        if (grades.length === 0)   { setError('Chọn ít nhất 1 lớp dạy'); return; }
        setLoading(true);
        try {
            const res = await api.post('/otp/verify/tutor', {
                email,
                otp,
                password,
                confirmPassword,
                registerData: {
                    fullName,
                    gender,
                    dateOfBirth: dateOfBirth || null,
                    cccd,
                    cccdIssuedPlace,
                    address: [addrDetail, addrDistrict, addrProvince].filter(Boolean).join(', '),
                    email,
                    phone,
                    school,
                    major,
                    graduationYear: graduationYear ? parseInt(graduationYear) : null,
                    currentOccupation,
                    strengths,
                    subjects,
                    grades,
                    teachingMode,
                },
            });

            const token: string = res.data.token;
            localStorage.setItem('token', token);
            const meRes = await api.get('/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            localStorage.setItem('user', JSON.stringify(meRes.data));

            setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
            setTimeout(() => navigate('/tutor'), 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Đăng ký thất bại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-tutor-page">
            <div className="register-container">
                <Link to="/" className="back-to-home">← Trang chủ</Link>
                <h1 className="register-title">Đăng ký làm Gia sư</h1>
                <p className="register-subtitle">Điền đầy đủ thông tin để bắt đầu dạy học</p>

                <div className="step-indicator">
                    <div className={`step ${step === 'email' ? 'active' : 'done'}`}>
                        <span>{step === 'email' ? '1' : '✓'}</span> Xác thực email
                    </div>
                    <div className="step-line" />
                    <div className={`step ${step === 'info' ? 'active' : ''}`}>
                        <span>2</span> Thông tin & OTP
                    </div>
                </div>

                {error      && <div className="alert alert-error">{error}</div>}
                {successMsg && step === 'email' && <div className="alert alert-success">{successMsg}</div>}

                {/* ===== BƯỚC 1 ===== */}
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
                            <Link to="/register/student">Đăng ký học viên</Link>
                        </div>
                    </form>
                )}

                {/* ===== BƯỚC 2 ===== */}
                {step === 'info' && (
                    <form onSubmit={handleRegister}>
                        <div className="otp-sent-notice">
                            📧 OTP đã gửi đến <strong>{email}</strong> — kiểm tra hộp thư (kể cả Spam)
                        </div>

                        {/* OTP + MẬT KHẨU */}
                        <div className="form-section-title">Mã xác thực & Mật khẩu</div>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Mã OTP *</label>
                                <input className="otp-field" value={otp} onChange={e => setOtp(e.target.value)}
                                    required maxLength={6} placeholder="_ _ _ _ _ _" autoFocus />
                            </div>
                            <div className="form-group">
                                <label>Mật khẩu *</label>
                                <PasswordInput value={password} onChange={e => setPassword(e.target.value)}
                                    required minLength={6} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
                            </div>
                            <div className="form-group">
                                <label>Xác nhận mật khẩu *</label>
                                <PasswordInput value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                    required placeholder="Nhập lại mật khẩu" autoComplete="new-password" />
                            </div>
                        </div>

                        {/* THÔNG TIN CÁ NHÂN */}
                        <div className="form-section-title">Thông tin cá nhân</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Họ và tên *</label>
                                <input value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Nguyễn Văn A" />
                            </div>
                            <div className="form-group">
                                <label>Giới tính *</label>
                                <select value={gender} onChange={e => setGender(e.target.value)} required>
                                    <option value="">-- Chọn --</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Số điện thoại *</label>
                                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="0912345678" />
                            </div>
                            <div className="form-group">
                                <label>Ngày sinh</label>
                                <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Số CCCD *</label>
                                <input value={cccd} onChange={e => setCccd(e.target.value)} required placeholder="012345678901" />
                            </div>
                            <div className="form-group">
                                <label>Nơi cấp CCCD *</label>
                                <input value={cccdIssuedPlace} onChange={e => setCccdIssuedPlace(e.target.value)} required placeholder="Cục CS QLHC về TTXH" />
                            </div>
                            <div className="form-group full-width">
                                <label>Tỉnh / Thành phố *</label>
                                <select value={addrProvince} onChange={e => { setAddrProvince(e.target.value); setAddrDistrict(''); }} required>
                                    <option value="">-- Chọn tỉnh/thành --</option>
                                    {VIETNAM_PROVINCES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            {addrProvince && (
                                <div className="form-group full-width">
                                    <label>Quận / Huyện *</label>
                                    <select value={addrDistrict} onChange={e => setAddrDistrict(e.target.value)} required>
                                        <option value="">-- Chọn quận/huyện --</option>
                                        {getDistricts(addrProvince).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="form-group full-width">
                                <label>Số nhà, đường, phường</label>
                                <input value={addrDetail} onChange={e => setAddrDetail(e.target.value)}
                                    placeholder="Ví dụ: 123 Lê Lợi, P. Bến Nghé" />
                            </div>
                        </div>

                        {/* HỌC VẤN & KINH NGHIỆM */}
                        <div className="form-section-title">Học vấn & Kinh nghiệm</div>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Trường học / Nơi công tác</label>
                                <input value={school} onChange={e => setSchool(e.target.value)} placeholder="Đại học Sư Phạm TP.HCM" />
                            </div>
                            <div className="form-group">
                                <label>Chuyên ngành</label>
                                <input value={major} onChange={e => setMajor(e.target.value)} placeholder="Sư phạm Toán" />
                            </div>
                            <div className="form-group">
                                <label>Năm tốt nghiệp</label>
                                <input type="number" value={graduationYear} onChange={e => setGraduationYear(e.target.value)} placeholder="2020" min="1990" max="2030" />
                            </div>
                            <div className="form-group">
                                <label>Nghề nghiệp hiện tại</label>
                                <input value={currentOccupation} onChange={e => setCurrentOccupation(e.target.value)} placeholder="Giáo viên / Sinh viên..." />
                            </div>
                            <div className="form-group full-width">
                                <label>Kinh nghiệm & Ưu điểm *</label>
                                <textarea value={strengths} onChange={e => setStrengths(e.target.value)} required rows={3}
                                    placeholder="Ví dụ: 3 năm kinh nghiệm dạy Toán lớp 10-12, phương pháp dễ hiểu..." />
                            </div>
                        </div>

                        {/* MÔN DẠY */}
                        <div className="form-section-title">
                            Môn dạy * <span className="hint">(chọn ít nhất 1)</span>
                        </div>
                        <div className="checkbox-grid" style={{ marginBottom: '1.5rem' }}>
                            {SUBJECTS.map(s => (
                                <label key={s} className={`checkbox-item ${subjects.includes(s) ? 'checked' : ''}`}>
                                    <input type="checkbox" checked={subjects.includes(s)} onChange={() => toggle(subjects, setSubjects, s)} />
                                    {s}
                                </label>
                            ))}
                        </div>

                        {/* LỚP DẠY */}
                        <div className="form-section-title">
                            Lớp dạy * <span className="hint">(chọn ít nhất 1)</span>
                        </div>
                        <div className="checkbox-grid" style={{ marginBottom: '1.5rem' }}>
                            {GRADES.map(g => (
                                <label key={g} className={`checkbox-item ${grades.includes(g) ? 'checked' : ''}`}>
                                    <input type="checkbox" checked={grades.includes(g)} onChange={() => toggle(grades, setGrades, g)} />
                                    {g}
                                </label>
                            ))}
                        </div>

                        {/* HÌNH THỨC DẠY */}
                        <div className="form-section-title">Hình thức dạy *</div>
                        <div className="checkbox-grid" style={{ marginBottom: '1.5rem' }}>
                            {[
                                { value: 'ONLINE',  label: '🌐 Online (dạy qua mạng)' },
                                { value: 'OFFLINE', label: '🏠 Offline (dạy tại nhà)' },
                                { value: 'BOTH',    label: '🌐🏠 Cả hai hình thức' },
                            ].map(opt => (
                                <label key={opt.value} className={`checkbox-item ${teachingMode === opt.value ? 'checked' : ''}`}
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setTeachingMode(opt.value)}>
                                    <input type="radio" name="teachingMode" value={opt.value}
                                        checked={teachingMode === opt.value}
                                        onChange={() => setTeachingMode(opt.value)} />
                                    {opt.label}
                                </label>
                            ))}
                        </div>

                        <button type="submit" className="register-button" disabled={loading}>
                            {loading ? 'Đang đăng ký...' : '✅ Hoàn tất đăng ký'}
                        </button>
                        <button type="button" className="btn-back"
                            onClick={() => { setStep('email'); setError(''); setSuccessMsg(''); setOtp(''); }}>
                            ← Đổi email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
