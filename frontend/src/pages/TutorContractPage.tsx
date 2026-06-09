import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
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

    // Upload ảnh chữ ký đã tách nền
    const [sigFile, setSigFile] = useState<File | null>(null);
    const [sigPreview, setSigPreview] = useState<string | null>(null);

    // Yêu cầu hợp đồng
    const [requesting, setRequesting] = useState(false);
    const [requested, setRequested] = useState(false);

    // Modal QR đóng phí sàn
    const [feeModal, setFeeModal] = useState(false);
    const [adminPayInfo, setAdminPayInfo] = useState<{ bankName: string; bankAccount: string; bankOwner: string; qrImageUrl: string } | null>(null);
    const [feeProofFile, setFeeProofFile] = useState<File | null>(null);
    const [feeProofMsg, setFeeProofMsg] = useState('');
    const [submittingFee, setSubmittingFee] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        fetchContracts();
        api.get('/public/payment-info').then(res => setAdminPayInfo(res.data)).catch(console.error);
    }, []);

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

    // Xử lý upload ảnh chữ ký đã tách nền — nén xuống trước khi gửi
    const handleSigUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSigFile(file);

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            // Giữ nguyên tỉ lệ, chỉ scale down nếu quá lớn
            const MAX_W = 500;
            const ratio = Math.min(1, MAX_W / img.width);
            canvas.width  = Math.round(img.width  * ratio);
            canvas.height = Math.round(img.height * ratio);
            const ctx = canvas.getContext('2d')!;
            // KHÔNG fill background — giữ trong suốt để chữ ký hiện đúng
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const compressed = canvas.toDataURL('image/png');
            setSigPreview(compressed);
            setHasSig(true);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    const clearSig = () => {
        setSigFile(null);
        setSigPreview(null);
        setHasSig(false);
    };

    // Yêu cầu Admin cấp hợp đồng
    const requestContract = async () => {
        setRequesting(true);
        try {
            await api.post('/tutor/contracts/request');
            setRequested(true);
            flash('✅ Đã gửi yêu cầu! Admin sẽ cấp hợp đồng cho bạn sớm.');
        } catch (e: any) {
            flash('❌ ' + (e.response?.data?.message || 'Lỗi gửi yêu cầu'), true);
        } finally { setRequesting(false); }
    };

    // Nộp minh chứng đóng phí sàn
    const submitFeeProof = async () => {
        if (!feeProofFile) { setFeeProofMsg('Vui lòng chọn ảnh minh chứng'); return; }
        setSubmittingFee(true);
        try {
            const formData = new FormData();
            formData.append('proof', feeProofFile);
            await api.post('/payments/platform-fee', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFeeProofMsg('✅ Đã nộp minh chứng! Admin sẽ xác nhận sớm.');
            setFeeProofFile(null);
        } catch (e: any) {
            setFeeProofMsg('❌ ' + (e.response?.data?.message || 'Lỗi nộp minh chứng'));
        } finally { setSubmittingFee(false); }
    };

    const signContract = async () => {
        if (!sigPreview) { flash('Vui lòng upload ảnh chữ ký trước!', true); return; }
        setSigning(true);
        try {
            await api.post(`/tutor/contracts/${viewModal.contract!.id}/sign`, { signatureBase64: sigPreview });
            flash('✅ Ký hợp đồng thành công!');
            setViewModal({ open: false, contract: null });
            clearSig();
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

    const downloadPdf = (id: number) => {
        const token = localStorage.getItem('token');
        window.open(
            `http://localhost:8080/api/tutor/contracts/${id}/download-pdf?token=${token}`,
            '_blank'
        );
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
                                <p style={{ fontSize: '1rem', color: '#374151', marginBottom: '0.5rem' }}>
                                    Bạn chưa có hợp đồng nào.
                                </p>
                                <p style={{ fontSize: '0.88rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
                                    Bấm nút bên dưới để gửi yêu cầu — Admin sẽ cấp hợp đồng cho bạn trong thời gian sớm nhất.
                                </p>
                                {requested ? (
                                    <div style={{ background: '#d1fae5', color: '#065f46', padding: '12px 20px', borderRadius: '10px', fontSize: '0.92rem', fontWeight: 600 }}>
                                        ✅ Đã gửi yêu cầu! Vui lòng chờ Admin xét duyệt.
                                    </div>
                                ) : (
                                    <button className="btn-primary" onClick={requestContract} disabled={requesting}>
                                        {requesting ? '⏳ Đang gửi...' : '📩 Yêu cầu cấp hợp đồng'}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Nút đóng phí sàn — hiện khi đã có hợp đồng đã ký */}
                                {contracts.some(c => c.status === 'SIGNED') && (
                                    <div style={{ background: '#fffbeb', border: '1.5px solid #fbbf24', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 4px', fontSize: '0.95rem' }}>
                                                💵 Đóng phí sàn để bắt đầu tạo khóa học
                                            </p>
                                            <p style={{ fontSize: '0.82rem', color: '#b45309', margin: 0 }}>
                                                Phí sàn <strong>200.000đ</strong> — nộp một lần để kích hoạt tài khoản gia sư
                                            </p>
                                        </div>
                                        <button className="btn-primary" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}
                                            onClick={() => { setFeeModal(true); setFeeProofMsg(''); }}>
                                            💳 Đóng phí sàn ngay
                                        </button>
                                    </div>
                                )}

                                {/* Danh sách hợp đồng */}
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
                                                        onClick={() => { setViewModal({ open: true, contract: c }); setSigPreview(null); }}>
                                                        👁️ Xem hợp đồng
                                                    </button>
                                                    {c.status === 'PENDING' && (
                                                        <button className="btn-sm btn-primary"
                                                            onClick={() => { setViewModal({ open: true, contract: c }); setSigPreview(null); }}>
                                                            ✍️ Ký hợp đồng
                                                        </button>
                                                    )}
                                                    {c.status === 'SIGNED' && (
                                                        <button className="btn-sm btn-primary" onClick={() => downloadPdf(c.id)}>
                                                            📥 Tải PDF
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
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
                                {/* Hướng dẫn tách nền chữ ký */}
                                <div style={{ background: '#fffbeb', border: '1.5px solid #fbbf24', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.25rem' }}>
                                    <p style={{ fontWeight: 700, color: '#92400e', margin: '0 0 6px', fontSize: '0.9rem' }}>
                                        ✍️ CHỮ KÝ CỦA BẠN
                                    </p>
                                    <p style={{ color: '#b45309', fontSize: '0.85rem', margin: 0 }}>
                                        Bạn vui lòng nhấn{' '}
                                        <a href="https://www.remove.bg/vi/upload" target="_blank" rel="noopener noreferrer"
                                            style={{ color: '#ef4444', fontWeight: 700, textDecoration: 'underline' }}>
                                            vào đây
                                        </a>
                                        {' '}để tách nền cho chữ ký trước khi tải ảnh lên nhé
                                    </p>
                                </div>

                                {/* Upload ảnh chữ ký */}
                                {!sigPreview ? (
                                    <label style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        width: '100%', minHeight: '120px', border: '2px dashed #cbd5e1', borderRadius: '12px',
                                        background: '#f8fafc', cursor: 'pointer', gap: '8px', marginBottom: '1rem'
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>🖼️</span>
                                        <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Click để chọn ảnh chữ ký (PNG trong suốt)</span>
                                        <input type="file" accept="image/png,image/*" style={{ display: 'none' }}
                                            onChange={handleSigUpload} />
                                    </label>
                                ) : (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '8px' }}>
                                            ✅ Chữ ký của bạn — sẽ được chèn vào hợp đồng:
                                        </p>
                                        {/* Preview chữ ký trên nền hợp đồng */}
                                        <div style={{
                                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px',
                                            padding: '16px 24px', display: 'inline-block', minWidth: '200px',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                                        }}>
                                            <img src={sigPreview} alt="Chữ ký"
                                                style={{ maxWidth: '180px', maxHeight: '80px', objectFit: 'contain', display: 'block' }} />
                                        </div>
                                        <button className="btn-sm btn-outline" style={{ marginTop: '8px', marginLeft: '8px' }}
                                            onClick={clearSig}>
                                            🗑️ Chọn lại
                                        </button>
                                    </div>
                                )}

                                <div className="modal-actions">
                                    <button className="btn-primary" onClick={signContract} disabled={signing || !sigPreview}>
                                        {signing ? 'Đang ký...' : '✅ Xác nhận ký hợp đồng'}
                                    </button>
                                    <button className="btn-outline" onClick={() => { setViewModal({ open: false, contract: null }); clearSig(); }}>Đóng</button>
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
                                    <button className="btn-primary" onClick={() => downloadPdf(viewModal.contract!.id)}>📥 Tải PDF</button>
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

            {/* MODAL QR ĐÓNG PHÍ SÀN */}
            {feeModal && (
                <div className="modal-overlay" onClick={() => setFeeModal(false)}>
                    <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '4px' }}>💵</div>
                            <h3 style={{ margin: 0, color: '#92400e' }}>Đóng phí sàn — 200.000đ</h3>
                            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '6px 0 0' }}>
                                Nộp một lần để kích hoạt tài khoản gia sư và bắt đầu tạo khóa học
                            </p>
                        </div>

                        {/* QR + thông tin tài khoản */}
                        {adminPayInfo?.qrImageUrl && (
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <img
                                    src={`http://localhost:8080/api/materials/download/${adminPayInfo.qrImageUrl}`}
                                    alt="QR chuyển khoản"
                                    style={{ width: 180, height: 180, objectFit: 'contain', borderRadius: '12px', border: '2px solid #e2e8f0' }}
                                />
                            </div>
                        )}

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

                        {/* Nội dung chuyển khoản tự sinh theo tên gia sư */}
                        {(() => {
                            const content = `PhiSan ${user?.fullName?.replace(/\s+/g, '') || 'GiaSu'}`;
                            return (
                                <div style={{ background: '#fff7ed', border: '2px solid #fed7aa', borderRadius: '12px', padding: '12px 16px', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.82rem', color: '#92400e', fontWeight: 600, margin: '0 0 6px' }}>
                                        ⚠️ Nội dung chuyển khoản (bắt buộc nhập đúng)
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <code style={{ flex: 1, background: 'white', border: '1.5px solid #fed7aa', borderRadius: '8px', padding: '8px 12px', fontSize: '1rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.5px' }}>
                                            {content}
                                        </code>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(content); }}
                                            style={{ background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Nộp minh chứng */}
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                                📤 Sau khi chuyển khoản, nộp minh chứng để Admin xác nhận:
                            </p>
                            <input type="file" accept="image/*,.pdf"
                                onChange={e => setFeeProofFile(e.target.files?.[0] || null)}
                                style={{ padding: '8px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '0.88rem', width: '100%', boxSizing: 'border-box' }} />
                            {feeProofFile && <p style={{ fontSize: '0.82rem', color: '#10b981', marginTop: '4px' }}>✅ Đã chọn: {feeProofFile.name}</p>}
                        </div>

                        {feeProofMsg && (
                            <p style={{ color: feeProofMsg.startsWith('✅') ? '#10b981' : '#ef4444', fontSize: '0.88rem', marginBottom: '8px' }}>
                                {feeProofMsg}
                            </p>
                        )}

                        <div className="modal-actions">
                            <button className="btn-primary" onClick={submitFeeProof} disabled={submittingFee || !feeProofFile}>
                                {submittingFee ? '⏳ Đang gửi...' : '📤 Nộp minh chứng'}
                            </button>
                            <button className="btn-outline" onClick={() => { setFeeModal(false); setFeeProofFile(null); setFeeProofMsg(''); }}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
