import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
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
    const tab = (searchParams.get('tab') as 'courses' | 'payments' | 'notifications') || 'courses';
    const setTab = (t: 'courses' | 'payments' | 'notifications') => setSearchParams({ tab: t });
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [refunds, setRefunds] = useState<RefundRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal nộp proof
    const [proofModal, setProofModal] = useState<{ open: boolean; paymentId: number | null }>({ open: false, paymentId: null });
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [proofMsg, setProofMsg] = useState('');
    const [submittingProof, setSubmittingProof] = useState(false);

    // Modal yêu cầu hoàn tiền
    const [refundModal, setRefundModal] = useState<{ open: boolean; payment: Payment | null }>({ open: false, payment: null });
    const [refundReason, setRefundReason] = useState('');
    const [refundEvidenceFile, setRefundEvidenceFile] = useState<File | null>(null);
    const [refundMsg, setRefundMsg] = useState('');
    const [submittingRefund, setSubmittingRefund] = useState(false);

    useEffect(() => {
        fetchAll();
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

    const completeCourse = async (id: number) => {
        if (!confirm('Xác nhận hoàn thành khóa học này?')) return;
        await api.put(`/student/registrations/${id}/complete`);
        fetchAll();
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

    const submitRefund = async () => {
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
                        <button className={tab === 'notifications' ? 'active' : ''} onClick={() => setTab('notifications')}>
                            🔔 Thông báo {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
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
                                        <div className="card-list">
                                            {registrations.map(reg => {
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
                                                                <>
                                                                    <Link to={`/student/course/${reg.courseId}`} className="btn-sm btn-primary">📅 Vào lớp học</Link>
                                                                    <button className="btn-sm btn-outline" onClick={() => completeCourse(reg.id)}>✅ Hoàn thành</button>
                                                                </>
                                                            )}
                                                            {reg.status === 'COMPLETED' && (
                                                                <>
                                                                    <Link to={`/student/course/${reg.courseId}`} className="btn-sm btn-outline">📖 Xem lại lớp học</Link>
                                                                    <Link to={`/student/review/${reg.id}`} className="btn-sm btn-primary">⭐ Đánh giá</Link>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
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
                                        <div className="card-list">
                                            {payments.filter(p => p.paymentType === 'TUITION_FEE').map(pay => {
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
                                                        {/* Thông tin chuyển khoản — hiện khi cần nộp tiền */}
                                                        {pay.status === 'PENDING' && !isExpired && pay.tutorBankAccount && (
                                                            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '10px 14px', margin: '8px 0', fontSize: '0.88rem' }}>
                                                                <p style={{ fontWeight: 700, color: '#065f46', margin: '0 0 6px' }}>🏦 Thông tin chuyển khoản:</p>
                                                                <p style={{ margin: '2px 0', color: '#374151' }}>Ngân hàng: <strong>{pay.tutorBankName}</strong></p>
                                                                <p style={{ margin: '2px 0', color: '#374151' }}>Số TK: <strong style={{ fontSize: '1rem', letterSpacing: '1px' }}>{pay.tutorBankAccount}</strong></p>
                                                                <p style={{ margin: '2px 0', color: '#374151' }}>Chủ TK: <strong>{pay.tutorBankOwner}</strong></p>
                                                                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>Nội dung CK: <strong>HocPhi #{pay.id}</strong></p>
                                                            </div>
                                                        )}
                                                        {pay.status === 'PENDING' && !isExpired && !pay.tutorBankAccount && (
                                                            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '10px 14px', margin: '8px 0', fontSize: '0.85rem', color: '#92400e' }}>
                                                                ⚠️ Gia sư chưa cập nhật thông tin tài khoản. Vui lòng liên hệ gia sư qua chat.
                                                            </div>
                                                        )}
                                                        <div className="reg-actions">
                                                            {pay.status === 'PENDING' && !isExpired && (
                                                                <button className="btn-sm btn-primary"
                                                                    onClick={() => { setProofModal({ open: true, paymentId: pay.id }); setProofMsg(''); }}>
                                                                    📤 Nộp minh chứng
                                                                </button>
                                                            )}                                                            {pay.status === 'SUCCESS' && !hasRefund && (
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

                            {/* TAB: THÔNG BÁO */}
                            {tab === 'notifications' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 className="dash-title" style={{ margin: 0 }}>Thông báo</h2>
                                        {unreadCount > 0 && (
                                            <button className="btn-sm btn-outline" onClick={markAllRead}>Đọc tất cả</button>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="empty-state"><p>Chưa có thông báo nào.</p></div>
                                    ) : (
                                        <div className="noti-list">
                                            {notifications.map(n => (
                                                <div
                                                    key={n.id}
                                                    className={`noti-item ${!n.isRead ? 'unread' : ''}`}
                                                    onClick={() => !n.isRead && markRead(n.id)}
                                                >
                                                    <div className="noti-dot" style={{ background: n.isRead ? '#e2e8f0' : '#4f46e5' }} />
                                                    <div className="noti-content">
                                                        <p>{n.message}</p>
                                                        <span>{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                                                    </div>
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

            {/* MODAL NỘP PROOF */}
            {proofModal.open && (
                <div className="modal-overlay" onClick={() => setProofModal({ open: false, paymentId: null })}>
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
                            <button className="btn-outline" onClick={() => { setProofModal({ open: false, paymentId: null }); setProofFile(null); setProofMsg(''); }}>Hủy</button>
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
