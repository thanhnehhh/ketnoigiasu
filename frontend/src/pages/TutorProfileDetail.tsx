import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/TutorProfile.css';

/**
 * GET /api/tutor-profiles/{id}  → TutorProfileResponse
 * GET /api/public/reviews/course/{courseId} → ReviewResponse[]
 *
 * TutorProfileResponse: { id, userId, email, fullName, phone, role,
 *   gender, dateOfBirth, address, school, major, graduationYear,
 *   currentOccupation, strengths, subjects[], grades[], courses[], avatar }
 */

interface TutorProfile {
    id: number;
    userId: number;
    email: string;
    fullName: string;
    phone: string;
    gender: string;
    dateOfBirth: string;
    address: string;
    school: string;
    major: string;
    graduationYear: number;
    currentOccupation: string;
    strengths: string;
    subjects: string[];
    grades: string[];
    courses: Course[];
    avatar: string | null;
    bio: string | null;
    avatarUrl: string | null;
    teachingMode: string | null;
}

interface Course {
    id: number;
    title: string;
    subjectName: string;
    pricePerSession: number;
    totalSessions: number;
    status: string;
    avgRating: number;
    registrationCount: number;
    isPromoted: boolean;
}

export default function TutorProfileDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [profile, setProfile] = useState<TutorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [registerMsg, setRegisterMsg] = useState<Record<number, string>>({});

    useEffect(() => {
        api.get(`/tutor-profiles/${id}`)
            .then(res => setProfile(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [id]);

    const registerCourse = async (courseId: number) => {
        if (!user) { window.location.href = '/login'; return; }
        try {
            await api.post('/student/registrations', null, { params: { courseId } });
            setRegisterMsg(prev => ({ ...prev, [courseId]: '✅ Đã gửi đơn!' }));
        } catch (e: any) {
            setRegisterMsg(prev => ({ ...prev, [courseId]: '❌ ' + (e.response?.data?.message || 'Lỗi') }));
        }
    };

    if (loading) return (
        <div className="dashboard-page"><Header />
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
        <Footer /></div>
    );

    if (!profile) return (
        <div className="dashboard-page"><Header />
            <div style={{ padding: '4rem', textAlign: 'center', color: '#ef4444' }}>Không tìm thấy gia sư.</div>
        <Footer /></div>
    );

    const subjectList = Array.isArray(profile.subjects)
        ? profile.subjects
        : (profile.subjects as any as string)?.split(',').map((s: string) => s.trim()) || [];

    const gradeList = Array.isArray(profile.grades)
        ? profile.grades
        : (profile.grades as any as string)?.split(',').map((g: string) => g.trim()) || [];

    const approvedCourses = (profile.courses || []).filter(c => c.status === 'APPROVED');

    return (
        <div className="dashboard-page">
            <Header />
            <div style={{ maxWidth: 1000, margin: '2rem auto', padding: '0 1.5rem' }}>

                {/* HEADER PROFILE */}
                <div className="tp-header">
                    <img
                        src={profile.avatarUrl
                            ? `http://localhost:8080/api/materials/download/${profile.avatarUrl}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName)}&background=4f46e5&color=fff&size=100&bold=true&rounded=true`}
                        alt={profile.fullName}
                        className="tp-avatar"
                    />
                    <div className="tp-info">
                        <h1 className="tp-name">{profile.fullName}</h1>
                        <p className="tp-meta">
                            {profile.currentOccupation && <span>💼 {profile.currentOccupation}</span>}
                            {profile.school && <span> · 🎓 {profile.school}</span>}
                            {profile.major && <span> · {profile.major}</span>}
                            {profile.graduationYear && <span> ({profile.graduationYear})</span>}
                        </p>
                        {profile.address && <p className="tp-location">📍 {profile.address}</p>}
                        {profile.teachingMode && (
                            <p className="tp-location">
                                {profile.teachingMode === 'ONLINE' ? '🌐 Dạy Online' :
                                 profile.teachingMode === 'OFFLINE' ? '🏠 Dạy tại nhà (Offline)' :
                                 '🌐🏠 Online & Offline'}
                            </p>
                        )}
                        <div className="tp-verified">
                            <span className="verified-chip">✓ Đã xác minh CCCD</span>
                            <span className="verified-chip">✓ Hợp đồng ký kết</span>
                        </div>
                    </div>
                </div>

                <div className="tp-body">
                    {/* CỘT TRÁI */}
                    <div className="tp-left">
                        {/* Giới thiệu bản thân */}
                        {profile.bio && (
                            <div className="tp-section tp-bio-section">
                                <h3>👋 Giới thiệu</h3>
                                <p className="tp-bio">{profile.bio}</p>
                            </div>
                        )}

                        {/* Môn dạy */}
                        {subjectList.length > 0 && (
                            <div className="tp-section">
                                <h3>📚 Môn dạy</h3>
                                <div className="tp-tags">
                                    {subjectList.map(s => <span key={s} className="tp-tag subject">{s}</span>)}
                                </div>
                            </div>
                        )}

                        {/* Lớp dạy */}
                        {gradeList.length > 0 && (
                            <div className="tp-section">
                                <h3>🎯 Lớp dạy</h3>
                                <div className="tp-tags">
                                    {gradeList.map(g => <span key={g} className="tp-tag grade">{g}</span>)}
                                </div>
                            </div>
                        )}

                        {/* Kinh nghiệm */}
                        {profile.strengths && (
                            <div className="tp-section">
                                <h3>⭐ Kinh nghiệm & Ưu điểm</h3>
                                <p className="tp-strengths">{profile.strengths}</p>
                            </div>
                        )}
                    </div>

                    {/* CỘT PHẢI — KHÓA HỌC */}
                    <div className="tp-right">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                            📖 Khóa học đang mở ({approvedCourses.length})
                        </h3>
                        {approvedCourses.length === 0 ? (
                            <div className="empty-state"><p>Gia sư chưa có khóa học nào.</p></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {approvedCourses.map(c => (
                                    <div key={c.id} className="tp-course-card">
                                        {c.isPromoted && <span className="promoted-tag">🔥 Đẩy tin</span>}
                                        <h4>{c.title}</h4>
                                        <p>📖 {c.subjectName} · 📅 {c.totalSessions} buổi</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                            <div>
                                                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4f46e5' }}>
                                                    {c.pricePerSession?.toLocaleString('vi-VN')}đ
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>/buổi</span>
                                            </div>
                                            {c.avgRating > 0 && (
                                                <span style={{ color: '#f59e0b', fontSize: '0.88rem' }}>
                                                    ★ {c.avgRating.toFixed(1)} · {c.registrationCount} học viên
                                                </span>
                                            )}
                                        </div>
                                        {user?.role === 'STUDENT' && (
                                            <button
                                                className="btn-primary"
                                                style={{ width: '100%', marginTop: '10px', padding: '10px' }}
                                                onClick={() => registerCourse(c.id)}
                                                disabled={!!registerMsg[c.id]}
                                            >
                                                {registerMsg[c.id] || 'Đăng ký khóa học'}
                                            </button>
                                        )}
                                        {registerMsg[c.id] && (
                                            <p style={{ fontSize: '0.82rem', marginTop: '6px', color: registerMsg[c.id].startsWith('✅') ? '#10b981' : '#ef4444' }}>
                                                {registerMsg[c.id]}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                    <Link to="/courses" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        ← Quay lại danh sách khóa học
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}
