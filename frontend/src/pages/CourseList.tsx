import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { VIETNAM_PROVINCES, getDistricts } from '../data/vietnamDistricts';
import '../css/CourseList.css';

interface Course {
    id: number;
    title: string;
    description: string;
    subjectName: string;
    tutorName: string;
    tutorProfileId: number;
    pricePerSession: number;
    totalSessions: number;
    status: string;
    isPromoted: boolean;
    avgRating: number;
    registrationCount: number;
    score: number;
    teachingMode: string;
    hasApprovedStudent: boolean;
}

interface Subject {
    id: number;
    name: string;
}

export default function CourseList() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [courses, setCourses] = useState<Course[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [loading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState('');
    const [subject, setSubject] = useState(searchParams.get('subject') || '');
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(500000);
    const [grade, setGrade] = useState('');
    const [teachingMode, setTeachingMode] = useState('');
    const [province, setProvince] = useState('');
    const [district, setDistrict] = useState('');
    const [registerMsg, setRegisterMsg] = useState<Record<number, string>>({});

    useEffect(() => {
        api.get('/public/subjects').then(res => setSubjects(res.data)).catch(console.error);
        search();
    }, []);

    const search = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (keyword) params.q = keyword;
            if (subject) params.subject = subject;
            if (minPrice > 0) params.minPrice = minPrice;
            if (maxPrice < 500000) params.maxPrice = maxPrice;
            if (grade) params.grade = grade;
            if (teachingMode) params.teachingMode = teachingMode;
            // Ưu tiên quận/huyện nếu có, không thì dùng tỉnh
            if (district) params.province = district;
            else if (province) params.province = province;
            const res = await api.get('/public/courses', { params });
            setCourses(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const registerCourse = async (courseId: number) => {
        if (!user) { window.location.href = '/login'; return; }
        try {
            await api.post('/student/registrations', null, { params: { courseId } });
            setRegisterMsg(prev => ({ ...prev, [courseId]: '✅ Đã gửi đơn đăng ký! Chờ gia sư duyệt.' }));
        } catch (e: any) {
            setRegisterMsg(prev => ({ ...prev, [courseId]: '❌ ' + (e.response?.data?.message || 'Lỗi đăng ký') }));
        }
    };

    const renderStars = (rating: number) => {
        const full = Math.floor(rating);
        const half = rating - full >= 0.5;
        return (
            <span className="stars">
                {'★'.repeat(full)}
                {half ? '½' : ''}
                {'☆'.repeat(5 - full - (half ? 1 : 0))}
                <span className="rating-num">{rating > 0 ? rating.toFixed(1) : 'Chưa có'}</span>
            </span>
        );
    };

    return (
        <div className="course-list-page">
            <Header />

            {/* SEARCH BAR */}
            <div className="search-hero">
                <div className="search-hero-inner">
                    <h1>Tìm khóa học phù hợp</h1>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Tìm theo tên khóa học..."
                            value={keyword}
                            onChange={e => setKeyword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && search()}
                        />
                        <button className="search-btn" onClick={search}>🔍 Tìm kiếm</button>
                    </div>
                </div>
            </div>

            <div className="course-layout">
                {/* SIDEBAR */}
                <aside className="course-sidebar">
                    <h3>Bộ lọc</h3>
                    <div className="filter-block">
                        <label>Môn học</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)}>
                            <option value="">Tất cả môn</option>
                            {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="filter-block">
                        <label>Hình thức dạy</label>
                        <select value={teachingMode} onChange={e => setTeachingMode(e.target.value)}>
                            <option value="">Tất cả hình thức</option>
                            <option value="ONLINE">🌐 Online</option>
                            <option value="OFFLINE">🏠 Offline (Tại nhà)</option>
                        </select>
                    </div>
                    <div className="filter-block">
                        <label>Tỉnh / Thành phố</label>
                        <select value={province} onChange={e => { setProvince(e.target.value); setDistrict(''); }}>
                            <option value="">Tất cả địa điểm</option>
                            {VIETNAM_PROVINCES.map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    {province && (
                        <div className="filter-block">
                            <label>Quận / Huyện</label>
                            <select value={district} onChange={e => setDistrict(e.target.value)}>
                                <option value="">Tất cả quận/huyện</option>
                                {getDistricts(province).map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="filter-block">
                        <label>Giá / buổi (VNĐ)</label>
                        <div className="price-range-display">
                            <span>{minPrice.toLocaleString('vi-VN')}đ</span>
                            <span>—</span>
                            <span>{maxPrice >= 500000 ? '500.000đ+' : maxPrice.toLocaleString('vi-VN') + 'đ'}</span>
                        </div>
                        <div className="price-slider-wrap">
                            <input
                                type="range"
                                className="price-slider"
                                min={0} max={500000} step={10000}
                                value={minPrice}
                                onChange={e => {
                                    const v = Number(e.target.value);
                                    if (v <= maxPrice) setMinPrice(v);
                                }}
                            />
                            <input
                                type="range"
                                className="price-slider"
                                min={0} max={500000} step={10000}
                                value={maxPrice}
                                onChange={e => {
                                    const v = Number(e.target.value);
                                    if (v >= minPrice) setMaxPrice(v);
                                }}
                            />
                        </div>
                        <div className="price-marks">
                            <span>0</span>
                            <span>100k</span>
                            <span>200k</span>
                            <span>300k</span>
                            <span>500k+</span>
                        </div>
                    </div>
                    <button className="filter-apply-btn" onClick={search}>Áp dụng bộ lọc</button>
                    <button className="filter-reset-btn" onClick={() => { setKeyword(''); setSubject(''); setMinPrice(0); setMaxPrice(500000); setGrade(''); setTeachingMode(''); setProvince(''); setDistrict(''); setTimeout(search, 0); }}>
                        Xóa bộ lọc
                    </button>
                </aside>

                {/* DANH SÁCH */}
                <section className="course-results">
                    <div className="results-header">
                        <p>Tìm thấy <strong>{courses.length}</strong> khóa học</p>
                        <span className="sort-note">Sắp xếp theo: Đánh giá → Độ phổ biến → Đẩy tin</span>
                    </div>

                    {loading ? (
                        <div className="loading-spinner">Đang tải...</div>
                    ) : courses.length === 0 ? (
                        <div className="empty-state">
                            <p>Không tìm thấy khóa học phù hợp.</p>
                        </div>
                    ) : (
                        <div className="course-grid">
                            {courses.map(c => (
                                <div key={c.id} className={`course-card ${c.isPromoted ? 'promoted' : ''}`}>
                                    {c.isPromoted && <div className="promoted-ribbon">🔥 Đẩy tin</div>}
                                    <div className="course-card-body">
                                        <div className="course-subject-tag">{c.subjectName}</div>
                                        <h3 className="course-title">{c.title}</h3>
                                        <p className="course-tutor">
                                            <Link to={`/tutor-profile/${c.tutorProfileId}`} style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
                                                👨‍🏫 {c.tutorName}
                                            </Link>
                                        </p>
                                        <div className="course-meta">
                                            <span>{renderStars(c.avgRating || 0)}</span>
                                            <span className="meta-sep">·</span>
                                            <span>👥 {c.registrationCount} học viên</span>
                                            <span className="meta-sep">·</span>
                                            <span>📅 {c.totalSessions} buổi</span>
                                            <span className="meta-sep">·</span>
                                            <span>{c.teachingMode === 'ONLINE' ? '🌐 Online' : c.teachingMode === 'OFFLINE' ? '🏠 Offline' : '🌐🏠 Online & Offline'}</span>
                                        </div>
                                        {c.description && (
                                            <p className="course-desc">{c.description.slice(0, 100)}{c.description.length > 100 ? '...' : ''}</p>
                                        )}
                                    </div>
                                    <div className="course-card-footer">
                                        <div className="course-price">
                                            <span className="price-amount">{c.pricePerSession?.toLocaleString('vi-VN')}đ</span>
                                            <span className="price-unit">/buổi</span>
                                        </div>
                                        <div className="course-actions">
                                            <Link to={`/courses/${c.id}`} className="btn-detail">Chi tiết</Link>
                                            {user?.role === 'STUDENT' && (
                                                c.hasApprovedStudent || c.registrationCount >= 1 ? (
                                                    <button className="btn-register-course btn-full" disabled>
                                                        🔒 Đã có học viên
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn-register-course"
                                                        onClick={() => registerCourse(c.id)}
                                                        disabled={!!registerMsg[c.id]}
                                                    >
                                                        {registerMsg[c.id] ? '✓ Đã gửi' : 'Đăng ký'}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                        {registerMsg[c.id] && (
                                            <p className="register-feedback" style={{ color: registerMsg[c.id].startsWith('✅') ? '#10b981' : '#ef4444' }}>
                                                {registerMsg[c.id]}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            <Footer />
        </div>
    );
}
