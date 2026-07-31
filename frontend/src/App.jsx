import { useState } from "react";
import TravelPlanner from "./TravelPlanner";
import SttApp from "./SttApp";
import { Plane, Mic } from "lucide-react";

function App() {
    const [tab, setTab] = useState("travel");

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f] text-white">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="blob-1 absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-600/30 blur-[120px]" />
                <div className="blob-2 absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-fuchsia-600/25 blur-[120px]" />
                <div className="blob-1 absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-purple-600/20 blur-[120px]" />
            </div>

            <div className="relative z-10 sticky top-0 backdrop-blur-xl bg-white/5 border-b border-white/10">
                <div className="max-w-5xl mx-auto flex gap-2 px-4 py-4">
                    <button onClick={() => setTab("travel")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all
              ${tab === "travel" ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                        <Plane className="w-4 h-4" /> 여행 플래너
                    </button>
                    <button onClick={() => setTab("stt")}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all
              ${tab === "stt" ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-lg shadow-fuchsia-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                        <Mic className="w-4 h-4" /> 음성 받아쓰기
                    </button>
                </div>
            </div>

            <div className="relative z-10">
                {tab === "travel" ? <TravelPlanner /> : <SttApp />}
            </div>
        </div>
    );
}

export default App;