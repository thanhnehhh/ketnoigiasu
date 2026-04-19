import { useState } from 'react';
import '../css/RegisterTutor.css';

const RegisterTutor = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        gender: '',
        dateOfBirth: '',
        cccd: '',
        cccdIssuedPlace: '',
        address: '',
        email: '',
        phone: '',
        school: '',
        major: '',
        graduationYear: '',
        currentOccupation: '',
        strengths: '',
        teachingAreas: [] as string[],
        subjects: [] as string[],
        grades: [] as string[],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleMultiSelect = (field: 'subjects' | 'grades' | 'teachingAreas', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(item => item !== value)
                : [...prev[field], value]
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Đăng ký Gia sư:", formData);
        alert("Đăng ký tài khoản Gia sư thành công! (Chưa kết nối backend)");
    };

    return (
        <div className="register-tutor-page">
            <div className="register-container">
                <h1 className="register-title">ĐĂNG KÝ LÀM GIA SƯ</h1>
                <p className="register-subtitle">* Vui lòng cung cấp đầy đủ thông tin bên dưới để chúng tôi tiện liên lạc.</p>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Tỉnh/Thành dạy *</label>
                            <select name="province" required>
                                <option value="">Chọn Tỉnh/Thành</option>
                                <option value="TP.HCM">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                                <option value="Đà Nẵng">Đà Nẵng</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Họ và tên *</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Giới tính *</label>
                            <select name="gender" value={formData.gender} onChange={handleChange} required>
                                <option value="">Chọn giới tính</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Ngày sinh *</label>
                            <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Số CCCD *</label>
                            <input type="text" name="cccd" value={formData.cccd} onChange={handleChange} required />
                        </div>

                        <div className="form-group full-width">
                            <label>Nơi cấp CCCD *</label>
                            <select name="cccdIssuedPlace" value={formData.cccdIssuedPlace} onChange={handleChange} required>
                                <option value="">Tỉnh/Thành trên CCCD</option>
                                <option value="TP.HCM">TP. Hồ Chí Minh</option>
                                <option value="Hà Nội">Hà Nội</option>
                            </select>
                        </div>

                        <div className="form-group full-width">
                            <label>Địa chỉ hiện tại *</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange} required placeholder="Số nhà, đường, phường/xã, quận/huyện" />
                        </div>

                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>

                        <div className="form-group">
                            <label>Điện thoại *</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
                        </div>

                        <div className="form-group full-width">
                            <label>Trường học / Nơi công tác hiện tại</label>
                            <input type="text" name="school" value={formData.school} onChange={handleChange} placeholder="Ví dụ: Đại học Sư Phạm" />
                        </div>

                        <div className="form-group">
                            <label>Năm tốt nghiệp</label>
                            <input type="text" name="graduationYear" value={formData.graduationYear} onChange={handleChange} placeholder="Ví dụ: 2018" />
                        </div>

                        <div className="form-group full-width">
                            <label>Ưu điểm / Kinh nghiệm nổi bật *</label>
                            <textarea
                                name="strengths"
                                value={formData.strengths}
                                onChange={handleChange}
                                placeholder="Ví dụ: 4 năm kinh nghiệm dạy kèm Toán lớp 10-12, nhiệt tình, có phương pháp dạy dễ hiểu..."
                                required
                            />
                        </div>

                        {/* Môn dạy */}
                        <div className="form-group full-width">
                            <label>Môn dạy *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                                {['Toán', 'Lý', 'Hóa', 'Văn', 'Tiếng Anh', 'Tiếng Trung', 'Tiếng Nhật', 'IELTS', 'TOEIC', 'Lịch sử', 'Địa lý'].map(subject => (
                                    <label key={subject} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.subjects.includes(subject)}
                                            onChange={() => handleMultiSelect('subjects', subject)}
                                        />
                                        {subject}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Lớp dạy */}
                        <div className="form-group full-width">
                            <label>Lớp dạy *</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                                {Array.from({ length: 12 }, (_, i) => `Lớp ${i+1}`).map(grade => (
                                    <label key={grade} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.grades.includes(grade)}
                                            onChange={() => handleMultiSelect('grades', grade)}
                                        />
                                        {grade}
                                    </label>
                                ))}
                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <input type="checkbox" onChange={() => handleMultiSelect('grades', 'Ngoại ngữ')} />
                                    Ngoại ngữ
                                </label>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="register-button">
                        Đăng ký làm Gia sư
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterTutor;