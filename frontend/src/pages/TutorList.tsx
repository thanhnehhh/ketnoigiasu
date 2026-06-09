import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/TutorList.css';

interface Tutor {
    id: number;
    fullName: string;
    school: string;
    major: string;
    strengths: string;
    address: string;
    avatarUrl: string | null;
    subjects: string[] | string;
    grades: string[] | string;
    reputationScore: number;
    reputationLabel: string;
}

const SUBJECTS = ['Toán','Lý','Hóa','Văn','Tiếng Anh','Tiếng Trung','Tiếng Nhật','IELTS','TOEIC','Lịch sử','Địa lý','Sinh học','Tin học'];

export default function TutorList() {
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [subject, setSubject] = useState('');

    useEffect(() => { search(); }, []);

    const search = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (keyword) params.keyword = keyword;
            if (subject) params.subject = subject;
            const res = await api.get('/tutor-profiles', { params });
            setTutors(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const getSubjectList = (t: Tutor): string[] => {
        if (Array.isArray(t.subjects)) return t.subjects;
        if (typeof t.subjects === 'string' && t.subjects)
            return t.subjects.replace(/[\[\]"]/g, '').split(',').map(s => s.trim()).filter(Boolean);
        return [];
    };

    const getReputationColor = (score: number) => {
        if (score >= 85) return '#10b981';
        if (score >= 70) return '#3b82f6';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="tutor-list-page">
            <Header />

            <div className="tl-hero">
                <div className="tl-hero-inner">
                    <h1>Tìm gia sư phù hợp</h1>
                    <p>Kết nối với hàng trăm gia sư chất lượng, đã xác minh</p>
                    <div className="tl-search-bar">
                        <input
                            type="text"
                            placeholder="Tìm theo tên gia sư, môn học, kinh nghiệm..."
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && search()}
                        />
                        <button onClick={search}>🔍 Tìm kiếm</button>
                    </div>
                </div>
            </div>

            <div className="tl-layout">
                {/* SIDEBAR */}
                <aside className="tl-sidebar">
                    <h3>Bộ lọc</h3>
                    <div className="tl-filter-block">
                        <label>Môn dạy</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)}>
                            <option value="">Tất cả môn</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <button className="tl-apply-btn" onClick={search}>Áp dụng</button>
                    <button className="tl-reset-btn" onClick={() => { setKeyword(''); setSubject(''); setTimeout(search, 0); }}>
                        Xóa bộ lọc
                    </button>
                </aside>

                {/* DANH SÁCH */}
                <section className="tl-results">
                    <p className="tl-count">Tìm thấy <strong>{tutors.length}</strong> gia sư</p>

                    {loading ? (
                        <div className="tl-loading">Đang tải...</div>
                    ) : tutors.length === 0 ? (
                        <div className="tl-empty">Không tìm thấy gia sư phù hợp.</div>
                    ) : (
                        <div className="tl-grid">
                            {tutors.map(t => {
                                const subjectList = getSubjectList(t);
                                return (
                                    <div key={t.id} className="tl-card">
                                        <div className="tl-card-top">
                                            <img
                                                src={t.avatarUrl
                                                    ? `http://localhost:8080/api/materials/download/${t.avatarUrl}`
                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(t.fullName)}&background=4f46e5&color=fff&size=64&bold=true&rounded=true`}
                                                alt={t.fullName}
                                                className="tl-avatar"
                                            />
                                            <div className="tl-card-info">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <h3 style={{ margin: 0 }}>{t.fullName}</h3>
                                                    {/* Badge điểm uy tín */}
                                                    <span style={{
                                                        background: getReputationColor(t.reputationScore),
                                                        color: 'white',
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: '20px',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        ⭐ {t.reputationScore} · {t.reputationLabel}
                                                    </span>
                                                </div>
                                                {t.school && <p>🎓 {t.school}{t.major ? ` · ${t.major}` : ''}</p>}
                                                {t.address && <p>📍 {t.address}</p>}
                                            </div>
                                        </div>

                                        {subjectList.length > 0 && (
                                            <div className="tl-subjects">
                                                {subjectList.slice(0, 5).map(s => (
                                                    <span key={s} className="tl-subject-tag">{s}</span>
                                                ))}
                                                {subjectList.length > 5 && (
                                                    <span className="tl-subject-tag more">+{subjectList.length - 5}</span>
                                                )}
                                            </div>
                                        )}

                                        {t.strengths && (
                                            <p className="tl-strengths">
                                                {t.strengths.length > 100 ? t.strengths.slice(0, 100) + '...' : t.strengths}
                                            </p>
                                        )}

                                        <div className="tl-card-footer">
                                            {/* Thanh điểm uy tín */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b', marginBottom: '3px' }}>
                                                    <span>Độ uy tín</span>
                                                    <span style={{ color: getReputationColor(t.reputationScore), fontWeight: 700 }}>{t.reputationScore}/100</span>
                                                </div>
                                                <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${t.reputationScore}%`,
                                                        background: getReputationColor(t.reputationScore),
                                                        borderRadius: '10px',
                                                        transition: 'width 0.3s',
                                                    }} />
                                                </div>
                                            </div>
                                            <Link to={`/tutor-profile/${t.id}`} className="tl-btn-view">
                                                Xem hồ sơ →
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            <Footer />
        </div>
    );
}
