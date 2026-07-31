import { useState } from "react";
import axios from "axios";
import { UploadCloud, FileAudio, Copy, Download, Sparkles, Check, Languages } from "lucide-react";

function SttApp() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fileName, setFileName] = useState("");
    const [dragOver, setDragOver] = useState(false);
    const [summary, setSummary] = useState("");
    const [summarizing, setSummarizing] = useState(false);
    const [copied, setCopied] = useState(false);
    const [translated, setTranslated] = useState("");
    const [translating, setTranslating] = useState(false);
    const [targetLang, setTargetLang] = useState("한국어");
    const [showTranslatedSegments, setShowTranslatedSegments] = useState(false);

    const sendToServer = async (file) => {
        if (!file) return;
        setFileName(file.name);
        setLoading(true); setError(""); setResult(null);
        setSummary(""); setTranslated(""); setShowTranslatedSegments(false);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await axios.post("/api/stt", formData);
            setResult(res.data);
        } catch (err) {
            setError("변환 실패: " + (err.message || "오류"));
        } finally { setLoading(false); }
    };

    const handleUpload = (e) => sendToServer(e.target.files[0]);
    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); sendToServer(e.dataTransfer.files[0]); };

    const handleSummarize = async () => {
        if (!result?.text) return;
        setSummarizing(true); setSummary("");
        try {
            const res = await axios.post("/api/summarize", { text: result.text });
            setSummary(res.data.summary);
        } catch (err) {
            setError("요약 실패: " + (err.message || "오류"));
        } finally { setSummarizing(false); }
    };

    // 번역: 전체 텍스트 + 구간별 둘 다
    const handleTranslate = async () => {
        if (!result?.text) return;
        setTranslating(true); setTranslated("");
        try {
            // 전체 텍스트 번역
            const res1 = await axios.post("/api/translate", {
                text: result.text, target_lang: targetLang,
            });
            setTranslated(res1.data.translated);

            // 구간별 번역
            if (result.segments?.length > 0) {
                const res2 = await axios.post("/api/translate-segments", {
                    segments: result.segments, target_lang: targetLang,
                });
                setResult((prev) => ({ ...prev, segments: res2.data.segments }));
                setShowTranslatedSegments(true);
            }
        } catch (err) {
            setError("번역 실패: " + (err.message || "오류"));
        } finally { setTranslating(false); }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        let content = `[전체 텍스트]\n${result.text}`;
        if (translated) content += `\n\n[번역 - ${targetLang}]\n${translated}`;
        if (summary) content += `\n\n[요약]\n${summary}`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "transcript.txt"; a.click();
        URL.revokeObjectURL(url);
    };

    const hasTranslatedSegments = result?.segments?.some((s) => s.translated);

    return (
        <div className="py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-lg shadow-fuchsia-500/40 mb-4">
                        <FileAudio className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                        음성 받아쓰기
                    </h1>
                    <p className="text-slate-400 mt-2">음성을 텍스트로 바꾸고 번역·요약해요</p>
                </div>

                <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6 mb-6">
                    <label
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl py-12 cursor-pointer transition-all
              ${dragOver ? "border-fuchsia-400 bg-fuchsia-500/10" : "border-white/15 hover:border-fuchsia-400/50 hover:bg-white/5"}`}
                    >
                        <UploadCloud className={`w-14 h-14 mb-3 transition ${dragOver ? "text-fuchsia-400" : "text-slate-500"}`} />
                        <span className="text-slate-200 font-semibold">음성을 드래그하거나 클릭해서 선택</span>
                        <span className="text-xs text-slate-500 mt-1">MP3 · WAV · M4A</span>
                        <input type="file" accept="audio/*" onChange={handleUpload} className="hidden" />
                    </label>
                    {fileName && <p className="text-center text-sm text-slate-400 mt-3">{fileName}</p>}
                </div>

                {loading && (
                    <div className="flex items-center justify-center gap-3 py-8 text-fuchsia-400">
                        <div className="w-5 h-5 border-2 border-fuchsia-400 border-t-transparent rounded-full animate-spin" />
                        <span className="font-medium">음성을 텍스트로 바꾸는 중...</span>
                    </div>
                )}

                {error && (
                    <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-center mb-4">{error}</div>
                )}

                {result && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}
                                    className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50">
                                <option className="bg-slate-800" value="한국어">한국어</option>
                                <option className="bg-slate-800" value="영어">영어</option>
                                <option className="bg-slate-800" value="일본어">일본어</option>
                                <option className="bg-slate-800" value="중국어">중국어</option>
                                <option className="bg-slate-800" value="스페인어">스페인어</option>
                            </select>
                            <button onClick={handleTranslate} disabled={translating}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-lg shadow-cyan-500/30">
                                <Languages className="w-4 h-4" />
                                {translating ? "번역 중..." : "번역"}
                            </button>
                            <button onClick={handleSummarize} disabled={summarizing}
                                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white hover:opacity-90 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-lg shadow-fuchsia-500/30">
                                <Sparkles className="w-4 h-4" />
                                {summarizing ? "요약 중..." : "AI 요약"}
                            </button>
                            <button onClick={handleCopy}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center gap-1.5 text-sm">
                                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                {copied ? "복사됨" : "복사"}
                            </button>
                            <button onClick={handleDownload}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 flex items-center gap-1.5 text-sm">
                                <Download className="w-4 h-4" /> TXT
                            </button>
                        </div>

                        {translated && (
                            <div className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Languages className="w-5 h-5 text-cyan-400" />
                                    <h2 className="font-bold text-white">번역 ({targetLang})</h2>
                                </div>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{translated}</p>
                            </div>
                        )}

                        {summary && (
                            <div className="backdrop-blur-xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 rounded-2xl border border-fuchsia-500/20 p-6">
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-5 h-5 text-fuchsia-400" />
                                    <h2 className="font-bold text-white">AI 요약</h2>
                                </div>
                                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{summary}</p>
                            </div>
                        )}

                        <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-6">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="font-bold text-white">전체 텍스트 (원문)</h2>
                                <span className="text-xs text-slate-500">{result.language} · {result.duration}초</span>
                            </div>
                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{result.text}</p>
                        </div>

                        {result.segments?.length > 0 && (
                            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                                <div className="bg-gradient-to-r from-fuchsia-500 to-pink-500 px-5 py-3 flex items-center justify-between">
                                    <h3 className="text-white font-semibold">구간별 ({result.segments.length}개)</h3>
                                    {hasTranslatedSegments && (
                                        <button onClick={() => setShowTranslatedSegments((v) => !v)}
                                                className="text-white/90 text-xs bg-white/20 px-3 py-1 rounded-full hover:bg-white/30">
                                            {showTranslatedSegments ? "번역 숨기기" : "번역 보기"}
                                        </button>
                                    )}
                                </div>
                                <ul className="divide-y divide-white/5">
                                    {result.segments.map((seg, i) => (
                                        <li key={i} className="px-5 py-3 flex gap-4">
                                            <span className="text-xs text-fuchsia-400 font-mono whitespace-nowrap pt-0.5">{seg.start}s</span>
                                            <div>
                                                <span className="text-slate-300">{seg.text}</span>
                                                {showTranslatedSegments && seg.translated && (
                                                    <p className="text-cyan-300 text-sm mt-1">{seg.translated}</p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SttApp;