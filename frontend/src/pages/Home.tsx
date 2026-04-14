import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow">
                            K
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Kết Nối Gia Sư</h1>
                            <p className="text-xs text-gray-500 -mt-1">Học 1 kèm 1 chất lượng</p>
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center gap-8 text-gray-700 font-medium">
                        <Link to="/" className="hover:text-blue-600 transition">Trang chủ</Link>
                        <Link to="/search" className="hover:text-blue-600 transition">Tìm gia sư</Link>
                        <Link to="/tutor/register" className="hover:text-blue-600 transition">Trở thành gia sư</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-6 py-2.5 text-gray-700 hover:text-gray-900 font-medium transition"
                        >
                            Đăng nhập
                        </Link>
                        <Link
                            to="/register"
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
                        >
                            Đăng ký
                        </Link>
                    </div>
                </div>
            </header>

            {/* HERO SECTION - Đẹp và rõ ràng */}
            <section className="bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white py-28">
                <div className="max-w-6xl mx-auto px-6 text-center">
                    <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
                        Kết nối Gia sư giỏi<br />
                        với Học viên phù hợp
                    </h1>
                    <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto">
                        Dạy kèm 1 kèm 1 tại nhà hoặc trực tuyến cho học sinh lớp 1-12 và ngoại ngữ.<br />
                        Minh bạch • Uy tín • Gần nhà
                    </p>

                    <div className="flex flex-col md:flex-row gap-6 justify-center">
                        <Link
                            to="/search"
                            className="group w-full md:w-[420px] bg-white text-indigo-700 hover:bg-indigo-50 text-2xl font-semibold py-7 px-12 rounded-3xl shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-3"
                        >
                            TÌM LỚP DẠY KÈM
                        </Link>

                        <Link
                            to="/tutor/register"
                            className="group w-full md:w-[420px] bg-white/10 hover:bg-white/20 border-2 border-white/70 text-white text-2xl font-semibold py-7 px-12 rounded-3xl shadow-xl transition-all hover:scale-105 backdrop-blur"
                        >
                            ĐĂNG KÝ LÀM GIA SƯ
                        </Link>
                    </div>
                </div>
            </section>

            {/* PHẦN SUẤT DẠY TIÊU BIỂU */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">
                        Suất dạy kèm đang hot
                    </h2>
                    <p className="text-center text-gray-600 mb-12">Học viên đánh giá cao • Gia sư uy tín</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Card mẫu - sau này sẽ lấy từ API */}
                        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden hover:shadow-2xl transition">
                            <div className="h-52 bg-gradient-to-br from-orange-400 to-red-400 flex items-center justify-center">
                                <span className="text-7xl">📐</span>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-xl">Toán lớp 8 - Thầy Minh</h3>
                                        <p className="text-gray-500">Quận 7 • 180.000đ/buổi</p>
                                    </div>
                                    <div className="text-yellow-500">★★★★☆</div>
                                </div>
                                <button className="mt-6 w-full bg-blue-600 text-white py-3 rounded-2xl hover:bg-blue-700 transition">
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>

                        {/* Thêm 2-3 card nữa nếu muốn, hiện tại để 1 cái mẫu trước */}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;