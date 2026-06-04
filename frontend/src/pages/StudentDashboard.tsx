import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Dashboard.css';

interface Registration {
    id: number;
    courseId: number;
    courseTitle: string;
    tutorName: string;
    status: string;
    pricePerSession: number;
    appliedAt: string;
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
    expiresAt: string;
    createdAt: string;
    verifiedAt: string | null;
    tutorBankName: string | null;
    tutorBankAccount: string | null;
    tutorBankOwner: string | null;
}

interface RefundRequest {
    id: number;
    paymentId: number;
    courseTitle: string;
    amount: number;
    reason: string;
    evidenceUrl: string;
    status: string; // PENDING | APPROVED | REJECTED
    adminNote: string | null;
    createdAt: string;
    resolvedAt: string | null;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    PENDING:    { label: 'Chờ duyệt',    color: '#f59e0b' },
    APPROVED:   { label: 'Đã duyệt',     color: '#3b82f6' },
    ACTIVE:     { label: 'Đang học',     color: '#10b981' },
    COMPLETED:  { label: 'Hoàn thành',   color: '#6366f1' },
    REJECTED:   { label: 'Bị từ chối',   color: '#ef4444' },
    CANCELLED_BY_ADMIN: { label: 'Bị hủy', color: '#ef4444' },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
    PENDING:         { label: 'Chờ nộp minh chứng', color: '#f59e0b' },
    PENDING_VERIFY:  { label: 'Chờ Admin duyệt',    color: '#3b82f6' },
    SUCCESS:         { label: 'Đã thanh toán',       color: '#10b981' },
    FAILED:          { label: 'Hết hạn',             color: '#ef4444' },
};

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [tab, setTabRaw] = useState<'courses' | 'payments' | 'notifications'>((searchParams.get('tab') as any) || 'courses');
    const setTab = (t: 'courses' | 'payments' | 'notifications') => { setTabRaw(t); setSearchParams({ tab: t }); };

    // Sub-filter trong tab courses
    const [courseFilter, setCourseFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'>('ALL');
    // Sub-filter trong tab payments
    const [payFilter, setPayFilter] = useState<'ALL' | 'PENDING' | 'PENDING_VERIFY' | 'SUCCESS'>('ALL');
    // Các filter đã xem — dùng để hiện chấm đỏ "mới"
    const [seenCourseFilters, setSeenCourseFilters] = useState<Set<string>>(new Set(['ALL']));
    const [seenPayFilters, setSeenPayFilters]       = useState<Set<string>>(new Set(['ALL']));
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [refunds, setRefunds] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal nộp proof
    const [proofModal, setProofModal] = useState<{ open: boolean; paymentId: number | null; payment: Payment | null }>({ open: false, paymentId: null, payment: null });
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofMsg, setProofMsg] = useState('');
    const [submittingProof, setSubmittingProof] = useState(false);

    // VietQR modal
    const [vietQRModal, setVietQRModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });
    const [adminPayInfo, setAdminPayInfo] = useState<{ bankName: string; bankAccount: string; bankOwner: string; qrImageUrl: string } | null>(null);

    // ZaloPay
    const [zaloPayModal, setZaloPayModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });
    const [zaloOrderUrl, setZaloOrderUrl] = useState('');
    const [zaloAppTransId, setZaloAppTransId] = useState('');
    const [zaloMsg, setZaloMsg] = useState('');
    const [zaloLoading, setZaloLoading] = useState(false);
    const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

    // Modal yêu cầu hoàn tiền
    const [refundModal, setRefundModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });
    const [refundReason, setRefundReason] = useState('');
    const [refundEvidenceFile, setRefundEvidenceFile] = useState<File | null>(null);
    const [refundMsg, setRefundMsg] = useState('');
    const [submittingRefund, setSubmittingRefund] = useState(false);

    useEffect(() => {
        fetchAll();
        api.get('/public/payment-info').then(res => setAdminPayInfo(res.data)).catch(console.error);
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [regRes, notiRes, payRes, refundRes] = await Promise.all([
                api.get('/student/registrations'),
                api.get('/notifications/my'),
                api.get('/payments/my'),
                api.get('/student/refunds/my'),
            ]);
            setRegistrations(regRes.data);
            setNotifications(notiRes.data);
            setPayments(payRes.data);
            setRefunds(refundRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const markRead = async (id: number) => {
        await api.put(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllRead = async () => {
        await api.put('/notifications/read-all');
        // Fetch lại từ BE để đảm bảo đồng bộ
        const res = await api.get('/notifications/my');
        setNotifications(res.data);
    };

    const handleCourseFilter = (key: typeof courseFilter) => {
        setCourseFilter(key);
        setSeenCourseFilters(prev => new Set([...prev, key]));
    };

    const handlePayFilter = (key: typeof payFilter) => {
        setPayFilter(key);
        setSeenPayFilters(prev => new Set([...prev, key]));
    };

    const completeCourse = async (id: number) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>Xác nhận hoàn thành khóa học này?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
                        onClick={async () => {
                            toast.dismiss(t.id);
                            await api.put(`/student/registrations/${id}/complete`);
                            toast.success('Đã xác nhận hoàn thành khóa học!');
                            fetchAll();
                        }}
                    >Xác nhận</button>
                    <button
                        style={{ background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
                        onClick={() => toast.dismiss(t.id)}
                    >Hủy</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const submitProof = async () => {
        if (!proofFile) { setProofMsg('Vui lòng chọn ảnh minh chứng'); return; }
        setSubmittingProof(true);
        try {
            const formData = new FormData();
            formData.append('proof', proofFile);
            await api.put(`/payments/${proofModal.paymentId}/submit-proof`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProofMsg('✅ Đã nộp minh chứng thành công! Chờ Admin duyệt.');
            setProofFile(null);
            fetchAll();
        } catch (e: any) {
            setProofMsg('❌ ' + (e.response?.data?.message || 'Lỗi khi nộp minh chứng'));
        } finally { setSubmittingProof(false); }
    };

    // ===== ZALOPAY =====
    const openZaloPay = async (pay: Payment) => {
        setZaloPayModal({ open: true, payment: pay });
        setZaloMsg('⏳ Đang tạo đơn hàng ZaloPay...');
        setZaloLoading(true);
        setZaloOrderUrl('');
        setZaloAppTransId('');
        try {
            const res = await api.post(`/payments/${pay.id}/zalopay/create`);
            if (res.data.return_code === 1) {
                setZaloOrderUrl(res.data.order_url);
                setZaloAppTransId(res.data.app_trans_id);
                setZaloMsg('✅ Đơn hàng tạo thành công! Bấm nút bên dưới để thanh toán.');
                // Bắt đầu polling
                startPolling(pay.id, res.data.app_trans_id);
            } else {
                setZaloMsg('❌ Lỗi tạo đơn: ' + (res.data.return_message || 'Thử lại sau'));
            }
        } catch (e: any) {
            setZaloMsg('❌ ' + (e.response?.data?.error || 'Không kết nối được ZaloPay'));
        } finally { setZaloLoading(false); }
    };

    const startPolling = (paymentId: number, appTransId: string) => {
        if (pollingInterval) clearInterval(pollingInterval);
        let approved = false; // flag đảm bảo chỉ xử lý 1 lần
        const interval = setInterval(async () => {
            if (approved) return; // đã xử lý rồi, bỏ qua
            try {
                const res = await api.get(`/payments/${paymentId}/zalopay/query`, { params: { appTransId } });
                if (res.data.return_code === 1) {
                    approved = true; // đánh dấu ngay lập tức trước khi làm gì khác
                    clearInterval(interval);
                    setPollingInterval(null);
                    setZaloMsg('🎉 Thanh toán thành công! Lớp học đã được kích hoạt.');
                    setZaloOrderUrl('');
                    fetchAll();
                    setTimeout(() => setZaloPayModal({ open: false, payment: null }), 2500);
                } else if (res.data.return_code === 2) {
                    clearInterval(interval);
                    setPollingInterval(null);
                    setZaloMsg('❌ Thanh toán thất bại hoặc bị hủy.');
                }
            } catch { /* ignore polling errors */ }
        }, 3000);
        setPollingInterval(interval);
    };

    const closeZaloModal = () => {
        if (pollingInterval) clearInterval(pollingInterval);
        setPollingInterval(null);
        setZaloPayModal({ open: false, payment: null });
        setZaloMsg(''); setZaloOrderUrl(''); setZaloAppTransId('');
    };

    // ===== VNPAY =====
    const openVNPay = async (paymentId: number) => {
        try {
            const res = await api.post(`/payments/${paymentId}/vnpay/create`);
            if (res.data.paymentUrl) {
                window.location.href = res.data.paymentUrl; // redirect sang VNPay
            } else {
                toast.error('❌ Không tạo được link VNPay: ' + (res.data.error || 'Lỗi không xác định'));
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || 'Lỗi kết nối');
        }
    };    const submitRefund = async () => {
        if (!refundReason.trim()) { setRefundMsg('❌ Vui lòng nhập lý do hoàn tiền'); return; }
        setSubmittingRefund(true);
        try {
            const formData = new FormData();
            formData.append('paymentId', String(refundModal.payment!.id));
            formData.append('reason', refundReason);
            if (refundEvidenceFile) formData.append('evidence', refundEvidenceFile);
            await api.post('/student/refunds', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setRefundMsg('✅ Đã gửi yêu cầu hoàn tiền! Admin sẽ xem xét trong 3-5 ngày làm việc.');
            setRefundReason('');
            setRefundEvidenceFile(null);
            fetchAll();
            setTimeout(() => { setRefundModal({ open: false, payment: null }); setRefundMsg(''); }, 2000);
        } catch (e: any) {
            setRefundMsg('❌ ' + (e.response?.data?.message || 'Lỗi gửi yêu cầu'));
        } finally { setSubmittingRefund(false); }
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="dashboard-page">
            <Header />
            <div className="dashboard-layout">
                {/* SIDEBAR */}
                <aside className="dash-sidebar">
                    <div className="dash-avatar">
                        <div className="avatar-circle">{user?.fullName?.charAt(0) || 'S'}</div>
                        <div>
                            <div className="dash-name">{user?.fullName}</div>
                            <div className="dash-role-badge student">Học viên</div>
                        </div>
                    </div>
                    <nav className="dash-nav">
                        <button className={tab === 'courses' ? 'active' : ''} onClick={() => setTab('courses')}>
                            📚 Khóa học của tôi
                        </button>
                        <button className={tab === 'payments' ? 'active' : ''} onClick={() => setTab('payments')}>
                            💳 Hóa đơn
                        </button>
                        <Link to="/courses" className="dash-nav-link">🔍 Tìm khóa học</Link>
                        <Link to="/profile" className="dash-nav-link">👤 Hồ sơ của tôi</Link>
                        <button className="logout-btn" onClick={logout}>🚪 Đăng xuất</button>
                    </nav>
                </aside>

                {/* MAIN */}
                <main className="dash-main">
                    {loading ? (
                        <div className="loading-spinner">Đang tải...</div>
                    ) : (
                        <>
                            {/* TAB: KHÓA HỌC */}
                            {tab === 'courses' && (
                                <div>
                                    <h2 className="dash-title">Khóa học của tôi</h2>
                                    {registrations.length === 0 ? (
                                        <div className="empty-state">
                                            <p>Bạn chưa đăng ký khóa học nào.</p>
                                            <Link to="/" className="btn-primary">Tìm khóa học ngay</Link>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Filter bar theo trạng thái */}
                                            <div className="course-filter-bar">
                                                {([
                                                    { key: 'ALL',       label: 'Tất cả',           color: '#64748b' },
                                                    { key: 'ACTIVE',    label: '📚 Đang học',       color: '#10b981' },
                                                    { key: 'PENDING',   label: '⏳ Chờ duyệt',      color: '#f59e0b' },
                                                    { key: 'APPROVED',  label: '💳 Chờ đóng tiền',  color: '#3b82f6' },
                                                    { key: 'COMPLETED', label: '🎓 Hoàn thành',     color: '#6366f1' },
                                                    { key: 'REJECTED',  label: '✖ Từ chối',        color: '#ef4444' },
                                                ] as const).map(f => {
                                                    const count = f.key === 'ALL'
                                                        ? registrations.length
                                                        : registrations.filter(r => r.status === f.key).length;
                                                    if (f.key !== 'ALL' && count === 0) return null;
                                                    const hasNew = f.key !== 'ALL' && count > 0 && !seenCourseFilters.has(f.key);
                                                    return (
                                                        <button
                                                            key={f.key}
                                                            className={`course-filter-btn ${courseFilter === f.key ? 'active' : ''}`}
                                                            style={{ '--filter-color': f.color } as any}
                                                            onClick={() => handleCourseFilter(f.key)}
                                                        >
                                                            {hasNew && <span className="filter-dot" />}
                                                            {f.label}
                                                            <span className="course-filter-count">{count}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Danh sách đã lọc */}
                                            <div className="card-list">
                                                {registrations
                                                    .filter(r => courseFilter === 'ALL' || r.status === courseFilter)
                                                    .map(reg => {
                                                    const s = STATUS_LABEL[reg.status] || { label: reg.status, color: '#64748b' };
                                                    const canEnter = reg.status === 'ACTIVE' || reg.status === 'COMPLETED';
                                                    return (
                                                        <div key={reg.id} className={`reg-card ${canEnter ? 'reg-card-clickable' : ''}`}>
                                                            <div className="reg-card-header">
                                                                <h3>
                                                                    <Link
                                                                        to={`/courses/${reg.courseId}`}
                                                                        className="reg-title-link"
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        {reg.courseTitle}
                                                                    </Link>
                                                                </h3>
                                                                <span className="status-badge" style={{ background: s.color }}>{s.label}</span>
                                                            </div>
                                                            <p className="reg-tutor">👨‍🏫 Gia sư: <strong>{reg.tutorName}</strong></p>
                                                            <p className="reg-price">💰 {reg.pricePerSession?.toLocaleString('vi-VN')}đ / buổi</p>
                                                            <p className="reg-date">📅 Đăng ký: {new Date(reg.appliedAt).toLocaleDateString('vi-VN')}</p>
                                                            <div className="reg-actions">
                                                                {reg.status === 'ACTIVE' && (
                                                                    <Link to={`/student/course/${reg.courseId}`} className="btn-sm btn-primary">📅 Vào lớp học</Link>
                                                                )}
                                                                {reg.status === 'COMPLETED' && (
                                                                    <>
                                                                        <Link to={`/student/course/${reg.courseId}`} className="btn-sm btn-outline">📖 Xem lại lớp học</Link>
                                                                        <Link to={`/student/review/${reg.id}`} className="btn-sm btn-primary">⭐ Đánh giá</Link>
                                                                    </>
                                                                )}
                                                                {reg.status === 'APPROVED' && (
                                                                    <button className="btn-sm btn-primary" onClick={() => setTab('payments')}>
                                                                        💳 Đóng học phí ngay
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {registrations.filter(r => courseFilter === 'ALL' || r.status === courseFilter).length === 0 && (
                                                    <div className="empty-state"><p>Không có khóa học nào trong mục này.</p></div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB: HÓA ĐƠN */}
                            {tab === 'payments' && (
                                <div>
                                    <h2 className="dash-title">Hóa đơn của tôi</h2>
                                    {payments.filter(p => p.paymentType === 'TUITION_FEE').length === 0 ? (
                                        <div className="empty-state"><p>Chưa có hóa đơn nào.</p></div>
                                    ) : (
                                        <>
                                        {/* Filter bar hóa đơn */}
                                        <div className="course-filter-bar">
                                            {([
                                                { key: 'ALL',            label: 'Tất cả',            color: '#64748b' },
                                                { key: 'PENDING',        label: '⏳ Chờ thanh toán',  color: '#f59e0b' },
                                                { key: 'PENDING_VERIFY', label: '🔍 Chờ xác nhận',   color: '#3b82f6' },
                                                { key: 'SUCCESS',        label: '✅ Đã thanh toán',   color: '#10b981' },
                                            ] as const).map(f => {
                                                const tuitionPayments = payments.filter(p => p.paymentType === 'TUITION_FEE');
                                                const count = f.key === 'ALL'
                                                    ? tuitionPayments.length
                                                    : tuitionPayments.filter(p => p.status === f.key).length;
                                                if (f.key !== 'ALL' && count === 0) return null;
                                                const hasNew = f.key !== 'ALL' && count > 0 && !seenPayFilters.has(f.key);
                                                return (
                                                    <button
                                                        key={f.key}
                                                        className={`course-filter-btn ${payFilter === f.key ? 'active' : ''}`}
                                                        style={{ '--filter-color': f.color } as any}
                                                        onClick={() => handlePayFilter(f.key)}
                                                    >
                                                        {hasNew && <span className="filter-dot" />}
                                                        {f.label}
                                                        <span className="course-filter-count">{count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div className="card-list">
                                            {payments.filter(p => p.paymentType === 'TUITION_FEE'
                                                && (payFilter === 'ALL' || p.status === payFilter)).map(pay => {
                                                const ps = PAYMENT_STATUS[pay.status] || { label: pay.status, color: '#64748b' };
                                                const isExpired = pay.expiresAt && new Date(pay.expiresAt) < new Date();
                                                const hasRefund = refunds.some(r => r.paymentId === pay.id);
                                                return (
                                                    <div key={pay.id} className="reg-card">
                                                        <div className="reg-card-header">
                                                            <h3>{pay.courseTitle || 'Học phí khóa học'}</h3>
                                                            <span className="status-badge" style={{ background: ps.color }}>{ps.label}</span>
                                                        </div>
                                                        <p>💰 Số tiền: <strong>{pay.amount?.toLocaleString('vi-VN')}đ</strong></p>
                                                        <p>📅 Ngày tạo: {new Date(pay.createdAt).toLocaleDateString('vi-VN')}</p>
                                                        {pay.verifiedAt && (
                                                            <p>✅ Xác nhận: {new Date(pay.verifiedAt).toLocaleDateString('vi-VN')}</p>
                                                        )}
                                                        {pay.expiresAt && pay.status === 'PENDING' && (
                                                            <p style={{ color: isExpired ? '#ef4444' : '#f59e0b' }}>
                                                                ⏰ Hạn nộp: {new Date(pay.expiresAt).toLocaleString('vi-VN')}
                                                                {isExpired && ' (Đã hết hạn)'}
                                                            </p>
                                                        )}
                                                        {/* Thông tin chuyển khoản → nút VietQR */}
                                                        <div className="reg-actions">
                                                            {pay.status === 'PENDING' && !isExpired && (
                                                                <>
                                                                    <button className="btn-sm btn-primary"
                                                                        onClick={() => { setProofModal({ open: true, paymentId: pay.id, payment: pay }); setProofMsg(''); }}>
                                                                        📤 Nộp minh chứng
                                                                    </button>
                                                                    <button className="btn-sm" style={{ background: '#005BAA', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                                                                        onClick={() => setVietQRModal({ open: true, payment: pay })}>
                                                                        📱 VietQR
                                                                    </button>
                                                                    <button className="btn-sm" style={{ background: '#0068ff', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                                                                        onClick={() => openZaloPay(pay)}>
                                                                        💙 ZaloPay
                                                                    </button>
                                                                    <button className="btn-sm" style={{ background: '#e5001a', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                                                                        onClick={() => openVNPay(pay.id)}>
                                                                        🏦 VNPay
                                                                    </button>
                                                                </>
                                                            )}
                                                            {pay.status === 'SUCCESS' && !hasRefund && (
                                                                <button className="btn-sm btn-danger"
                                                                    onClick={() => { setRefundModal({ open: true, payment: pay }); setRefundMsg(''); setRefundReason(''); setRefundEvidenceFile(null); }}>
                                                                    🔄 Yêu cầu hoàn tiền
                                                                </button>
                                                            )}
                                                            {hasRefund && (
                                                                <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
                                                                    ⏳ Đã gửi yêu cầu hoàn tiền
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        </>
                                    )}

                                    {/* Lịch sử yêu cầu hoàn tiền */}
                                    {refunds.length > 0 && (
                                        <div style={{ marginTop: '2rem' }}>
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                                                🔄 Lịch sử yêu cầu hoàn tiền
                                            </h3>
                                            <div className="card-list">
                                                {refunds.map(r => {
                                                    const color = r.status === 'APPROVED' ? '#10b981' : r.status === 'REJECTED' ? '#ef4444' : '#f59e0b';
                                                    const label = r.status === 'APPROVED' ? '✅ Đã duyệt' : r.status === 'REJECTED' ? '❌ Từ chối' : '⏳ Đang xử lý';
                                                    return (
                                                        <div key={r.id} className="reg-card">
                                                            <div className="reg-card-header">
                                                                <h3>Hoàn tiền #{r.id} — {r.courseTitle}</h3>
                                                                <span className="status-badge" style={{ background: color }}>{label}</span>
                                                            </div>
                                                            <p>💰 Số tiền: <strong>{r.amount?.toLocaleString('vi-VN')}đ</strong></p>
                                                            <p>📝 Lý do: {r.reason}</p>
                                                            {r.adminNote && <p>💬 Admin: <em>{r.adminNote}</em></p>}
                                                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                                                📅 {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                                                                {r.resolvedAt && ` → Xử lý: ${new Date(r.resolvedAt).toLocaleDateString('vi-VN')}`}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: THÔNG BÁO — đã chuyển lên Header */}
                            {tab === 'notifications' && null}
                        </>
                    )}
                </main>
            </div>

            {/* MODAL NỘP PROOF */}
            {proofModal.open && (
                <div className="modal-overlay" onClick={() => setProofModal({ open: false, paymentId: null, payment: null })}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>📤 Nộp minh chứng chuyển khoản</h3>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                            Chụp ảnh hoặc chọn ảnh minh chứng chuyển khoản từ thiết bị:
                        </p>
                        <input
                            type="file"
                            accept="image/*,.pdf"
                            className="modal-input"
                            onChange={e => setProofFile(e.target.files?.[0] || null)}
                            style={{ padding: '8px' }}
                        />
                        {proofFile && <p style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '4px' }}>✅ Đã chọn: {proofFile.name}</p>}
                        {proofMsg && <p style={{ marginTop: '8px', color: proofMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{proofMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitProof} disabled={submittingProof}>
                                {submittingProof ? '⏳ Đang gửi...' : 'Xác nhận nộp'}
                            </button>
                            <button className="btn-outline" onClick={() => { setProofModal({ open: false, paymentId: null, payment: null }); setProofFile(null); setProofMsg(''); }}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VIETQR */}
            {vietQRModal.open && vietQRModal.payment && (() => {
                const transferContent = `HocPhi ${vietQRModal.payment.id} ${user?.fullName?.replace(/\s+/g, '') || ''}`;
                return (
                <div className="modal-overlay" onClick={() => setVietQRModal({ open: false, payment: null })}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#005BAA', color: 'white', padding: '8px 18px', borderRadius: '20px', fontWeight: 700, fontSize: '1rem' }}>
                                <span>📱</span> VietQR Chuyển khoản
                            </div>
                        </div>

                        {/* Số tiền */}
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 4px' }}>Số tiền cần chuyển</p>
                            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#005BAA', margin: 0 }}>
                                {vietQRModal.payment.amount?.toLocaleString('vi-VN')}đ
                            </p>
                        </div>

                        {/* QR Image */}
                        {adminPayInfo?.qrImageUrl ? (
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <img
                                    src={`http://localhost:8080/api/materials/download/${adminPayInfo.qrImageUrl}`}
                                    alt="QR chuyển khoản"
                                    style={{ width: 220, height: 220, objectFit: 'contain', borderRadius: '12px', border: '2px solid #e2e8f0' }}
                                />
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', background: '#f8fafc', borderRadius: '12px', marginBottom: '1rem' }}>
                                <p>⚠️ Admin chưa cập nhật ảnh QR</p>
                            </div>
                        )}

                        {/* Thông tin tài khoản */}
                        {adminPayInfo?.bankAccount && (
                            <div style={{ background: '#f0f7ff', border: '1.5px solid #bfdbfe', borderRadius: '12px', padding: '12px 16px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                                <p style={{ fontWeight: 700, color: '#1e40af', margin: '0 0 8px' }}>🏦 Thông tin tài khoản</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '6px 8px', color: '#374151' }}>
                                    <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                                    <strong>{adminPayInfo.bankName}</strong>
                                    <span style={{ color: '#64748b' }}>Số TK:</span>
                                    <strong style={{ letterSpacing: '1px', fontSize: '1rem', color: '#005BAA' }}>{adminPayInfo.bankAccount}</strong>
                                    <span style={{ color: '#64748b' }}>Chủ TK:</span>
                                    <strong>{adminPayInfo.bankOwner}</strong>
                                    <span style={{ color: '#64748b' }}>Số tiền:</span>
                                    <strong style={{ color: '#005BAA' }}>{vietQRModal.payment.amount?.toLocaleString('vi-VN')}đ</strong>
                                </div>
                            </div>
                        )}

                        {/* Nội dung chuyển khoản — nổi bật + copy */}
                        <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '12px', padding: '12px 16px', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600, margin: '0 0 6px' }}>
                                ⚠️ Nội dung chuyển khoản (bắt buộc nhập đúng)
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <code style={{ flex: 1, background: 'white', border: '1.5px solid #fed7aa', borderRadius: '8px', padding: '8px 12px', fontSize: '1rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.5px' }}>
                                    {transferContent}
                                </code>
                                <button
                                    onClick={() => { navigator.clipboard.writeText(transferContent); toast.success('Đã copy nội dung chuyển khoản!'); }}
                                    style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                    📋 Copy
                                </button>
                            </div>
                            <p style={{ fontSize: '0.78rem', color: '#92400e', margin: '6px 0 0' }}>
                                Khóa học: <strong>{vietQRModal.payment.courseTitle}</strong>
                            </p>
                        </div>

                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', marginBottom: '1rem' }}>
                            Sau khi chuyển khoản, vui lòng nộp minh chứng để Admin xác nhận
                        </p>

                        <div className="modal-actions">
                            <button className="btn-primary" onClick={() => {
                                setVietQRModal({ open: false, payment: null });
                                setProofModal({ open: true, paymentId: vietQRModal.payment!.id, payment: vietQRModal.payment });
                                setProofMsg('');
                            }}>📤 Nộp minh chứng</button>
                            <button className="btn-outline" onClick={() => setVietQRModal({ open: false, payment: null })}>Đóng</button>
                        </div>
                    </div>
                </div>
                );
            })()}

            {/* MODAL ZALOPAY */}            {zaloPayModal.open && zaloPayModal.payment && (
                <div className="modal-overlay" onClick={closeZaloModal}>
                    <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>💙</div>
                            <h3 style={{ margin: 0, color: '#0068ff' }}>Thanh toán qua ZaloPay</h3>
                        </div>
                        <div style={{ background: '#f0f7ff', borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem', fontSize: '0.88rem' }}>
                            <p style={{ margin: '2px 0' }}>📚 <strong>{zaloPayModal.payment.courseTitle}</strong></p>
                            <p style={{ margin: '2px 0' }}>💰 Số tiền: <strong style={{ color: '#0068ff', fontSize: '1.1rem' }}>{zaloPayModal.payment.amount?.toLocaleString('vi-VN')}đ</strong></p>
                            <p style={{ margin: '2px 0', fontSize: '0.8rem', color: '#64748b' }}>
                                Nội dung: <em>KetNoiGiaSu - {user?.fullName} thanh toan hoc phi - Ma HD #{zaloPayModal.payment.id}</em>
                            </p>
                        </div>

                        <p style={{ textAlign: 'center', color: zaloMsg.startsWith('🎉') ? '#10b981' : zaloMsg.startsWith('❌') ? '#ef4444' : '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            {zaloMsg || '⏳ Đang xử lý...'}
                        </p>

                        {zaloOrderUrl && (
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <a href={zaloOrderUrl} target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'inline-block', background: '#0068ff', color: 'white', padding: '12px 28px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
                                    💙 Mở ZaloPay để thanh toán
                                </a>
                                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '8px' }}>
                                    Hệ thống tự động xác nhận sau khi bạn thanh toán xong
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '6px', color: '#64748b', fontSize: '0.8rem' }}>
                                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
                                    Đang chờ xác nhận thanh toán...
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="btn-outline" onClick={closeZaloModal}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL YÊU CẦU HOÀN TIỀN */}
            {refundModal.open && refundModal.payment && (
                <div className="modal-overlay" onClick={() => setRefundModal({ open: false, payment: null })}>
                    <div className="modal-box" onClick={e => e.stopPropagation()}>
                        <h3>🔄 Yêu cầu hoàn tiền</h3>
                        <p style={{ color: '#64748b', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Khóa học: <strong>{refundModal.payment.courseTitle}</strong><br/>
                            Số tiền: <strong>{refundModal.payment.amount?.toLocaleString('vi-VN')}đ</strong>
                        </p>
                        <div className="modal-form">
                            <label>Lý do hoàn tiền *</label>
                            <textarea className="modal-input" rows={4}
                                value={refundReason}
                                onChange={e => setRefundReason(e.target.value)}
                                placeholder="Ví dụ: Gia sư không dạy đúng cam kết, lớp học bị hủy đột ngột..." />
                            <label>Minh chứng sự cố (ảnh từ thiết bị, tùy chọn)</label>
                            <input type="file" accept="image/*,.pdf"
                                onChange={e => setRefundEvidenceFile(e.target.files?.[0] || null)}
                                style={{ padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', width: '100%', boxSizing: 'border-box' }} />
                            {refundEvidenceFile && (
                                <p style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '4px' }}>✅ Đã chọn: {refundEvidenceFile.name}</p>
                            )}
                        </div>
                        {refundMsg && (
                            <p style={{ marginTop: '8px', color: refundMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>
                                {refundMsg}
                            </p>
                        )}
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitRefund} disabled={submittingRefund}>
                                {submittingRefund ? '⏳ Đang gửi...' : '📤 Gửi yêu cầu'}
                            </button>
                            <button className="btn-outline" onClick={() => { setRefundModal({ open: false, payment: null }); setRefundEvidenceFile(null); }}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
