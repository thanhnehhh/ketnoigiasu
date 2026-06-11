import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SchedulePicker from '../components/SchedulePicker';
import type { ScheduleSlot } from '../components/SchedulePicker';
import MapModal from '../components/MapModal';
import '../css/Dashboard.css';

interface Course {
    id: number;
    title: string;
    subjectName: string;
    subjectId: number;
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
    studentAddress: string;
    status: string;
    appliedAt: string;
    notes: string;
    completedSessions: number;
    totalSessions: number;
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

    // Điểm uy tín
    const [reputationScore, setReputationScore] = useState<number>(50);
    const [reputationLabel, setReputationLabel] = useState<string>('Trung bình');

    // Bản đồ
    const [mapModal, setMapModal] = useState<{ open: boolean; app: Registration | null }>({ open: false, app: null });
    const [tutorAddress, setTutorAddress] = useState<string>('');

    // Modal từ chối đơn đăng ký
    const [rejectModal, setRejectModal] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
    const [rejectReason, setRejectReason] = useState('');
    const [rejectMsg, setRejectMsg] = useState('');

    // Reply modal
    const [replyModal, setReplyModal] = useState<{ open: boolean; reviewId: number | null }>({ open: false, reviewId: null });
    const [replyText, setReplyText] = useState('');
    const [replyMsg, setReplyMsg] = useState('');

    // Complaint modal
    const [complaintModal, setComplaintModal] = useState<{ open: boolean; reviewId: number | null }>({ open: false, reviewId: null });
    const [complaintReason, setComplaintReason] = useState('');
    const [complaintMsg, setComplaintMsg] = useState('');

    // Filter đơn đăng ký
    const [appFilter, setAppFilter] = useState<'PENDING' | 'DONE'>('PENDING');
    // Filter khóa học
    const [courseFilter, setCourseFilter] = useState<'ALL' | 'APPROVED' | 'PENDING_APPROVE' | 'REJECTED' | 'HIDDEN'>('ALL');
    const [seenCourseFilters, setSeenCourseFilters] = useState<Set<string>>(new Set(['ALL']));
    // Filter thanh toán gia sư
    const [payFilter, setPayFilter] = useState<'ALL' | 'PENDING' | 'PENDING_VERIFY' | 'SUCCESS'>('ALL');
    const [seenPayFilters, setSeenPayFilters] = useState<Set<string>>(new Set(['ALL']));
    // Filter đánh giá
    const [reviewFilter, setReviewFilter] = useState<'ALL' | 'NO_REPLY' | 'REPLIED'>('ALL');
    const [seenReviewFilters, setSeenReviewFilters] = useState<Set<string>>(new Set(['ALL']));
    const [courseModal, setCourseModal] = useState<{ open: boolean; editing: Course | null }>({ open: false, editing: null });
    const [courseForm, setCourseForm] = useState({ title: '', description: '', pricePerSession: '', totalSessions: '', subjectId: '1', teachingMode: 'BOTH' });
    const [courseMsg, setCourseMsg] = useState('');
    const [subjects, setSubjects] = useState<{ id: number; name: string }[]>([]);

