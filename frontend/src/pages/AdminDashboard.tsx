import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Dashboard.css';

interface Course { id: number; title: string; tutorName: string; tutorProfileId: number; status: string; subjectName: string; createdAt: string; }
interface Payment { id: number; userFullName: string; email: string; amount: number; paymentType: string; status: string; proofImageUrl: string; courseTitle: string; createdAt: string; }
interface Report { id: number; studentName: string; tutorName: string; title: string; content: string; status: string; createdAt: string; registrationId: number; }
interface Complaint { id: number; tutorName: string; reviewId: number; reason: string; status: string; createdAt: string; }
interface Contract { id: number; tutorId: number; tutorName: string; tutorEmail: string; contentSnapshot: string; status: string; signedAt: string | null; createdAt: string; }

type AdminTab = 'overview' | 'courses' | 'payments' | 'reports' | 'complaints' | 'contracts';

// ===== STAT CARD COMPONENT =====
function StatCard({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) {
    return (
        <div style={{
            background: 'white', borderRadius: '16px', padding: '1.5rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', gap: '1rem'
        }}>
            <div style={{
                width: 52, height: 52, borderRadius: '14px', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', flexShrink: 0
            }}>{icon}</div>
            <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1f2937', lineHeight: 1.1 }}>{value}</div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginTop: '2px' }}>{label}</div>
                {sub && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{sub}</div>}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [tab, setTab] = useState<AdminTab>('overview');
    const [courses, setCourses] = useState<Course[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [allPayments, setAllPayments] = useState<Payment[]>([]); // tất cả payment để tính doanh thu
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isErr, setIsErr] = useState(false);

    // Modal phát hành hợp đồng
    const [issueModal, setIssueModal] = useState(false);
    const [issueTutorId, setIssueTutorId] = useState('');
    const [issueTemplate, setIssueTemplate] = useState(
        `<h2>HỢP ĐỒNG GIA SƯ</h2>
<p>Hôm nay, chúng tôi ký kết hợp đồng với gia sư:</p>
<p><strong>Họ tên:</strong> {{TEN_GIA_SU}}</p>
<p><strong>Email:</strong> {{EMAIL}}</p>
<p><strong>Ngày ký:</strong> {{NGAY_TAO}}</p>
<h3>Điều khoản:</h3>
<ol>
  <li>Gia sư cam kết dạy đúng nội dung đã đăng ký.</li>
  <li>Phí sàn: 200.000đ/tháng, thanh toán trước khi tạo khóa học.</li>
  <li>Vi phạm chính sách sẽ bị khóa tài khoản vĩnh viễn.</li>
</ol>
<p>Chữ ký gia sư: {{CHU_KY}}</p>`
    );
    const [issueMsg, setIssueMsg] = useState('');

    // Modal xem nhật ký
    const [logModal, setLogModal] = useState<{ open: boolean; data: any }>({ open: false, data: null });

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [cRes, pRes, rRes, cmpRes, conRes, allPayRes] = await Promise.all([
                api.get('/admin/courses'),
                api.get('/admin/payments/pending'),
                api.get('/admin/interactions/reports'),
                api.get('/admin/interactions/complaints'),
                api.get('/admin/contracts/all'),
                api.get('/admin/payments/pending'), // dùng lại pending để tính
            ]);
            setCourses(cRes.data);
            setPayments(pRes.data);
            setReports(rRes.data);
            setComplaints(cmpRes.data);
            setContracts(conRes.data);
            setAllPayments(allPayRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const flash = (text: string, err = false) => {
        setMsg(text); setIsErr(err);
        setTimeout(() => setMsg(''), 3000);
    };

    // Courses
    const approveCourse = async (id: number) => {
        await api.put(`/admin/courses/${id}/approve`);
        flash('✅ Đã duyệt khóa học'); fetchAll();
    };
    const rejectCourse = async (id: number) => {
        const reason = prompt('Lý do từ chối:');
        if (reason === null) return;
        await api.put(`/admin/courses/${id}/reject`);
        flash('✅ Đã từ chối khóa học'); fetchAll();
    };
    const hideCourse = async (id: number) => {
        const reason = prompt('Lý do ẩn khóa học:');
        if (!reason) return;
        await api.put(`/admin/interactions/courses/${id}/hide`, null, { params: { reason } });
        flash('✅ Đã ẩn khóa học'); fetchAll();
    };

    // Payments
    const approvePayment = async (id: number) => {
        await api.put(`/admin/payments/${id}/approve`);
        flash('✅ Đã duyệt thanh toán'); fetchAll();
    };

    // Reports
    const resolveReport = async (id: number) => {
        const res = prompt('Hành động xử lý:\n- WARN: Cảnh báo gia sư\n- BAN: Khóa tài khoản gia sư\n\nNhập WARN hoặc BAN:');
        if (!res) return;
        await api.post(`/admin/interactions/reports/${id}/resolve`, null, { params: { resolution: res.toUpperCase() } });
        flash('✅ Đã xử lý báo cáo'); fetchAll();
    };

    // Complaints
    const resolveComplaint = async (id: number, accept: boolean) => {
        await api.post(`/admin/interactions/complaints/${id}/resolve`, null, { params: { accept } });
        flash(accept ? '✅ Đã chấp nhận — review đã bị gỡ' : '✅ Đã từ chối khiếu nại'); fetchAll();
    };

    // Contracts
    const issueContract = async () => {
        if (!issueTutorId.trim()) { setIssueMsg('Vui lòng nhập Tutor Profile ID'); return; }
        try {
            // POST /api/admin/contracts/issue?tutorId= body: HTML string
            await api.post(`/admin/contracts/issue`, issueTemplate, {
                params: { tutorId: parseInt(issueTutorId) },
                headers: { 'Content-Type': 'text/plain' },
            });
            setIssueMsg('✅ Đã phát hành hợp đồng!');
            fetchAll();
            setTimeout(() => { setIssueModal(false); setIssueMsg(''); setIssueTutorId(''); }, 1500);
        } catch (e: any) {
            setIssueMsg('❌ ' + (e.response?.data?.message || 'Lỗi phát hành'));
        }
    };
    const deleteContract = async (id: number) => {
        if (!confirm('Xóa hợp đồng này?')) return;
        await api.delete(`/admin/contracts/${id}`);
        flash('✅ Đã xóa hợp đồng'); fetchAll();
    };

    // Training log + cancel
    const viewLog = async (registrationId: number) => {
        try {
            const res = await api.get(`/admin/interactions/registrations/${registrationId}/log`);
            setLogModal({ open: true, data: res.data });
        } catch (e: any) {
            flash('❌ ' + (e.response?.data?.message || 'Không lấy được nhật ký'), true);
        }
    };
    const cancelRegistration = async (registrationId: number) => {
        const reason = prompt('Lý do hủy lớp học:');
        if (!reason) return;
        await api.post(`/admin/interactions/registrations/${registrationId}/cancel`, null, { params: { reason } });
        flash('✅ Đã hủy lớp học và thông báo hai bên'); fetchAll();
    };

    const pendingCourses = courses.filter(c => c.status === 'PENDING_APPROVE');
    const pendingContracts = contracts.filter(c => c.status === 'PENDING');
    const pendingCount = pendingCourses.length + payments.length
        + reports.filter(r => r.status === 'PENDING').length
        + complaints.filter(c => c.status === 'PENDING').length;

    const STATUS_COLOR: Record<string, string> = {
        PENDING_APPROVE: '#f59e0b', APPROVED: '#10b981', REJECTED: '#ef4444', HIDDEN: '#94a3b8',
        PENDING: '#f59e0b', PENDING_VERIFY: '#3b82f6', SUCCESS: '#10b981', RESOLVED: '#10b981',
        SIGNED: '#10b981', CANCELLED: '#ef4444',
    };

    return (
        <div className="dashboard-page">
            <Header />
            <div className="dashboard-layout">
                {/* SIDEBAR */}
                <aside className="dash-sidebar">
                    <div className="dash-avatar">
                        <div className="avatar-circle admin">{user?.fullName?.charAt(0) || 'A'}</div>
                        <div>
                            <div className="dash-name">{user?.fullName}</div>
                            <div className="dash-role-badge admin">Admin</div>
                        </div>
                    </div>
                    <nav className="dash-nav">
                        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
                            📊 Tổng quan
                        </button>
                        <button className={tab === 'courses' ? 'active' : ''} onClick={() => setTab('courses')}>
                            📚 Duyệt khóa học
                            {pendingCourses.length > 0 && <span className="badge">{pendingCourses.length}</span>}
                        </button>
                        <button className={tab === 'payments' ? 'active' : ''} onClick={() => setTab('payments')}>
                            💳 Duyệt thanh toán
                            {payments.length > 0 && <span className="badge">{payments.length}</span>}
                        </button>
                        <button className={tab === 'contracts' ? 'active' : ''} onClick={() => setTab('contracts')}>
                            📄 Hợp đồng
                            {pendingContracts.length > 0 && <span className="badge" style={{ background: '#f59e0b' }}>{pendingContracts.length}</span>}
                        </button>
                        <button className={tab === 'reports' ? 'active' : ''} onClick={() => setTab('reports')}>
                            🚨 Báo cáo vi phạm
                            {reports.filter(r => r.status === 'PENDING').length > 0 && <span className="badge">{reports.filter(r => r.status === 'PENDING').length}</span>}
                        </button>
                        <button className={tab === 'complaints' ? 'active' : ''} onClick={() => setTab('complaints')}>
                            📣 Khiếu nại review
                            {complaints.filter(c => c.status === 'PENDING').length > 0 && <span className="badge">{complaints.filter(c => c.status === 'PENDING').length}</span>}
                        </button>
                        <button className="logout-btn" onClick={logout}>🚪 Đăng xuất</button>
                    </nav>
                    {pendingCount > 0 && (
                        <div className="pending-summary">⚠️ Có <strong>{pendingCount}</strong> việc cần xử lý</div>
                    )}
                    {/* Hướng dẫn nhanh */}
                    <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#f0f9ff', borderRadius: '10px', fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.6 }}>
                        💡 <strong>Lưu ý:</strong> Khóa học chỉ hiện ở trang tìm kiếm khi có trạng thái <strong>Đã duyệt</strong>. Vào tab Duyệt khóa học để phê duyệt.
                    </div>
                </aside>

                {/* MAIN */}
                <main className="dash-main">
                    {msg && <div className={isErr ? 'alert alert-error' : 'flash-msg'} style={{ marginBottom: '1rem' }}>{msg}</div>}
                    {loading ? <div className="loading-spinner">Đang tải...</div> : (
                        <>
                            {/* TỔNG QUAN */}
                            {tab === 'overview' && (() => {
                                // Tính toán stats từ data đã fetch
                                const totalCourses    = courses.length;
                                const approvedCourses = courses.filter(c => c.status === 'APPROVED').length;
                                const pendingCourseCount = courses.filter(c => c.status === 'PENDING_APPROVE').length;
                                const hiddenCourses   = courses.filter(c => c.status === 'HIDDEN').length;

                                const signedContracts  = contracts.filter(c => c.status === 'SIGNED').length;
                                const pendingContracts = contracts.filter(c => c.status === 'PENDING').length;

                                const pendingPayCount  = payments.length;
                                const pendingReports   = reports.filter(r => r.status === 'PENDING').length;
                                const resolvedReports  = reports.filter(r => r.status === 'RESOLVED').length;
                                const pendingComplaints = complaints.filter(c => c.status === 'PENDING').length;

                                // Phân loại khóa học theo môn
                                const subjectCount: Record<string, number> = {};
                                courses.forEach(c => {
                                    if (c.subjectName) subjectCount[c.subjectName] = (subjectCount[c.subjectName] || 0) + 1;
                                });
                                const topSubjects = Object.entries(subjectCount)
                                    .sort((a, b) => b[1] - a[1]).slice(0, 5);

                                // Gia sư có nhiều khóa nhất
                                const tutorCount: Record<string, number> = {};
                                courses.forEach(c => {
                                    tutorCount[c.tutorName] = (tutorCount[c.tutorName] || 0) + 1;
                                });
                                const topTutors = Object.entries(tutorCount)
                                    .sort((a, b) => b[1] - a[1]).slice(0, 5);

                                return (
                                    <div>
                                        <h2 className="dash-title">Tổng quan hệ thống</h2>

                                        {/* STAT CARDS */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                            <StatCard icon="📚" label="Tổng khóa học" value={totalCourses}
                                                sub={`${approvedCourses} đã duyệt · ${pendingCourseCount} chờ duyệt`} color="#ede9fe" />
                                            <StatCard icon="📄" label="Hợp đồng" value={contracts.length}
                                                sub={`${signedContracts} đã ký · ${pendingContracts} chờ ký`} color="#dbeafe" />
                                            <StatCard icon="💳" label="Thanh toán chờ duyệt" value={pendingPayCount}
                                                sub="Cần xác nhận minh chứng" color="#fef3c7" />
                                            <StatCard icon="🚨" label="Báo cáo vi phạm" value={reports.length}
                                                sub={`${pendingReports} chờ xử lý · ${resolvedReports} đã xử lý`} color="#fee2e2" />
                                            <StatCard icon="📣" label="Khiếu nại review" value={complaints.length}
                                                sub={`${pendingComplaints} chờ xử lý`} color="#fce7f3" />
                                            <StatCard icon="🙈" label="Khóa học bị ẩn" value={hiddenCourses}
                                                sub="Do vi phạm chính sách" color="#f3f4f6" />
                                        </div>

                                        {/* VIỆC CẦN LÀM NGAY */}
                                        {(pendingCourseCount > 0 || pendingPayCount > 0 || pendingReports > 0 || pendingComplaints > 0 || pendingContracts > 0) && (
                                            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', marginBottom: '0.75rem' }}>
                                                    ⚠️ Việc cần xử lý ngay
                                                </h3>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                                    {pendingCourseCount > 0 && (
                                                        <button className="btn-sm btn-outline" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
                                                            onClick={() => setTab('courses')}>
                                                            📚 {pendingCourseCount} khóa học chờ duyệt
                                                        </button>
                                                    )}
                                                    {pendingPayCount > 0 && (
                                                        <button className="btn-sm btn-outline" style={{ color: '#3b82f6', borderColor: '#3b82f6' }}
                                                            onClick={() => setTab('payments')}>
                                                            💳 {pendingPayCount} thanh toán chờ duyệt
                                                        </button>
                                                    )}
                                                    {pendingContracts > 0 && (
                                                        <button className="btn-sm btn-outline" style={{ color: '#8b5cf6', borderColor: '#8b5cf6' }}
                                                            onClick={() => setTab('contracts')}>
                                                            📄 {pendingContracts} hợp đồng chờ ký
                                                        </button>
                                                    )}
                                                    {pendingReports > 0 && (
                                                        <button className="btn-sm btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                                            onClick={() => setTab('reports')}>
                                                            🚨 {pendingReports} báo cáo chờ xử lý
                                                        </button>
                                                    )}
                                                    {pendingComplaints > 0 && (
                                                        <button className="btn-sm btn-outline" style={{ color: '#ec4899', borderColor: '#ec4899' }}
                                                            onClick={() => setTab('complaints')}>
                                                            📣 {pendingComplaints} khiếu nại chờ xử lý
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* 2 CỘT: TOP MÔN HỌC + TOP GIA SƯ */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                            {/* Top môn học */}
                                            <div className="reg-card">
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                                                    📖 Môn học phổ biến nhất
                                                </h3>
                                                {topSubjects.length === 0 ? <p style={{ color: '#94a3b8' }}>Chưa có dữ liệu</p> : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {topSubjects.map(([subject, count], i) => (
                                                            <div key={subject} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <span style={{
                                                                    width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : '#cd7c2f',
                                                                    color: 'white', fontSize: '0.75rem', fontWeight: 700,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                                                }}>{i + 1}</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                                                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>{subject}</span>
                                                                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{count} khóa</span>
                                                                    </div>
                                                                    <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                                                        <div style={{
                                                                            height: '100%', borderRadius: 3,
                                                                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                                                            width: `${(count / (topSubjects[0]?.[1] || 1)) * 100}%`
                                                                        }} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Top gia sư */}
                                            <div className="reg-card">
                                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1rem' }}>
                                                    👨‍🏫 Gia sư nhiều khóa nhất
                                                </h3>
                                                {topTutors.length === 0 ? <p style={{ color: '#94a3b8' }}>Chưa có dữ liệu</p> : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                        {topTutors.map(([name, count], i) => (
                                                            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                <img
                                                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=32&bold=true&rounded=true`}
                                                                    alt={name} style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }}
                                                                />
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>{name}</span>
                                                                        <span style={{ fontSize: '0.82rem', color: '#64748b' }}>{count} khóa</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* TRẠNG THÁI KHÓA HỌC — DONUT CHART bằng CSS */}
                                        <div className="reg-card">
                                            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1f2937', marginBottom: '1.25rem' }}>
                                                📊 Phân bổ trạng thái khóa học
                                            </h3>
                                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                {[
                                                    { label: 'Đã duyệt',   count: approvedCourses,  color: '#10b981' },
                                                    { label: 'Chờ duyệt',  count: pendingCourseCount, color: '#f59e0b' },
                                                    { label: 'Bị từ chối', count: courses.filter(c => c.status === 'REJECTED').length, color: '#ef4444' },
                                                    { label: 'Đã ẩn',      count: hiddenCourses,    color: '#94a3b8' },
                                                ].map(s => (
                                                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 160 }}>
                                                        <div style={{
                                                            width: 48, height: 48, borderRadius: '50%',
                                                            background: `conic-gradient(${s.color} ${totalCourses > 0 ? (s.count / totalCourses) * 360 : 0}deg, #f1f5f9 0deg)`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: s.color }}>
                                                                {s.count}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#374151' }}>{s.label}</div>
                                                            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                                                                {totalCourses > 0 ? Math.round((s.count / totalCourses) * 100) : 0}%
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            {/* DUYỆT KHÓA HỌC */}
                            {tab === 'courses' && (
                                <div>
                                    <h2 className="dash-title">Quản lý khóa học</h2>
                                    {courses.length === 0 ? <div className="empty-state"><p>Chưa có khóa học nào.</p></div> : (
                                        <div className="card-list">
                                            {courses.map(c => (
                                                <div key={c.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>{c.title}</h3>
                                                        <span className="status-badge" style={{ background: STATUS_COLOR[c.status] || '#64748b' }}>
                                                            {c.status === 'PENDING_APPROVE' ? 'Chờ duyệt' : c.status === 'APPROVED' ? 'Đã duyệt' : c.status === 'REJECTED' ? 'Từ chối' : c.status}
                                                        </span>
                                                    </div>
                                                    <p>👨‍🏫 Gia sư: <strong>{c.tutorName}</strong> &nbsp;|&nbsp; 📖 {c.subjectName}</p>
                                                    <p>📅 {new Date(c.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    <div className="reg-actions">
                                                        {c.status === 'PENDING_APPROVE' && (
                                                            <>
                                                                <button className="btn-sm btn-primary" onClick={() => approveCourse(c.id)}>✅ Duyệt</button>
                                                                <button className="btn-sm btn-danger" onClick={() => rejectCourse(c.id)}>❌ Từ chối</button>
                                                            </>
                                                        )}
                                                        {c.status === 'APPROVED' && (
                                                            <button className="btn-sm btn-outline" onClick={() => hideCourse(c.id)}>🙈 Ẩn</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* DUYỆT THANH TOÁN */}
                            {tab === 'payments' && (
                                <div>
                                    <h2 className="dash-title">Duyệt thanh toán đang chờ</h2>
                                    {payments.length === 0 ? (
                                        <div className="empty-state"><p>Không có thanh toán nào đang chờ duyệt.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {payments.map(p => (
                                                <div key={p.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>{p.paymentType === 'PLATFORM_FEE' ? '💵 Phí sàn' : p.paymentType === 'PROMOTE' ? '🔥 Đẩy tin' : '🎓 Học phí'}</h3>
                                                        <span className="status-badge" style={{ background: '#3b82f6' }}>Chờ duyệt</span>
                                                    </div>
                                                    <p>👤 <strong>{p.userFullName}</strong> ({p.email})</p>
                                                    {p.courseTitle && <p>📚 Khóa học: {p.courseTitle}</p>}
                                                    <p>💰 <strong>{p.amount?.toLocaleString('vi-VN')}đ</strong></p>
                                                    {p.proofImageUrl && (
                                                        <p>🖼️ Minh chứng: <a href={p.proofImageUrl} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>Xem ảnh</a></p>
                                                    )}
                                                    <p>📅 {new Date(p.createdAt).toLocaleString('vi-VN')}</p>
                                                    <div className="reg-actions">
                                                        <button className="btn-sm btn-primary" onClick={() => approvePayment(p.id)}>✅ Duyệt</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* HỢP ĐỒNG */}
                            {tab === 'contracts' && (
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                        <h2 className="dash-title" style={{ margin: 0 }}>Quản lý hợp đồng</h2>
                                        <button className="btn-primary" onClick={() => { setIssueModal(true); setIssueMsg(''); setIssueTutorId(''); }}>
                                            + Phát hành hợp đồng
                                        </button>
                                    </div>
                                    {contracts.length === 0 ? (
                                        <div className="empty-state"><p>Chưa có hợp đồng nào.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {contracts.map(c => (
                                                <div key={c.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>📄 Hợp đồng #{c.id} — {c.tutorName}</h3>
                                                        <span className="status-badge" style={{ background: STATUS_COLOR[c.status] || '#64748b' }}>
                                                            {c.status === 'PENDING' ? 'Chờ ký' : c.status === 'SIGNED' ? 'Đã ký' : 'Đã hủy'}
                                                        </span>
                                                    </div>
                                                    <p>📧 {c.tutorEmail}</p>
                                                    <p>📅 Phát hành: {new Date(c.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    {c.signedAt && <p>✅ Ký ngày: {new Date(c.signedAt).toLocaleDateString('vi-VN')}</p>}
                                                    <div className="reg-actions">
                                                        <button className="btn-sm btn-danger" onClick={() => deleteContract(c.id)}>🗑️ Xóa</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BÁO CÁO VI PHẠM */}
                            {tab === 'reports' && (
                                <div>
                                    <h2 className="dash-title">Báo cáo vi phạm</h2>
                                    {reports.length === 0 ? (
                                        <div className="empty-state"><p>Không có báo cáo nào.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {reports.map(r => (
                                                <div key={r.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>{r.title}</h3>
                                                        <span className="status-badge" style={{ background: r.status === 'PENDING' ? '#f59e0b' : '#10b981' }}>
                                                            {r.status === 'PENDING' ? 'Chờ xử lý' : 'Đã xử lý'}
                                                        </span>
                                                    </div>
                                                    <p>👤 <strong>{r.studentName}</strong> tố cáo gia sư <strong>{r.tutorName}</strong></p>
                                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{r.content}</p>
                                                    <p>📅 {new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    <div className="reg-actions">
                                                        {/* Xem nhật ký lớp học liên quan */}
                                                        <button className="btn-sm btn-outline" onClick={() => viewLog(r.registrationId)}>
                                                            📋 Xem nhật ký lớp
                                                        </button>
                                                        {/* Hủy lớp học */}
                                                        <button className="btn-sm btn-outline" onClick={() => cancelRegistration(r.registrationId)}
                                                            style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>
                                                            🚫 Hủy lớp học
                                                        </button>
                                                        {r.status === 'PENDING' && (
                                                            <button className="btn-sm btn-danger" onClick={() => resolveReport(r.id)}>⚖️ Xử lý vi phạm</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* KHIẾU NẠI REVIEW */}
                            {tab === 'complaints' && (
                                <div>
                                    <h2 className="dash-title">Khiếu nại đánh giá</h2>
                                    {complaints.length === 0 ? (
                                        <div className="empty-state"><p>Không có khiếu nại nào.</p></div>
                                    ) : (
                                        <div className="card-list">
                                            {complaints.map(c => (
                                                <div key={c.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>Khiếu nại review #{c.reviewId}</h3>
                                                        <span className="status-badge" style={{ background: c.status === 'PENDING' ? '#f59e0b' : '#10b981' }}>
                                                            {c.status === 'PENDING' ? 'Chờ xử lý' : c.status}
                                                        </span>
                                                    </div>
                                                    <p>👨‍🏫 Gia sư: <strong>{c.tutorName}</strong></p>
                                                    <p>📝 Lý do: {c.reason}</p>
                                                    <p>📅 {new Date(c.createdAt).toLocaleDateString('vi-VN')}</p>
                                                    {c.status === 'PENDING' && (
                                                        <div className="reg-actions">
                                                            <button className="btn-sm btn-primary" onClick={() => resolveComplaint(c.id, true)}>✅ Chấp nhận (gỡ review)</button>
                                                            <button className="btn-sm btn-danger" onClick={() => resolveComplaint(c.id, false)}>❌ Từ chối</button>
                                                        </div>
                                                    )}
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

            {/* MODAL PHÁT HÀNH HỢP ĐỒNG */}
            {issueModal && (
                <div className="modal-overlay" onClick={() => setIssueModal(false)}>
                    <div className="modal-box" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
                        <h3>📄 Phát hành hợp đồng cho gia sư</h3>
                        <div className="modal-form">
                            <label>Tutor Profile ID *</label>
                            <input className="modal-input" type="number" value={issueTutorId}
                                onChange={e => setIssueTutorId(e.target.value)}
                                placeholder="Nhập ID profile gia sư (xem trong DB hoặc URL)" />
                            <label>Nội dung hợp đồng (HTML) *</label>
                            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '6px' }}>
                                Dùng placeholder: <code>{'{{TEN_GIA_SU}}'}</code>, <code>{'{{EMAIL}}'}</code>, <code>{'{{NGAY_TAO}}'}</code>, <code>{'{{CHU_KY}}'}</code>
                            </p>
                            <textarea className="modal-input" rows={10} value={issueTemplate}
                                onChange={e => setIssueTemplate(e.target.value)} style={{ fontFamily: 'monospace', fontSize: '0.82rem' }} />
                        </div>
                        {issueMsg && <p style={{ color: issueMsg.startsWith('✅') ? '#10b981' : '#ef4444', marginTop: '8px' }}>{issueMsg}</p>}
                        <div className="modal-actions">
                            <button className="btn-primary" onClick={issueContract}>📤 Phát hành</button>
                            <button className="btn-outline" onClick={() => setIssueModal(false)}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XEM NHẬT KÝ LỚP HỌC */}
            {logModal.open && logModal.data && (
                <div className="modal-overlay" onClick={() => setLogModal({ open: false, data: null })}>
                    <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <h3>📋 Nhật ký lớp học</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.92rem' }}>
                            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1rem' }}>
                                <p><strong>Khóa học:</strong> {logModal.data.courseName}</p>
                                <p><strong>Học viên:</strong> {logModal.data.studentName}</p>
                                <p><strong>Gia sư:</strong> {logModal.data.tutorName}</p>
                                <p><strong>Trạng thái:</strong>
                                    <span className="status-badge" style={{ background: '#3b82f6', marginLeft: '8px' }}>
                                        {logModal.data.status}
                                    </span>
                                </p>
                                <p><strong>Ngày đăng ký:</strong> {logModal.data.appliedAt ? new Date(logModal.data.appliedAt).toLocaleDateString('vi-VN') : '—'}</p>
                                <p><strong>Cập nhật:</strong> {logModal.data.updatedAt ? new Date(logModal.data.updatedAt).toLocaleDateString('vi-VN') : '—'}</p>
                                {logModal.data.notes && logModal.data.notes !== 'Chưa có ghi chú' && (
                                    <p><strong>Ghi chú:</strong> {logModal.data.notes}</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-actions" style={{ marginTop: '1rem' }}>
                            <button className="btn-outline" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}
                                onClick={() => { cancelRegistration(logModal.data.registrationId); setLogModal({ open: false, data: null }); }}>
                                🚫 Hủy lớp học này
                            </button>
                            <button className="btn-outline" onClick={() => setLogModal({ open: false, data: null })}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
