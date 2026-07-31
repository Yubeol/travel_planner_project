import { useState, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    UploadCloud, Search, Coffee, Download, RotateCcw, Utensils, Tag, Hash,
} from "lucide-react";

const CATEGORY_COLORS = [
    "from-indigo-500 to-purple-500",
    "from-rose-500 to-pink-500",
    "from-amber-500 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-sky-500 to-blue-500",
    "from-violet-500 to-fuchsia-500",
];

function MenuOcr() {
    const [menu, setMenu] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [preview, setPreview] = useState(null);
    const [search, setSearch] = useState("");
    const [activeCat, setActiveCat] = useState("전체");
    const [dragOver, setDragOver] = useState(false);

    const sendToServer = async (file) => {
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        setLoading(true);
        setError("");
        setMenu([]);
        setSearch("");
        setActiveCat("전체");
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await axios.post("/api/ocr", formData);
            setMenu(res.data.menu || []);
        } catch (err) {
            setError("분석에 실패했어요: " + (err.message || "알 수 없는 오류"));
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = (e) => sendToServer(e.target.files[0]);
    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); sendToServer(e.dataTransfer.files[0]); };
    const reset = () => { setMenu([]); setPreview(null); setError(""); setSearch(""); setActiveCat("전체"); };

    const categories = useMemo(() => {
        const cats = [...new Set(menu.map((m) => m.category || "기타"))];
        return ["전체", ...cats];
    }, [menu]);

    const filtered = useMemo(() => {
        return menu.filter((m) => {
            const catOk = activeCat === "전체" || (m.category || "기타") === activeCat;
            const searchOk = m.name?.toLowerCase().includes(search.toLowerCase());
            return catOk && searchOk;
        });
    }, [menu, activeCat, search]);

    const grouped = useMemo(() => {
        return filtered.reduce((acc, item) => {
            const cat = item.category || "기타";
            (acc[cat] = acc[cat] || []).push(item);
            return acc;
        }, {});
    }, [filtered]);

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(menu, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "menu.json"; a.click();
        URL.revokeObjectURL(url);
    };

    const catColor = (cat) => {
        const idx = categories.indexOf(cat) - 1;
        return CATEGORY_COLORS[idx % CATEGORY_COLORS.length] || CATEGORY_COLORS[0];
    };

    return (
        <div className="py-12 px-4">
            <div className="max-w-3xl mx-auto">
                {/* 헤더 */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/40 mb-4">
                        <Utensils className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        메뉴판 OCR
                    </h1>
                    <p className="text-slate-400 mt-2">메뉴판 사진 한 장이면 메뉴가 자동으로 정리돼요</p>
                </motion.div>

                {/* 업로드 */}
                {menu.length === 0 && !loading && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                        <label
                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={handleDrop}
                            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-14 cursor-pointer transition-all
                ${dragOver ? "border-indigo-400 bg-indigo-500/10" : "border-white/15 hover:border-indigo-400/50 hover:bg-white/5"}`}
                        >
                            <UploadCloud className={`w-14 h-14 mb-3 transition ${dragOver ? "text-indigo-400" : "text-slate-500"}`} />
                            <span className="text-slate-200 font-semibold">이미지를 드래그하거나 클릭해서 선택</span>
                            <span className="text-xs text-slate-500 mt-1">JPG · PNG · WEBP</span>
                            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                        </label>
                        {preview && <img src={preview} alt="미리보기" className="max-h-56 mx-auto rounded-lg shadow-lg mt-4" />}
                    </motion.div>
                )}

                {/* 로딩 */}
                {loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-10 text-center">
                        {preview && <img src={preview} alt="" className="max-h-48 mx-auto rounded-lg shadow-lg mb-6 opacity-50" />}
                        <div className="flex items-center justify-center gap-3 text-indigo-400">
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            <span className="font-medium">메뉴를 읽는 중이에요...</span>
                        </div>
                    </motion.div>
                )}

                {/* 에러 */}
                {error && (
                    <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-center mb-4">
                        {error}
                        <button onClick={reset} className="ml-3 underline">다시 시도</button>
                    </div>
                )}

                {/* 결과 */}
                {menu.length > 0 && !loading && (
                    <div>
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <StatCard icon={<Hash className="w-5 h-5" />} label="총 메뉴" value={`${menu.length}개`} />
                            <StatCard icon={<Tag className="w-5 h-5" />} label="카테고리" value={`${categories.length - 1}개`} />
                        </div>

                        <div className="flex gap-2 mb-4">
                            <div className="flex-1 relative">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="메뉴 검색..."
                                       className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400/50 text-sm" />
                            </div>
                            <button onClick={downloadJson}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center gap-1.5 text-sm">
                                <Download className="w-4 h-4" /> JSON
                            </button>
                            <button onClick={reset}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90 flex items-center gap-1.5 text-sm shadow-lg shadow-indigo-500/30">
                                <RotateCcw className="w-4 h-4" /> 새로
                            </button>
                        </div>

                        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                            {categories.map((cat) => (
                                <button key={cat} onClick={() => setActiveCat(cat)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition
                    ${activeCat === cat ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30" : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="popLayout">
                            {Object.entries(grouped).map(([category, items]) => (
                                <motion.div key={category} layout
                                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                            className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden mb-4">
                                    <div className={`bg-gradient-to-r ${catColor(category)} px-5 py-3 flex items-center gap-2`}>
                                        <Coffee className="w-4 h-4 text-white/90" />
                                        <h3 className="text-white font-semibold">{category}</h3>
                                        <span className="ml-auto text-white/80 text-xs">{items.length}개</span>
                                    </div>
                                    <ul className="divide-y divide-white/5">
                                        {items.map((item, i) => (
                                            <li key={i} className="flex items-center justify-between px-5 py-3 hover:bg-white/5 transition">
                                                <div>
                                                    <p className="font-medium text-slate-100">{item.name}</p>
                                                    {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                                                </div>
                                                <span className="font-semibold text-indigo-300 bg-white/5 px-3 py-1 rounded-lg text-sm">
                                                    {item.price || "-"}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filtered.length === 0 && <p className="text-center text-slate-500 py-8">검색 결과가 없어요</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="backdrop-blur-xl bg-white/5 rounded-xl border border-white/10 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">{icon}</div>
            <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
            </div>
        </div>
    );
}

export default MenuOcr;