import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './NotificationBell.css';

interface Notification {
    id: number;
    message: string;
    actionUrl: string | null;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = () => {
        if (!user) return;
        api.get('/notifications/my')
            .then(res => setNotifications(res.data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchNotifications();
        // Poll mỗi 30s để cập nhật thông báo mới
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id: number) => {
        await api.put(`/notifications/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const markAllRead = async () => {
        await api.put('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleClick = (n: Notification) => {
        if (!n.isRead) markRead(n.id);
        setOpen(false);
        if (n.actionUrl) {
            // Nếu đang ở URL đó rồi thì không navigate lại (tránh reload)
            if (location.pathname !== n.actionUrl) {
                navigate(n.actionUrl);
            }
        }
    };

    if (!user) return null;

    return (
        <div className="noti-bell-wrap" ref={ref}>
            <button
                className="noti-bell-btn"
                onClick={() => setOpen(prev => !prev)}
                aria-label="Thông báo"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="noti-bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div className="noti-dropdown">
                    <div className="noti-dropdown-header">
                        <span>Thông báo</span>
                        {unreadCount > 0 && (
                            <button className="noti-read-all" onClick={markAllRead}>Đọc tất cả</button>
                        )}
                    </div>
                    <div className="noti-dropdown-list">
                        {notifications.length === 0 ? (
                            <div className="noti-empty">Chưa có thông báo nào.</div>
                        ) : (
                            notifications.slice(0, 20).map(n => (
                                <div
                                    key={n.id}
                                    className={`noti-dropdown-item ${!n.isRead ? 'unread' : ''}`}
                                    onClick={() => handleClick(n)}
                                >
                                    <div className="noti-dot" />
                                    <div className="noti-dropdown-content">
                                        <p>{n.message}</p>
                                        <span>{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
