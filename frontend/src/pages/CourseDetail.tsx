import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MapModal from '../components/MapModal';
import '../css/CourseDetail.css';

/**
 * Trang chi tiết khóa học — PUBLIC (không cần đăng nhập để xem)
 * GET /api/public/courses?q=... → lấy từ danh sách (không có endpoint riêng cho 1 course)
 * GET /api/public/reviews/course/{courseId} → reviews
 * POST /api/student/registrations?courseId= → đăng ký (cần đăng nhập)
 */

interface Course {
    id: number;
    title: string;
    description: string;
    subjectName: string;
    tutorName: string;
    tutorProfileId: number;
    tutorAddress: string | null;
    pricePerSession: number;
    totalSessions: number;
    status: string;
    isPromoted: boolean;
    avgRating: number;
    registrationCount: number;
    promotionExpiration: string | null;
    schedule: string | null;
    teachingMode: string;
}

interface Review {
    id: number;
    studentName: string;
    courseTitle: string;
    rating: number;
    comment: string;
    tutorReply: string | null;
    createdAt: string;
}

export default function CourseDetail() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [course, setCourse] = useState<Course | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [registerMsg, setRegisterMsg] = useState('');
    const [registering, setRegistering] = useState(false);
    const [showMap, setShowMap] = useState(false);
    const [studentAddress, setStudentAddress] = useState<string>('');

    useEffect(() => {
        fetchData();
        // Lấy địa chỉ học viên để dùng trong bản đồ
        if (user?.role === 'STUDENT') {
            api.get('/profile/me').then(res => {
                if (res.data.address) setStudentAddress(res.data.address);
            }).catch(console.error);
        }
    }, [id, user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [courseRes, reviewsRes] = await Promise.all([
                api.get(`/public/courses/${id}`),
                api.get(`/public/reviews/course/${id}`),
            ]);
            setCourse(courseRes.data);
            setReviews(reviewsRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        if (!user) { navigate('/login'); return; }
        if (user.role !== 'STUDENT') { setRegisterMsg('❌ Chỉ học viên mới có thể đăng ký khóa học.'); return; }
        setRegistering(true);
        try {
            await api.post('/student/registrations', null, { params: { courseId: id } });
            setRegisterMsg('✅ Đã gửi đơn đăng ký! Chờ gia sư duyệt.');
        } catch (e: any) {
            setRegisterMsg('❌ ' + (e.response?.data?.message || 'Lỗi đăng ký'));
        } finally {
            setRegistering(false);
        }
    };

    const renderStars = (rating: number) => '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));

    const DAY_LABELS: Record<string, string> = {
        MON: 'Thứ 2', TUE: 'Thứ 3', WED: 'Thứ 4',
        THU: 'Thứ 5', FRI: 'Thứ 6', SAT: 'Thứ 7', SUN: 'Chủ nhật',
    };
    const DAY_ORDER = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

    const parseSchedule = (raw: string | null) => {
        if (!raw) return [];
        try { return JSON.parse(raw); } catch { return []; }
    };

    if (loading) return (
        <div className="dashboard-page">
            <Header />
            <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
            <Footer />
        </div>
    );

    if (!course) return (
        <div className="dashboard-page">
            <Header />
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <p style={{ color: '#ef4444', marginBottom: '1rem' }}>Không tìm thấy khóa học.</p>
                <Link to="/courses" className="btn-primary">← Quay lại danh sách</Link>
            </div>
            <Footer />
        </div>
    );

    const avgRating = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    return (
        <div className="course-detail-page">
            <Header />

            <div className="cd-container">
                {/* BREADCRUMB */}
                <div className="cd-breadcrumb">
                    <Link to="/">Trang chủ</Link>
                    <span>›</span>
                    <Link to="/courses">Khóa học</Link>
                    <span>›</span>
                    <span>{course.title}</span>
                </div>

                <div className="cd-layout">
                    {/* NỘI DUNG CHÍNH */}
                    <div className="cd-main">
                        {/* Header khóa học */}
                        <div className="cd-header-card">
                            {course.isPromoted && (
                                <div className="cd-promoted-badge">🔥 Đang được đẩy tin</div>
                            )}
                            <div className="cd-subject-tag">{course.subjectName}</div>
                            <h1 className="cd-title">{course.title}</h1>

                            <div className="cd-meta-row">
                                <Link to={`/tutor-profile/${course.tutorProfileId}`} className="cd-tutor-link">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.tutorName)}&background=4f46e5&color=fff&size=36&bold=true&rounded=true`}
                                        alt={course.tutorName}
                                        style={{ width: 36, height: 36, borderRadius: '50%' }}
                                    />
                                    <span>{course.tutorName}</span>
                                </Link>
                                {avgRating && (
                                    <span className="cd-rating">
                                        <span style={{ color: '#f59e0b' }}>★</span> {avgRating}
                                        <span style={{ color: '#94a3b8', marginLeft: 4 }}>({reviews.length} đánh giá)</span>
                                    </span>
                                )}
                                <span className="cd-students">👥 {course.registrationCount} học viên</span>
                            </div>
                        </div>

                        {/* MÔ TẢ */}
                        {course.description && (
                            <div className="cd-section">
                                <h2>📋 Mô tả khóa học</h2>
                                <p className="cd-description">{course.description}</p>
                            </div>
                        )}

                        {/* THÔNG TIN KHÓA HỌC */}
                        <div className="cd-section">
                            <h2>📊 Thông tin khóa học</h2>
                            <div className="cd-info-grid">
                                <div className="cd-info-item">
                                    <span className="cd-info-icon">📖</span>
                                    <div>
                                        <div className="cd-info-label">Môn học</div>
                                        <div className="cd-info-value">{course.subjectName}</div>
                                    </div>
                                </div>
                                <div className="cd-info-item">
                                    <span className="cd-info-icon">📅</span>
                                    <div>
                                        <div className="cd-info-label">Tổng số buổi</div>
                                        <div className="cd-info-value">{course.totalSessions} buổi</div>
                                    </div>
                                </div>
                                <div className="cd-info-item">
                                    <span className="cd-info-icon">👥</span>
                                    <div>
                                        <div className="cd-info-label">Học viên đã đăng ký</div>
                                        <div className="cd-info-value">{course.registrationCount} người</div>
                                    </div>
                                </div>
                                <div className="cd-info-item">
                                    <span className="cd-info-icon">⭐</span>
                                    <div>
                                        <div className="cd-info-label">Đánh giá trung bình</div>
                                        <div className="cd-info-value">{avgRating ? `${avgRating}/5` : 'Chưa có'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* LỊCH HỌC DỰ KIẾN */}
                        {(() => {
                            const slots = parseSchedule(course.schedule);
                            const sorted = [...slots].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
                            return (
                                <div className="cd-section">
                                    <h2>📅 Lịch học dự kiến</h2>
                                    {sorted.length === 0 ? (
                                        <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Gia sư chưa cập nhật lịch dạy.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {sorted.map((slot: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f0f4ff', border: '1.5px solid #c7d2fe', borderRadius: '10px', padding: '10px 16px' }}>
                                                    <span style={{ fontWeight: 700, color: '#4f46e5', minWidth: '72px', fontSize: '0.92rem' }}>
                                                        {DAY_LABELS[slot.day] || slot.day}
                                                    </span>
                                                    <span style={{ color: '#374151', fontWeight: 600, fontSize: '1rem', letterSpacing: '0.5px' }}>
                                                        🕐 {slot.startTime} – {slot.endTime}
                                                    </span>
                                                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#6366f1', background: '#e0e7ff', padding: '2px 10px', borderRadius: '20px', fontWeight: 600 }}>
                                                        {(() => {
                                                            const [sh, sm] = slot.startTime.split(':').map(Number);
                                                            const [eh, em] = slot.endTime.split(':').map(Number);
                                                            const mins = (eh * 60 + em) - (sh * 60 + sm);
                                                            return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2,'0') + 'p' : ''}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            ))}
                                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                                                * Lịch có thể điều chỉnh theo thỏa thuận giữa gia sư và học viên.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* ĐÁNH GIÁ */}
                        <div className="cd-section">                            <h2>⭐ Đánh giá từ học viên ({reviews.length})</h2>
                            {reviews.length === 0 ? (
                                <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa có đánh giá nào.</p>
                            ) : (
                                <div className="cd-reviews">
                                    {reviews.map(r => (
                                        <div key={r.id} className="cd-review-item">
                                            <div className="cd-review-header">
                                                <img
                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.studentName)}&background=6366f1&color=fff&size=36&bold=true&rounded=true`}
                                                    alt={r.studentName}
                                                    style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }}
                                                />
                                                <div>
                                                    <div className="cd-review-name">{r.studentName}</div>
                                                    <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{renderStars(r.rating)}</div>
                                                </div>
                                                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: '#94a3b8' }}>
                                                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                            <p className="cd-review-comment">"{r.comment}"</p>
                                            {r.tutorReply && (
                                                <div className="cd-tutor-reply">
                                                    <span style={{ fontWeight: 600, color: '#065f46' }}>💬 Gia sư phản hồi:</span>
                                                    <p>{r.tutorReply}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* SIDEBAR ĐĂNG KÝ */}
                    <aside className="cd-sidebar">
                        <div className="cd-register-card">
                            <div className="cd-price">
                                <span className="cd-price-amount">{course.pricePerSession?.toLocaleString('vi-VN')}đ</span>
                                <span className="cd-price-unit">/buổi</span>
                            </div>
                            <div className="cd-total-price">
                                Tổng: <strong>{(course.pricePerSession * course.totalSessions)?.toLocaleString('vi-VN')}đ</strong>
                                <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}> ({course.totalSessions} buổi)</span>
                            </div>

                            {registerMsg ? (
                                <div style={{
                                    padding: '12px', borderRadius: '10px', marginBottom: '1rem',
                                    background: registerMsg.startsWith('✅') ? '#d1fae5' : '#fee2e2',
                                    color: registerMsg.startsWith('✅') ? '#065f46' : '#b91c1c',
                                    fontSize: '0.9rem'
                                }}>
                                    {registerMsg}
                                </div>
                            ) : (
                                <button
                                    className="cd-register-btn"
                                    onClick={handleRegister}
                                    disabled={registering}
                                >
                                    {registering ? 'Đang gửi...' : user?.role === 'STUDENT' ? '📝 Đăng ký khóa học' : user ? '🔒 Chỉ học viên mới đăng ký được' : '🔑 Đăng nhập để đăng ký'}
                                </button>
                            )}

                            {!user && (
                                <p style={{ textAlign: 'center', fontSize: '0.82rem', color: '#64748b', marginTop: '8px' }}>
                                    <Link to="/register/student" style={{ color: '#4f46e5', fontWeight: 600 }}>Đăng ký học viên</Link>
                                    {' · '}
                                    <Link to="/login" style={{ color: '#4f46e5' }}>Đăng nhập</Link>
                                </p>
                            )}

                            <div className="cd-register-info">
                                <div>✅ Gia sư đã xác minh CCCD</div>
                                <div>📄 Hợp đồng ký kết rõ ràng</div>
                                <div>🔒 Thanh toán an toàn qua Admin</div>
                                <div>⭐ Đánh giá thực từ học viên</div>
                            </div>

                            {/* Nút xem bản đồ — chỉ hiện khi offline, gia sư có địa chỉ */}
                            {(course.teachingMode === 'OFFLINE' || course.teachingMode === 'BOTH') && course.tutorAddress && (
                                <button
                                    onClick={() => setShowMap(true)}
                                    style={{
                                        width: '100%', marginTop: '10px', padding: '10px',
                                        background: '#f0fdf4', color: '#059669',
                                        border: '1.5px solid #bbf7d0', borderRadius: '10px',
                                        fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                    }}
                                >
                                    🗺️ Xem gia sư cách nhà bạn bao xa
                                </button>
                            )}
                        </div>

                        {/* Thông tin gia sư */}
                        <div className="cd-tutor-card">
                            <h3>👨‍🏫 Gia sư</h3>
                            <Link to={`/tutor-profile/${course.tutorProfileId}`} className="cd-tutor-link-card">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(course.tutorName)}&background=4f46e5&color=fff&size=52&bold=true&rounded=true`}
                                    alt={course.tutorName}
                                    style={{ width: 52, height: 52, borderRadius: '50%' }}
                                />
                                <div>
                                    <div style={{ fontWeight: 700, color: '#1f2937' }}>{course.tutorName}</div>
                                    <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Xem hồ sơ đầy đủ →</div>
                                </div>
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>

            <Footer />
            {/* BẢN ĐỒ — gia sư đến nhà học viên */}
            {showMap && course?.tutorAddress && (
                <MapModal
                    studentName={user?.fullName || 'Nhà bạn'}
                    studentAddress={studentAddress || 'Chưa cập nhật địa chỉ'}
                    tutorAddress={course.tutorAddress}
                    onClose={() => setShowMap(false)}
                />
            )}

        </div>
    );
}
