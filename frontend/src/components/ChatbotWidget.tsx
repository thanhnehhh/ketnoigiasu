import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { analyzeTutorSearch, callGemini } from '../services/gemini';

interface Message {
    role: 'user' | 'bot';
    text: string;
}

export default function ChatbotWidget() {
    const { user } = useAuth();
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: 'Xin chào! 👋 Tôi có thể giúp bạn tìm gia sư phù hợp. Hãy mô tả nhu cầu của bạn, ví dụ: "Tìm gia sư Toán lớp 9 gần Thủ Đức giá dưới 300k"' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const send = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const isTutorSearch = /gia sư|dạy|môn|lớp|học|tìm|cần|muốn/i.test(userMsg);

            if (isTutorSearch) {
                const parsed = await analyzeTutorSearch(userMsg);

                // Gọi API lấy khóa học thực tế
                const params: any = {};
                if (parsed.subject) params.subject = parsed.subject;
                if (parsed.province) params.province = parsed.province;
                if (parsed.teachingMode) params.teachingMode = parsed.teachingMode;
                if (parsed.maxPrice) params.maxPrice = parsed.maxPrice;

                const res = await fetch(
                    'http://localhost:8080/api/public/courses?' + new URLSearchParams(params).toString()
                );
                const courses = res.ok ? await res.json() : [];

                if (courses.length === 0) {
                    setMessages(prev => [...prev, {
                        role: 'bot',
                        text: `Xin lỗi, không tìm thấy khóa học nào phù hợp với yêu cầu của bạn. Thử mô tả khác nhé!`
                    }]);
                } else {
                    setMessages(prev => [...prev, {
                        role: 'bot',
                        text: `✨ Tìm thấy **${courses.length}** khóa học phù hợp:|||COURSES|||${JSON.stringify(courses.slice(0, 5))}`
                    }]);
                }
            } else {
                const answer = await callGemini(
                    `Bạn là trợ lý của nền tảng Kết Nối Gia Sư. Hãy trả lời ngắn gọn bằng tiếng Việt câu hỏi sau: "${userMsg}". Nếu câu hỏi về tìm gia sư hãy gợi ý người dùng mô tả môn học, lớp, khu vực.`
                );
                setMessages(prev => [...prev, { role: 'bot', text: answer }]);
            }
        } catch (e) {
            // Fallback khi Gemini lỗi — tự parse đơn giản
            const subjects = ['Toán','Vật lý','Hóa học','Sinh học','Ngữ văn','Tiếng Anh','Tiếng Trung','Tiếng Nhật','IELTS','TOEIC','Tin học'];
            const found = subjects.find(s => input.toLowerCase().includes(s.toLowerCase()) || userMsg.toLowerCase().includes(s.toLowerCase()));
            if (found) {
                try {
                    const res = await fetch(`http://localhost:8080/api/public/courses?subject=${encodeURIComponent(found)}`);
                    const courses = res.ok ? await res.json() : [];
                    if (courses.length > 0) {
                        setMessages(prev => [...prev, {
                            role: 'bot',
                            text: `✨ Tìm thấy **${courses.length}** khóa học môn ${found}:|||COURSES|||${JSON.stringify(courses.slice(0, 5))}`
                        }]);
                        return;
                    }
                } catch { /**/ }
            }
            setMessages(prev => [...prev, { role: 'bot', text: '❌ Có lỗi xảy ra, vui lòng thử lại.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (paramsJson: string) => {
        try {
            const p = JSON.parse(paramsJson);
            const query = new URLSearchParams();
            if (p.subject) query.set('subject', p.subject);
            if (p.province) query.set('province', p.province);
            if (p.teachingMode) query.set('teachingMode', p.teachingMode);
            if (p.maxPrice) query.set('maxPrice', String(p.maxPrice));
            const qs = query.toString();
            window.location.href = qs ? `/courses?${qs}` : '/courses';
        } catch {
            window.location.href = '/courses';
        }
    };

    const renderMessage = (msg: Message, i: number) => {
        // Hiện danh sách khóa học trực tiếp trong chat
        if (msg.role === 'bot' && msg.text.includes('|||COURSES|||')) {
            const idx = msg.text.indexOf('|||COURSES|||');
            const headerText = msg.text.substring(0, idx).replace(/\*\*(.*?)\*\*/g, '$1');
            const coursesJson = msg.text.substring(idx + 13);
            let courses: any[] = [];
            try { courses = JSON.parse(coursesJson); } catch (e) {
                console.error('Parse courses error:', e, coursesJson.substring(0, 100));
            }
            return (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ background: '#f0f4ff', borderRadius: '12px 12px 12px 0', padding: '10px 14px', maxWidth: '95%', fontSize: '0.88rem', color: '#1f2937', width: '100%' }}>
                        <p style={{ margin: '0 0 8px', fontWeight: 600 }}>{headerText}</p>
                        {courses.length === 0 && <p style={{ color: '#94a3b8', fontStyle: 'italic' }}>Không có dữ liệu</p>}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {courses.map((c: any) => (
                                <a key={c.id} href={`/courses/${c.id}`}
                                    style={{ background: 'white', border: '1.5px solid #c7d2fe', borderRadius: '10px', padding: '10px 12px', textDecoration: 'none', color: '#1f2937', display: 'block' }}
                                >
                                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>{c.title}</div>
                                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '2px' }}>
                                        👨‍🏫 {c.tutorName} · 📖 {c.subjectName}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#4f46e5' }}>
                                        💰 {c.pricePerSession?.toLocaleString('vi-VN')}đ/buổi · {c.totalSessions} buổi
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        if (msg.role === 'bot' && msg.text.includes('|||SEARCH|||')) {
            const [text, , paramsJson] = msg.text.split('|||SEARCH|||');
            const lines = text.split('\n').map((line, j) => (
                <span key={j}>{line.replace(/\*\*(.*?)\*\*/g, '$1')}<br /></span>
            ));
            return (
                <div key={i} style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                    <div style={{ background: '#f0f4ff', borderRadius: '12px 12px 12px 0', padding: '10px 14px', maxWidth: '85%', fontSize: '0.88rem', color: '#1f2937' }}>
                        <div style={{ marginBottom: '8px' }}>{lines}</div>
                        <button onClick={() => handleSearch(paramsJson)}
                                style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white', border: 'none', borderRadius: '8px', padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                            🔍 Tìm gia sư ngay
                        </button>
                    </div>
                </div>
            );
        }

        const isUser = msg.role === 'user';
        return (
            <div key={i} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '10px' }}>
                <div style={{
                    background: isUser ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : '#f0f4ff',
                    color: isUser ? 'white' : '#1f2937',
                    borderRadius: isUser ? '12px 12px 0 12px' : '12px 12px 12px 0',
                    padding: '10px 14px', maxWidth: '85%', fontSize: '0.88rem', lineHeight: 1.5,
                }}>
                    {msg.text}
                </div>
            </div>
        );
    };

    // Chỉ hiện chatbot khi đã đăng nhập
    if (!user) return null;

    return (
        <>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    position: 'fixed', bottom: '24px', right: '24px', zIndex: 9998,
                    width: '56px', height: '56px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                    border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.5rem', transition: 'transform 0.2s',
                }}
                title="Trợ lý tìm gia sư AI"
            >
                {open ? '✕' : '🤖'}
            </button>

            {open && (
                <div style={{
                    position: 'fixed', bottom: '92px', right: '24px', zIndex: 9997,
                    width: '360px', height: '480px',
                    background: 'white', borderRadius: '20px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}>
                    <div style={{ padding: '14px 16px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', color: 'white' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>🤖 Trợ lý Kết Nối Gia Sư</div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Powered by Gemini AI</div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '14px', background: '#fafafa' }}>
                        {messages.map((m, i) => renderMessage(m, i))}
                        {loading && (
                            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '10px' }}>
                                <div style={{ background: '#f0f4ff', borderRadius: '12px', padding: '10px 14px', fontSize: '0.88rem', color: '#64748b' }}>
                                    ⏳ Đang tìm kiếm...
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && send()}
                            placeholder="Nhập yêu cầu tìm gia sư..."
                            style={{ flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px', fontSize: '0.88rem', outline: 'none' }}
                            disabled={loading}
                        />
                        <button onClick={send} disabled={loading || !input.trim()}
                                style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700 }}>
                            ➤
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}