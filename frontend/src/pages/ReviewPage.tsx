import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/Dashboard.css';

/**
 * Đánh giá gia sư sau khi hoàn thành khóa học
 * POST /api/reviews  body: { registrationId, rating, comment }
 * Điều kiện BE: registration.status === "COMPLETED"
 */
export default function ReviewPage() {
    const { registrationId } = useParams<{ registrationId: string }>();
    const navigate = useNavigate();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState('');
    const [isErr, setIsErr] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // POST /api/reviews { registrationId, rating, comment }
            await api.post('/reviews', {
                registrationId: parseInt(registrationId!),
                rating,
                comment,
            });
            setMsg('✅ Đánh giá đã gửi thành công! Cảm ơn bạn.');
            setIsErr(false);
            setTimeout(() => navigate('/student'), 1500);
        } catch (e: any) {
            setMsg('❌ ' + (e.response?.data?.message || 'Lỗi gửi đánh giá'));
            setIsErr(true);
        } finally { setLoading(false); }
    };

    return (
        <div className="dashboard-page">
            <Header />
            <div style={{ maxWidth: 600, margin: '3rem auto', padding: '0 1.5rem' }}>
                <div className="reg-card">
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1f2937', marginBottom: '0.5rem' }}>
                        ⭐ Đánh giá khóa học
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                        Chia sẻ trải nghiệm của bạn để giúp học viên khác tìm được gia sư phù hợp.
                    </p>

                    {msg && (
                        <div className={isErr ? 'alert alert-error' : 'flash-msg'} style={{ marginBottom: '1rem' }}>
                            {msg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Rating stars */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
                                Đánh giá sao *
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setRating(star)}
                                        style={{
                                            fontSize: '2rem',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: star <= rating ? '#f59e0b' : '#e2e8f0',
                                            transition: 'color 0.15s',
                                        }}
                                    >★</button>
                                ))}
                                <span style={{ alignSelf: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                                    {rating}/5 sao
                                </span>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Nhận xét *</label>
                            <textarea
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                required
                                rows={5}
                                placeholder="Chia sẻ về chất lượng giảng dạy, phương pháp, thái độ của gia sư..."
                                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '0.95rem', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Đang gửi...' : '⭐ Gửi đánh giá'}
                            </button>
                            <button type="button" className="btn-outline" onClick={() => navigate('/student')}>
                                Hủy
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <Footer />
        </div>
    );
}
