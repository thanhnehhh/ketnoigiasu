import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function VNPayReturn() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'fail'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            const params: Record<string, string> = {};
            searchParams.forEach((value, key) => { params[key] = value; });

            const responseCode = params['vnp_ResponseCode'];
            const txnRef = params['vnp_TxnRef']; // dạng "HD7_12345"

            if (!responseCode || !txnRef) {
                setStatus('fail');
                setMessage('Không nhận được thông tin thanh toán.');
                return;
            }

            // Lấy paymentId từ vnp_TxnRef: "7_1234567890" → 7
            const paymentId = txnRef.split('_')[0];
            params['paymentId'] = paymentId;

            try {
                const res = await api.post('/payments/vnpay/verify', params);
                if (res.data.success) {
                    setStatus('success');
                    setMessage(res.data.message || 'Thanh toán thành công!');
                } else {
                    setStatus('fail');
                    setMessage(res.data.message || 'Thanh toán thất bại hoặc bị hủy.');
                }
            } catch (e: any) {
                setStatus('fail');
                setMessage(e.response?.data?.message || 'Lỗi xác nhận thanh toán.');
            }
        };
        verify();
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div style={{ background: 'white', borderRadius: '20px', padding: '3rem', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
                    {status === 'loading' && (
                        <>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
                            <h2 style={{ color: '#1f2937' }}>Đang xác nhận thanh toán...</h2>
                            <p style={{ color: '#64748b' }}>Vui lòng chờ trong giây lát</p>
                        </>
                    )}
                    {status === 'success' && (
                        <>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                            <h2 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Thanh toán thành công!</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>{message}</p>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '2rem' }}>
                                Lớp học của bạn đã được kích hoạt. Vào Dashboard để bắt đầu học.
                            </p>
                            <Link to="/student?tab=courses"
                                style={{ display: 'inline-block', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', padding: '12px 28px', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '1rem' }}>
                                📚 Vào lớp học ngay
                            </Link>
                        </>
                    )}
                    {status === 'fail' && (
                        <>
                            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
                            <h2 style={{ color: '#ef4444', marginBottom: '0.5rem' }}>Thanh toán thất bại</h2>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>{message}</p>
                            <Link to="/student?tab=payments"
                                style={{ display: 'inline-block', background: '#f1f5f9', color: '#374151', padding: '12px 28px', borderRadius: '10px', fontWeight: 600, textDecoration: 'none', fontSize: '1rem' }}>
                                ← Quay lại hóa đơn
                            </Link>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}
