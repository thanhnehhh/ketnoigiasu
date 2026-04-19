import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Home.css';

const Home = () => {
    return (
        <div className="home-page">
            {/* Gọi Header từ component, không viết lại code HTML ở đây */}
            <Header />

            <main className="main-content">
                {/* SIDEBAR BỘ LỌC */}
                <aside className="sidebar">
                    <h3>Bộ lọc</h3>

                    <div className="filter-section">
                        <h4>MÔN HỌC</h4>
                        <div className="checkbox-group">
                            <label><input type="checkbox" /> Toán học</label>
                            <label><input type="checkbox" defaultChecked /> Tiếng Anh</label>
                            <label><input type="checkbox" /> Vật lý</label>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h4>CẤP HỌC</h4>
                        <select className="filter-select">
                            <option>Tất cả cấp học</option>
                            <option>Lớp 1-5</option>
                            <option>Lớp 6-9</option>
                            <option>Lớp 10-12</option>
                        </select>
                    </div>

                    <div className="filter-section">
                        <h4>GIÁ (VND/GIỜ)</h4>
                        <input type="range" min="50000" max="1000000" className="price-slider" />
                        <div className="price-labels">
                            <span>50.000đ</span>
                            <span>1.000.000đ</span>
                        </div>
                    </div>
                </aside>

                {/* DANH SÁCH GIA SƯ */}
                <section className="content-area">
                    <div className="search-header">
                        <h2>Kết quả tìm kiếm</h2>
                        <p>Tìm thấy <span className="highlight">124</span> gia sư phù hợp</p>
                    </div>

                    <div className="cards-grid">
                        {/* Ví dụ 1 Card */}
                        <div className="card">
                            <div className="card-image">
                                <div className="verified-badge">ĐÃ XÁC THỰC</div>
                            </div>
                            <div className="card-body">
                                <h3>Phạm Thùy Linh</h3>
                                <p className="subtitle">Thạc sĩ Ngôn ngữ Anh - ĐH Quốc gia Hà Nội</p>
                                <div className="rating">★★★★☆ <span>4.9</span></div>
                                <div className="price">
                                    <span className="price-number">350.000đ</span>
                                    <span className="price-unit">/giờ</span>
                                </div>
                            </div>
                        </div>
                        {/* Bạn có thể map dữ liệu gia sư ở đây */}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Home;