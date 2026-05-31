import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Dashboard.css';

interface Course {
    id: number;
    title: string;
    subjectName: string;
    status: string;
    pricePerSession: number;
    totalSessions: number;
    isPromoted: boolean;
    avgRating: number;
    registrationCount: number;
}

interface Registration {
    id: number;
    courseTitle: string;
    studentName: string;
    status: string;
    appliedAt: string;
    notes: string;
}

interface Notification {
    id: number;
    message: string;
    isRead: boolean;
    createdAt: string;
}

interface Payment {
    id: number;
    courseTitle: string;
    amount: number;
    paymentType: string;
    status: string;
    createdAt: string;
}

interface Review {
    id: number;
    studentName: string;
    courseTitle: string;
    rating: number;
    comment: string;
    tutorReply: string | null;
    repliedAt: string | null;
    createdAt: string;
}

const COURSE_STATUS: Record<string, { label: string; color: string }> = {
    PENDING_APPROVE: { label: 'Chờ duyệt',  color: '#f59e0b' },
    APPROVED:        { label: 'Đã duyệt',   color: '#10b981' },
    REJECTED:        { label: 'Bị từ chối', color: '#ef4444' },
    HIDDEN:          { label: 'Đã ẩn',      color: '#94a3b8' },
};

export default function TutorDashboard() {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (searchParams.get('tab') as 'courses' | 'applications' | 'payments' | 'notifications' | 'reviews') || 'courses';
    const setTab = (t: 'courses' | 'applications' | 'payments' | 'notifications' | 'reviews') => setSearchParams({ tab: t });
    const [courses, setCourses] = useState<Course[]>([]);
    const [applications, setApplications] = useState<Registration[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Reply modal
    const [replyModal, setReplyModal] = useState<{ open: boolean; reviewId: number | null }>({ open: false, reviewId: null });
    const [replyText, setReplyText] = useState('');
    const [replyMsg, setReplyMsg] = useState('');

    // Complaint modal
    const [complaintModal, setComplaintModal] = useState<{ open: boolean; reviewId: number | null }>({ open: false, reviewId: null });
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintMsg, setComplaintMsg] = useState('');

    // Modal tạo/sửa khóa học
    const [courseModal, setCourseModal] = useState<{ open: boolean; editing: Course | null }>({ open: false, editing: null });
    const [courseForm, setCourseForm] = useState({ title: '', description: '', pricePerSession: '', totalSessions: '', subjectId: '1' });
    const [courseMsg, setCourseMsg] = useState('');

    // Modal phí sàn
    const [feeModal, setFeeModal] = useState(false);
    const [feeProofFile, setFeeProofFile] = useState<File | null>(null);
    const [feeMsg, setFeeMsg] = useState('');
    const [submittingFee, setSubmittingFee] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [courseRes, appRes, notiRes, payRes, reviewRes] = await Promise.all([
                api.get('/courses/my-courses'),
                api.get('/tutor/registrations'),
                api.get('/notifications/my'),
                api.get('/payments/my'),
                api.get('/tutor/reviews/my-reviews'),
            ]);
            setCourses(courseRes.data);
            setApplications(appRes.data);
            setNotifications(notiRes.data);
            setPayments(payRes.data);
            setReviews(reviewRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const submitCourse = async () => {
        setCourseMsg('');
        try {
            const payload = {
                title: courseForm.title,
                description: courseForm.description,
                pricePerSession: parseFloat(courseForm.pricePerSession),
                totalSessions: parseInt(courseForm.totalSessions),
                subjectId: parseInt(courseForm.subjectId),
            };
            if (courseModal.editing) {
                await api.put(`/courses/${courseModal.editing.id}`, payload);
                setCourseMsg('✅ Cập nhật thành công! Khóa học đang chờ duyệt lại.');
            } else {
                await api.post('/courses', payload);
                setCourseMsg('✅ Tạo khóa học thành công! Đang chờ Admin duyệt.');
            }
            fetchAll();
        } catch (e: any) {
            setCourseMsg('❌ ' + (e.response?.data?.message || 'Có lỗi xảy ra'));
        }
    };

    const openEdit = (course: Course) => {
        setCourseForm({
            title: course.title,
            description: '',
            pricePerSession: String(course.pricePerSession),
            totalSessions: String(course.totalSessions),
            subjectId: '1',
        });
        setCourseModal({ open: true, editing: course });
        setCourseMsg('');
    };

    const requestPromote = async (courseId: number) => {
        try {
            const res = await api.put(`/courses/${courseId}/promote`);
            alert(`Yêu cầu đẩy tin đã tạo! Mã hóa đơn: #${res.data.id}. Vui lòng nộp minh chứng chuyển khoản 50.000đ.`);
            fetchAll();
        } catch (e: any) {
            alert('❌ ' + (e.response?.data?.message || 'Lỗi'));
        }
    };

    const reviewApplication = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        await api.put(`/tutor/registrations/${id}/status`, null, { params: { status } });
        fetchAll();
    };

    const markAllRead = async () => {
        await api.put('/notifications/read-all');
        const res = await api.get('/notifications/my');
        setNotifications(res.data);
    };

    const submitFee = async () => {
        if (!feeProofFile) { setFeeMsg('Vui lòng chọn ảnh minh chứng'); return; }
        setSubmittingFee(true);
        try {
            const formData = new FormData();
            formData.append('proof', feeProofFile);
            await api.post('/payments/platform-fee', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFeeMsg('✅ Đã gửi yêu cầu! Chờ Admin duyệt.');
            setFeeProofFile(null);
            fetchAll();
        } catch (e: any) {
            setFeeMsg('❌ ' + (e.response?.data?.message || 'Lỗi'));
        } finally { setSubmittingFee(false); }
    };

    const submitReply = async () => {
        if (!replyText.trim()) { setReplyMsg('Vui lòng nhập nội dung phản hồi'); return; }
        try {
            await api.post(`/tutor/reviews/${replyModal.reviewId}/reply`, { replyComment: replyText });
            setReplyMsg('✅ Đã gửi phản hồi!');
            setReplyText('');
            fetchAll();
            setTimeout(() => { setReplyModal({ open: false, reviewId: null }); setReplyMsg(''); }, 1000);
        } catch (e: any) {
            setReplyMsg('❌ ' + (e.response?.data?.message || 'Lỗi'));
        }
    };

    const submitComplaint = async () => {
        if (!complaintReason.trim()) { setComplaintMsg('Vui lòng nhập lý do khiếu nại'); return; }
        try {
            // POST /api/complaints { reviewId, reason }
            await api.post('/complaints', { reviewId: complaintModal.reviewId, reason: complaintReason });
            setComplaintMsg('✅ Đã gửi khiếu nại! Admin sẽ xem xét.');
            setComplaintReason('');
            setTimeout(() => { setComplaintModal({ open: false, reviewId: null }); setComplaintMsg(''); }, 1500);
        } catch (e: any) {
            setComplaintMsg('❌ ' + (e.response?.data?.message || 'Lỗi gửi khiếu nại'));
        }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="dashboard-page">
            <Header />
            <div className="dashboard-layout">
                {/* SIDEBAR */}
                <aside className="dash-sidebar">
                    <div className="dash-avatar">
                        <div className="avatar-circle tutor">{user?.fullName?.charAt(0) || 'T'}</div>
                        <div>
                            <div className="dash-name">{user?.fullName}</div>
                            <div className="dash-role-badge tutor">Gia sư</div>
                        </div>
                    </div>
                    <nav className="dash-nav">
                        <button className={tab === 'courses' ? 'active' : ''} onClick={() => setTab('courses')}>
                            📚 Khóa học của tôi
                        </button>
                        <button className={tab === 'applications' ? 'active' : ''} onClick={() => setTab('applications')}>
                            📋 Đơn đăng ký
                            {applications.filter(a => a.status === 'PENDING').length > 0 && (
                                <span className="badge">{applications.filter(a => a.status === 'PENDING').length}</span>
                            )}
                        </button>
                        <button className={tab === 'payments' ? 'active' : ''} onClick={() => setTab('payments')}>
                            💳 Thanh toán
                        </button>
                        <button className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}>
                            🔔 Thông báo {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                        </button>
                        <button className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>
                            ⭐ Đánh giá {reviews.length > 0 && <span className="badge" style={{ background: '#f59e0b' }}>{reviews.length}</span>}
                        </button>
                        <Link to="/tutor/contracts" className="dash-nav-link">📄 Hợp đồng</Link>
                        <Link to="/tutor/payments" className="dash-nav-link">💰 Quản lý thanh toán</Link>
                        <Link to="/profile" className="dash-nav-link">👤 Hồ sơ của tôi</Link>
                        <button className="btn-fee" onClick={() => { setFeeModal(true); setFeeMsg(''); }}>
                            💵 Nộp phí sàn
                        </button>
                        <button className="logout-btn" onClick={logout}>🚪 Đăng xuất</button>
                    </nav>
                </aside>

                {/* MAIN */}
                <main className="dash-main">
                    {loading ? <div className="loading-spinner">Đang tải...</div> : (
                        <>
                            {/* TAB: KHÓA HỌC */}
                            {tab === 'courses' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 className="dash-title" style={{ margin: 0 }}>Khóa học của tôi</h2>
                                        <button className="btn-primary" onClick={() => {
                                            setCourseForm({ title: '', description: '', pricePerSession: '', totalSessions: '', subjectId: '1' });
                                            setCourseModal({ open: true, editing: null });
                                            setCourseMsg('');
                                        }}>+ Tạo khóa học</button>
                                    </div>
                                    {courses.length === 0 ? (
                                        <div className="empty-state"><p>Bạn chưa có khóa học nào.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {courses.map(c => {
                                                const s = COURSE_STATUS[c.status] || { label: c.status, color: '#64748b' };
                                                return (
                                                    <div key={c.id} className="reg-card">
                                                        <div className="reg-card-header">
                                                            <h3>
                                                                {c.isPromoted && <span className="promoted-tag">🔥 Đẩy tin</span>}
                                                                {c.title}
                                                            </h3>
                                                            <span className="status-badge" style={{ background: s.color }}>{s.label}</span>
                                                        </div>
                                                        <p>📖 Môn: <strong>{c.subjectName}</strong> &nbsp;|&nbsp; 💰 {c.pricePerSession?.toLocaleString('vi-VN')}đ/buổi &nbsp;|&nbsp; 📅 {c.totalSessions} buổi</p>
                                                        <p>⭐ {c.avgRating?.toFixed(1) || '—'} &nbsp;|&nbsp; 👥 {c.registrationCount} học viên</p>
                                                        <div className="reg-actions">
                                                            <button className="btn-sm btn-outline" onClick={() => openEdit(c)}>✏️ Sửa</button>
                                                            {c.status === 'APPROVED' && !c.isPromoted && (
                                                                <button className="btn-sm btn-promote" onClick={() => requestPromote(c.id)}>🔥 Đẩy tin</button>
                                                            )}
                                                            {c.status === 'APPROVED' && (
                                                                <Link to={`/tutor/course/${c.id}`} className="btn-sm btn-primary">Quản lý lớp</Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: ĐƠN ĐĂNG KÝ */}
                            {tab === 'applications' && (
                                <div>
                                    <h2 className="dash-title">Đơn đăng ký từ học viên</h2>
                                    {applications.length === 0 ? (
                                        <div className="empty-state"><p>Chưa có đơn đăng ký nào.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {applications.map(app => (
                                                <div key={app.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>{app.studentName}</h3>
                                                        <span className="status-badge" style={{ background: app.status === 'PENDING' ? '#f59e0b' : app.status === 'APPROVED' ? '#10b981' : '#ef4444' }}>
                                                            {app.status === 'PENDING' ? 'Chờ duyệt' : app.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                                                        </span>
                                                    </div>
                                                    <p>📚 Khóa học: <strong>{app.courseTitle}</strong></p>
                                                    {app.notes && <p>📝 Ghi chú: {app.notes}</p>}
                                                    <p>📅 {new Date(app.appliedAt).toLocaleDateString('vi-VN')}</p>
                                                    {app.status === 'PENDING' && (
                                                        <div className="reg-actions">
                                                            <button className="btn-sm btn-primary" onClick={() => reviewApplication(app.id, 'APPROVED')}>✅ Duyệt</button>
                                                            <button className="btn-sm btn-danger" onClick={() => reviewApplication(app.id, 'REJECTED')}>❌ Từ chối</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: THANH TOÁN */}
                            {tab === 'payments' && (
                                <div>
                                    <h2 className="dash-title">Lịch sử thanh toán</h2>
                                    {payments.length === 0 ? (
                                        <div className="empty-state"><p>Chưa có giao dịch nào.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {payments.map(p => (
                                                <div key={p.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>{p.paymentType === 'PLATFORM_FEE' ? '💵 Phí sàn' : '🔥 Đẩy tin: ' + (p.courseTitle || '')}</h3>
                                                        <span className="status-badge" style={{ background: p.status === 'SUCCESS' ? '#10b981' : p.status === 'PENDING_VERIFY' ? '#3b82f6' : '#f59e0b' }}>
                                                            {p.status === 'SUCCESS' ? 'Đã duyệt' : p.status === 'PENDING_VERIFY' ? 'Chờ duyệt' : 'Chờ nộp proof'}
                                                        </span>
                                                    </div>
                                                    <p>💰 {p.amount?.toLocaleString('vi-VN')}đ &nbsp;|&nbsp; 📅 {new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    {/* Nộp proof cho PROMOTE */}
                                                    {p.paymentType === 'PROMOTE' && p.status === 'PENDING' && (
                                                        <button className="btn-sm btn-primary" style={{ marginTop: '8px' }}
                                                            onClick={() => alert(`Chuyển khoản 50.000đ rồi dùng mã hóa đơn #${p.id} để nộp minh chứng`)}>
                                                            📤 Nộp minh chứng
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: THÔNG BÁO */}
                            {tab === 'notifications' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 className="dash-title" style={{ margin: 0 }}>Thông báo</h2>
                                        {unreadCount > 0 && <button className="btn-sm btn-outline" onClick={markAllRead}>Đọc tất cả</button>}
                                    </div>
                                    <div className="noti-list">
                                        {notifications.map(n => (
                                            <div key={n.id} className={`noti-item ${!n.isRead ? 'unread' : ''}`}
                                                onClick={() => !n.isRead && api.put(`/notifications/${n.id}/read`).then(() =>
                                                    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)))}>
                                                <div className="noti-dot" style={{ background: n.isRead ? '#e2e8f0' : '#4f46e5' }} />
                                                <div className="noti-content">
                                                    <p>{n.message}</p>
                                                    <span>{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* TAB: ĐÁNH GIÁ */}
                            {tab === 'reviews' && (
                                <div>
                                    <h2 className="dash-title">Đánh giá từ học viên</h2>
                                    {reviews.length === 0 ? (
                                        <div className="empty-state"><p>Chưa có đánh giá nào.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {reviews.map(r => (
                                                <div key={r.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <div>
                                                            <h3>{r.studentName}</h3>
                                                            <p style={{ margin: '2px 0', fontSize: '0.82rem', color: '#64748b' }}>{r.courseTitle}</p>
                                                        </div>
                                                        <span style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                                                    </div>
                                                    <p style={{ color: '#374151', fontStyle: 'italic', margin: '8px 0' }}>"{r.comment}"</p>
                                                    <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                        {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                                    </p>
                                                    {r.tutorReply ? (
                                                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginTop: '10px' }}>
                                                            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46', marginBottom: '4px' }}>💬 Phản hồi của bạn:</p>
                                                            <p style={{ fontSize: '0.88rem', color: '#374151' }}>{r.tutorReply}</p>
                                                        </div>
                                                    ) : (
                                                        <button className="btn-sm btn-outline" style={{ marginTop: '10px' }}
                                                            onClick={() => { setReplyModal({ open: true, reviewId: r.id }); setReplyText(''); setReplyMsg(''); }}>
                                                            💬 Phản hồi đánh giá
                                                        </button>
                                                    )}
                                                    {/* Khiếu nại nếu đánh giá sai sự thật */}
                                                    <button className="btn-sm btn-danger" style={{ marginTop: '8px' }}
                                                        onClick={() => { setComplaintModal({ open: true, reviewId: r.id }); setComplaintReason(''); setComplaintMsg(''); }}>
                                                        🚩 Khiếu nại đánh giá này
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* MODAL TẠO/SỬA KHÓA HỌC */}
            {courseModal.open && (
                <div className="modal-overlay" onClick={() => setCourseModal({ open: false, editing: null })}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>{courseModal.editing ? '✏️ Sửa khóa học' : '➕ Tạo khóa học mới'}</h3>
                        <div className="modal-form">
                            <label>Tiêu đề *</label>
                            <input className="modal-input" value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} placeholder="Ví dụ: Toán lớp 12 nâng cao" />
                            <label>Mô tả</label>
                            <textarea className="modal-input" rows={3} value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả nội dung khóa học..." />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label>Giá / buổi (VNĐ) *</label>
                                    <input className="modal-input" type="number" value={courseForm.pricePerSession} onChange={e => setCourseForm(p => ({ ...p, pricePerSession: e.target.value }))} placeholder="200000" />
                                </div>
                                <div>
                                    <label>Tổng số buổi *</label>
                                    <input className="modal-input" type="number" value={courseForm.totalSessions} onChange={e => setCourseForm(p => ({ ...p, totalSessions: e.target.value }))} placeholder="10" />
                                </div>
                            </div>
                            <label>Môn học (ID) *</label>
                            <input className="modal-input" type="number" value={courseForm.subjectId} onChange={e => setCourseForm(p => ({ ...p, subjectId: e.target.value }))} placeholder="1" />
                        </div>
                        {courseMsg && <p style={{ color: courseMsg.startsWith('✅') ? '#10b981' : '#ef4444', marginTop: '8px' }}>{courseMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitCourse}>
                                {courseModal.editing ? 'Cập nhật' : 'Tạo khóa học'}
                            </button>
                            <button className="btn-outline" onClick={() => setCourseModal({ open: false, editing: null })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PHÍ SÀN */}
            {feeModal && (
                <div className="modal-overlay" onClick={() => setFeeModal(false)}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>💵 Nộp phí sàn</h3>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                            Chuyển khoản <strong>200.000đ</strong> theo thông tin hợp đồng, sau đó chọn ảnh minh chứng:
                        </p>
                        <input type="file" accept="image/*,.pdf"
                            onChange={e => setFeeProofFile(e.target.files?.[0] || null)}
                            style={{ padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }} />
                        {feeProofFile && <p style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '4px' }}>✅ Đã chọn: {feeProofFile.name}</p>}
                        {feeMsg && <p style={{ color: feeMsg.startsWith('✅') ? '#10b981' : '#ef4444', marginTop: '8px' }}>{feeMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitFee} disabled={submittingFee}>
                                {submittingFee ? '⏳ Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                            <button className="btn-outline" onClick={() => { setFeeModal(false); setFeeProofFile(null); setFeeMsg(''); }}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PHẢN HỒI ĐÁNH GIÁ */}
            {replyModal.open && (
                <div className="modal-overlay" onClick={() => setReplyModal({ open: false, reviewId: null })}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>💬 Phản hồi đánh giá</h3>
                        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Phản hồi của bạn sẽ hiển thị công khai bên dưới đánh giá.
                        </p>
                        <textarea className="modal-input" rows={4} value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            placeholder="Cảm ơn bạn đã đánh giá. Tôi rất vui khi..." />
                        {replyMsg && <p style={{ color: replyMsg.startsWith('✅') ? '#10b981' : '#ef4444', marginTop: '8px' }}>{replyMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitReply}>Gửi phản hồi</button>
                            <button className="btn-outline" onClick={() => setReplyModal({ open: false, reviewId: null })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KHIẾU NẠI ĐÁNH GIÁ */}
            {complaintModal.open && (
                <div className="modal-overlay" onClick={() => setComplaintModal({ open: false, reviewId: null })}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>🚩 Khiếu nại đánh giá</h3>
                        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Nếu đánh giá này sai sự thật hoặc vi phạm chính sách, hãy mô tả lý do để Admin xem xét.
                        </p>
                        <textarea className="modal-input" rows={4} value={complaintReason}
                            onChange={e => setComplaintReason(e.target.value)}
                            placeholder="Ví dụ: Học viên này chưa từng học lớp của tôi, đánh giá sai sự thật..." />
                        {complaintMsg && <p style={{ color: complaintMsg.startsWith('✅') ? '#10b981' : '#ef4444', marginTop: '8px' }}>{complaintMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-danger" onClick={submitComplaint}>Gửi khiếu nại</button>
                            <button className="btn-outline" onClick={() => setComplaintModal({ open: false, reviewId: null })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
