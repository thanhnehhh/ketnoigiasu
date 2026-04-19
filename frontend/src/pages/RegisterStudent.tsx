import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/RegisterStudent.css';

const RegisterStudent = () => {
    const [formData, setFormData] = useState({
        fullName: '',           // Tên học viên
        email: '',
        phone: '',
        province: '',
        district: '',
        address: '',
        gradeLevel: '',
        learningGoals: '',
        captcha: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Đăng ký học viên:", formData);
        alert("Đăng ký tài khoản học viên thành công! (Chưa kết nối backend)");
    };

    return (
        <div className="register-student-page">
            <div className="register-container">
                <h1 className="register-title">Đăng ký tài khoản Học viên</h1>
                <p className="register-subtitle">Vui lòng điền thông tin để tìm gia sư phù hợp</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Tên học viên *</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                                placeholder="Nhập họ và tên học viên"
                            />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="example@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>Số điện thoại *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                placeholder="0123456789"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tỉnh/Thành phố *</label>
                            <select name="province" value={formData.province} onChange={handleChange} required>
                                <option value="">-- Chọn tỉnh/thành phố --</option>
                                <option value="TP.HCM">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Quận/Huyện *</label>
                            <select name="district" value={formData.district} onChange={handleChange} required>
                                <option value="">-- Chọn quận/huyện --</option>
                                <option value="Quận 1">Quận 1</option>
                                <option value="Quận 7">Quận 7</option>
                                <option value="Thủ Đức">Thủ Đức</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label>Địa chỉ chi tiết *</label>
                            <input
                                type="text"
                                name="address"
                                placeholder="Số nhà, tên đường, phường/xã..."
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Cấp lớp hiện tại *</label>
                            <select name="gradeLevel" value={formData.gradeLevel} onChange={handleChange} required>
                                <option value="">-- Chọn cấp lớp --</option>
                                <option value="Lớp 1-5">Lớp 1-5 (Tiểu học)</option>
                                <option value="Lớp 6-9">Lớp 6-9 (THCS)</option>
                                <option value="Lớp 10-12">Lớp 10-12 (THPT)</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label>Yêu cầu học tập / Mong muốn *</label>
                            <textarea
                                name="learningGoals"
                                placeholder="Ví dụ: Cần gia sư dạy Toán lớp 8, tập trung giải bài tập nâng cao, học 2 buổi/tuần vào buổi tối..."
                                value={formData.learningGoals}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mã bảo vệ *</label>
                        <div className="captcha-container">
                            <input
                                type="text"
                                name="captcha"
                                value={formData.captcha}
                                onChange={handleChange}
                                required
                                placeholder="Nhập mã bảo vệ"
                            />
                            <div className="captcha-box">NU8U</div>
                        </div>
                    </div>

                    <button type="submit" className="register-button">
                        Đăng ký tài khoản Học viên
                    </button>
                </form>

                <div className="back-link">
                    Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterStudent;