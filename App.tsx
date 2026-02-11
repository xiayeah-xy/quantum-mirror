import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. 类型定义 ---
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

// --- 2. 静态数据 ---
const PRESET_CONCERNS = [
  "金钱似乎总是指间沙，无论如何努力都填不满内心深处的匮乏深渊...",
  "在职场表演中耗尽了最后一丝生命力，却依然对未知的评价感到深深恐惧...",
  "试图在亲密关系中寻找救赎，却发现只是在对方的镜子里重复旧有的伤痛...",
  "感觉自己被囚禁在社会的矩阵剧本里，渴望收回主权却找不到出口..."
];

const BOOKS_DATA = [
  { title: "《你值得过更好的生活》", author: "罗伯特·谢费尔德", desc: "拆解全息幻象的进阶指南" },
  { title: "《金钱的灵魂》", author: "林恩·特威斯特", desc: "重新定义丰盛与流动的本质" },
  { title: "《当下的力量》", author: "埃克哈特·托利", desc: "进入意识现场的必经之路" },
  { title: "《瓦解控制》", author: "克拉克·斯特兰德", desc: "放弃小我控制，回归源头" },
  { title: "《信念的力量》", author: "布鲁斯·利普顿", desc: "量子生物学视角下的意识改写" },
  { title: "《零极限》", author: "修·蓝博士", desc: "清理潜意识记忆的实操手册" },
  { title: "《终极自由之路》", author: "莱斯特·利文森", desc: "释放与收回力量的终极教导" },
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
  { title: "Universal Harmony", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3", type: "万物共振" }
];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // 状态控制
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const [isDepotOpen, setIsDepotOpen] = useState(false);
  const [depotPlayingTitle, setDepotPlayingTitle] = useState<string | null>(null);
  
  const bgmRef = useRef<HTMLAudioElement>(null);
  const depotAudioRef = useRef<HTMLAudioElement>(null);
  const BGM_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3";

  // 打字机逻辑
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [currentConcernIndex, setCurrentConcernIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (bgmRef.current) {
      isBgmPlaying ? bgmRef.current.play().catch(() => setIsBgmPlaying(false)) : bgmRef.current.pause();
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

  const handleCalibrate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setIsBgmPlaying(true);

    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      // 这里使用的是你指定的 2.5 flash 模型
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `你是一位精通意识法则的大师。针对用户困扰进行频率校准。
      用户困扰："${input}"
      
      请必须从以下列表中选出一本书名（严格匹配）：${BOOKS_DATA.map(b => b.title).join(',')}
      请必须从以下列表中选出一个音乐名（严格匹配）：${MUSIC_DATA.map(m => m.title).join(',')}

      返回 JSON：
      {
        "frequencyScan": "当前频率深度洞察",
        "illusionStripping": "该困扰背后的全息幻象本质",
        "fiveSteps": ["步骤1", "步骤2", "步骤3", "步骤4", "步骤5"],
        "actionAnchor": "一个能在现实中执行的物理动作锚点",
        "recommendedBookTitle": "从列表中选的书名",
        "recommendedMusicTitle": "从列表中选的音乐名"
      }`;

      const response = await model.generateContent(prompt);
      const text = response.response.text();
      const cleanText = text.replace(/```json|```/g, '').trim();
      const data = JSON.parse(cleanText) as CalibrationResult;

      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), timestamp: Date.now(), input, result: data }, ...prev].slice(0, 10));
      setInput('');
    } catch (err: any) {
      setError("核心频率接入失败，请确保 API Key 配置正确。");
    } finally {
      setLoading(false);
    }
  };

  const handleMusicToggle = (track: typeof MUSIC_DATA[0]) => {
    if (depotPlayingTitle === track.title) {
      depotAudioRef.current?.pause();
      setDepotPlayingTitle(null);
    } else {
      if (depotAudioRef.current) {
        depotAudioRef.current.src = track.url;
        depotAudioRef.current.play();
        setDepotPlayingTitle(track.title);
        setIsBgmPlaying(false);
      }
    }
  };

  // 匹配逻辑
  const matchedBook = result ? BOOKS_DATA.find(b => b.title.includes(result.recommendedBookTitle.replace(/《|》/g, ''))) || BOOKS_DATA[0] : null;
  const matchedMusic = result ? MUSIC_DATA.find(m => m.title.includes(result.recommendedMusicTitle)) || MUSIC_DATA[0] : null;

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light text-white overflow-x-hidden">
      <StarBackground />
      <audio ref={bgmRef} src={BGM_URL} loop />
      <audio ref={depotAudioRef} onEnded={() => setDepotPlayingTitle(null)} />

      {/* 音乐悬浮按钮 */}
      <button 
        onClick={() => { setIsBgmPlaying(!isBgmPlaying); setDepotPlayingTitle(null); depotAudioRef.current?.pause(); }}
        className="fixed top-6 right-6 z-50 p-4 rounded-full bg-white/5 backdrop-blur-2xl border border-white/10 opacity-60 hover:opacity-100 transition-all"
      >
        <div className="text-cyan-400 w-6 h-6 flex items-center justify-center">
          {isBgmPlaying || depotPlayingTitle ? (
            <div className="w-1 h-4 bg-cyan-400 animate-pulse mx-0.5" />
          ) : (
             <div className="border-l-8 border-l-cyan-400 border-y-4 border-y-transparent ml-1" />
          )}
        </div>
      </button>

      <div className="flex-grow flex flex-col items-center justify-center py-10 px-6 w-full max-w-5xl mx-auto">
        <header className="text-center mb-10 animate-fadeIn">
          <h1 className="text-3xl md:text-5xl font-extralight tracking-[0.2em] gradient-text mb-4 uppercase">频率校准之镜</h1>
          <p className="text-cyan-200/80 text-[10px] md:text-xs tracking-[0.4em] uppercase">QUANTUM MIRROR • 剥离幻象 • 收回力量</p>
        </header>

        <main className="w-full">
          <div className="glass-panel rounded-[2.5rem] p-6 md:p-14 min-h-[500px] flex flex-col justify-center relative shadow-2xl overflow-hidden">
            
            {/* 输入页 */}
            {!result && !loading && (
              <div className="space-y-10 animate-fadeIn">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={displayedPlaceholder}
                  className="w-full h-56 bg-black/40 backdrop-blur-3xl border border-cyan-400/40 rounded-[2.5rem] p-12 text-white text-center text-xl md:text-2xl focus:outline-none transition-all resize-none shadow-2xl"
                />
                <button
                  onClick={handleCalibrate}
                  disabled={!input.trim()}
                  className="w-full py-6 rounded-2xl font-bold text-lg tracking-[0.5em] bg-gradient-to-r from-cyan-500/80 to-purple-600/80 text-white hover:scale-[1.01] transition-all"
                >
                  收回力量
                </button>
                {error && <p className="text-red-400 text-center text-sm">{error}</p>}
              </div>
            )}

            {/* 加载页 (你想要的那个转圈圈图标) */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 space-y-10">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 border border-cyan-500/10 rounded-full scale-150 animate-pulse"></div>
                  <div className="absolute inset-0 border-[3px] border-cyan-500/20 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.2)]"></div>
                  <div className="absolute inset-0 border-[3px] border-t-white rounded-full animate-spin shadow-cyan-400"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-cyan-400">
                     {/* 中心原子图标 */}
                     <svg className="w-12 h-12 animate-spin-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2"/>
                        <ellipse cx="12" cy="12" rx="10" ry="4" strokeDasharray="2 4"/>
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" strokeDasharray="2 4"/>
                        <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" strokeDasharray="2 4"/>
                     </svg>
                  </div>
                </div>
                <div className="text-center space-y-2">
                   <p className="tracking-[0.5em] text-cyan-200 uppercase animate-pulse">解析全息图景...</p>
                   <p className="text-[10px] text-white/40 uppercase tracking-widest italic">正在剥离频率投影，请保持呼吸</p>
                </div>
              </div>
            )}

            {/* 结果页 (找回被丢的内容) */}
            {result && (
              <div className="animate-fadeIn space-y-10 py-4 overflow-y-auto max-h-[75vh] no-scrollbar">
                {/* 1. 频率扫描 */}
                <section className="border-l-2 border-cyan-400/80 pl-8">
                  <h3 className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase">【频率扫描】</h3>
                  <p className="text-2xl font-light mt-2 leading-tight">{result.frequencyScan}</p>
                </section>

                {/* 2. 幻象剥离 */}
                <section className="border-l-2 border-purple-400/80 pl-8">
                  <h3 className="text-purple-400 text-[10px] font-bold tracking-[0.3em] uppercase">【幻象剥离】</h3>
                  <p className="text-lg italic opacity-90 mt-2 leading-relaxed">{result.illusionStripping}</p>
                </section>

                {/* 3. 五部曲 */}
                <section className="space-y-4">
                  <h3 className="text-yellow-400 text-[10px] font-bold tracking-[0.3em] uppercase ml-8">【收回力量五部曲】</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {result.fiveSteps.map((step, i) => (
                      <div key={i} className="bg-white/5 p-6 rounded-2xl border border-white/5 flex items-start gap-4 hover:bg-white/10 transition-all">
                        <span className="text-cyan-400 font-bold opacity-60">{i+1}</span>
                        <p className="font-light leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. 行动锚点 */}
                <section className="p-8 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-[2rem] border border-green-500/20">
                    <h3 className="text-green-400 text-[10px] font-bold tracking-[0.3em] uppercase mb-3">【行动锚点】</h3>
                    <p className="text-xl font-light italic leading-relaxed text-emerald-100">{result.actionAnchor}</p>
                </section>

                {/* 5. 补给站 (带查看更多) */}
                <section className="pt-10 border-t border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase">校准补给</h3>
                    <button onClick={() => setIsDepotOpen(true)} className="text-cyan-400/50 hover:text-cyan-400 text-[10px] tracking-widest uppercase transition-all">
                      查看更多库 →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 书籍 */}
                    <div className="bg-black/30 p-6 rounded-3xl border border-white/10">
                      <h4 className="text-pink-300 text-[9px] uppercase tracking-widest mb-2 font-bold">意识指引</h4>
                      <p className="text-lg">{matchedBook?.title}</p>
                      <p className="text-[10px] opacity-40 italic">{matchedBook?.author}</p>
                    </div>
                    {/* 音乐 */}
                    <div 
                      onClick={() => matchedMusic && handleMusicToggle(matchedMusic)}
                      className="bg-black/30 p-6 rounded-3xl border border-white/10 cursor-pointer hover:bg-white/5 transition-all flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="text-cyan-300 text-[9px] uppercase tracking-widest mb-2 font-bold">频率共鸣</h4>
                        <p className="text-lg">{matchedMusic?.title}</p>
                        <p className="text-[10px] opacity-40 uppercase">{matchedMusic?.type}</p>
                      </div>
                      <div className="text-cyan-400 opacity-40 group-hover:opacity-100">
                        {depotPlayingTitle === matchedMusic?.title ? "⏸" : "▶"}
                      </div>
                    </div>
                  </div>
                </section>

                <button onClick={() => setResult(null)} className="w-full text-center text-white/20 text-[10px] tracking-[1em] py-10 uppercase hover:text-white transition-all">
                  — 返回虚空 —
                </button>
              </div>
            )}
          </div>

          {/* 历史档案 */}
          {history.length > 0 && !result && (
            <div className="mt-12 flex justify-center gap-4 overflow-x-auto pb-4 no-scrollbar">
              {history.map(item => (
                <button key={item.id} onClick={() => setResult(item.result)} className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-[10px] opacity-40 hover:opacity-100 transition-all whitespace-nowrap">
                  ARCHIVE #{item.id.slice(-4)}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 补给库弹出层 */}
      {isDepotOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsDepotOpen(false)} />
          <div className="relative w-full max-w-4xl max-h-[80vh] bg-white/[0.03] border border-white/10 rounded-[3rem] p-12 overflow-y-auto no-scrollbar shadow-2xl">
            <h2 className="text-2xl font-extralight tracking-[0.3em] uppercase mb-12">量子资源库</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <section className="space-y-6">
                <h3 className="text-pink-300 text-[10px] font-bold tracking-[0.5em] uppercase border-b border-pink-500/20 pb-2">意识典籍</h3>
                {BOOKS_DATA.map((book, i) => (
                  <div key={i} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                    <p className="text-lg">{book.title}</p>
                    <p className="text-[10px] text-white/40 mb-2 uppercase">{book.author}</p>
                    <p className="text-xs text-white/60 italic">{book.desc}</p>
                  </div>
                ))}
              </section>
              <section className="space-y-6">
                <h3 className="text-cyan-300 text-[10px] font-bold tracking-[0.5em] uppercase border-b border-cyan-500/20 pb-2">共振音频</h3>
                {MUSIC_DATA.map((music, i) => (
                  <div key={i} onClick={() => handleMusicToggle(music)} className="p-4 bg-white/5 rounded-2xl hover:bg-cyan-500/20 transition-all cursor-pointer flex justify-between items-center">
                    <div>
                        <p className="text-lg">{music.title}</p>
                        <p className="text-[10px] text-white/40 uppercase">{music.type}</p>
                    </div>
                    {depotPlayingTitle === music.title && <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />}
                  </div>
                ))}
              </section>
            </div>
          </div>
        </div>
      )}

      <footer className="py-10 text-[10px] text-white/10 tracking-[1em] text-center uppercase">
        © Mirror Logic • Quantum Consciousness
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 15s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
};

export default App;
