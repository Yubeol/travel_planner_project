import { useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { UploadCloud, Plane, MapPin, Clock } from "lucide-react";

// 마커 아이콘 (기본 아이콘 깨짐 방지)
const createIcon = (number) =>
    L.divIcon({
        html: `<div style="background:linear-gradient(135deg,#6366f1,#a855f7);width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);border:2px solid white;">
             <span style="transform:rotate(45deg);color:white;font-size:12px;font-weight:bold;">${number}</span>
           </div>`,
        className: "",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
    });

const DAY_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

function TravelPlanner() {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);
    const [dragOver, setDragOver] = useState(false);

    const sendToServer = async (file) => {
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        setLoading(true); setError(""); setPlan(null);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await axios.post("/api/travel", formData);
            setPlan(res.data);
        } catch (err) {
            setError("분석 실패: " + (err.message || "오류"));
        } finally { setLoading(false); }
    };

    const handleUpload = (e) => sendToServer(e.target.files[0]);
    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); sendToServer(e.dataTransfer.files[0]); };
    const reset = () => { setPlan(null); setPreview(null); setError(""); };

    // 모든 장소를 하나의 배열로 (지도 마커용)
    const allPlaces = plan?.days?.flatMap((d, di) =>
        d.places.map((p) => ({ ...p, day: d.day, dayIndex: di }))
    ) || [];

    // 지도 중심 (첫 장소 기준)
    const center = allPlaces.length > 0 ? [allPlaces[0].lat, allPlaces[0].lng] : [48.8584, 2.2945];

    // 동선 (day별 경로)
    const routes = plan?.days?.map((d) => d.places.map((p) => [p.lat, p.lng])) || [];

    return (
        <div className="py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* 헤더 */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 mb-4">
                        <Plane className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        AI 여행 플래너
                    </h1>
                    <p className="text-slate-400 mt-2">여행지 사진 한 장이면 일정과 지도를 만들어드려요</p>
                </div>

                {/* 업로드 */}
                {!plan && !loading && (
                    <div className="max-w-2xl mx-auto backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                        <label
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-14 cursor-pointer transition-all
                ${dragOver ? "border-indigo-400 bg-indigo-500/10" : "border-white/15 hover:border-indigo-400/50 hover:bg-white/5"}`}
                        >
                            <UploadCloud className={`w-14 h-14 mb-3 ${dragOver ? "text-indigo-400" : "text-slate-500"}`} />
                            <span className="text-slate-200 font-semibold">여행지 사진을 드래그하거나 클릭</span>
                            <span className="text-xs text-slate-500 mt-1">랜드마크가 잘 보이는 사진일수록 정확해요</span>
                            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                        </label>
                        {preview && <img src={preview} alt="" className="max-h-56 mx-auto rounded-lg shadow-lg mt-4" />}
                    </div>
                )}

                {/* 로딩 */}
                {loading && (
                    <div className="max-w-2xl mx-auto backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-10 text-center">
                        {preview && <img src={preview} alt="" className="max-h-48 mx-auto rounded-lg shadow-lg mb-6 opacity-50" />}
                        <div className="flex items-center justify-center gap-3 text-indigo-400">
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            <span className="font-medium">여행 일정을 짜는 중이에요...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="max-w-2xl mx-auto backdrop-blur-xl bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-center">
                        {error}
                        <button onClick={reset} className="ml-3 underline">다시 시도</button>
                    </div>
                )}

                {/* 결과 */}
                {plan && !loading && (
                    <div>
                        {/* 목적지 헤더 */}
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <p className="text-slate-400 text-sm">{plan.country}</p>
                                <h2 className="text-3xl font-bold text-white">{plan.city}</h2>
                            </div>
                            <button onClick={reset}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm shadow-lg shadow-indigo-500/30">
                                새 여행지
                            </button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-5">
                            {/* 왼쪽: 일정 카드 */}
                            <div className="space-y-4">
                                {plan.days?.map((d, di) => (
                                    <div key={di} className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                        <div className="px-5 py-3 font-semibold text-white" style={{ background: `linear-gradient(90deg, ${DAY_COLORS[di % DAY_COLORS.length]}, transparent)` }}>
                                            Day {d.day}
                                        </div>
                                        <ul className="divide-y divide-white/5">
                                            {d.places.map((p, pi) => (
                                                <li key={pi} className="px-5 py-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5"
                                                             style={{ background: DAY_COLORS[di % DAY_COLORS.length] }}>
                                                            {pi + 1}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium text-slate-100">{p.name}</span>
                                                                {p.time && (
                                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                                        <Clock className="w-3 h-3" />{p.time}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {p.description && <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>

                            {/* 오른쪽: 지도 */}
                            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden h-[500px] md:sticky md:top-24">
                                <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
                                        attribution='&copy; OpenStreetMap &copy; CARTO'
                                    />
                                    {/* 마커 */}
                                    {allPlaces.map((p, i) => (
                                        <Marker key={i} position={[p.lat, p.lng]} icon={createIcon(i + 1)}>
                                            <Popup>
                                                <b>{p.name}</b><br />
                                                Day {p.day} · {p.time}<br />
                                                {p.description}
                                            </Popup>
                                        </Marker>
                                    ))}
                                    {/* 동선 (day별) */}
                                    {routes.map((route, di) => (
                                        <Polyline key={di} positions={route}
                                                  pathOptions={{ color: DAY_COLORS[di % DAY_COLORS.length], weight: 3, opacity: 0.7 }} />
                                    ))}
                                </MapContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TravelPlanner;