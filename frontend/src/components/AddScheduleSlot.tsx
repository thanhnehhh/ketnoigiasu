import { useState } from 'react';

interface Props {
    days: { key: string; label: string }[];
    onAdd: (slot: { day: string; startTime: string; endTime: string }) => void;
}

export default function AddScheduleSlot({ days, onAdd }: Props) {
    const [day, setDay] = useState('MON');
    const [startTime, setStartTime] = useState('19:00');
    const [endTime, setEndTime] = useState('21:00');
    const [err, setErr] = useState('');

    const handleAdd = () => {
        if (!startTime || !endTime) { setErr('Vui lòng nhập giờ bắt đầu và kết thúc'); return; }
        if (startTime >= endTime) { setErr('Giờ kết thúc phải sau giờ bắt đầu'); return; }
        setErr('');
        onAdd({ day, startTime, endTime });
        // Reset về mặc định để thêm slot tiếp
        setStartTime('19:00');
        setEndTime('21:00');
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                    value={day}
                    onChange={e => setDay(e.target.value)}
                    style={{ border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.88rem', background: 'white' }}
                >
                    {days.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>
                <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    style={{ border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.88rem' }}
                />
                <span style={{ color: '#64748b', fontSize: '0.85rem' }}>–</span>
                <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    style={{ border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '0.88rem' }}
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    style={{ background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                >
                    + Thêm
                </button>
            </div>
            {err && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '4px' }}>{err}</p>}
        </div>
    );
}
