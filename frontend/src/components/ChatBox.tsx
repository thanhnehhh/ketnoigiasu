import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import type { ChatMessage } from '../hooks/useChat';
import './ChatBox.css';

interface Props {
    courseId: string;
}

export default function ChatBox({ courseId }: Props) {
    const { user } = useAuth();
    const { messages, connected, sendText, sendFile } = useChat(courseId);
    const [text, setText] = useState('');
    const [mode, setMode] = useState<'TEXT' | 'EXERCISE'>('TEXT');
    const [fileTitle, setFileTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showFileForm, setShowFileForm] = useState(false);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto scroll xuống tin mới nhất
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendText = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        sendText(text.trim(), mode);
        setText('');
    };

    const handleSendFile = async () => {
        if (!selectedFile || !fileTitle.trim()) return;
        setSending(true);
        try {
            await sendFile(fileTitle.trim(), selectedFile);
            setFileTitle('');
            setSelectedFile(null);
            setShowFileForm(false);
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getFileIcon = (fileName: string | null) => {
        if (!fileName) return '📄';
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (['pdf'].includes(ext!)) return '📕';
        if (['doc', 'docx'].includes(ext!)) return '📘';
        if (['xls', 'xlsx'].includes(ext!)) return '📗';
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext!)) return '🖼️';
        if (['zip', 'rar'].includes(ext!)) return '📦';
        return '📄';
    };

    const isMine = (msg: ChatMessage) => msg.senderId === user?.id;

    return (
        <div className="chatbox">
            {/* Header */}
            <div className="chatbox-header">
                <span>💬 Nhắn tin</span>
                <span className={`chat-status ${connected ? 'online' : 'offline'}`}>
                    {connected ? '● Đang kết nối' : '○ Mất kết nối'}
                </span>
            </div>

            {/* Messages */}
            <div className="chatbox-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <p>Chưa có tin nhắn nào.</p>
                        <p>Bắt đầu trao đổi với {user?.role === 'TUTOR' ? 'học viên' : 'gia sư'}!</p>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} className={`chat-msg ${isMine(msg) ? 'mine' : 'theirs'}`}>
                        {/* Avatar + tên — chỉ hiện cho tin của người kia */}
                        {!isMine(msg) && (
                            <div className="chat-sender-info">
                                <img
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(msg.senderName)}&background=${msg.senderRole === 'TUTOR' ? '4f46e5' : '10b981'}&color=fff&size=28&bold=true&rounded=true`}
                                    alt={msg.senderName}
                                    className="chat-avatar"
                                />
                                <span className="chat-sender-name">{msg.senderName}</span>
                                <span className={`chat-role-tag ${msg.senderRole === 'TUTOR' ? 'tutor' : 'student'}`}>
                                    {msg.senderRole === 'TUTOR' ? 'Gia sư' : 'Học viên'}
                                </span>
                            </div>
                        )}

                        <div className={`chat-bubble ${msg.type === 'EXERCISE' ? 'exercise' : msg.type === 'FILE' ? 'file' : ''}`}>
                            {/* Bài tập */}
                            {msg.type === 'EXERCISE' && (
                                <div className="chat-exercise-label">📝 Bài tập</div>
                            )}

                            {/* File */}
                            {msg.type === 'FILE' ? (
                                <div className="chat-file">
                                    <span className="chat-file-icon">{getFileIcon(msg.fileName)}</span>
                                    <div className="chat-file-info">
                                        <span className="chat-file-name">{msg.content}</span>
                                        {msg.fileUrl && (
                                            <a href={`http://localhost:8080${msg.fileUrl}`}
                                                target="_blank" rel="noreferrer"
                                                className="chat-file-download">
                                                ⬇️ Tải xuống
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="chat-text">{msg.content}</p>
                            )}

                            <span className="chat-time">{formatTime(msg.createdAt)}</span>
                        </div>
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Upload file form */}
            {showFileForm && (
                <div className="chat-file-form">
                    <input
                        type="text"
                        placeholder="Tên tài liệu / bài tập..."
                        value={fileTitle}
                        onChange={e => setFileTitle(e.target.value)}
                        className="chat-file-title-input"
                    />
                    <input
                        type="file"
                        onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                        className="chat-file-input"
                    />
                    <div className="chat-file-actions">
                        <button className="chat-send-file-btn" onClick={handleSendFile}
                            disabled={sending || !selectedFile || !fileTitle.trim()}>
                            {sending ? 'Đang gửi...' : '📤 Gửi'}
                        </button>
                        <button className="chat-cancel-btn" onClick={() => setShowFileForm(false)}>Hủy</button>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="chatbox-input-area">
                {/* Mode selector */}
                <div className="chat-mode-btns">
                    <button
                        className={`chat-mode-btn ${mode === 'TEXT' ? 'active' : ''}`}
                        onClick={() => setMode('TEXT')}>
                        💬 Tin nhắn
                    </button>
                    <button
                        className="chat-mode-btn"
                        onClick={() => setShowFileForm(f => !f)}>
                        📎 Tài liệu
                    </button>
                </div>

                <form onSubmit={handleSendText} className="chat-input-row">
                    <input
                        type="text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={mode === 'EXERCISE' ? 'Nhập đề bài tập...' : 'Nhập tin nhắn...'}
                        className="chat-input"
                    />
                    <button type="submit" className="chat-send-btn" disabled={!text.trim()}>
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
}
