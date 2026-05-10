import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/CourseRoom.css';

interface Session {
    id: number;
    sessionOrder: number;
    title: string;
    notes: string;
    onlineLink: string;
    isCompleted: boolean;
    startTime: string;
    canConfirm: boolean; // BE tính: startTime đã qua && chưa hoàn thành
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

export default function CourseRoom() {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const [tab, setTab] = useState<'sessions' | 'materials' | 'report'>('sessions');
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
    const [logModal, setLogModal] = useState<{ open: boolean; session: Session | null }>({ open: false, session: null });
    const [logNotes, setLogNotes] = useState('');

    // Announcement (tutor)
    const [announcement, setAnnouncement] = useState('');

    // Upload (tutor)
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);

    // Report (student)
    const [reportTitle, setReportTitle] = useState('');
    const [reportContent, setReportContent] = useState('');

    const isStudent = user?.role === 'STUDENT';
    const isTutor   = user?.role === 'TUTOR';

    useEffect(() => { fetchAll(); }, [courseId]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sessRes, matRes] = await Promise.all([
                isStudent
                    ? api.get(`/student/activities/course/${courseId}/sessions`)
                    : api.get(`/tutor/activities/course/${courseId}`),
                isStudent
                    ? api.get(`/student/activities/course/${courseId}/materials`)
                    : api.get(`/materials/course/${courseId}`),
            ]);
            // Sort theo sessionOrder
            const sorted = [...sessRes.data].sort((a: Session, b: Session) => a.sessionOrder - b.sessionOrder);
            setSessions(sorted);
            setMaterials(matRes.data);

            // Lấy thông tin registration của student
            if (isStudent) {
                const regRes = await api.get('/student/registrations');
                const found = regRes.data.find((r: Registration) => r.courseId === parseInt(courseId!));
                setRegistration(found || null);
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
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
            fetchAll();
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi'), true); }
    };

