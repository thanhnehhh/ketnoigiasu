import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    const [tab, setTab] = useState<'courses' | 'payments' | 'notifications'>('courses');
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal nộp proof
    const [proofModal, setProofModal] = useState<{ open: boolean; paymentId: number | null }>({ open: false, paymentId: null });
    const [proofUrl, setProofUrl] = useState('');
    const [proofMsg, setProofMsg] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [regRes, notiRes, payRes] = await Promise.all([
                api.get('/student/registrations'),
                api.get('/notifications/my'),
                api.get('/payments/my'),
            ]);
            setRegistrations(regRes.data);
            setNotifications(notiRes.data);
            setPayments(payRes.data);
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
        if (!proofUrl.trim()) { setProofMsg('Vui lòng nhập URL minh chứng'); return; }
        try {
            await api.put(`/payments/${proofModal.paymentId}/submit-proof`, { proofImageUrl: proofUrl });
            setProofMsg('✅ Đã nộp minh chứng thành công! Chờ Admin duyệt.');
            setProofUrl('');
            fetchAll();
        } catch (e: any) {
            setProofMsg('❌ ' + (e.response?.data?.message || 'Lỗi khi nộp minh chứng'));
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
                                                return (
                                                    <div key={reg.id} className="reg-card">
                                                        <div className="reg-card-header">
                                                            <h3>{reg.courseTitle}</h3>
                                                            <span className="status-badge" style={{ background: s.color }}>{s.label}</span>
                                                        </div>
                                                        <p className="reg-tutor">👨‍🏫 Gia sư: <strong>{reg.tutorName}</strong></p>
                                                        <p className="reg-price">💰 {reg.pricePerSession?.toLocaleString('vi-VN')}đ / buổi</p>
                                                        <p className="reg-date">📅 Đăng ký: {new Date(reg.appliedAt).toLocaleDateString('vi-VN')}</p>
                                                        <div className="reg-actions">
                                                            {reg.status === 'ACTIVE' && (
                                                                <>
                                                                    <Link to={`/student/course/${reg.courseId}`} className="btn-sm btn-primary">📅 Vào lớp học</Link>
                                                                    <Link to={`/student/course/${reg.courseId}`} className="btn-sm btn-outline">📁 Tài liệu</Link>
                                                                    <button className="btn-sm btn-outline" onClick={() => completeCourse(reg.id)}>✅ Hoàn thành</button>
                                                                </>
                                                            )}
                                                            {reg.status === 'COMPLETED' && (
                                                                <Link to={`/student/review/${reg.id}`} className="btn-sm btn-primary">⭐ Đánh giá</Link>
                                                            )}
                                                        </div>                                                    </div>
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
                                                return (
                                                    <div key={pay.id} className="reg-card">
                                                        <div className="reg-card-header">
                                                            <h3>{pay.courseTitle || 'Học phí khóa học'}</h3>
                                                            <span className="status-badge" style={{ background: ps.color }}>{ps.label}</span>
                                                        </div>
                                                        <p>💰 Số tiền: <strong>{pay.amount?.toLocaleString('vi-VN')}đ</strong></p>
                                                        {pay.expiresAt && (
                                                            <p style={{ color: isExpired ? '#ef4444' : '#f59e0b' }}>
                                                                ⏰ Hạn nộp: {new Date(pay.expiresAt).toLocaleString('vi-VN')}
                                                                {isExpired && ' (Đã hết hạn)'}
                                                            </p>
                                                        )}
                                                        {pay.status === 'PENDING' && !isExpired && (
                                                            <button
                                                                className="btn-sm btn-primary"
                                                                style={{ marginTop: '10px' }}
                                                                onClick={() => { setProofModal({ open: true, paymentId: pay.id }); setProofMsg(''); }}
                                                            >
                                                                📤 Nộp minh chứng chuyển khoản
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
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
                            Chuyển khoản xong, nhập URL ảnh minh chứng (hoặc link Google Drive) bên dưới:
                        </p>
                        <input
                            type="text"
                            className="modal-input"
                            placeholder="https://drive.google.com/..."
                            value={proofUrl}
                            onChange={e => setProofUrl(e.target.value)}
                        />
                        {proofMsg && <p style={{ marginTop: '8px', color: proofMsg.startsWith('✅') ? '#10b981' : '#ef4444' }}>{proofMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitProof}>Xác nhận nộp</button>
                            <button className="btn-outline" onClick={() => setProofModal({ open: false, paymentId: null })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
