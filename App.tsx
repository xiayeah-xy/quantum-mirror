import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
// 核心修复：直接引入 Google AI SDK，彻底绕过导致报错的 services 路径
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 类型定义 ---
export interface CalibrationResult {
  frequencyScan: string;
  illusionStripping: string;
  fiveSteps: string[];
  actionAnchor: string;
  recommendedBookTitle: string;
  recommendedMusicTitle: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  input: string;
  result: CalibrationResult;
}

const PRESET_CONCERNS = [
  "金钱似乎总是指间沙，无论如何努力都填不满内心深处的匮乏深渊...",
  "在职场表演中耗尽了最后一丝生命力，却依然对未知的评价感到深深恐惧...",
  "试图在亲密关系中寻找救赎，却发现只是在对方的镜子里重复旧有的伤痛...",
  "当生活变成了一场无止境的追逐，我开始怀疑这一切繁荣背后的终极意义...",
  "无法停止对未来可能发生的‘最坏情况’进行灾难化预演，灵魂无法安放...",
  "感觉自己被囚禁在社会的矩阵剧本里，渴望收回主权却找不到出口..."
];

const BOOKS_DATA = [
  { title: "《你值得过更好的生活》", author: "罗伯特·谢费尔德", desc: "核心架构：拆解全息幻象" },
  { title: "《金钱的灵魂》", author: "林恩·特威斯特", desc: "重新定义丰盛与金钱的关系" },
  { title: "《当下的力量》", author: "埃克哈特·托利", desc: "进入意识现场的必经之路" },
  { title: "《瓦解控制》", author: "克拉克·斯特兰德", desc: "放弃小我控制，回归源头" },
  { title: "《信念的力量》", author: "布鲁斯·利普顿", desc: "量子生物学视角下的意识改写" },
  { title: "《零极限》", author: "修·蓝博士", desc: "清理潜意识记忆的实操指南" },
  { title: "《终极自由之路》", author: "莱斯特·利文森", desc: "关于释放与收回力量的终极教导" },
  { title: "《显化的真义》", author: "尼维尔·高达德", desc: "意识即实相的古典量子观" }
];

