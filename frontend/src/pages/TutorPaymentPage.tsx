import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Dashboard.css';
import '../css/TutorPayment.css';

interface Summary {
    totalIncome: number;
    platformFeePercent: number;
    estimatedFee: number;
    netIncome: number;
    paidPlatformFee: boolean;
    platformFeeAmount: number;
    bankName: string | null;
    bankAccount: string | null;
    bankOwner: string | null;
}

interface IncomeRecord {
    id: number;
    courseTitle: string;
    amount: number;
    status: string;
    verifiedAt: string | null;
    createdAt: string;
}

export default function TutorPaymentPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = (searchParams.get('tab') as 'overview' | 'history' | 'bank') || 'overview';
    const setTab = (t: 'overview' | 'history' | 'bank') => setSearchParams({ tab: t });
    const [summary, setSummary] = useState<Summary | null>(null);
    const [history, setHistory] = useState<IncomeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState('');
    const [isErr, setIsErr] = useState(false);

    // Bank form
    const [bankForm, setBankForm] = useState({ bankName: '', bankAccount: '', bankOwner: '' });
    const [savingBank, setSavingBank] = useState(false);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [sumRes, histRes] = await Promise.all([
                api.get('/payments/tutor/summary'),
                api.get('/payments/tutor/income-history'),
            ]);
            setSummary(sumRes.data);
            setHistory(histRes.data);
            setBankForm({
                bankName: sumRes.data.bankName || '',
                bankAccount: sumRes.data.bankAccount || '',
                bankOwner: sumRes.data.bankOwner || '',
            });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const flash = (text: string, err = false) => {
        setMsg(text); setIsErr(err);
        setTimeout(() => setMsg(''), 3000);
    };

    const saveBankInfo = async () => {
        if (!bankForm.bankName.trim() || !bankForm.bankAccount.trim() || !bankForm.bankOwner.trim()) {
            flash('❌ Vui lòng điền đầy đủ thông tin ngân hàng', true); return;
        }
        setSavingBank(true);
        try {
            await api.put('/payments/tutor/bank-info', bankForm);
            flash('✅ Đã cập nhật thông tin tài khoản thụ hưởng!');
            fetchAll();
        } catch (e: any) {
            flash('❌ ' + (e.response?.data?.message || 'Lỗi cập nhật'), true);
        } finally { setSavingBank(false); }
    };

    const fmt = (n: number) => n?.toLocaleString('vi-VN') + 'đ';

    return (
        <div className="dashboard-page">
            <Header />
            <div className="dashboard-layout">
                <aside className="dash-sidebar">
                    <div className="dash-avatar">
                        <div className="avatar-circle tutor">💰</div>
                        <div>
                            <div className="dash-name">Quản lý thanh toán</div>
                            <div className="dash-role-badge tutor">Gia sư</div>
                        </div>
                    </div>
                    <nav className="dash-nav">
                        <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>
                            📊 Doanh thu & Phí
                        </button>
                        <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>
                            📋 Lịch sử nhận tiền
                        </button>
                        <button className={tab === 'bank' ? 'active' : ''} onClick={() => setTab('bank')}>
                            🏦 Tài khoản thụ hưởng
                        </button>
                        <Link to="/tutor" className="dash-nav-link">← Về Dashboard</Link>
                    </nav>
                </aside>

                <main className="dash-main">
                    {msg && (
                        <div className={isErr ? 'alert alert-error' : 'flash-msg'} style={{ marginBottom: '1rem' }}>
                            {msg}
                        </div>
                    )}

                    {loading ? <div className="loading-spinner">Đang tải...</div> : (
                        <>
                            {/* ===== TAB: DOANH THU & PHÍ ===== */}
                            {tab === 'overview' && summary && (
                                <div>
                                    <h2 className="dash-title">📊 Doanh thu & Đối soát phí</h2>

                                    {/* Thẻ tóm tắt */}
                                    <div className="tp-cards">
                                        <div className="tp-card tp-card-green">
                                            <div className="tp-card-icon">💰</div>
                                            <div className="tp-card-body">
                                                <p className="tp-card-label">Tổng doanh thu</p>
                                                <p className="tp-card-value">{fmt(summary.totalIncome)}</p>
                                                <p className="tp-card-sub">Học phí học viên đã thanh toán</p>
                                            </div>
                                        </div>
                                        <div className="tp-card tp-card-orange">
                                            <div className="tp-card-icon">📉</div>
                                            <div className="tp-card-body">
                                                <p className="tp-card-label">Phí sàn ({summary.platformFeePercent}%)</p>
                                                <p className="tp-card-value">{fmt(summary.estimatedFee)}</p>
                                                <p className="tp-card-sub">Khấu trừ từ doanh thu</p>
                                            </div>
                                        </div>
                                        <div className="tp-card tp-card-purple">
                                            <div className="tp-card-icon">🏆</div>
                                            <div className="tp-card-body">
                                                <p className="tp-card-label">Thực nhận dự kiến</p>
                                                <p className="tp-card-value">{fmt(summary.netIncome)}</p>
                                                <p className="tp-card-sub">Sau khi trừ phí sàn</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Đối soát phí sàn */}
                                    <div className="tp-section">
                                        <h3>🔍 Đối soát phí sàn</h3>
                                        <div className="tp-fee-row">
                                            <div className="tp-fee-item">
                                                <span className="tp-fee-label">Phí đăng ký sàn (1 lần)</span>
                                                <span className="tp-fee-amount">{fmt(summary.platformFeeAmount)}</span>
                                                <span className={`tp-fee-status ${summary.paidPlatformFee ? 'paid' : 'unpaid'}`}>
                                                    {summary.paidPlatformFee ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                                                </span>
                                            </div>
                                            <div className="tp-fee-item">
                                                <span className="tp-fee-label">Phí % trên doanh thu ({summary.platformFeePercent}%)</span>
                                                <span className="tp-fee-amount">{fmt(summary.estimatedFee)}</span>
                                                <span className="tp-fee-status info">📊 Tự động khấu trừ</span>
                                            </div>
                                        </div>
                                        <div className="tp-note">
                                            💡 Phí sàn {summary.platformFeePercent}% được tính trên tổng học phí thu được.
                                            Hệ thống sẽ chuyển phần còn lại vào tài khoản thụ hưởng của bạn.
                                        </div>
                                    </div>

                                    {/* Thông tin tài khoản */}
                                    <div className="tp-section">
                                        <h3>🏦 Tài khoản thụ hưởng hiện tại</h3>
                                        {summary.bankAccount ? (
                                            <div className="tp-bank-display">
                                                <div className="tp-bank-row">
                                                    <span>Ngân hàng:</span>
                                                    <strong>{summary.bankName}</strong>
                                                </div>
                                                <div className="tp-bank-row">
                                                    <span>Số tài khoản:</span>
                                                    <strong>{summary.bankAccount}</strong>
                                                </div>
                                                <div className="tp-bank-row">
                                                    <span>Chủ tài khoản:</span>
                                                    <strong>{summary.bankOwner}</strong>
                                                </div>
                                                <button className="btn-sm btn-outline" style={{ marginTop: '12px' }}
                                                    onClick={() => setTab('bank')}>
                                                    ✏️ Cập nhật
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="tp-bank-empty">
                                                <p>⚠️ Bạn chưa cập nhật tài khoản thụ hưởng.</p>
                                                <button className="btn-sm btn-primary" onClick={() => setTab('bank')}>
                                                    🏦 Cập nhật ngay
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ===== TAB: LỊCH SỬ NHẬN TIỀN ===== */}
                            {tab === 'history' && (
                                <div>
                                    <h2 className="dash-title">📋 Lịch sử nhận tiền</h2>
                                    {history.length === 0 ? (
                                        <div className="empty-state">
                                            <p>Chưa có học viên nào thanh toán học phí.</p>
                                        </div>
                                    ) : (
                                        <div className="card-list">
                                            {history.map(h => (
                                                <div key={h.id} className="reg-card">
                                                    <div className="reg-card-header">
                                                        <h3>📚 {h.courseTitle}</h3>
                                                        <span className="status-badge" style={{ background: '#10b981' }}>
                                                            ✅ Đã nhận
                                                        </span>
                                                    </div>
                                                    <p>💰 Học phí: <strong style={{ color: '#10b981' }}>{fmt(h.amount)}</strong></p>
                                                    <p>📉 Phí sàn (10%): <strong style={{ color: '#f59e0b' }}>
                                                        -{fmt(h.amount * 0.1)}
                                                    </strong></p>
                                                    <p>🏆 Thực nhận: <strong style={{ color: '#4f46e5' }}>
                                                        {fmt(h.amount * 0.9)}
                                                    </strong></p>
                                                    {h.verifiedAt && (
                                                        <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                                                            📅 Xác nhận: {new Date(h.verifiedAt).toLocaleString('vi-VN')}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ===== TAB: TÀI KHOẢN THỤ HƯỞNG ===== */}
                            {tab === 'bank' && (
                                <div>
                                    <h2 className="dash-title">🏦 Cập nhật tài khoản thụ hưởng</h2>
                                    <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                                        Hệ thống sẽ chuyển tiền vào tài khoản này sau khi đối soát phí sàn.
                                        Vui lòng điền chính xác để tránh sai sót.
                                    </p>
                                    <div className="tp-bank-form">
                                        <div className="form-group">
                                            <label>Tên ngân hàng *</label>
                                            <input
                                                value={bankForm.bankName}
                                                onChange={e => setBankForm(p => ({ ...p, bankName: e.target.value }))}
                                                placeholder="Ví dụ: Vietcombank, BIDV, Techcombank..."
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Số tài khoản *</label>
                                            <input
                                                value={bankForm.bankAccount}
                                                onChange={e => setBankForm(p => ({ ...p, bankAccount: e.target.value }))}
                                                placeholder="Ví dụ: 1234567890"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Tên chủ tài khoản *</label>
                                            <input
                                                value={bankForm.bankOwner}
                                                onChange={e => setBankForm(p => ({ ...p, bankOwner: e.target.value }))}
                                                placeholder="Ví dụ: NGUYEN VAN A (viết hoa, không dấu)"
                                            />
                                        </div>
                                        <button
                                            className="btn-primary"
                                            onClick={saveBankInfo}
                                            disabled={savingBank}
                                            style={{ marginTop: '8px' }}
                                        >
                                            {savingBank ? '⏳ Đang lưu...' : '💾 Lưu thông tin'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
            <Footer />
        </div>
    );
}
