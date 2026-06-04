import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PasswordInput from '../components/PasswordInput';
import '../css/Dashboard.css';

/**
 * GET  /api/profile/me          → StudentProfileResponse | TutorProfileResponse
 * PUT  /api/profile/student     body: { fullName, phone, address, gradeLevel, learningGoals }
 * PUT  /api/profile/tutor       body: { fullName, phone, gender, dateOfBirth, cccd, cccdIssuedPlace,
 *                                       address, school, major, graduationYear, currentOccupation,
 *                                       strengths, subjects(string), grades(string) }
 * POST /api/auth/change-password body: { oldPassword, newPassword, confirmNewPassword }
 */

export default function ProfilePage() {
    const { user, refreshUser } = useAuth();
    const [tab, setTab] = useState<'profile' | 'password'>('profile');
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    // Password change
    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');

    // Avatar upload (tutor)
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarMsg, setAvatarMsg] = useState('');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get('/profile/me');
            setProfile(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const flash = (text: string, err = false) => {
        setMsg(text); setIsError(err);
        setTimeout(() => setMsg(''), 3000);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (user?.role === 'STUDENT') {
                await api.put('/profile/student', {
                    fullName: profile.fullName,
                    phone: profile.phone,
                    address: profile.address,
                    gradeLevel: profile.gradeLevel,
                    learningGoals: profile.learningGoals,
                });
            } else if (user?.role === 'TUTOR') {
                await api.put('/profile/tutor', {
                    fullName: profile.fullName,
                    phone: profile.phone,
                    gender: profile.gender,
                    dateOfBirth: profile.dateOfBirth,
                    cccd: profile.cccd,
                    cccdIssuedPlace: profile.cccdIssuedPlace,
                    address: profile.address,
                    school: profile.school,
                    major: profile.major,
                    graduationYear: profile.graduationYear,
                    currentOccupation: profile.currentOccupation,
                    strengths: profile.strengths,
                    subjects: profile.subjects,
                    grades: profile.grades,
                    bio: profile.bio,
                });
            }
            flash('✅ Cập nhật hồ sơ thành công!');
            // Fetch lại profile để hiển thị data mới
            await fetchProfile();
            // Cập nhật user trong AuthContext + localStorage (để Header hiển thị tên mới)
            await refreshUser();
        } catch (e: any) {
            flash('❌ ' + (e.response?.data?.message || 'Lỗi cập nhật'), true);
        } finally { setSaving(false); }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPw !== confirmPw) { flash('❌ Mật khẩu xác nhận không khớp!', true); return; }
        setSaving(true);
        try {
            // POST /api/auth/change-password { oldPassword, newPassword, confirmNewPassword }
            await api.post('/auth/change-password', {
                oldPassword: oldPw,
                newPassword: newPw,
                confirmNewPassword: confirmPw,
            });
            flash('✅ Đổi mật khẩu thành công!');
            setOldPw(''); setNewPw(''); setConfirmPw('');
        } catch (e: any) {
            flash('❌ ' + (e.response?.data?.message || 'Lỗi đổi mật khẩu'), true);
        } finally { setSaving(false); }
    };

    const set = (field: string, val: string) => setProfile((p: any) => ({ ...p, [field]: val }));

    const handleUploadAvatar = async () => {
        if (!avatarFile) return;
        setUploadingAvatar(true);
        try {
            const fd = new FormData();
            fd.append('file', avatarFile);
            await api.post('/profile/tutor/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            setAvatarMsg('✅ Cập nhật ảnh thành công!');
            setAvatarFile(null);
            fetchProfile();
        } catch (e: any) {
            setAvatarMsg('❌ ' + (e.response?.data?.message || 'Lỗi upload'));
        } finally { setUploadingAvatar(false); }
    };

    return (
        <div className="dashboard-page">
            <Header />
            <div className="dashboard-layout">
                <aside className="dash-sidebar">
                    <div className="dash-avatar">
                        <div className={`avatar-circle ${user?.role?.toLowerCase()}`}>
                            {user?.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                            <div className="dash-name">{user?.fullName}</div>
                            <div className={`dash-role-badge ${user?.role?.toLowerCase()}`}>
                                {user?.role === 'STUDENT' ? 'Học viên' : user?.role === 'TUTOR' ? 'Gia sư' : 'Admin'}
                            </div>
                        </div>
                    </div>
                    <nav className="dash-nav">
                        <button className={tab === 'profile' ? 'active' : ''} onClick={() => setTab('profile')}>
                            👤 Thông tin cá nhân
                        </button>
                        <button className={tab === 'password' ? 'active' : ''} onClick={() => setTab('password')}>
                            🔑 Đổi mật khẩu
                        </button>
                        <a href={user?.role === 'STUDENT' ? '/student' : user?.role === 'TUTOR' ? '/tutor' : '/admin'}
                            className="dash-nav-link">← Về Dashboard</a>
                    </nav>
                </aside>

                <main className="dash-main">
                    {msg && (
                        <div className={isError ? 'alert alert-error' : 'flash-msg'} style={{ marginBottom: '1rem' }}>
                            {msg}
                        </div>
                    )}

                    {loading ? <div className="loading-spinner">Đang tải...</div> : (
                        <>
                            {tab === 'profile' && profile && (
                                <form onSubmit={handleSaveProfile}>
                                    <h2 className="dash-title">Thông tin cá nhân</h2>
                                    <div className="profile-grid">
                                        <div className="form-group">
                                            <label>Họ và tên</label>
                                            <input value={profile.fullName || ''} onChange={e => set('fullName', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Email</label>
                                            <input value={profile.email || ''} disabled style={{ background: '#f8fafc', color: '#94a3b8' }} />
                                        </div>
                                        <div className="form-group">
                                            <label>Số điện thoại</label>
                                            <input value={profile.phone || ''} onChange={e => set('phone', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Địa chỉ</label>
                                            <input value={profile.address || ''} onChange={e => set('address', e.target.value)} />
                                        </div>

                                        {user?.role === 'STUDENT' && (
                                            <>
                                                <div className="form-group">
                                                    <label>Cấp lớp</label>
                                                    <select value={profile.gradeLevel || ''} onChange={e => set('gradeLevel', e.target.value)}>
                                                        <option value="">-- Chọn --</option>
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
                                                        <optgroup label="Ngoại ngữ">
                                                            <option value="Tiếng Anh">Tiếng Anh</option>
                                                            <option value="Tiếng Trung">Tiếng Trung</option>
                                                            <option value="Tiếng Nhật">Tiếng Nhật</option>
                                                            <option value="IELTS">IELTS</option>
                                                            <option value="TOEIC">TOEIC</option>
                                                        </optgroup>
                                                    </select>
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Mục tiêu học tập</label>
                                                    <textarea rows={3} value={profile.learningGoals || ''} onChange={e => set('learningGoals', e.target.value)} />
                                                </div>
                                            </>
                                        )}

                                        {user?.role === 'TUTOR' && (
                                            <>
                                                <div className="form-group">
                                                    <label>Giới tính</label>
                                                    <select value={profile.gender || ''} onChange={e => set('gender', e.target.value)}>
                                                        <option value="">-- Chọn --</option>
                                                        <option value="Nam">Nam</option>
                                                        <option value="Nữ">Nữ</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Trường học</label>
                                                    <input value={profile.school || ''} onChange={e => set('school', e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Chuyên ngành</label>
                                                    <input value={profile.major || ''} onChange={e => set('major', e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label>Nghề nghiệp</label>
                                                    <input value={profile.currentOccupation || ''} onChange={e => set('currentOccupation', e.target.value)} />
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>Kinh nghiệm & Ưu điểm</label>
                                                    <textarea rows={3} value={profile.strengths || ''} onChange={e => set('strengths', e.target.value)} />
                                                </div>
                                                <div className="form-group full-width">
                                                    <label>👋 Giới thiệu bản thân <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 400 }}>(hiển thị công khai cho học viên)</span></label>
                                                    <textarea rows={5} value={profile.bio || ''} onChange={e => set('bio', e.target.value)}
                                                        placeholder="Ví dụ: Xin chào! Tôi là gia sư Toán với 5 năm kinh nghiệm, từng dạy nhiều học sinh đạt điểm cao trong kỳ thi THPT. Phương pháp của tôi tập trung vào hiểu bản chất thay vì học thuộc lòng..." />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '1rem' }}>
                                        {saving ? 'Đang lưu...' : '💾 Lưu thay đổi'}
                                    </button>

                                    {user?.role === 'TUTOR' && (
                                        <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1.5px solid #e2e8f0' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.75rem' }}>📸 Ảnh đại diện</h3>
                                            {profile.avatarUrl && (
                                                <img
                                                    src={`http://localhost:8080/api/materials/download/${profile.avatarUrl}`}
                                                    alt="avatar"
                                                    style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', marginBottom: '0.75rem', border: '3px solid #4f46e5' }}
                                                />
                                            )}
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <input type="file" accept="image/*"
                                                    onChange={e => setAvatarFile(e.target.files?.[0] || null)}
                                                    style={{ fontSize: '0.88rem' }} />
                                                <button type="button" className="btn-primary" onClick={handleUploadAvatar}
                                                    disabled={!avatarFile || uploadingAvatar}
                                                    style={{ padding: '8px 16px', fontSize: '0.88rem' }}>
                                                    {uploadingAvatar ? 'Đang upload...' : '📤 Cập nhật ảnh'}
                                                </button>
                                            </div>
                                            {avatarMsg && <p style={{ fontSize: '0.82rem', marginTop: '6px', color: avatarMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{avatarMsg}</p>}
                                        </div>
                                    )}
                                </form>
                            )}

                            {tab === 'password' && (
                                <form onSubmit={handleChangePassword}>
                                    <h2 className="dash-title">Đổi mật khẩu</h2>
                                    <div className="profile-grid" style={{ maxWidth: 480 }}>
                                        <div className="form-group full-width">
                                            <label>Mật khẩu hiện tại *</label>
                                            <PasswordInput value={oldPw} onChange={e => setOldPw(e.target.value)} required placeholder="Mật khẩu hiện tại" autoComplete="current-password" />
                                        </div>
                                        <div className="form-group">
                                            <label>Mật khẩu mới *</label>
                                            <PasswordInput value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={6} placeholder="Tối thiểu 6 ký tự" autoComplete="new-password" />
                                        </div>
                                        <div className="form-group">
                                            <label>Xác nhận mật khẩu mới *</label>
                                            <PasswordInput value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="Nhập lại mật khẩu mới" autoComplete="new-password" />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '1rem' }}>
                                        {saving ? 'Đang xử lý...' : '🔑 Đổi mật khẩu'}
                                    </button>
                                </form>
                            )}
                        </>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
}
