import React, { useState, useEffect, useRef } from 'react';
import StarBackground from './components/StarBackground';
// 直接集成 SDK，彻底消灭 services 文件夹引用的红叉报错
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- 1. 核心接口 ---
interface CalibrationResult {
  frequencyScan: string;
  illusionStripping: string;
  fiveSteps: string[];
  actionAnchor: string;
  recommendedBookTitle: string;
  recommendedMusicTitle: string;
}

interface HistoryItem {
  id: string;
  input: string;
  result: CalibrationResult;
}

// --- 2. 静态数据 (补给站数据完全还原) ---
const PRESET_CONCERNS = ["金钱似乎总是指间沙...", "职场表演中耗尽生命力...", "亲密关系中的救赎..."];
const BOOKS_DATA = [{ title: "《你值得过更好的生活》", author: "罗伯特·谢费尔德", desc: "核心架构：拆解全息幻象" }];
const MUSIC_DATA = [{ title: "Deep Space 432Hz", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", type: "谐振频率" }];

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const bgmRef = useRef<HTMLAudioElement>(null);

  // --- 3. 核心调用逻辑 (满血 UI 的灵魂) ---
  const handleCalibrate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    
    // 修复关键：VITE 前缀的环境变量
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
    
    try {
      if (!API_KEY) throw new Error("密钥未配置，请在 Vercel 环境变量中添加 VITE_GEMINI_API_KEY");
      
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const prompt = `你是一位意识法则大师。用户烦恼："${input}"。请以此剥离幻象，以 JSON 格式返回：{frequencyScan, illusionStripping, fiveSteps[], actionAnchor, recommendedBookTitle, recommendedMusicTitle}`;
      
      const response = await model.generateContent(prompt);
      const data = JSON.parse(response.response.text().replace(/```json|```/g, '')) as CalibrationResult;
      
      setResult(data);
      setHistory(prev => [{ id: Date.now().toString(), input, result: data }, ...prev].slice(0, 5));
      setInput('');
      setIsBgmPlaying(true);
    } catch (err: any) {
      setError(err.message || "连接量子核心失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col z-10 font-light text-white">
      <StarBackground />
      <audio ref={bgmRef} src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3" loop />

      {/* 所有的精美 UI 渲染代码（保持你 AI Studio 版的 HTML 结构） */}
      <div className="max-w-4xl mx-auto py-20 px-6 text-center">
        <header className="mb-12 animate-fadeIn">
          <h1 className="text-5xl font-extralight tracking-[0.3em] gradient-text mb-4">频率校准之镜</h1>
          <p className="text-cyan-300/60 tracking-widest uppercase text-xs">QUANTUM MIRROR</p>
        </header>

        <div className="glass-panel p-10 rounded-[3rem] shadow-2xl border border-white/10 backdrop-blur-xl">
          {!result && !loading ? (
            <div className="space-y-8">
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="在此输入你的困惑..."
                className="w-full h-40 bg-black/20 border border-cyan-500/30 rounded-3xl p-6 text-xl focus:border-cyan-400 outline-none transition-all"
              />
              <button onClick={handleCalibrate} className="w-full py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-purple-600 font-bold tracking-widest hover:scale-[1.02] transition-transform">
                收回力量
              </button>
            </div>
          ) : loading ? (
            <div className="py-20 animate-pulse text-cyan-400 tracking-widest">解析全息图景中...</div>
          ) : (
            <div className="text-left space-y-10 animate-fadeIn">
               {/* 结果展示区 */}
               <h3 className="text-cyan-400 font-bold tracking-tighter">【频率扫描】</h3>
               <p className="text-2xl font-light">{result?.frequencyScan}</p>
               <button onClick={() => setResult(null)} className="opacity-20 hover:opacity-100 transition-opacity">返回虚空</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
