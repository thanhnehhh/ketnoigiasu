import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Dashboard.css';

/**
 * GET  /api/tutor/contracts/my          → ContractResponse[]
 * POST /api/tutor/contracts/{id}/sign   body: { signatureBase64 }
 * GET  /api/tutor/contracts/{id}/download → HTML string
 *
 * ContractResponse: { id, tutorId, tutorName, tutorEmail, contentSnapshot,
 *                     signatureBase64, status, signedAt, createdAt }
 */

interface Contract {
    id: number;
    tutorName: string;
    tutorEmail: string;
    contentSnapshot: string;
    signatureBase64: string | null;
    status: string; // PENDING | SIGNED | CANCELLED
    signedAt: string | null;
    createdAt: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING:   { label: 'Chờ ký',    color: '#f59e0b' },
    SIGNED:    { label: 'Đã ký',     color: '#10b981' },
    CANCELLED: { label: 'Đã hủy',   color: '#ef4444' },
};

export default function TutorContractPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isErr, setIsErr] = useState(false);

    // Modal xem + ký hợp đồng
    const [viewModal, setViewModal] = useState<{ open: boolean; contract: Contract | null }>({ open: false, contract: null });
    const [signing, setSigning] = useState(false);

    // Canvas vẽ chữ ký
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSig, setHasSig] = useState(false);

    useEffect(() => { fetchContracts(); }, []);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tutor/contracts/my');
            setContracts(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const flash = (text: string, err = false) => {
        setMsg(text); setIsErr(err);
        setTimeout(() => setMsg(''), 3000);
    };

    // Canvas drawing
    const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const rect = canvas.getBoundingClientRect();
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
        setIsDrawing(true);
    };
    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#1f2937';
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
        setHasSig(true);
    };
    const stopDraw = () => setIsDrawing(false);
    const clearCanvas = () => {
        const canvas = canvasRef.current; if (!canvas) return;
        canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
        setHasSig(false);
    };

    const signContract = async () => {
        if (!hasSig) { flash('Vui lòng ký tên trước!', true); return; }
        const canvas = canvasRef.current; if (!canvas) return;
        const base64 = canvas.toDataURL('image/png');
        setSigning(true);
        try {
            await api.post(`/tutor/contracts/${viewModal.contract!.id}/sign`, { signatureBase64: base64 });
            flash('✅ Ký hợp đồng thành công!');
            setViewModal({ open: false, contract: null });
            fetchContracts();
        } catch (e: any) {
            flash('❌ ' + (e.response?.data?.message || 'Lỗi ký hợp đồng'), true);
        } finally { setSigning(false); }
    };

    const downloadContract = async (id: number) => {
        try {
            const res = await api.get(`/tutor/contracts/${id}/download`);
            const blob = new Blob([res.data], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `hop-dong-${id}.html`; a.click();
            URL.revokeObjectURL(url);
        } catch (e) { flash('❌ Không tải được hợp đồng', true); }
    };

    return (
        <div className="dashboard-page">
            <Header />
            <div className="dashboard-layout">
                <aside className="dash-sidebar">
                    <div className="dash-avatar">
                        <div className="avatar-circle tutor">📄</div>
                        <div>
                            <div className="dash-name">Hợp đồng của tôi</div>
                            <div className="dash-role-badge tutor">Gia sư</div>
                        </div>
                    </div>
                    <nav className="dash-nav">
                        <Link to="/tutor" className="dash-nav-link">← Về Dashboard</Link>
                    </nav>
                </aside>

                <main className="dash-main">
                    {msg && <div className={isErr ? 'alert alert-error' : 'flash-msg'} style={{ marginBottom: '1rem' }}>{msg}</div>}
                    <h2 className="dash-title">Hợp đồng gia sư</h2>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                        Hợp đồng được Admin cấp. Bạn cần ký hợp đồng trước khi có thể tạo khóa học.
                    </p>

                    {loading ? <div className="loading-spinner">Đang tải...</div> : (
                        contracts.length === 0 ? (
                            <div className="empty-state">
                                <p>Chưa có hợp đồng nào. Vui lòng liên hệ Admin để được cấp hợp đồng.</p>
                            </div>
                        ) : (
                            <div className="card-list">
                                {contracts.map(c => {
                                    const s = STATUS_MAP[c.status] || { label: c.status, color: '#64748b' };
                                    return (
                                        <div key={c.id} className="reg-card">
                                            <div className="reg-card-header">
                                                <h3>📄 Hợp đồng #{c.id}</h3>
                                                <span className="status-badge" style={{ background: s.color }}>{s.label}</span>
                                            </div>
                                            <p>📅 Ngày cấp: {new Date(c.createdAt).toLocaleDateString('vi-VN')}</p>
                                            {c.signedAt && <p>✅ Ngày ký: {new Date(c.signedAt).toLocaleDateString('vi-VN')}</p>}
                                            <div className="reg-actions">
                                                <button className="btn-sm btn-outline"
                                                    onClick={() => { setViewModal({ open: true, contract: c }); setHasSig(false); }}>
                                                    👁️ Xem hợp đồng
                                                </button>
                                                {c.status === 'PENDING' && (
                                                    <button className="btn-sm btn-primary"
                                                        onClick={() => { setViewModal({ open: true, contract: c }); setHasSig(false); }}>
                                                        ✍️ Ký hợp đồng
                                                    </button>
                                                )}
                                                {c.status === 'SIGNED' && (
                                                    <button className="btn-sm btn-outline" onClick={() => downloadContract(c.id)}>
                                                        ⬇️ Tải xuống
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </main>
            </div>

            {/* MODAL XEM + KÝ HỢP ĐỒNG */}
            {viewModal.open && viewModal.contract && (
                <div className="modal-overlay" onClick={() => setViewModal({ open: false, contract: null })}>
                    <div className="modal-box" style={{ maxWidth: 700, maxHeight: '90vh', overflowY: 'auto' }}
                        onClick={e => e.stopPropagation()}>
                        <h3>📄 Hợp đồng #{viewModal.contract.id}</h3>

                        {/* Nội dung hợp đồng */}
                        <div style={{
                            border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.5rem',
                            background: '#f8fafc', marginBottom: '1.5rem', maxHeight: '300px', overflowY: 'auto',
                            fontSize: '0.88rem', lineHeight: '1.7', color: '#374151'
                        }}
                            dangerouslySetInnerHTML={{ __html: viewModal.contract.contentSnapshot }}
                        />

                        {/* Khu vực ký tên — chỉ hiện khi PENDING */}
                        {viewModal.contract.status === 'PENDING' && (
                            <div>
                                <p style={{ fontWeight: 600, color: '#374151', marginBottom: '8px' }}>
                                    ✍️ Ký tên của bạn vào ô bên dưới:
                                </p>
                                <canvas
                                    ref={canvasRef}
                                    width={600} height={150}
                                    style={{
                                        border: '2px dashed #4f46e5', borderRadius: '10px',
                                        cursor: 'crosshair', background: 'white', width: '100%', display: 'block'
                                    }}
                                    onMouseDown={startDraw}
                                    onMouseMove={draw}
                                    onMouseUp={stopDraw}
                                    onMouseLeave={stopDraw}
                                />
                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '1rem' }}>
                                    <button className="btn-sm btn-outline" onClick={clearCanvas}>🗑️ Xóa chữ ký</button>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-primary" onClick={signContract} disabled={signing || !hasSig}>
                                        {signing ? 'Đang ký...' : '✅ Xác nhận ký hợp đồng'}
                                    </button>
                                    <button className="btn-outline" onClick={() => setViewModal({ open: false, contract: null })}>Đóng</button>
                                </div>
                            </div>
                        )}

                        {viewModal.contract.status === 'SIGNED' && (
                            <div>
                                {viewModal.contract.signatureBase64 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontWeight: 600, color: '#374151', marginBottom: '8px' }}>Chữ ký của bạn:</p>
                                        <img src={viewModal.contract.signatureBase64} alt="Chữ ký"
                                            style={{ border: '1px solid #e2e8f0', borderRadius: '8px', maxWidth: '200px' }} />
                                    </div>
                                )}
                                <div className="modal-actions">
                                    <button className="btn-primary" onClick={() => downloadContract(viewModal.contract!.id)}>⬇️ Tải xuống</button>
                                    <button className="btn-outline" onClick={() => setViewModal({ open: false, contract: null })}>Đóng</button>
                                </div>
                            </div>
                        )}

                        {viewModal.contract.status !== 'PENDING' && viewModal.contract.status !== 'SIGNED' && (
                            <div className="modal-actions">
                                <button className="btn-outline" onClick={() => setViewModal({ open: false, contract: null })}>Đóng</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
