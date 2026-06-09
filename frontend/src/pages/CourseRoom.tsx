import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatBox from '../components/ChatBox';
import '../css/CourseRoom.css';

interface Session {
    id: number;
    sessionOrder: number;
    title: string;
    notes: string;
    onlineLink: string;
    isCompleted: boolean;
    startTime: string;
    canConfirm: boolean;
    studentFeedback: string | null;
    // Xác nhận 2 chiều
    studentConfirmed: boolean;
    studentDisputed: boolean;
    disputeReason: string | null;
    studentConfirmedAt: string | null;
    canStudentConfirm: boolean;
    // Phí sàn
    sessionFee: number | null;
    sessionMode: string | null; // "ONLINE" | "OFFLINE"
}

interface Material {
    id: number;
    title: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    tutorName: string;
    createdAt: string;
}

interface Registration {
    id: number;
    courseId: number;
    courseTitle: string;
    tutorName: string;
    studentName: string;
    status: string;
    pricePerSession: number;
}

interface ActiveStudent {
    registrationId: number;
    studentName: string;
    studentEmail: string;
}

export default function CourseRoom() {
    const { courseId } = useParams<{ courseId: string }>();
    const { user, loading: authLoading } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (searchParams.get('tab') as 'sessions' | 'chat' | 'report' | 'parent-report') || 'sessions';
    const setTab = (t: 'sessions' | 'chat' | 'report' | 'parent-report') => setSearchParams({ tab: t });
    const [sessions, setSessions] = useState<Session[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [registration, setRegistration] = useState<Registration | null>(null);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isErr, setIsErr] = useState(false);

    // Schedule modal (tutor)
    const [scheduleModal, setScheduleModal] = useState<{ open: boolean; session: Session | null }>({ open: false, session: null });
    const [scheduleForm, setScheduleForm] = useState({ onlineLink: '', startTime: '' });

    // Log modal (tutor)
    const [logModal, setLogModal] = useState<{ open: boolean; session: Session | null; isEdit: boolean }>({ open: false, session: null, isEdit: false });
    const [logNotes, setLogNotes] = useState('');

    // Announcement (tutor)
    const [announcement, setAnnouncement] = useState('');

    // Upload (tutor)
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // Report (student)
    const [reportTitle, setReportTitle] = useState('');
    const [reportContent, setReportContent] = useState('');

    // Phản hồi buổi học (student)
    const [feedbackModal, setFeedbackModal] = useState<{ open: boolean; session: Session | null }>({ open: false, session: null });
    const [feedbackText, setFeedbackText] = useState('');
    const [feedbackMsg, setFeedbackMsg] = useState('');

    // Phản đối buổi học (student)
    const [disputeModal, setDisputeModal] = useState<{ open: boolean; session: Session | null }>({ open: false, session: null });
    const [disputeReason, setDisputeReason] = useState('');
    const [disputeMsg, setDisputeMsg] = useState('');

    // Báo cáo phụ huynh (tutor)
    const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
    const [selectedRegId, setSelectedRegId] = useState<number | null>(null);
    const [parentReportNote, setParentReportNote] = useState('');
    const [parentReportMsg, setParentReportMsg] = useState('');
    const [parentReportErr, setParentReportErr] = useState(false);
    const [sendingReport, setSendingReport] = useState(false);

    const isStudent = user?.role === 'STUDENT';
    const isTutor   = user?.role === 'TUTOR';

    // Chờ auth load xong mới fetch — tránh gọi API với role sai → 401
    useEffect(() => {
        if (!authLoading && user && courseId) {
            fetchAll();
        }
    }, [authLoading, user, courseId]);

    // Fetch danh sách học viên ACTIVE khi tutor mở tab báo cáo phụ huynh
    useEffect(() => {
        if (!authLoading && isTutor && tab === 'parent-report' && courseId) {
            api.get(`/tutor/activities/course/${courseId}/students`)
                .then(res => {
                    setActiveStudents(res.data);
                    if (res.data.length > 0) setSelectedRegId(res.data[0].registrationId);
                })
                .catch(console.error);
        }
    }, [tab, isTutor, courseId, authLoading]);

    const fetchAll = async () => {
        if (!user || !courseId) return;
        const isStudentRole = user.role === 'STUDENT';
        setLoading(true);
        try {
            const [sessRes, matRes] = await Promise.all([
                isStudentRole
                    ? api.get(`/student/activities/course/${courseId}/sessions`)
                    : api.get(`/tutor/activities/course/${courseId}`),
                isStudentRole
                    ? api.get(`/student/activities/course/${courseId}/materials`)
                    : api.get(`/materials/course/${courseId}`),
            ]);
            const sorted = [...sessRes.data].sort((a: Session, b: Session) => a.sessionOrder - b.sessionOrder);
            setSessions(sorted);
            setMaterials(matRes.data);

            if (isStudentRole) {
                const regRes = await api.get('/student/registrations');
                const found = regRes.data.find((r: Registration) => r.courseId === parseInt(courseId!));
                setRegistration(found || null);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Chỉ refetch sessions (không show loading spinner — dùng sau saveLog/saveSchedule)
    const fetchSessions = async () => {
        if (!user || !courseId) return;
        try {
            const res = user.role === 'STUDENT'
                ? await api.get(`/student/activities/course/${courseId}/sessions`)
                : await api.get(`/tutor/activities/course/${courseId}`);
            const sorted = [...res.data].sort((a: Session, b: Session) => a.sessionOrder - b.sessionOrder);
            setSessions(sorted);
        } catch (e) { console.error(e); }
    };

    const flash = (text: string, err = false) => {
        setMsg(text); setIsErr(err);
        setTimeout(() => setMsg(''), 3000);
    };

    const saveSchedule = async () => {
        if (!scheduleModal.session) return;
        try {
            // Chuyển datetime-local sang ISO format
            const startTime = scheduleForm.startTime
                ? scheduleForm.startTime.replace('T', 'T') // đã đúng format
                : null;
            await api.put(`/tutor/activities/session/${scheduleModal.session.id}/schedule`, {
                title: scheduleModal.session.title,
                onlineLink: scheduleForm.onlineLink || null,
                startTime: startTime,
            });
            flash('✅ Đã cập nhật lịch học!');
            setScheduleModal({ open: false, session: null });
            fetchSessions();
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi'), true); }
    };

    const saveLog = async () => {
        if (!logModal.session) return;
        if (!logNotes.trim()) { flash('❌ Vui lòng nhập nội dung nhật ký', true); return; }
        try {
            if (logModal.isEdit) {
                await api.put(`/tutor/activities/session/${logModal.session.id}/edit-log`, logNotes, {
                    headers: { 'Content-Type': 'text/plain' }
                });
                flash('✅ Đã cập nhật nhật ký!');
            } else {
                await api.put(`/tutor/activities/session/${logModal.session.id}/log`, logNotes, {
                    headers: { 'Content-Type': 'text/plain' }
                });
                flash('✅ Đã ghi nhật ký buổi ' + logModal.session.sessionOrder + '!');
            }
            setLogModal({ open: false, session: null, isEdit: false });
            setLogNotes('');
            fetchSessions();
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi'), true); }
    };

    const sendAnnouncement = async () => {
        if (!announcement.trim()) return;
        try {
            await api.post(`/tutor/activities/announcement`, announcement, {
                params: { courseId },
                headers: { 'Content-Type': 'text/plain' }
            });
            flash('✅ Đã gửi thông báo cho học viên!');
            setAnnouncement('');
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi'), true); }
    };

    const uploadMaterial = async () => {
        if (!uploadFile || !uploadTitle.trim()) { flash('❌ Vui lòng nhập tiêu đề và chọn file', true); return; }
        const formData = new FormData();
        formData.append('tutorId', String(user?.id));
        formData.append('courseId', courseId!);
        formData.append('title', uploadTitle);
        formData.append('file', uploadFile);
        try {
            await api.post('/materials/tutor/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            flash('✅ Upload tài liệu thành công!');
            setUploadTitle('');
            setUploadFile(null);
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            fetchAll();
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi upload'), true); }
    };

    const deleteMaterial = async (id: number) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>Xóa tài liệu này?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                await api.delete(`/materials/${id}`);
                                toast.success('Đã xóa tài liệu');
                                fetchMaterials();
                            } catch { toast.error('Xóa thất bại'); }
                        }}
                    >Xóa</button>
                    <button
                        style={{ background: '#e2e8f0', color: '#374151', border: 'none', borderRadius: 6, padding: '4px 12px', cursor: 'pointer' }}
                        onClick={() => toast.dismiss(t.id)}
                    >Hủy</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const submitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registration) { flash('❌ Không tìm thấy thông tin đăng ký', true); return; }
        try {
            await api.post('/student/reports', {
                registrationId: registration.id,
                title: reportTitle,
                content: reportContent,
            });
            flash('✅ Đã gửi báo cáo vi phạm!');
            setReportTitle('');
            setReportContent('');
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi'), true); }
    };

    const submitFeedback = async () => {
        if (!feedbackModal.session || !feedbackText.trim()) return;
        try {
            const res = await api.put(`/student/activities/session/${feedbackModal.session.id}/feedback`,
                feedbackText, { headers: { 'Content-Type': 'text/plain' } });
            setSessions(prev => prev.map(s => s.id === feedbackModal.session!.id ? { ...s, studentFeedback: res.data.studentFeedback } : s));
            setFeedbackMsg('✅ Đã gửi phản hồi!');
            setTimeout(() => { setFeedbackModal({ open: false, session: null }); setFeedbackMsg(''); setFeedbackText(''); }, 1200);
        } catch (e: any) {
            setFeedbackMsg('❌ ' + (e.response?.data?.message || 'Lỗi gửi phản hồi'));
        }
    };

    const confirmSession = async (sessionId: number) => {
        try {
            const res = await api.put(`/student/activities/session/${sessionId}/confirm`);
            setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...res.data } : s));
            toast.success('✅ Đã xác nhận buổi học!');
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Lỗi xác nhận');
        }
    };

    const submitDispute = async () => {
        if (!disputeModal.session || !disputeReason.trim()) {
            setDisputeMsg('❌ Vui lòng nhập lý do phản đối');
            return;
        }
        try {
            const res = await api.put(`/student/activities/session/${disputeModal.session.id}/dispute`,
                { reason: disputeReason });
            setSessions(prev => prev.map(s => s.id === disputeModal.session!.id ? { ...s, ...res.data } : s));
            setDisputeMsg('✅ Đã gửi phản đối! Admin sẽ xem xét và liên hệ với bạn.');
            setTimeout(() => {
                setDisputeModal({ open: false, session: null });
                setDisputeMsg('');
                setDisputeReason('');
            }, 2000);
        } catch (e: any) {
            setDisputeMsg('❌ ' + (e.response?.data?.message || 'Lỗi gửi phản đối'));
        }
    };

    const sendParentReport = async () => {
        if (!selectedRegId) { setParentReportMsg('❌ Vui lòng chọn học viên'); setParentReportErr(true); return; }
        setSendingReport(true);
        setParentReportMsg('');
        try {
            await api.post('/tutor/activities/report-to-parent', {
                registrationId: selectedRegId,
                extraNote: parentReportNote,
            });
            setParentReportMsg('✅ Đã gửi báo cáo học tập đến email phụ huynh thành công!');
            setParentReportErr(false);
            setParentReportNote('');
        } catch (e: any) {
            setParentReportMsg('❌ ' + (e.response?.data?.message || 'Lỗi gửi báo cáo'));
            setParentReportErr(true);
        } finally {
            setSendingReport(false);
        }
    };

    // Tính tiến độ
    const completedCount = sessions.filter(s => s.isCompleted).length;
    const totalCount = sessions.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Tổng phí sàn tích lũy (chỉ cho tutor)
    const totalPlatformFee = sessions
        .filter(s => s.isCompleted && s.sessionFee != null)
        .reduce((sum, s) => sum + (s.sessionFee ?? 0), 0);

    const getFileIcon = (fileType: string) => {
        if (!fileType) return '📄';
        if (fileType.includes('pdf')) return '📕';
        if (fileType.includes('word') || fileType.includes('doc')) return '📘';
        if (fileType.includes('excel') || fileType.includes('sheet')) return '📗';
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('video')) return '🎬';
        if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
        return '📄';
    };

    // Chờ auth load xong — tránh render với user=null rồi gọi API sai
    if (authLoading) {
        return (
            <div className="course-room-page">
                <Header />
                <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>Đang tải...</div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="course-room-page">
            <Header />

            <div className="cr-container">
                {/* HEADER */}
                <div className="cr-header">
                    <div className="cr-header-left">
                        <Link to={isStudent ? '/student' : '/tutor'} className="cr-back">← Dashboard</Link>
                        <div>
                            <h1 className="cr-title">
                                {isStudent ? registration?.courseTitle : `Lớp học #${courseId}`}
                            </h1>
                            <p className="cr-subtitle">
                                {isStudent
                                    ? `👨‍🏫 Gia sư: ${registration?.tutorName || '...'}`
                                    : `📚 Quản lý lớp học`}
                            </p>
                        </div>
                    </div>

                    {/* Progress */}
                    {totalCount > 0 && (
                        <div className="cr-progress-box">
                            <div className="cr-progress-label">
                                <span>Tiến độ học</span>
                                <span className="cr-progress-pct">{completedCount}/{totalCount} buổi ({progressPct}%)</span>
                            </div>
                            <div className="cr-progress-bar">
                                <div className="cr-progress-fill" style={{ width: `${progressPct}%` }} />
                            </div>
                            {/* Tổng phí sàn tích lũy — chỉ hiện cho tutor */}
                            {isTutor && totalPlatformFee > 0 && (
                                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#64748b', textAlign: 'right' }}>
                                    💰 Phí sàn tích lũy: <strong style={{ color: '#ef4444' }}>-{totalPlatformFee.toLocaleString('vi-VN')}đ</strong>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* TABS */}
                <div className="cr-tabs">
                    <button className={`cr-tab ${tab === 'sessions' ? 'active' : ''}`} onClick={() => setTab('sessions')}>
                        📅 Buổi học
                        {totalCount > 0 && (
                            <span className="cr-tab-badge">{completedCount}/{totalCount}</span>
                        )}
                    </button>
                    <button className={`cr-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
                        💬 Nhắn tin
                    </button>
                    {isStudent && (
                        <button className={`cr-tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
                            🚨 Báo cáo
                        </button>
                    )}
                    {isTutor && (
                        <>
                            <button className={`cr-tab ${tab === 'parent-report' ? 'active' : ''}`} onClick={() => setTab('parent-report')}>
                                📊 Báo cáo PH
                            </button>
                            <div className="cr-announcement-inline">
                                <input
                                    type="text"
                                    value={announcement}
                                    onChange={e => setAnnouncement(e.target.value)}
                                    placeholder="📢 Gửi thông báo cho học viên..."
                                    onKeyDown={e => e.key === 'Enter' && sendAnnouncement()}
                                    className="cr-announcement-input"
                                />
                                <button className="cr-announcement-btn" onClick={sendAnnouncement}>Gửi</button>
                            </div>
                        </>
                    )}
                </div>

                {/* FLASH MSG */}
                {msg && (
                    <div className={`cr-flash ${isErr ? 'error' : 'success'}`}>{msg}</div>
                )}

                {loading ? (
                    <div className="cr-loading">Đang tải...</div>
                ) : (
                    <div className="cr-content">
                        {/* ===== TAB: BUỔI HỌC ===== */}
                        {tab === 'sessions' && (
                            <div>
                                {sessions.length === 0 ? (
                                    <div className="cr-empty">
                                        <p>Chưa có buổi học nào được tạo.</p>
                                        {isTutor && <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Buổi học được tạo tự động khi Admin duyệt khóa học.</p>}
                                    </div>
                                ) : (
                                    <div className="cr-sessions">
                                        {sessions.map((s, idx) => {
                                            const prevNotDone = idx > 0 && !sessions[idx - 1].isCompleted;
                                            const now = new Date();
                                            const startDate = s.startTime ? new Date(s.startTime) : null;
                                            const isPast = startDate ? now > startDate : false;

                                            const getStatus = () => {
                                                if (s.isCompleted && s.studentConfirmed)
                                                    return { label: '✅ Đã hoàn thành', cls: 'done' };
                                                if (s.isCompleted && s.studentDisputed)
                                                    return { label: '⚠️ Đang phản đối', cls: 'confirm' };
                                                if (s.isCompleted && !s.studentConfirmed) {
                                                    // Gia sư đã dạy, chờ học viên xác nhận
                                                    return isTutor
                                                        ? { label: '⏳ Chờ học viên xác nhận', cls: 'scheduled' }
                                                        : { label: '📋 Cần xác nhận của bạn', cls: 'confirm' };
                                                }
                                                if (!startDate) return { label: '⏳ Chưa lên lịch', cls: 'pending' };
                                                if (!isPast) return { label: '📅 Sắp diễn ra', cls: 'scheduled' };
                                                // Đã qua giờ, gia sư chưa ghi nhật ký
                                                return isTutor
                                                    ? { label: '🕐 Cần xác nhận dạy', cls: 'confirm' }
                                                    : { label: '⌛ Chờ gia sư xác nhận', cls: 'pending' };
                                            };
                                            const status = getStatus();

                                            return (
                                                <div key={s.id} className={`cr-session-card ${s.isCompleted ? 'completed' : ''} ${prevNotDone && !s.isCompleted ? 'locked' : ''}`}>
                                                    <div className={`cr-session-num ${s.isCompleted ? 'done' : s.canConfirm ? 'ready' : ''}`}>
                                                        {s.isCompleted ? '✓' : s.sessionOrder}
                                                    </div>

                                                    <div className="cr-session-body">
                                                        <div className="cr-session-top">
                                                            <h3 className="cr-session-title">{s.title}</h3>
                                                            <span className={`cr-session-status ${status.cls}`}>{status.label}</span>
                                                        </div>

                                                        {s.startTime && (
                                                            <p className="cr-session-time">
                                                                🕐 {new Date(s.startTime).toLocaleString('vi-VN', {
                                                                    weekday: 'long', year: 'numeric', month: 'long',
                                                                    day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                })}
                                                            </p>
                                                        )}

                                                        {s.onlineLink && (
                                                            <a href={s.onlineLink} target="_blank" rel="noreferrer" className="cr-join-btn">
                                                                🔗 Vào phòng học online
                                                            </a>
                                                        )}

                                                        {/* Nhật ký — cả gia sư lẫn học viên đều xem được */}
                                                        {s.isCompleted && s.notes && (
                                                            <div className="cr-session-notes">
                                                                <p className="cr-notes-label">📝 Nhật ký buổi học:</p>
                                                                <p className="cr-notes-content">{s.notes}</p>
                                                            </div>
                                                        )}
                                                        {s.isCompleted && !s.notes && (
                                                            <div className="cr-session-notes" style={{ borderColor: '#94a3b8' }}>
                                                                <p className="cr-notes-content" style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                                                                    Gia sư chưa ghi nhật ký cho buổi này.
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Phản hồi của học viên — chỉ hiện khi buổi đã hoàn thành */}
                                                        {isStudent && s.isCompleted && (
                                                            <div style={{ marginTop: '10px' }}>
                                                                {/* Khu vực xác nhận 2 chiều */}
                                                                {s.canStudentConfirm && (
                                                                    <div style={{ background: '#fffbeb', border: '2px solid #fbbf24', borderRadius: '10px', padding: '12px 14px', marginBottom: '10px' }}>
                                                                        <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#92400e', margin: '0 0 8px' }}>
                                                                            📋 Gia sư vừa xác nhận đã dạy buổi này. Bạn có xác nhận đã học không?
                                                                        </p>
                                                                        <p style={{ fontSize: '0.78rem', color: '#92400e', margin: '0 0 10px' }}>
                                                                            ⏰ Nếu không phản hồi trong 48h, hệ thống sẽ tự động xác nhận.
                                                                        </p>
                                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                                            <button
                                                                                className="cr-btn-primary"
                                                                                style={{ fontSize: '0.85rem', padding: '6px 16px' }}
                                                                                onClick={() => confirmSession(s.id)}
                                                                            >
                                                                                ✅ Xác nhận đã học
                                                                            </button>
                                                                            <button
                                                                                className="cr-btn-outline"
                                                                                style={{ fontSize: '0.85rem', padding: '6px 16px', color: '#ef4444', borderColor: '#ef4444' }}
                                                                                onClick={() => { setDisputeModal({ open: true, session: s }); setDisputeReason(''); setDisputeMsg(''); }}
                                                                            >
                                                                                ❌ Phản đối
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Đã xác nhận */}
                                                                {s.studentConfirmed && !s.canStudentConfirm && (
                                                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '8px 14px', marginBottom: '10px', fontSize: '0.82rem', color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        ✅ <strong>Bạn đã xác nhận buổi học này</strong>
                                                                        {s.studentConfirmedAt && (
                                                                            <span style={{ color: '#6b7280', fontWeight: 400 }}>
                                                                                — {new Date(s.studentConfirmedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Đang phản đối */}
                                                                {s.studentDisputed && (
                                                                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 14px', marginBottom: '10px', fontSize: '0.82rem', color: '#991b1b' }}>
                                                                        ⚠️ <strong>Bạn đang phản đối buổi học này.</strong> Admin sẽ xem xét và liên hệ với bạn.
                                                                        {s.disputeReason && (
                                                                            <p style={{ margin: '4px 0 0', color: '#7f1d1d' }}>Lý do: {s.disputeReason}</p>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Phản hồi nội dung buổi học */}
                                                                {s.studentFeedback ? (
                                                                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px' }}>
                                                                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46', marginBottom: '4px' }}>💬 Phản hồi của bạn:</p>
                                                                        <p style={{ fontSize: '0.88rem', color: '#374151', margin: 0 }}>{s.studentFeedback}</p>
                                                                        <button className="cr-btn-outline" style={{ marginTop: '8px', fontSize: '0.78rem', padding: '4px 10px' }}
                                                                            onClick={() => { setFeedbackModal({ open: true, session: s }); setFeedbackText(s.studentFeedback || ''); setFeedbackMsg(''); }}>
                                                                            ✏️ Sửa phản hồi
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button className="cr-btn-outline" style={{ fontSize: '0.85rem' }}
                                                                        onClick={() => { setFeedbackModal({ open: true, session: s }); setFeedbackText(''); setFeedbackMsg(''); }}>
                                                                        💬 Gửi phản hồi buổi học
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Actions cho Tutor */}
                                                        {isTutor && (
                                                            <div className="cr-session-actions">
                                                                {/* Phí sàn — hiện sau khi buổi hoàn thành */}
                                                                {s.isCompleted && s.sessionFee != null && (
                                                                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', background: s.sessionMode === 'ONLINE' ? '#eff6ff' : '#f0fdf4', border: `1px solid ${s.sessionMode === 'ONLINE' ? '#bfdbfe' : '#bbf7d0'}`, borderRadius: '8px', padding: '8px 14px', marginBottom: '10px', fontSize: '0.82rem' }}>
                                                                        <span>{s.sessionMode === 'ONLINE' ? '🌐' : '🏠'}</span>
                                                                        <span style={{ color: '#374151' }}>
                                                                            Buổi <strong>{s.sessionMode === 'ONLINE' ? 'Online' : 'Offline'}</strong> — Phí sàn:
                                                                        </span>
                                                                        <span style={{ fontWeight: 700, color: s.sessionMode === 'ONLINE' ? '#1d4ed8' : '#15803d', marginLeft: 'auto' }}>
                                                                            -{s.sessionFee.toLocaleString('vi-VN')}đ
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {s.isCompleted && s.studentFeedback && (                                                                    <div style={{ width: '100%', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '10px 14px', marginBottom: '10px' }}>
                                                                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46', margin: '0 0 4px' }}>
                                                                            💬 Phản hồi của học viên:
                                                                        </p>
                                                                        <p style={{ fontSize: '0.88rem', color: '#374151', margin: 0 }}>{s.studentFeedback}</p>
                                                                    </div>
                                                                )}
                                                                {s.isCompleted && !s.studentFeedback && (
                                                                    <div style={{ width: '100%', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', padding: '8px 14px', marginBottom: '10px', fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                                                        💬 Học viên chưa gửi phản hồi buổi học này.
                                                                    </div>
                                                                )}
                                                                {(() => {
                                                                    if (s.isCompleted) {
                                                                        // Đã xác nhận → chỉ sửa nhật ký
                                                                        return (
                                                                            <button className="cr-btn-outline"
                                                                                onClick={() => { setLogModal({ open: true, session: s, isEdit: true }); setLogNotes(s.notes || ''); }}>
                                                                                ✏️ Sửa nhật ký
                                                                            </button>
                                                                        );
                                                                    }
                                                                    if (!startDate) {
                                                                        // Chưa lên lịch
                                                                        return (
                                                                            <button className="cr-btn-outline"
                                                                                onClick={() => { setScheduleModal({ open: true, session: s }); setScheduleForm({ onlineLink: '', startTime: '' }); }}>
                                                                                📅 Lên lịch
                                                                            </button>
                                                                        );
                                                                    }
                                                                    if (!isPast) {
                                                                        // Đã lên lịch, chưa đến giờ → cho sửa lịch
                                                                        return (
                                                                            <>
                                                                                <button className="cr-btn-outline"
                                                                                    onClick={() => { setScheduleModal({ open: true, session: s }); setScheduleForm({ onlineLink: s.onlineLink || '', startTime: s.startTime.slice(0, 16) }); }}>
                                                                                    ✏️ Sửa lịch
                                                                                </button>
                                                                                <span className="cr-lock-hint">
                                                                                    ⏰ Mở lúc {startDate.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    }
                                                                    // Đã qua giờ → nút xác nhận
                                                                    return (
                                                                        <>
                                                                            <button className="cr-btn-primary"
                                                                                disabled={prevNotDone}
                                                                                style={{ opacity: prevNotDone ? 0.45 : 1, cursor: prevNotDone ? 'not-allowed' : 'pointer' }}
                                                                                title={prevNotDone ? `Hoàn thành buổi ${s.sessionOrder - 1} trước` : ''}
                                                                                onClick={() => {
                                                                                    if (prevNotDone) return;
                                                                                    setLogModal({ open: true, session: s, isEdit: false });
                                                                                    setLogNotes('');
                                                                                }}>
                                                                                ✅ Xác nhận đã dạy
                                                                            </button>
                                                                            {prevNotDone && <span className="cr-lock-hint">🔒 Hoàn thành buổi {s.sessionOrder - 1} trước</span>}
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== TAB: CHAT ===== */}
                        {tab === 'chat' && (
                            <ChatBox courseId={courseId!} />
                        )}

                        {/* ===== TAB: BÁO CÁO PH (TUTOR) ===== */}
                        {tab === 'parent-report' && isTutor && (
                            <div className="cr-parent-report-box">
                                <h2>📊 Gửi báo cáo học tập cho phụ huynh</h2>
                                <p className="cr-parent-report-desc">
                                    Hệ thống sẽ tự động tổng hợp tiến độ học tập (số buổi hoàn thành, nhật ký từng buổi)
                                    và gửi email đến địa chỉ email đăng ký của học viên (dùng làm email phụ huynh).
                                </p>

                                {activeStudents.length === 0 ? (
                                    <div className="cr-empty">
                                        <p>Chưa có học viên nào đang học (ACTIVE) trong lớp này.</p>
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                            Học viên cần được duyệt và thanh toán học phí để có trạng thái ACTIVE.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="cr-parent-report-form">
                                        <div className="cr-form-group">
                                            <label>Chọn học viên *</label>
                                            <select
                                                className="cr-select"
                                                value={selectedRegId ?? ''}
                                                onChange={e => setSelectedRegId(Number(e.target.value))}
                                            >
                                                {activeStudents.map(s => (
                                                    <option key={s.registrationId} value={s.registrationId}>
                                                        {s.studentName} ({s.studentEmail})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="cr-form-group">
                                            <label>Nhận xét thêm của gia sư (tùy chọn)</label>
                                            <textarea
                                                rows={4}
                                                className="cr-textarea"
                                                value={parentReportNote}
                                                onChange={e => setParentReportNote(e.target.value)}
                                                placeholder="Ví dụ: Con học rất chăm chỉ, tiến bộ rõ rệt. Cần ôn thêm phần đạo hàm..."
                                            />
                                        </div>

                                        <div className="cr-parent-report-preview">
                                            <h4>📋 Nội dung báo cáo sẽ bao gồm:</h4>
                                            <ul>
                                                <li>✅ Tiến độ học tập: <strong>{completedCount}/{totalCount} buổi ({progressPct}%)</strong></li>
                                                <li>📅 Chi tiết từng buổi học và nhật ký gia sư</li>
                                                <li>💬 Nhận xét thêm của gia sư (nếu có)</li>
                                            </ul>
                                        </div>

                                        {parentReportMsg && (
                                            <div className={`cr-flash ${parentReportErr ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                                                {parentReportMsg}
                                            </div>
                                        )}

                                        <button
                                            className="cr-btn-send-report"
                                            onClick={sendParentReport}
                                            disabled={sendingReport}
                                        >
                                            {sendingReport ? '⏳ Đang gửi...' : '📧 Gửi báo cáo cho phụ huynh'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== TAB: BÁO CÁO ===== */}
                        {tab === 'report' && isStudent && (                            <div className="cr-report-box">
                                <h2>🚨 Báo cáo vi phạm</h2>
                                <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                                    Nếu gia sư không dạy đúng cam kết, dạy sai nội dung hoặc có hành vi không phù hợp,
                                    hãy báo cáo để Admin xem xét và xử lý.
                                </p>
                                {registration ? (
                                    <form onSubmit={submitReport}>
                                        <div className="cr-report-info">
                                            <span>📚 Khóa học: <strong>{registration.courseTitle}</strong></span>
                                            <span>👨‍🏫 Gia sư: <strong>{registration.tutorName}</strong></span>
                                        </div>
                                        <div className="cr-form-group">
                                            <label>Tiêu đề báo cáo *</label>
                                            <input value={reportTitle} onChange={e => setReportTitle(e.target.value)}
                                                required placeholder="Ví dụ: Gia sư không dạy đúng cam kết" />
                                        </div>
                                        <div className="cr-form-group">
                                            <label>Mô tả chi tiết *</label>
                                            <textarea rows={5} value={reportContent} onChange={e => setReportContent(e.target.value)}
                                                required placeholder="Mô tả cụ thể vi phạm, thời gian xảy ra, bằng chứng nếu có..." />
                                        </div>
                                        <button type="submit" className="cr-btn-danger-full">🚨 Gửi báo cáo</button>
                                    </form>
                                ) : (
                                    <div className="cr-empty"><p>Không tìm thấy thông tin đăng ký khóa học này.</p></div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL CẬP NHẬT LỊCH */}
            {scheduleModal.open && scheduleModal.session && (
                <div className="cr-modal-overlay" onClick={() => setScheduleModal({ open: false, session: null })}>
                    <div className="cr-modal" onClick={e => e.stopPropagation()}>
                        <h3>📅 Cập nhật lịch — {scheduleModal.session.title}</h3>
                        <div className="cr-form-group">
                            <label>Thời gian bắt đầu *</label>
                            <input type="datetime-local" value={scheduleForm.startTime}
                                onChange={e => setScheduleForm(p => ({ ...p, startTime: e.target.value }))} />
                        </div>
                        <div className="cr-form-group">
                            <label>Link phòng học online <span style={{ fontWeight: 400, color: '#94a3b8' }}>(tùy chọn — nếu dạy online)</span></label>
                            <input value={scheduleForm.onlineLink}
                                onChange={e => setScheduleForm(p => ({ ...p, onlineLink: e.target.value }))}
                                placeholder="https://meet.google.com/xxx-xxxx-xxx" />
                        </div>
                        <div className="cr-modal-actions">
                            <button className="cr-btn-primary" onClick={saveSchedule}>💾 Lưu lịch học</button>
                            <button className="cr-btn-outline" onClick={() => setScheduleModal({ open: false, session: null })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GHI NHẬT KÝ */}
            {logModal.open && logModal.session && (
                <div className="cr-modal-overlay" onClick={() => setLogModal({ open: false, session: null, isEdit: false })}>
                    <div className="cr-modal" onClick={e => e.stopPropagation()}>
                        <h3>{logModal.isEdit ? '✏️ Sửa nhật ký' : '✅ Xác nhận hoàn thành'} — {logModal.session.title}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            {logModal.isEdit
                                ? 'Chỉnh sửa nội dung nhật ký. Chỉ được sửa trong vòng 24h sau khi xác nhận.'
                                : 'Ghi lại nội dung đã dạy trong buổi học này. Sau khi lưu, buổi học sẽ được đánh dấu hoàn thành.'}
                        </p>
                        <div className="cr-form-group">
                            <label>Nội dung đã dạy *</label>
                            <textarea rows={5} value={logNotes} onChange={e => setLogNotes(e.target.value)}
                                placeholder="Ví dụ: Ôn tập chương 1 - Hàm số bậc hai. Giải 10 bài tập từ SGK. Học viên nắm được cách vẽ đồ thị..." />
                        </div>
                        <div className="cr-modal-actions">
                            <button className="cr-btn-primary" onClick={saveLog}>
                                {logModal.isEdit ? '💾 Lưu chỉnh sửa' : '✅ Xác nhận đã dạy xong'}
                            </button>
                            <button className="cr-btn-outline" onClick={() => setLogModal({ open: false, session: null, isEdit: false })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PHẢN HỒI BUỔI HỌC (STUDENT) */}
            {feedbackModal.open && feedbackModal.session && (
                <div className="cr-modal-overlay" onClick={() => setFeedbackModal({ open: false, session: null })}>
                    <div className="cr-modal" onClick={e => e.stopPropagation()}>
                        <h3>💬 Phản hồi — {feedbackModal.session.title}</h3>
                        <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
                            Chia sẻ cảm nhận của bạn về buổi học này để giúp gia sư cải thiện chất lượng dạy học.
                        </p>
                        <div className="cr-form-group">
                            <label>Nội dung phản hồi *</label>
                            <textarea rows={4} value={feedbackText}
                                onChange={e => setFeedbackText(e.target.value)}
                                placeholder="Ví dụ: Buổi học rất hiệu quả, gia sư giảng dễ hiểu. Tuy nhiên cần thêm bài tập thực hành..." />
                        </div>
                        {feedbackMsg && <p style={{ color: feedbackMsg.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '0.88rem' }}>{feedbackMsg}</p>}
                        <div className="cr-modal-actions">
                            <button className="cr-btn-primary" onClick={submitFeedback} disabled={!feedbackText.trim()}>
                                💬 Gửi phản hồi
                            </button>
                            <button className="cr-btn-outline" onClick={() => { setFeedbackModal({ open: false, session: null }); setFeedbackText(''); setFeedbackMsg(''); }}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PHẢN ĐỐI BUỔI HỌC (STUDENT) */}
            {disputeModal.open && disputeModal.session && (
                <div className="cr-modal-overlay" onClick={() => setDisputeModal({ open: false, session: null })}>
                    <div className="cr-modal" onClick={e => e.stopPropagation()}>
                        <h3>❌ Phản đối — {disputeModal.session.title}</h3>
                        <p style={{ fontSize: '0.88rem', color: '#64748b', marginBottom: '1rem' }}>
                            Nếu gia sư không dạy thực sự hoặc có vấn đề với buổi học này, hãy mô tả lý do.
                            Admin sẽ xem xét và liên hệ với bạn trong vòng <strong>24h</strong>.
                        </p>
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', fontSize: '0.82rem', color: '#991b1b' }}>
                            ⚠️ Hành động này không thể hoàn tác. Chỉ phản đối khi có cơ sở thực sự.
                        </div>
                        <div className="cr-form-group">
                            <label>Lý do phản đối *</label>
                            <textarea rows={4} value={disputeReason}
                                onChange={e => setDisputeReason(e.target.value)}
                                placeholder="Ví dụ: Gia sư không vào phòng học đúng giờ, buổi học chỉ diễn ra 10 phút, gia sư không giảng đúng nội dung cam kết..." />
                        </div>
                        {disputeMsg && (
                            <p style={{ color: disputeMsg.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '0.88rem', marginBottom: '8px' }}>
                                {disputeMsg}
                            </p>
                        )}
                        <div className="cr-modal-actions">
                            <button className="cr-btn-outline"
                                style={{ color: '#ef4444', borderColor: '#ef4444' }}
                                onClick={submitDispute}
                                disabled={!disputeReason.trim()}
                            >
                                ❌ Gửi phản đối
                            </button>
                            <button className="cr-btn-outline" onClick={() => { setDisputeModal({ open: false, session: null }); setDisputeReason(''); setDisputeMsg(''); }}>
                                Hủy
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