    const saveLog = async () => {
        if (!logModal.session) return;
        if (!logNotes.trim()) { flash('❌ Vui lòng nhập nội dung nhật ký', true); return; }
        try {
            await api.put(`/tutor/activities/session/${logModal.session.id}/log`, logNotes, {
                headers: { 'Content-Type': 'text/plain' }
            });
            flash('✅ Đã ghi nhật ký buổi ' + logModal.session.sessionOrder + '!');
            setLogModal({ open: false, session: null });
            setLogNotes('');
            fetchAll();
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi'), true); }
    };

    const sendAnnouncement = async () => {
        if (!announcement.trim()) return;
        try {
            await api.post(`/tutor/activities/announcement`, announcement, {
                params: { courseId },
                headers: { 'Content-Type': 'text/plain' }
            });
            flash('✅ Đã gửi thông báo cho cả lớp!');
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
        if (!confirm('Xóa tài liệu này?')) return;
        try {
            await api.delete(`/materials/${id}`);
            flash('✅ Đã xóa tài liệu');
            fetchAll();
        } catch (e: any) { flash('❌ ' + (e.response?.data?.message || 'Lỗi'), true); }
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

    // Tính tiến độ
    const completedCount = sessions.filter(s => s.isCompleted).length;
    const totalCount = sessions.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

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
                    <button className={`cr-tab ${tab === 'materials' ? 'active' : ''}`} onClick={() => setTab('materials')}>
                        📁 Tài liệu
                        {materials.length > 0 && <span className="cr-tab-badge">{materials.length}</span>}
                    </button>
                    {isStudent && (
                        <button className={`cr-tab ${tab === 'report' ? 'active' : ''}`} onClick={() => setTab('report')}>
                            🚨 Báo cáo
                        </button>
                    )}
                    {isTutor && (
                        <div className="cr-announcement-inline">
                            <input
                                type="text"
                                value={announcement}
                                onChange={e => setAnnouncement(e.target.value)}
                                placeholder="📢 Gửi thông báo khẩn cho cả lớp..."
                                onKeyDown={e => e.key === 'Enter' && sendAnnouncement()}
                                className="cr-announcement-input"
                            />
                            <button className="cr-announcement-btn" onClick={sendAnnouncement}>Gửi</button>
                        </div>
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

                                            const getStatus = () => {
                                                if (s.isCompleted) return { label: '✅ Đã hoàn thành', cls: 'done' };
                                                if (!s.startTime) return { label: '⏳ Chưa lên lịch', cls: 'pending' };
                                                const start = new Date(s.startTime);
                                                if (new Date() < start) return { label: '📅 Sắp diễn ra', cls: 'scheduled' };
                                                if (s.canConfirm) return { label: '🔔 Chờ xác nhận', cls: 'confirm' };
                                                return { label: '📅 Đã lên lịch', cls: 'scheduled' };
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

                                                        {/* Actions cho Tutor */}
                                                        {isTutor && (
                                                            <div className="cr-session-actions">
                                                                <button className="cr-btn-outline"
                                                                    onClick={() => {
                                                                        setScheduleModal({ open: true, session: s });
                                                                        setScheduleForm({
                                                                            onlineLink: s.onlineLink || '',
                                                                            startTime: s.startTime ? s.startTime.slice(0, 16) : ''
                                                                        });
                                                                    }}>
                                                                    📅 {s.startTime ? 'Sửa lịch' : 'Lên lịch'}
                                                                </button>

                                                                {!s.isCompleted && (
                                                                    <button
                                                                        className="cr-btn-primary"
                                                                        disabled={!s.canConfirm || prevNotDone}
                                                                        style={{ opacity: (!s.canConfirm || prevNotDone) ? 0.45 : 1, cursor: (!s.canConfirm || prevNotDone) ? 'not-allowed' : 'pointer' }}
                                                                        title={
                                                                            prevNotDone ? `Hoàn thành buổi ${s.sessionOrder - 1} trước` :
                                                                            !s.startTime ? 'Lên lịch trước' :
                                                                            !s.canConfirm ? 'Chưa đến giờ học' : ''
                                                                        }
                                                                        onClick={() => {
                                                                            if (!s.canConfirm || prevNotDone) return;
                                                                            setLogModal({ open: true, session: s });
                                                                            setLogNotes('');
                                                                        }}>
                                                                        ✅ Xác nhận đã dạy
                                                                    </button>
                                                                )}

                                                                {!s.isCompleted && prevNotDone && (
                                                                    <span className="cr-lock-hint">🔒 Hoàn thành buổi {s.sessionOrder - 1} trước</span>
                                                                )}
                                                                {!s.isCompleted && !prevNotDone && !s.canConfirm && s.startTime && (
                                                                    <span className="cr-lock-hint">
                                                                        ⏰ Mở sau {new Date(s.startTime).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                                {!s.isCompleted && !s.startTime && (
                                                                    <span className="cr-lock-hint">📅 Lên lịch trước để mở nút xác nhận</span>
                                                                )}
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

                        {/* ===== TAB: TÀI LIỆU ===== */}
                        {tab === 'materials' && (
                            <div>
                                {/* Upload form cho Tutor */}
                                {isTutor && (
                                    <div className="cr-upload-box">
                                        <h3>📤 Upload tài liệu mới</h3>
                                        <div className="cr-upload-form">
                                            <div className="cr-upload-field">
                                                <label>Tiêu đề *</label>
                                                <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)}
                                                    placeholder="Ví dụ: Bài tập chương 1, Slide buổi 3..." />
                                            </div>
                                            <div className="cr-upload-field">
                                                <label>File *</label>
                                                <input id="file-upload" type="file"
                                                    onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                                            </div>
                                        </div>
                                        <button className="cr-btn-primary" onClick={uploadMaterial}>
                                            📤 Upload tài liệu
                                        </button>
                                    </div>
                                )}

                                {materials.length === 0 ? (
                                    <div className="cr-empty">
                                        <p>Chưa có tài liệu nào.</p>
                                        {isTutor && <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Upload tài liệu để học viên có thể tải về.</p>}
                                    </div>
                                ) : (
                                    <div className="cr-materials">
                                        {materials.map(m => (
                                            <div key={m.id} className="cr-material-card">
                                                <div className="cr-material-icon">{getFileIcon(m.fileType)}</div>
                                                <div className="cr-material-info">
                                                    <h4>{m.title}</h4>
                                                    <p>
                                                        {m.fileType?.split('/').pop()?.toUpperCase() || 'FILE'}
                                                        {m.fileSize ? ` · ${(m.fileSize / 1024).toFixed(0)} KB` : ''}
                                                        {' · '}📅 {m.createdAt?.slice(0, 10)}
                                                    </p>
                                                </div>
                                                <div className="cr-material-actions">
                                                    <a href={`http://localhost:8080/api/materials/download/${m.fileName}`}
                                                        className="cr-btn-primary" target="_blank" rel="noreferrer">
                                                        ⬇️ Tải xuống
                                                    </a>
                                                    {isTutor && (
                                                        <button className="cr-btn-danger" onClick={() => deleteMaterial(m.id)}>
                                                            🗑️
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===== TAB: BÁO CÁO ===== */}
                        {tab === 'report' && isStudent && (
                            <div className="cr-report-box">
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
                            <label>Link phòng học online (Google Meet / Zoom)</label>
                            <input value={scheduleForm.onlineLink}
                                onChange={e => setScheduleForm(p => ({ ...p, onlineLink: e.target.value }))}
                                placeholder="https://meet.google.com/xxx-xxxx-xxx" />
                        </div>
                        <div className="cr-form-group">
                            <label>Thời gian bắt đầu</label>
                            <input type="datetime-local" value={scheduleForm.startTime}
                                onChange={e => setScheduleForm(p => ({ ...p, startTime: e.target.value }))} />
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
                <div className="cr-modal-overlay" onClick={() => setLogModal({ open: false, session: null })}>
                    <div className="cr-modal" onClick={e => e.stopPropagation()}>
                        <h3>✅ Xác nhận hoàn thành — {logModal.session.title}</h3>
                        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Ghi lại nội dung đã dạy trong buổi học này. Sau khi lưu, buổi học sẽ được đánh dấu hoàn thành.
                        </p>
                        <div className="cr-form-group">
                            <label>Nội dung đã dạy *</label>
                            <textarea rows={5} value={logNotes} onChange={e => setLogNotes(e.target.value)}
                                placeholder="Ví dụ: Ôn tập chương 1 - Hàm số bậc hai. Giải 10 bài tập từ SGK. Học viên nắm được cách vẽ đồ thị..." />
                        </div>
                        <div className="cr-modal-actions">
                            <button className="cr-btn-primary" onClick={saveLog}>✅ Xác nhận đã dạy xong</button>
                            <button className="cr-btn-outline" onClick={() => setLogModal({ open: false, session: null })}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
