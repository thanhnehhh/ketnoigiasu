import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import api from '../services/api';

export interface ChatMessage {
    id: number;
    courseId: number;
    senderId: number;
    senderName: string;
    senderRole: string;   // TUTOR | STUDENT
    type: string;         // TEXT | FILE | EXERCISE
    content: string;
    fileUrl: string | null;
    fileName: string | null;
    createdAt: string;
}

export function useChat(courseId: string | undefined) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [connected, setConnected] = useState(false);
    const clientRef = useRef<Client | null>(null);

    // Load lịch sử tin nhắn khi vào lớp
    useEffect(() => {
        if (!courseId) return;
        api.get(`/messages/course/${courseId}`)
            .then(res => setMessages(res.data))
            .catch(console.error);
    }, [courseId]);

    // Kết nối WebSocket
    useEffect(() => {
        if (!courseId) return;
        const token = localStorage.getItem('token');
        if (!token) return;

        const client = new Client({
            // Dùng SockJS load từ CDN qua window.SockJS
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            webSocketFactory: () => new (window as any).SockJS('http://localhost:8080/ws'),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 3000,
            onConnect: () => {
                setConnected(true);
                // Subscribe nhận tin nhắn của lớp này
                client.subscribe(`/topic/chat/${courseId}`, (frame) => {
                    const msg: ChatMessage = JSON.parse(frame.body);
                    setMessages(prev => {
                        // Tránh duplicate nếu chính mình gửi
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg];
                    });
                });
            },
            onDisconnect: () => setConnected(false),
            onStompError: (frame) => {
                console.error('STOMP error:', frame);
                setConnected(false);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            client.deactivate();
            clientRef.current = null;
        };
    }, [courseId]);

    // Gửi tin nhắn text hoặc bài tập
    const sendText = useCallback((content: string, type: 'TEXT' | 'EXERCISE' = 'TEXT') => {
        if (!clientRef.current?.connected || !courseId) return;
        clientRef.current.publish({
            destination: `/app/chat/${courseId}`,
            body: JSON.stringify({ content, type }),
        });
    }, [courseId]);

    // Gửi file qua REST (multipart không qua WebSocket)
    const sendFile = useCallback(async (title: string, file: File) => {
        if (!courseId) return;
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);
        await api.post(`/messages/course/${courseId}/file`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        // BE sẽ broadcast qua WebSocket, FE nhận qua subscription
    }, [courseId]);

    return { messages, connected, sendText, sendFile };
}
