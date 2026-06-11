import { useEffect, useRef, useState } from 'react';

interface Props {
    studentName: string;
    studentAddress: string;
    tutorAddress?: string;
    onClose: () => void;
}

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImZkODI0MDdmYTBkNjQ1MDk5NzAxM2U0NTM4MjIyN2Y3IiwiaCI6Im11cm11cjY0In0=';

async function geocode(address: string): Promise<[number, number] | null> {
    const clean = (s: string) => s.split(',').map(t => t.trim()).filter(t => t.length > 2).join(', ');
    const parts = address.split(',').map(t => t.trim()).filter(t => t.length > 2);
    const cleaned = address.replace(/\bQQ\b/gi, '').replace(/\s+/g, ' ').trim();
    const tries = [
        clean(cleaned) + ', Việt Nam',
        parts.slice(-3).join(', ') + ', Việt Nam',
        parts.slice(-2).join(', ') + ', Việt Nam',
        parts.slice(-1).join(', ') + ', Việt Nam',
    ].filter((q, i, arr) => q.replace(', Việt Nam','').trim().length >= 4 && arr.indexOf(q) === i);

    for (const q of tries) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const r = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=vn`,
                { headers: { 'Accept-Language': 'vi', 'User-Agent': 'TieuLuanGiaSuApp/1.0' }, signal: controller.signal }
            );
            clearTimeout(timer);
            const d = await r.json();
            if (d?.length > 0) return [parseFloat(d[0].lat), parseFloat(d[0].lon)];
        } catch (e) {
            console.warn('[Geocode] Error for:', q, e);
        }
    }
    return null;
}

async function getRoute(from: [number,number], to: [number,number]) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000); // 10s timeout
        const r = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
            method: 'POST',
            headers: { 'Authorization': ORS_API_KEY, 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinates: [[from[1],from[0]],[to[1],to[0]]] }),
            signal: controller.signal,
        });
        clearTimeout(timer);
        if (!r.ok) return null;

        const d = await r.json();
        const seg = d.features?.[0]?.properties?.segments?.[0];
        const coords: [number,number][] = (d.features?.[0]?.geometry?.coordinates || [])
            .map((c: number[]) => [c[1], c[0]] as [number,number]);
        return { coords, distance: seg?.distance || 0, duration: seg?.duration || 0 };
    } catch (e) {
        return null;
    }
}

function hav(a: [number,number], b: [number,number]) {
    const R=6371, dL=(b[0]-a[0])*Math.PI/180, dN=(b[1]-a[1])*Math.PI/180;
    const h=Math.sin(dL/2)**2+Math.cos(a[0]*Math.PI/180)*Math.cos(b[0]*Math.PI/180)*Math.sin(dN/2)**2;
    return R*2*Math.asin(Math.sqrt(h));
}

function fmt(s: number) {
    const h=Math.floor(s/3600), m=Math.floor((s%3600)/60);
    return h>0 ? `${h}h ${m}p` : `${m} phút`;
}

declare const L: any;

export default function MapModal({ studentName, studentAddress, tutorAddress, onClose }: Props) {
    const mapRef      = useRef<HTMLDivElement>(null);
    const mapInst     = useRef<any>(null);
    const circleRef   = useRef<any>(null);
    const tutorPt     = useRef<[number,number]|null>(null);
    const studentPt   = useRef<[number,number]|null>(null);

    // States quản lý chuẩn React (Thay thế cho innerHTML)
    const [radius, setRadius] = useState(5);
    const [loadingMsg, setLoadingMsg] = useState<React.ReactNode>(
        <span style={{ color:'#64748b',fontSize:'0.88rem' }}>⏳ Đang tải bản đồ...</span>
    );
    const [distStraight, setDistStraight] = useState<number | null>(null);
    const [routeData, setRouteData] = useState<{ km: string, duration: number } | null>(null);
    const [routeError, setRouteError] = useState(false);

    // Cập nhật vòng tròn trên bản đồ khi kéo slider (Không dùng JS thuần sửa text nữa)
    const handleRadius = (r: number) => {
        setRadius(r);
        if (circleRef.current) circleRef.current.setRadius(r * 1000);
    };

    useEffect(() => {
        // 1. THÊM CỜ NÀY
        let isMounted = true;

        if (!document.getElementById('leaflet-css')) {
            const l = document.createElement('link');
            l.id='leaflet-css'; l.rel='stylesheet';
            l.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(l);
        }
        const loadL = () => new Promise<void>(res => {
            if (typeof L !== 'undefined') { res(); return; }
            const s = document.createElement('script');
            s.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            s.onload = () => res();
            document.head.appendChild(s);
        });

        const run = async () => {
            await loadL();
            // 2. CHECK CỜ
            if (!isMounted) return;
            if (!mapRef.current || mapInst.current) return;

            const map = L.map(mapRef.current).setView([10.762, 106.660], 6);
            mapInst.current = map;
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const mkS = L.divIcon({ html: `<div style="font-size:26px;line-height:1;pointer-events:auto;cursor:pointer;">🎓</div>`, className:'', iconAnchor:[13,26], popupAnchor:[0,-28] });
            const mkT = L.divIcon({ html: `<div style="font-size:26px;line-height:1;pointer-events:auto;cursor:pointer;">👨‍🏫</div>`, className:'', iconAnchor:[13,26], popupAnchor:[0,-28] });

            setLoadingMsg(<span style={{ color:'#64748b',fontSize:'0.88rem' }}>⏳ Đang tìm địa chỉ học viên...</span>);

            const pts: [number,number][] = [];

            // Học viên
            const sCoords = await geocode(studentAddress);
            // 3. NẾU UNMOUNT RỒI THÌ DỪNG LẠI, KHÔNG VẼ NỮA
            if (!isMounted) return;
            if (sCoords) {
                studentPt.current = sCoords;
                pts.push(sCoords);
                L.marker(sCoords, { icon: mkS }).addTo(map)
                    .bindPopup(`<b>🎓 ${studentName}</b><br/><small style="color:#64748b">${studentAddress}</small>`)
                    .openPopup();
            }

            setLoadingMsg(<span style={{ color:'#64748b',fontSize:'0.88rem' }}>⏳ Đang tìm địa chỉ gia sư...</span>);

            // Gia sư
            if (tutorAddress) {
                const tCoords = await geocode(tutorAddress);
                // 4. KIỂM TRA CỜ LẦN NỮA SAU KHI ĐỢI API
                if (!isMounted) return;
                if (tCoords) {
                    tutorPt.current = tCoords;
                    pts.push(tCoords);
                    L.marker(tCoords, { icon: mkT }).addTo(map)
                        .bindPopup(`<b>👨‍🏫 Địa chỉ của bạn</b><br/><small style="color:#64748b">${tutorAddress}</small>`);

                    const circle = L.circle(tCoords, {
                        radius: radius * 1000,
                        color:'#ef4444', fillColor:'#ef4444',
                        fillOpacity: 0.12, weight: 2, dashArray:'6,4'
                    }).addTo(map);
                    circleRef.current = circle;
                }
            }

            // 5. TRƯỚC KHI TÍNH ROUTE VÀ ZOOM BẢN ĐỒ
            if (!isMounted) return;

            if (pts.length === 2) {
                map.fitBounds(L.latLngBounds(pts), { padding:[70,70] });
                const straight = hav(pts[1], pts[0]);
                setDistStraight(straight);
                setLoadingMsg(null);

                const route = await getRoute(pts[1], pts[0]);
                if (!isMounted) return; // Kẻo tính route xong lại vẽ lên map chết

                if (route?.coords?.length) {
                    L.polyline(route.coords, { color:'#4f46e5', weight:5, opacity:0.9 }).addTo(map);
                    map.fitBounds(L.latLngBounds(route.coords), { padding:[60,60] });
                    setRouteData({ km: (route.distance/1000).toFixed(1), duration: route.duration });
                } else {
                    L.polyline(pts, { color:'#94a3b8', weight:2, dashArray:'6,4' }).addTo(map);
                    setRouteError(true);
                }
            } else if (pts.length === 1) {
                map.setView(pts[0], 13);
                if (!studentPt.current) {
                    setLoadingMsg(<span style={{ color:'#ef4444' }}>⚠️ Không tìm được địa chỉ học viên. Học viên cần cập nhật địa chỉ đầy đủ.</span>);
                } else {
                    setLoadingMsg(<span style={{ color:'#ef4444' }}>⚠️ Không tìm được địa chỉ gia sư. Bạn cần cập nhật địa chỉ trong hồ sơ.</span>);
                }
            } else {
                setLoadingMsg(<span style={{ color:'#ef4444' }}>⚠️ Không thể định vị được vị trí trên bản đồ! Vui lòng kiểm tra lại địa chỉ.</span>);
            }
        };

        run();

        return () => {
            // 6. ĐÁNH DẤU ĐÃ HỦY ĐỂ CHẶN MỌI THAO TÁC DOM ĐANG CHỜ
            isMounted = false;
            if (mapInst.current) {
                mapInst.current.remove();
                mapInst.current=null;
            }
        };
    }, []);
    const inR = distStraight !== null && distStraight <= radius;

    return (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:'1rem' }} onClick={onClose}>
            <div style={{ background:'white',borderRadius:'20px',width:'100%',maxWidth:'740px',overflow:'hidden',boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }} onClick={e=>e.stopPropagation()}>

                {/* Header */}
                <div style={{ padding:'14px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                    <div>
                        <h3 style={{ margin:0,fontSize:'1rem',fontWeight:700 }}>🗺️ Đường đi đến học viên</h3>
                        <p style={{ margin:'2px 0 0',fontSize:'0.8rem',color:'#64748b' }}>🎓 {studentName} — {studentAddress || 'Chưa có địa chỉ'}</p>
                    </div>
                    <button onClick={onClose} style={{ background:'#f1f5f9',border:'none',borderRadius:'8px',padding:'6px 14px',cursor:'pointer',fontWeight:700,color:'#64748b',fontSize:'1rem' }}>✕</button>
                </div>

                {/* Thông tin route render 100% bằng React State */}
                <div style={{ padding:'10px 20px',background:'#f8fafc',borderBottom:'1px solid #f1f5f9',minHeight:'44px',display:'flex',alignItems:'center' }}>
                    {loadingMsg ? loadingMsg : (
                        <div style={{ display:'flex',gap:'14px',alignItems:'center',flexWrap:'wrap', width:'100%' }}>
                            {!routeData && !routeError && (
                                <div><div style={{ fontSize:'1.1rem',fontWeight:800,color:'#94a3b8' }}>📏 ~{distStraight?.toFixed(1)} km</div><div style={{ fontSize:'0.7rem',color:'#94a3b8' }}>Đường thẳng · đang tính đường bộ...</div></div>
                            )}
                            {routeData && (
                                <>
                                    <div><div style={{ fontSize:'1.1rem',fontWeight:800,color:'#4f46e5' }}>📏 {routeData.km} km</div><div style={{ fontSize:'0.7rem',color:'#64748b' }}>Đường bộ</div></div>
                                    <div><div style={{ fontSize:'1.1rem',fontWeight:800,color:'#059669' }}>🚗 {fmt(routeData.duration)}</div><div style={{ fontSize:'0.7rem',color:'#64748b' }}>Ô tô</div></div>
                                    <div><div style={{ fontSize:'1.1rem',fontWeight:800,color:'#f59e0b' }}>🏍️ {fmt(routeData.duration*0.75)}</div><div style={{ fontSize:'0.7rem',color:'#64748b' }}>Xe máy</div></div>
                                </>
                            )}
                            {routeError && (
                                <div><div style={{ fontSize:'1.1rem',fontWeight:800,color:'#94a3b8' }}>📏 ~{distStraight?.toFixed(1)} km</div><div style={{ fontSize:'0.7rem',color:'#94a3b8' }}>Đường thẳng (không tính được đường bộ)</div></div>
                            )}

                            {/* Badge bán kính tự động cập nhật khi slider đổi */}
                            {distStraight !== null && (
                                <span style={{ marginLeft:'auto',padding:'4px 12px',borderRadius:'20px',fontWeight:700,fontSize:'0.82rem', background: inR?'#d1fae5':'#fee2e2', color: inR?'#065f46':'#b91c1c' }}>
                                    {inR ? `✅ Trong bán kính ${radius}km` : `❌ Ngoài bán kính ${radius}km`}
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Slider bán kính */}
                <div style={{ padding:'10px 20px',background:'#fef3c7',borderBottom:'1px solid #fde68a',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap' }}>
                    <span style={{ fontSize:'0.85rem',fontWeight:600,color:'#92400e',whiteSpace:'nowrap' }}>🔴 Bán kính dạy học:</span>
                    <input type="range" min={1} max={50} step={1} value={radius}
                           onChange={e => handleRadius(parseInt(e.target.value))}
                           style={{ flex:1,minWidth:'120px',accentColor:'#ef4444' }} />
                    <span style={{ fontWeight:800,color:'#ef4444',fontSize:'1rem',minWidth:'60px' }}>{radius} km</span>
                </div>

                {/* Bản đồ */}
                <div ref={mapRef} style={{ height:'390px',width:'100%' }} />

                {/* Chú thích */}
                <div style={{ padding:'8px 20px',background:'#f0f9ff',display:'flex',gap:'16px',fontSize:'0.78rem',color:'#0369a1',flexWrap:'wrap',borderTop:'1px solid #e0f2fe' }}>
                    <span>👨‍🏫 <b>Click icon gia sư</b> để xem địa chỉ</span>
                    <span>🎓 <b>Click icon học viên</b> để xem địa chỉ</span>
                    <span>🔵 Đường đi thực tế</span>
                    <span>🔴 Vùng bán kính</span>
                </div>
            </div>
        </div>
    );
}