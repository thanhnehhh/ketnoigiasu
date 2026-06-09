import { useState } from 'react';

export interface ScheduleSlot {
    day: string;
    startTime: string;
    endTime: string;
}

interface Props {
    value: ScheduleSlot[];
    onChange: (slots: ScheduleSlot[]) => void;
}

const DAYS = [
    { key: 'MON', label: 'T2' },
    { key: 'TUE', label: 'T3' },
    { key: 'WED', label: 'T4' },
    { key: 'THU', label: 'T5' },
    { key: 'FRI', label: 'T6' },
    { key: 'SAT', label: 'T7' },
    { key: 'SUN', label: 'CN' },
];

// Các khung giờ phổ biến cho gia sư
const TIME_OPTIONS = [
    '06:00', '07:00', '07:30', '08:00', '08:30',
    '09:00', '09:30', '10:00', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00',
    '17:00', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30', '22:00',
];

export default function SchedulePicker({ value, onChange }: Props) {
    // Ngày đang được chọn để set giờ
    const [activeDay, setActiveDay] = useState<string | null>(null);

    const selectedDays = value.map(s => s.day);

    const toggleDay = (dayKey: string) => {
        if (selectedDays.includes(dayKey)) {
            // Bỏ chọn ngày này
            onChange(value.filter(s => s.day !== dayKey));
            if (activeDay === dayKey) setActiveDay(null);
        } else {
            // Chọn ngày, thêm slot mặc định 19:00-21:00
            onChange([...value, { day: dayKey, startTime: '19:00', endTime: '21:00' }]);
            setActiveDay(dayKey);
        }
    };

    const updateSlot = (dayKey: string, field: 'startTime' | 'endTime', time: string) => {
        onChange(value.map(s => s.day === dayKey ? { ...s, [field]: time } : s));
    };

    const getSlot = (dayKey: string) => value.find(s => s.day === dayKey);

    return (
        <div>
            {/* Hàng chọn ngày */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {DAYS.map(d => {
                    const selected = selectedDays.includes(d.key);
                    const isActive = activeDay === d.key;
                    return (
                        <button
                            key={d.key}
                            type="button"
                            onClick={() => {
                                toggleDay(d.key);
                                if (!selected) setActiveDay(d.key);
                                else if (isActive) setActiveDay(null);
                                else setActiveDay(d.key);
                            }}
                            style={{
                                flex: 1,
                                padding: '8px 4px',
                                borderRadius: '10px',
                                border: `2px solid ${selected ? '#4f46e5' : '#e2e8f0'}`,
                                background: selected ? '#4f46e5' : 'white',
                                color: selected ? 'white' : '#64748b',
                                fontWeight: 700,
                                fontSize: '0.82rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                outline: isActive ? '3px solid #a5b4fc' : 'none',
                            }}
                        >
                            {d.label}
                        </button>
                    );
                })}
            </div>

            {/* Panel chỉnh giờ cho từng ngày đã chọn */}
            {value.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {DAYS.filter(d => selectedDays.includes(d.key)).map(d => {
                        const slot = getSlot(d.key)!;
                        const isActive = activeDay === d.key;
                        return (
                            <div
                                key={d.key}
                                onClick={() => setActiveDay(d.key)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: isActive ? '#eef2ff' : '#f8fafc',
                                    border: `1.5px solid ${isActive ? '#6366f1' : '#e2e8f0'}`,
                                    borderRadius: '10px', padding: '10px 14px',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}
                            >
                                {/* Tên ngày */}
                                <span style={{ fontWeight: 700, color: '#4f46e5', minWidth: '28px', fontSize: '0.88rem' }}>
                                    {d.label}
                                </span>

                                {/* Giờ bắt đầu */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>Bắt đầu</span>
                                    <select
                                        value={slot.startTime}
                                        onChange={e => { e.stopPropagation(); updateSlot(d.key, 'startTime', e.target.value); }}
                                        onClick={e => e.stopPropagation()}
                                        style={{ border: '1.5px solid #c7d2fe', borderRadius: '8px', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', background: 'white', cursor: 'pointer' }}
                                    >
                                        {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                <span style={{ color: '#94a3b8', fontWeight: 600 }}>→</span>

                                {/* Giờ kết thúc */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '2px' }}>Kết thúc</span>
                                    <select
                                        value={slot.endTime}
                                        onChange={e => { e.stopPropagation(); updateSlot(d.key, 'endTime', e.target.value); }}
                                        onClick={e => e.stopPropagation()}
                                        style={{ border: '1.5px solid #c7d2fe', borderRadius: '8px', padding: '5px 8px', fontSize: '0.9rem', fontWeight: 700, color: '#1f2937', background: 'white', cursor: 'pointer' }}
                                    >
                                        {TIME_OPTIONS.filter(t => t > slot.startTime).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>

                                {/* Nút xóa */}
                                <button
                                    type="button"
                                    onClick={e => { e.stopPropagation(); onChange(value.filter(s => s.day !== d.key)); if (activeDay === d.key) setActiveDay(null); }}
                                    style={{ background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#ef4444', fontWeight: 700, fontSize: '1rem', lineHeight: 1 }}
                                    title="Xóa"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {value.length === 0 && (
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '8px' }}>
                    Chưa chọn ngày nào — click vào các ngày ở trên để thêm lịch
                </p>
            )}
        </div>
    );
}
