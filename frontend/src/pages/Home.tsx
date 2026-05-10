import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Home.css';

const FEATURES = [
    { icon: '🛡️', title: 'Gia sư được xác minh', desc: 'Mỗi gia sư đều qua kiểm tra CCCD, ký hợp đồng và duyệt nội dung trước khi lên sàn.' },
    { icon: '📅', title: 'Lịch học linh hoạt', desc: 'Học online qua Google Meet/Zoom hoặc offline, sắp xếp theo thời gian của bạn.' },
    { icon: '⭐', title: 'Đánh giá minh bạch', desc: 'Chỉ học viên đã hoàn thành khóa học mới được đánh giá — không có review ảo.' },
    { icon: '🔒', title: 'Thanh toán an toàn', desc: 'Học phí chỉ được xác nhận sau khi Admin kiểm tra minh chứng chuyển khoản.' },
];

const SUBJECTS = [
    { name: 'Toán học',   icon: '📐', color: '#ede9fe', textColor: '#6d28d9' },
    { name: 'Tiếng Anh',  icon: '🇬🇧', color: '#dbeafe', textColor: '#1d4ed8' },
    { name: 'Vật lý',     icon: '⚡',  color: '#fef3c7', textColor: '#92400e' },
    { name: 'Hóa học',    icon: '🧪',  color: '#d1fae5', textColor: '#065f46' },
    { name: 'Ngữ văn',    icon: '📖',  color: '#fee2e2', textColor: '#991b1b' },
    { name: 'IELTS',      icon: '🌍',  color: '#e0f2fe', textColor: '#0369a1' },
    { name: 'Lịch sử',    icon: '🏛️',  color: '#fce7f3', textColor: '#9d174d' },
    { name: 'Tin học',    icon: '💻',  color: '#f3f4f6', textColor: '#374151' },
];

const TUTORS = [
    { name: 'Phạm Thị Lan', subject: 'Toán · THPT', rating: 4.9, reviews: 32, price: '250.000', color: '#4f46e5' },
    { name: 'Nguyễn Đức Huy', subject: 'Tiếng Anh · IELTS', rating: 4.8, reviews: 47, price: '300.000', color: '#0ea5e9' },
    { name: 'Trần Thị Mai', subject: 'Hóa học · THCS', rating: 5.0, reviews: 18, price: '200.000', color: '#10b981' },
    { name: 'Lê Văn Bình', subject: 'Vật lý · THPT', rating: 4.7, reviews: 25, price: '220.000', color: '#f59e0b' },
];

const REVIEWS = [
    { name: 'Minh Tú', text: 'Gia sư dạy rất dễ hiểu, kiên nhẫn giải thích từng bước. Điểm Toán của mình tăng từ 5 lên 8 sau 2 tháng!', subject: 'Toán lớp 11', rating: 5, color: '6366f1' },
    { name: 'Hồng Nhung', text: 'Tìm được gia sư IELTS phù hợp chỉ trong 1 ngày. Nền tảng rất tiện lợi, thanh toán minh bạch.', subject: 'IELTS', rating: 5, color: 'ec4899' },
    { name: 'Quốc Anh', text: 'Gia sư nhiệt tình, có phương pháp riêng rất hiệu quả. Mình đã đạt 9.0 Hóa trong kỳ thi THPT.', subject: 'Hóa học lớp 12', rating: 5, color: '10b981' },
];

const HOW_IT_WORKS = [
    { step: '01', title: 'Tìm khóa học', desc: 'Tìm kiếm theo môn học, lớp, giá tiền. Xem đánh giá thực từ học viên.' },
    { step: '02', title: 'Đăng ký & Chờ duyệt', desc: 'Gửi đơn đăng ký, gia sư xem xét và phản hồi trong 24 giờ.' },
    { step: '03', title: 'Thanh toán học phí', desc: 'Chuyển khoản và nộp minh chứng. Admin xác nhận trong vài giờ.' },
    { step: '04', title: 'Bắt đầu học', desc: 'Vào lớp học online hoặc gặp trực tiếp theo lịch đã thống nhất.' },
];