    // Lịch dạy dự kiến
    const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);

    // Modal phí sàn
    const [feeModal, setFeeModal] = useState(false);
    const [feeProofFile, setFeeProofFile] = useState<File | null>(null);
    const [feeMsg, setFeeMsg] = useState('');
    const [submittingFee, setSubmittingFee] = useState(false);
    const [adminPayInfo, setAdminPayInfo] = useState<{ bankName: string; bankAccount: string; bankOwner: string; qrImageUrl: string } | null>(null);

    useEffect(() => {
        fetchAll();
        api.get('/public/subjects').then(res => setSubjects(res.data)).catch(console.error);
        api.get('/public/payment-info').then(res => setAdminPayInfo(res.data)).catch(console.error);
        // Lấy điểm uy tín từ profile
        api.get('/profile/me').then(res => {
            if (res.data.reputationScore !== undefined) {
                setReputationScore(res.data.reputationScore);
                setReputationLabel(res.data.reputationLabel || '');
            }
            if (res.data.address) setTutorAddress(res.data.address);
        }).catch(console.error);
    }, []);

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
                teachingMode: courseForm.teachingMode,
                schedule: scheduleSlots.length > 0 ? JSON.stringify(scheduleSlots) : null,
            };
            if (courseModal.editing) {
                await api.put(`/courses/${courseModal.editing.id}`, payload);
                setCourseMsg('✅ Cập nhật thành công!');
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
            subjectId: course.subjectId ? String(course.subjectId) : (subjects.length > 0 ? String(subjects[0].id) : '1'),
            teachingMode: 'BOTH',
        });
        // Load lại schedule nếu có
        try {
            const parsed = course.schedule ? JSON.parse(course.schedule) : [];
            setScheduleSlots(parsed);
        } catch { setScheduleSlots([]); }
        setCourseModal({ open: true, editing: course });
        setCourseMsg('');
    };

    const requestPromote = async (courseId: number) => {
        try {
            const res = await api.put(`/courses/${courseId}/promote`);
            toast.success(`Yêu cầu đẩy tin đã tạo! Mã hóa đơn: #${res.data.id}. Vui lòng nộp minh chứng chuyển khoản 50.000đ.`);
            fetchAll();
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Lỗi');
        }
    };

    const completeCourse = (registrationId: number) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>Xác nhận hoàn thành khóa học này?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.put(`/student/registrations/${registrationId}/complete`);
                                toast.success('Đã xác nhận hoàn thành khóa học!');
                                fetchAll();
                            } catch (e: any) {
                                toast.error(e.response?.data?.message || 'Lỗi');
                            }
                        }}>Xác nhận</button>
                    <button style={{ background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
                        onClick={() => toast.dismiss(t.id)}>Hủy</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const reviewApplication = async (id: number, status: 'APPROVED' | 'REJECTED') => {
        await api.put(`/tutor/registrations/${id}/status`, null, { params: { status } });
        fetchAll();
    };

    const submitReject = async () => {
        if (!rejectModal.id) return;
        try {
            await api.put(`/tutor/registrations/${rejectModal.id}/status`, null, {
                params: { status: 'REJECTED', reason: rejectReason.trim() || 'Không phù hợp' }
            });
            setRejectModal({ open: false, id: null });
            setRejectReason('');
            setRejectMsg('');
            fetchAll();
            toast.success('Đã từ chối đơn đăng ký.');
        } catch (e: any) {
            setRejectMsg('❌ ' + (e.response?.data?.message || 'Lỗi'));
        }
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
                            {/* Badge điểm uy tín */}
                            <div style={{ marginTop: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '3px' }}>
                                    <span>Độ uy tín</span>
                                    <span style={{
                                        fontWeight: 700,
                                        color: reputationScore >= 85 ? '#10b981' : reputationScore >= 70 ? '#3b82f6' : reputationScore >= 50 ? '#f59e0b' : '#ef4444'
                                    }}>{reputationScore}/100</span>
                                </div>
                                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', width: '100%' }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${reputationScore}%`,
                                        background: reputationScore >= 85 ? '#10b981' : reputationScore >= 70 ? '#3b82f6' : reputationScore >= 50 ? '#f59e0b' : '#ef4444',
                                        borderRadius: '10px',
                                        transition: 'width 0.3s',
                                    }} />
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>{reputationLabel}</div>
                            </div>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <h2 className="dash-title" style={{ margin: 0 }}>Khóa học của tôi</h2>
                                        <button className="btn-primary" onClick={() => {
                                            setCourseForm({ title: '', description: '', pricePerSession: '', totalSessions: '', subjectId: subjects.length > 0 ? String(subjects[0].id) : '1', teachingMode: 'BOTH' });
                                            setScheduleSlots([]);
                                            setCourseModal({ open: true, editing: null });
                                            setCourseMsg('');
                                        }}>+ Tạo khóa học</button>
                                    </div>
                                    {courses.length === 0 ? (
                                        <div className="empty-state"><p>Bạn chưa có khóa học nào.</p></div>
                                    ) : (
                                        <>
                                        <div className="course-filter-bar">
                                            {([
                                                { key: 'ALL',            label: 'Tất cả',       color: '#64748b' },
                                                { key: 'APPROVED',       label: '✅ Đang hoạt động', color: '#10b981' },
                                                { key: 'PENDING_APPROVE',label: '⏳ Chờ duyệt', color: '#f59e0b' },
                                                { key: 'REJECTED',       label: '✖ Bị từ chối', color: '#ef4444' },
                                                { key: 'HIDDEN',         label: '🙈 Đã ẩn',     color: '#94a3b8' },
                                            ] as const).map(f => {
                                                const count = f.key === 'ALL' ? courses.length : courses.filter(c => c.status === f.key).length;
                                                if (f.key !== 'ALL' && count === 0) return null;
                                                const hasNew = f.key !== 'ALL' && count > 0 && !seenCourseFilters.has(f.key);
                                                return (
                                                    <button key={f.key}
                                                        className={`course-filter-btn ${courseFilter === f.key ? 'active' : ''}`}
                                                        style={{ '--filter-color': f.color } as any}
                                                        onClick={() => { setCourseFilter(f.key); setSeenCourseFilters(p => new Set([...p, f.key])); }}>
                                                        {hasNew && <span className="filter-dot" />}
                                                        {f.label}
                                                        <span className="course-filter-count">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="card-list">
                                            {courses.filter(c => courseFilter === 'ALL' || c.status === courseFilter).map(c => {
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
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB: ĐƠN ĐĂNG KÝ */}
                            {tab === 'applications' && (
                                <div>
                                    <h2 className="dash-title">Đơn đăng ký từ học viên</h2>

                                    {/* 2 Ô THỐNG KÊ */}
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                        <div onClick={() => setAppFilter('PENDING')}
                                            style={{ flex: 1, position: 'relative', background: appFilter === 'PENDING' ? '#fef3c7' : 'white', border: `2px solid ${appFilter === 'PENDING' ? '#f59e0b' : '#e2e8f0'}`, borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e', fontWeight: 600 }}>⏳ Chờ duyệt</p>
                                            <p style={{ margin: '6px 0 0', fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
                                                {applications.filter(a => a.status === 'PENDING').length}
                                            </p>
                                            {applications.filter(a => a.status === 'PENDING').length > 0 && (
                                                <span style={{ position: 'absolute', top: 10, right: 10, background: '#ef4444', color: 'white', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {applications.filter(a => a.status === 'PENDING').length}
                                                </span>
                                            )}
                                        </div>
                                        <div onClick={() => setAppFilter('DONE')}
                                            style={{ flex: 1, background: appFilter === 'DONE' ? '#f0fdf4' : 'white', border: `2px solid ${appFilter === 'DONE' ? '#10b981' : '#e2e8f0'}`, borderRadius: '14px', padding: '1.25rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#065f46', fontWeight: 600 }}>✅ Đã xử lý</p>
                                            <p style={{ margin: '6px 0 0', fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>
                                                {applications.filter(a => a.status !== 'PENDING').length}
                                            </p>
                                        </div>
                                    </div>

                                    {/* DANH SÁCH */}
                                    {(() => {
                                        const list = (appFilter === 'PENDING'
                                            ? applications.filter(a => a.status === 'PENDING')
                                            : applications.filter(a => a.status !== 'PENDING')
                                        ).sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
                                        return list.length === 0 ? (
                                            <div className="empty-state"><p>{appFilter === 'PENDING' ? 'Không có đơn nào chờ duyệt.' : 'Chưa có đơn nào được xử lý.'}</p></div>
                                        ) : (
                                            <div className="card-list">
                                                {list.map(app => (
                                                    <div key={app.id} className="reg-card" style={{ borderLeft: `4px solid ${app.status === 'PENDING' ? '#f59e0b' : app.status === 'APPROVED' || app.status === 'ACTIVE' ? '#10b981' : '#ef4444'}` }}>
                                                        <div className="reg-card-header">
                                                            <h3>{app.studentName}</h3>
                                                            <span className="status-badge" style={{ background: app.status === 'PENDING' ? '#f59e0b' : app.status === 'APPROVED' ? '#10b981' : app.status === 'ACTIVE' ? '#6366f1' : app.status === 'COMPLETED' ? '#64748b' : '#ef4444' }}>
                                                                {app.status === 'PENDING' ? 'Chờ duyệt' : app.status === 'APPROVED' ? 'Đã duyệt' : app.status === 'ACTIVE' ? 'Đang học' : app.status === 'COMPLETED' ? 'Hoàn thành' : 'Từ chối'}
                                                            </span>
                                                        </div>
                                                        <p>📚 <strong>{app.courseTitle}</strong></p>
                                                        {app.notes && <p>📝 {app.notes}</p>}
                                                        {app.studentAddress && (
                                                            <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                                                                📍 {app.studentAddress}
                                                            </p>
                                                        )}
                                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>📅 {new Date(app.appliedAt).toLocaleDateString('vi-VN')}</p>
                                                        {app.status === 'PENDING' && (
                                                            <div className="reg-actions">
                                                                <button className="btn-sm btn-primary" onClick={() => reviewApplication(app.id, 'APPROVED')}>✅ Duyệt</button>
                                                                <button className="btn-sm btn-danger" onClick={() => { setRejectModal({ open: true, id: app.id }); setRejectReason(''); setRejectMsg(''); }}>❌ Từ chối</button>
                                                                {app.studentAddress && (
                                                                    <button className="btn-sm btn-outline"
                                                                        style={{ color: '#059669', borderColor: '#059669' }}
                                                                        onClick={() => setMapModal({ open: true, app })}>
                                                                        🗺️ Xem bản đồ
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                        {app.status === 'ACTIVE' && (
                                                            <div className="reg-actions">
                                                                {app.completedSessions >= app.totalSessions ? (
                                                                    <button className="btn-sm btn-primary" onClick={() => completeCourse(app.id)}>
                                                                        🎓 Hoàn thành khóa học
                                                                    </button>
                                                                ) : (
                                                                    <button className="btn-sm btn-outline" disabled
                                                                        title={`Còn ${app.totalSessions - app.completedSessions} buổi chưa xong`}
                                                                        style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                                                        📊 {app.completedSessions}/{app.totalSessions} buổi
                                                                    </button>
                                                                )}
                                                                {app.studentAddress && (
                                                                    <button className="btn-sm btn-outline"
                                                                        style={{ color: '#059669', borderColor: '#059669' }}
                                                                        onClick={() => setMapModal({ open: true, app })}>
                                                                        🗺️ Xem bản đồ
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* TAB: THANH TOÁN */}
                            {tab === 'payments' && (
                                <div>
                                    <h2 className="dash-title">Lịch sử thanh toán</h2>
                                    {payments.length === 0 ? (
                                        <div className="empty-state"><p>Chưa có giao dịch nào.</p></div>
                                    ) : (
                                        <>
                                        <div className="course-filter-bar">
                                            {([
                                                { key: 'ALL',            label: 'Tất cả',          color: '#64748b' },
                                                { key: 'PENDING',        label: '⏳ Chờ nộp proof', color: '#f59e0b' },
                                                { key: 'PENDING_VERIFY', label: '🔍 Chờ duyệt',    color: '#3b82f6' },
                                                { key: 'SUCCESS',        label: '✅ Đã hoàn tất',  color: '#10b981' },
                                            ] as const).map(f => {
                                                const count = f.key === 'ALL' ? payments.length : payments.filter(p => p.status === f.key).length;
                                                if (f.key !== 'ALL' && count === 0) return null;
                                                const hasNew = f.key !== 'ALL' && count > 0 && !seenPayFilters.has(f.key);
                                                return (
                                                    <button key={f.key}
                                                        className={`course-filter-btn ${payFilter === f.key ? 'active' : ''}`}
                                                        style={{ '--filter-color': f.color } as any}
                                                        onClick={() => { setPayFilter(f.key); setSeenPayFilters(p => new Set([...p, f.key])); }}>
                                                        {hasNew && <span className="filter-dot" />}
                                                        {f.label}
                                                        <span className="course-filter-count">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="card-list">
                                            {payments.filter(p => payFilter === 'ALL' || p.status === payFilter).map(p => (
                                                <div key={p.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>{p.paymentType === 'PLATFORM_FEE' ? '💵 Phí sàn' : '🔥 Đẩy tin: ' + (p.courseTitle || '')}</h3>
                                                        <span className="status-badge" style={{ background: p.status === 'SUCCESS' ? '#10b981' : p.status === 'PENDING_VERIFY' ? '#3b82f6' : '#f59e0b' }}>
                                                            {p.status === 'SUCCESS' ? 'Đã duyệt' : p.status === 'PENDING_VERIFY' ? 'Chờ duyệt' : 'Chờ nộp proof'}
                                                        </span>
                                                    </div>
                                                    <p>💰 {p.amount?.toLocaleString('vi-VN')}đ &nbsp;|&nbsp; 📅 {new Date(p.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    {p.paymentType === 'PROMOTE' && p.status === 'PENDING' && (
                                                        <button className="btn-sm btn-primary" style={{ marginTop: '8px' }}
                                                            onClick={() => toast(`Chuyển khoản 50.000đ rồi dùng mã hóa đơn #${p.id} để nộp minh chứng`, { icon: '📤' })}>
                                                            📤 Nộp minh chứng
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB: THÔNG BÁO — đã chuyển lên Header */}
                            {tab === 'notifications' && null}

                            {/* TAB: ĐÁNH GIÁ */}
                            {tab === 'reviews' && (
                                <div>
                                    <h2 className="dash-title">Đánh giá từ học viên</h2>
                                    {reviews.length === 0 ? (
                                        <div className="empty-state"><p>Chưa có đánh giá nào.</p></div>
                                    ) : (
                                        <>
                                        <div className="course-filter-bar">
                                            {([
                                                { key: 'ALL',      label: 'Tất cả',          color: '#64748b' },
                                                { key: 'NO_REPLY', label: '💬 Chưa phản hồi', color: '#f59e0b' },
                                                { key: 'REPLIED',  label: '✅ Đã phản hồi',  color: '#10b981' },
                                            ] as const).map(f => {
                                                const count = f.key === 'ALL' ? reviews.length
                                                    : f.key === 'NO_REPLY' ? reviews.filter(r => !r.tutorReply).length
                                                    : reviews.filter(r => !!r.tutorReply).length;
                                                if (f.key !== 'ALL' && count === 0) return null;
                                                const hasNew = f.key !== 'ALL' && count > 0 && !seenReviewFilters.has(f.key);
                                                return (
                                                    <button key={f.key}
                                                        className={`course-filter-btn ${reviewFilter === f.key ? 'active' : ''}`}
                                                        style={{ '--filter-color': f.color } as any}
                                                        onClick={() => { setReviewFilter(f.key); setSeenReviewFilters(p => new Set([...p, f.key])); }}>
                                                        {hasNew && <span className="filter-dot" />}
                                                        {f.label}
                                                        <span className="course-filter-count">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="card-list">
                                            {reviews.filter(r =>
                                                reviewFilter === 'ALL' ? true
                                                : reviewFilter === 'NO_REPLY' ? !r.tutorReply
                                                : !!r.tutorReply
                                            ).map(r => (
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
                                        </>
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
                    <div className="modal-box" onClick={e => e.stopPropagation()}
                        style={{ maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                            <label>Môn học *</label>
                            <select className="modal-input" value={courseForm.subjectId} onChange={e => setCourseForm(p => ({ ...p, subjectId: e.target.value }))}>
                                {subjects.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                            </select>
                            <label>Hình thức dạy *</label>
                            <select className="modal-input" value={courseForm.teachingMode} onChange={e => setCourseForm(p => ({ ...p, teachingMode: e.target.value }))}>
                                <option value="BOTH">🌐🏠 Cả hai (Online & Offline)</option>
                                <option value="ONLINE">🌐 Online</option>
                                <option value="OFFLINE">🏠 Offline (Tại nhà)</option>
                            </select>

                            {/* === LỊCH DẠY DỰ KIẾN === */}
                            <label style={{ marginTop: '8px' }}>📅 Lịch dạy dự kiến <span style={{ fontWeight: 400, color: '#94a3b8' }}>(tùy chọn — giúp học viên biết lịch trước khi đăng ký)</span></label>
                            <SchedulePicker
                                value={scheduleSlots}
                                onChange={setScheduleSlots}
                            />
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
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>💵</div>
                            <h3 style={{ margin: 0, color: '#92400e' }}>Nộp phí sàn — 200.000đ</h3>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '6px 0 0' }}>
                                Nộp một lần để kích hoạt tài khoản và tạo khóa học
                            </p>
                        </div>

                        {/* QR */}
                        {adminPayInfo?.qrImageUrl && (
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <img
                                    src={`http://localhost:8080/api/materials/download/${adminPayInfo.qrImageUrl}`}
                                    alt="QR chuyển khoản"
                                    style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: '12px', border: '2px solid #e2e8f0' }}
                                />
                            </div>
                        )}

                        {/* Thông tin tài khoản */}
                        {adminPayInfo?.bankAccount && (
                            <div style={{ background: '#f0f7ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                                <p style={{ fontWeight: 700, color: '#1e40af', margin: '0 0 8px' }}>🏦 Thông tin tài khoản</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', color: '#374151' }}>
                                    <span style={{ color: '#64748b' }}>Ngân hàng:</span><strong>{adminPayInfo.bankName}</strong>
                                    <span style={{ color: '#64748b' }}>Số TK:</span><strong style={{ color: '#005BAA', fontSize: '1rem', letterSpacing: '1px' }}>{adminPayInfo.bankAccount}</strong>
                                    <span style={{ color: '#64748b' }}>Chủ TK:</span><strong>{adminPayInfo.bankOwner}</strong>
                                    <span style={{ color: '#64748b' }}>Số tiền:</span><strong style={{ color: '#005BAA' }}>200.000đ</strong>
                                </div>
                            </div>
                        )}

                        {/* Nội dung chuyển khoản */}
                        {(() => {
                            const content = `PhiSan ${user?.fullName?.replace(/\s+/g, '') || 'GiaSu'}`;
                            return (
                                <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '12px', padding: '10px 14px', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600, margin: '0 0 6px' }}>
                                        ⚠️ Nội dung chuyển khoản (bắt buộc)
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <code style={{ flex: 1, background: 'white', border: '1.5px solid #fed7aa', borderRadius: '8px', padding: '8px 12px', fontSize: '0.95rem', fontWeight: 700, color: '#ef4444' }}>
                                            {content}
                                        </code>
                                        <button onClick={() => navigator.clipboard.writeText(content)}
                                            style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Upload minh chứng */}
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                            📤 Sau khi chuyển khoản, nộp ảnh minh chứng:
                        </p>
                        <input type="file" accept="image/*,.pdf"
                            onChange={e => setFeeProofFile(e.target.files?.[0] || null)}
                            style={{ padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }} />
                        {feeProofFile && <p style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '4px' }}>✅ Đã chọn: {feeProofFile.name}</p>}
                        {feeMsg && <p style={{ color: feeMsg.startsWith('✅') ? '#10b981' : '#ef4444', marginTop: '8px', fontSize: '0.88rem' }}>{feeMsg}</p>}

                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitFee} disabled={submittingFee || !feeProofFile}>
                                {submittingFee ? '⏳ Đang gửi...' : '📤 Nộp minh chứng'}
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

            {/* MODAL TỪ CHỐI ĐƠN ĐĂNG KÝ */}
            {rejectModal.open && (
                <div className="modal-overlay" onClick={() => setRejectModal({ open: false, id: null })}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                        <h3>❌ Từ chối đơn đăng ký</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Vui lòng cho biết lý do để học viên hiểu và cải thiện.
                        </p>
                        <div className="modal-form">
                            <label>Lý do từ chối</label>
                            <textarea
                                className="modal-input"
                                rows={3}
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="VD: Học viên chưa cung cấp đủ thông tin, lịch học không phù hợp, khu vực quá xa..."
                            />
                        </div>
                        {rejectMsg && <p style={{ color: '#ef4444', fontSize: '0.88rem', marginTop: '8px' }}>{rejectMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-danger" onClick={submitReject}>
                                ❌ Xác nhận từ chối
                            </button>
                            <button className="btn-outline" onClick={() => setRejectModal({ open: false, id: null })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BẢN ĐỒ */}
            {mapModal.open && mapModal.app && (
                <MapModal
                    studentName={mapModal.app.studentName}
                    studentAddress={mapModal.app.studentAddress}
                    tutorAddress={tutorAddress}
                    onClose={() => setMapModal({ open: false, app: null })}
                />
            )}

            <Footer />
        </div>
    );
}