const MUSIC_DATA = [
  { title: "Deep Space 432Hz - Abundance", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "谐振频率" },
  { title: "Quantum Field Meditation", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3", type: "场域扩张" },
  { title: "Solfeggio 528Hz & 432Hz Mix", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3", type: "修复与显化" },
  { title: "Alpha Wave Focus", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", type: "深度专注" },
  { title: "Healing Resonance 432Hz", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3", type: "细胞修复" },
  { title: "Higher Self Connection", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3", type: "意识链接" },
  { title: "Pineal Gland Activation", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3", type: "觉知开启" },
  { title: "Universal Harmony", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", type: "万物共振" },
  { title: "Eternal Silence", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3", type: "宁静本源" },
  { title: "Soul Blueprint Alignment", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3", type: "灵魂重塑" }
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement>(null);
  const [depotPlayingTitle, setDepotPlayingTitle] = useState<string | null>(null);
  const depotAudioRef = useRef<HTMLAudioElement>(null);

  const BGM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3";

  // 打字机效果逻辑
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (bgmRef.current) {
      if (isBgmPlaying) {
        bgmRef.current.play().catch(() => setIsBgmPlaying(false));
      } else {
        bgmRef.current.pause();
      }
    }
  }, [isBgmPlaying]);

  useEffect(() => {
    if (result || loading) return;
    const currentFullText = PRESET_CONCERNS[currentConcernIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < currentFullText.length) {
        setDisplayedPlaceholder(currentFullText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      } else if (!isDeleting && charIndex === currentFullText.length) {
        setTimeout(() => setIsDeleting(true), 3000);
      } else if (isDeleting && charIndex > 0) {
        setDisplayedPlaceholder(currentFullText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      } else {
        setIsDeleting(false);
        setCharIndex(0);
        setCurrentConcernIndex((prev) => (prev + 1) % PRESET_CONCERNS.length);
      }
    }, isDeleting ? 30 : 100);
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, currentConcernIndex, result, loading]);

  // --- 核心修复：将 API 调用逻辑直接写在 handleCalibrate 中 ---
  const handleCalibrate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    // 关键：从 Vercel 环境变量中读取 Key
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      if (!API_KEY) throw new Error("API Key 未配置，请在 Vercel 环境变量中设置 VITE_GEMINI_API_KEY");
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: "你是一位精通意识法则的大师。请根据用户烦恼返回 JSON 格式：{frequencyScan, illusionStripping, fiveSteps[], actionAnchor, recommendedBookTitle, recommendedMusicTitle}。" 
      });

      const prompt = `用户当前烦恼：${input}。请透过全息影相剥离幻象，给出频率扫描结论和收回力量的五步曲。`;
      const response = await model.generateContent(prompt);
      const text = response.response.text().replace(/```json|```/g, "");
      const data = JSON.parse(text) as CalibrationResult;

      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), input: input, result: data }, ...prev].slice(0, 10));
      setInput('');
      if (!isBgmPlaying && !depotPlayingTitle) setIsBgmPlaying(true);
    } catch (err: any) {
      console.error("Calibration Error:", err);
      setError(err.message || "连接量子核心失败。请检查网络或 API Key。");
    } finally {
      setLoading(false);
    }
  };

  const handleDepotMusicPlay = (track: typeof MUSIC_DATA[0]) => {
    if (depotPlayingTitle === track.title) {
      depotAudioRef.current?.pause();
      setDepotPlayingTitle(null);
    } else {
      if (depotAudioRef.current) {
        depotAudioRef.current.src = track.url;
        depotAudioRef.current.play().catch(e => console.error("Depot playback error:", e));
        setDepotPlayingTitle(track.title);
        setIsBgmPlaying(false);
      }
    }
  };

  const matchedBook = result ? BOOKS_DATA.find(b => result.recommendedBookTitle.includes(b.title.replace(/《|》/g, ""))) || BOOKS_DATA[0] : null;
  const matchedMusic = result ? MUSIC_DATA.find(m => result.recommendedMusicTitle.includes(m.title)) || MUSIC_DATA[0] : null;

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light selection:bg-cyan-500/30">
      <StarBackground />
      <audio ref={bgmRef} src={BGM_URL} loop />
      <audio ref={depotAudioRef} onEnded={() => setDepotPlayingTitle(null)} />

      {/* 音乐控制图标保持原样 */}
      <button 
        onClick={() => {
          setIsBgmPlaying(!isBgmPlaying);
          if (depotAudioRef.current) {
            depotAudioRef.current.pause();
            setDepotPlayingTitle(null);
          }
        }}
        className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 hover:scale-110 transition-all duration-500 shadow-2xl group"
      >
        <div className="text-cyan-400 text-lg">
          {isBgmPlaying ? <span className="animate-pulse">🔊</span> : <span>🔇</span>}
        </div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <div className="w-full flex flex-col items-center">
          <header className="text-center mb-10 relative w-full animate-fadeIn">
            <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.2em] md:tracking-[0.3em] gradient-text mb-4 drop-shadow-2xl whitespace-nowrap">
              频率校准之镜
            </h1>
            <p className="text-cyan-200/80 font-medium text-xs md:text-sm tracking-[0.2em] md:tracking-[0.4em] uppercase opacity-90">
              QUANTUM MIRROR • 剥离幻象 • 收回力量
            </p>
          </header>

          <main className="w-full">
            <div className="glass-panel rounded-[2.5rem] p-6 md:p-14 transition-all duration-700 hover:shadow-[0_0_80px_rgba(128,222,234,0.15)] min-h-[400px] md:min-h-[480px] flex flex-col justify-center relative overflow-hidden shadow-2xl">
              
              {!result && !loading && (
                <div className="space-y-8 md:space-y-10 animate-fadeIn">
                  <div className="relative group">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={displayedPlaceholder}
                      className="relative w-full h-40 md:h-56 bg-black/40 backdrop-blur-3xl border border-cyan-400/40 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 text-white text-center placeholder-cyan-100/20 text-lg md:text-2xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-300/20 transition-all resize-none shadow-2xl leading-relaxed font-light"
                    />
                  </div>
                  <button
                    onClick={handleCalibrate}
                    disabled={!input.trim() || loading}
                    className={`w-full py-5 md:py-6 rounded-2xl font-bold text-base md:text-lg tracking-[0.4em] md:tracking-[0.5em] transition-all duration-700 transform uppercase
                      ${input.trim() ? 'bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-purple-600/80 text-white hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(128,222,234,0.3)]' : 'bg-white/5 text-white/10 cursor-not-allowed'}`}
                  >
                    收回力量
                  </button>
                  {error && <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-300 text-center text-xs animate-shake">{error}</div>}
                </div>
              )}

              {loading && (
                <div className="flex flex-col items-center justify-center py-16 space-y-8">
                  <div className="w-24 h-24 border-4 border-cyan-500/20 border-t-white rounded-full animate-spin"></div>
                  <p className="text-white text-lg tracking-[0.5em] animate-pulse uppercase">解析全息图景</p>
                </div>
              )}

              {result && (
                <div className="animate-fadeIn space-y-10 md:space-y-12 py-4 overflow-y-auto max-h-[75vh] no-scrollbar pr-2 text-white">
                   <section className="border-l-2 border-cyan-400/80 pl-6">
                    <h3 className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-2">【频率扫描】</h3>
                    <p className="text-xl md:text-2xl font-light">{result.frequencyScan}</p>
                  </section>
                  <section className="border-l-2 border-purple-400/80 pl-6">
                    <h3 className="text-purple-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-2">【幻象剥离】</h3>
                    <p className="text-white text-base md:text-lg italic opacity-90">{result.illusionStripping}</p>
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] uppercase ml-6">【收回力量五部曲】</h3>
                    {result.fiveSteps.map((step, idx) => (
                      <div key={idx} className="flex items-start space-x-4 bg-white/[0.03] p-6 rounded-[1.5rem] border border-white/5">
                        <span className="w-7 h-7 flex-shrink-0 border border-cyan-500/30 rounded-full flex items-center justify-center text-cyan-300 text-xs font-bold">{idx + 1}</span>
                        <p className="text-base font-light">{step}</p>
                      </div>
                    ))}
                  </section>
                  <button onClick={() => setResult(null)} className="w-full mt-6 py-6 text-white/20 hover:text-white transition-all text-[10px] tracking-[1em] uppercase border-t border-white/5">
                    — 返回虚空 —
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <footer className="w-full py-10 text-[10px] text-white/10 tracking-[1.5em] text-center uppercase">
        © Mirror Logic • Engineered for Consciousness
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shake { 10%, 90% { transform: translate3d(-1px, 0, 0); } 20%, 80% { transform: translate3d(2px, 0, 0); } 30%, 50%, 70% { transform: translate3d(-4px, 0, 0); } }
        .animate-shake { animation: shake 0.6s cubic-bezier(.36,.07,.19,.97) both; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .gradient-text { background: linear-gradient(to right, #22d3ee, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      `}} />
    </div>
  );
};

export default App;