export default function Home() {
    const { user, isAuthenticated } = useAuth();
    const dashboardPath = user?.role === 'ADMIN' ? '/admin' : user?.role === 'TUTOR' ? '/tutor' : '/student';

    return (
        <div className="home-page">
            <Header />

            {/* ===== HERO ===== */}
            <section className="hero">
                <div className="hero-inner">
                    <div className="hero-text">
                        <div className="hero-badge">🎓 Nền tảng kết nối gia sư uy tín</div>
                        <h1 className="hero-title">
                            Học tốt hơn với<br />
                            <span className="hero-gradient">gia sư chất lượng</span>
                        </h1>
                        <p className="hero-desc">
                            Kết nối với gia sư đã được xác minh danh tính, ký hợp đồng rõ ràng.
                            Học online hoặc offline — linh hoạt theo lịch của bạn.
                        </p>
                        <div className="hero-actions">
                            {isAuthenticated ? (
                                <>
                                    <Link to="/courses" className="btn-hero-primary">🔍 Tìm khóa học ngay</Link>
                                    <Link to={dashboardPath} className="btn-hero-secondary">Vào Dashboard →</Link>
                                </>
                            ) : (
                                <>
                                    <Link to="/courses" className="btn-hero-primary">🔍 Tìm khóa học ngay</Link>
                                    <Link to="/register/student" className="btn-hero-secondary">Đăng ký miễn phí →</Link>
                                </>
                            )}
                        </div>
                        <div className="hero-stats">
                            <div className="stat"><strong>500+</strong><span>Gia sư</span></div>
                            <div className="stat-divider" />
                            <div className="stat"><strong>2.000+</strong><span>Học viên</span></div>
                            <div className="stat-divider" />
                            <div className="stat"><strong>4.8★</strong><span>Đánh giá TB</span></div>
                            <div className="stat-divider" />
                            <div className="stat"><strong>98%</strong><span>Hài lòng</span></div>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="hero-card-float card-1">
                            <div className="float-icon-box" style={{ background: '#d1fae5' }}>🛡️</div>
                            <div>
                                <div className="float-name">Gia sư xác minh 100%</div>
                                <div className="float-sub">CCCD · Hợp đồng · Kiểm duyệt</div>
                            </div>
                        </div>
                        <div className="hero-card-float card-2">
                            <div className="float-icon-box" style={{ background: '#dbeafe' }}>⭐</div>
                            <div>
                                <div className="float-name">Đánh giá thực tế</div>
                                <div className="float-sub">Chỉ từ học viên đã học</div>
                            </div>
                        </div>
                        <div className="hero-card-float card-3">
                            <div className="float-icon-box" style={{ background: '#fce7f3' }}>🔒</div>
                            <div>
                                <div className="float-name">Thanh toán an toàn</div>
                                <div className="float-sub">Admin xác nhận minh chứng</div>
                            </div>
                        </div>
                        <div className="hero-blob" />
                    </div>
                </div>
            </section>

            {/* ===== CÁCH HOẠT ĐỘNG ===== */}
            <section className="how-section">
                <div className="section-inner">
                    <h2 className="section-title">Bắt đầu chỉ trong 4 bước</h2>
                    <p className="section-sub">Đơn giản, nhanh chóng và minh bạch</p>
                    <div className="how-grid">
                        {HOW_IT_WORKS.map((h, i) => (
                            <div key={h.step} className="how-card">
                                <div className="how-step">{h.step}</div>
                                {i < HOW_IT_WORKS.length - 1 && <div className="how-arrow">→</div>}
                                <h3>{h.title}</h3>
                                <p>{h.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== MÔN HỌC ===== */}
            <section className="subjects-section">
                <div className="section-inner">
                    <h2 className="section-title">Khám phá theo môn học</h2>
                    <p className="section-sub">Hơn 20 môn học với gia sư chuyên sâu</p>
                    <div className="subjects-grid">
                        {SUBJECTS.map(s => (
                            <Link key={s.name} to={`/courses?subject=${encodeURIComponent(s.name)}`}
                                className="subject-chip" style={{ background: s.color, color: s.textColor }}>
                                <span className="subject-icon">{s.icon}</span>
                                <span>{s.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== GIA SƯ NỔI BẬT ===== */}
            <section className="tutors-section">
                <div className="section-inner">
                    <div className="section-header-row">
                        <div>
                            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '0.25rem' }}>Gia sư nổi bật</h2>
                            <p className="section-sub" style={{ textAlign: 'left', marginBottom: 0 }}>Được học viên đánh giá cao nhất</p>
                        </div>
                        <Link to="/courses" className="btn-see-all">Xem tất cả →</Link>
                    </div>
                    <div className="tutors-grid">
                        {TUTORS.map(t => (
                            <div key={t.name} className="tutor-card">
                                <div className="tutor-card-top">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=${t.color.replace('#','')}&color=fff&size=80&bold=true&rounded=true`}
                                        alt={t.name}
                                        className="tutor-avatar-img"
                                    />
                                    <div className="tutor-verified">✓ Đã xác minh</div>
                                </div>
                                <h3 className="tutor-name">{t.name}</h3>
                                <p className="tutor-subject">{t.subject}</p>
                                <div className="tutor-rating">
                                    <span className="stars-yellow">{'★'.repeat(Math.floor(t.rating))}</span>
                                    <span className="rating-val">{t.rating}</span>
                                    <span className="review-count">({t.reviews} đánh giá)</span>
                                </div>
                                <div className="tutor-price">
                                    <span className="price-val">{t.price}đ</span>
                                    <span className="price-unit">/buổi</span>
                                </div>
                                <Link to="/courses" className="btn-tutor-view">Xem khóa học</Link>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TẠI SAO CHỌN ===== */}
            <section className="features-section">
                <div className="section-inner">
                    <h2 className="section-title">Tại sao chọn Kết Nối Gia Sư?</h2>
                    <p className="section-sub">Chúng tôi đặt chất lượng và sự tin tưởng lên hàng đầu</p>
                    <div className="features-grid">
                        {FEATURES.map(f => (
                            <div key={f.title} className="feature-card">
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== ĐÁNH GIÁ HỌC VIÊN ===== */}
            <section className="reviews-section">
                <div className="section-inner">
                    <h2 className="section-title">Học viên nói gì về chúng tôi?</h2>
                    <p className="section-sub">Hơn 2.000 học viên đã tin tưởng và học tập trên nền tảng</p>
                    <div className="reviews-grid">
                        {REVIEWS.map(r => (
                            <div key={r.name} className="review-card">
                                <div className="review-stars">{'★'.repeat(r.rating)}</div>
                                <p className="review-text">"{r.text}"</p>
                                <div className="review-author">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(r.name)}&background=${r.color}&color=fff&size=40&bold=true&rounded=true`}
                                        alt={r.name}
                                        className="review-avatar-img"
                                    />
                                    <div>
                                        <div className="review-name">{r.name}</div>
                                        <div className="review-subject">{r.subject}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            {!isAuthenticated && (
                <section className="cta-section">
                    <div className="cta-inner">
                        <h2>Sẵn sàng bắt đầu học?</h2>
                        <p>Đăng ký miễn phí và tìm gia sư phù hợp ngay hôm nay</p>
                        <div className="cta-actions">
                            <Link to="/register/student" className="btn-hero-primary">Đăng ký học viên</Link>
                            <Link to="/register/tutor" className="btn-cta-outline">Trở thành gia sư</Link>
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}
