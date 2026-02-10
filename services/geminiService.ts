import { GoogleGenerativeAI } from "@google/generative-ai";
import { CalibrationResult } from "../types";

// 1. 定义推荐列表
const BOOKS_LIST = `
1. 《你值得过更好的生活》 - 罗伯特·谢费尔德 (核心架构：拆解全息幻象)
2. 《金钱的灵魂》 - 林恩·特威斯特 (重新定义丰盛与金钱的关系)
3. 《当下的力量》 - 埃克哈特·托利 (进入意识现场的必经之路)
4. 《瓦解控制》 - 克拉克·斯特兰德 (放弃小我控制，回归源头)
5. 《信念的力量》 - 布鲁斯·利普顿 (量子生物学视角下的意识改写)
6. 《零极限》 - 修·蓝博士 (清理潜意识记忆的实操指南)
7. 《终极自由之路》 - 莱斯特·利文森 (关于释放与收回力量的终极教导)
8. 《显化的真义》 - 尼维尔·高达德 (意识即实相的古典量子观)
`;

const MUSIC_LIST = `
1. Deep Space 432Hz - Abundance
2. Quantum Field Meditation
3. Solfeggio 528Hz & 432Hz Mix
4. Alpha Wave Focus
5. Healing Resonance 432Hz
6. Higher Self Connection
7. Pineal Gland Activation
8. Universal Harmony
9. Eternal Silence
10. Soul Blueprint Alignment
`;

// 2. 设定 AI 指令系统
const SYSTEM_INSTRUCTION = `你是一位精通意识法则、频率校准与现实创造的大师。
你的任务是帮助用户看穿他们生活中的“烦恼”，将其识别为内在频率的“全息投影”。
请以充满智慧、空灵且赋能的口吻回答。

书籍列表参考：
${BOOKS_LIST}

音乐列表参考：
${MUSIC_LIST}

你必须从上述列表中各选择最契合的一项，并严格按照以下 JSON 格式返回结果：
{
  "frequencyScan": "简短描述识别到的能量模式",
  "illusionStripping": "剖析为什么这个烦恼只是一个幻象",
  "fiveSteps": ["动作1", "动作2", "动作3", "动作4", "动作5"],
  "actionAnchor": "一个简单的物理行动锚点",
  "recommendedBookTitle": "从书籍列表中选择最匹配的完整书名",
  "recommendedMusicTitle": "从音乐列表中选择最匹配的完整曲名"
}`;

// 3. 执行频率校准逻辑
export const calibrateFrequency = async (userInput: string): Promise<CalibrationResult> => {
  // 【关键修复】：使用 Vite 专用的 import.meta.env 读取 Vercel 变量
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!API_KEY) {
    throw new Error("量子核心密钥缺失。请在 Vercel 中设置 VITE_GEMINI_API_KEY。");
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  
  try {
    // 使用目前最稳定快速的模型
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION 
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `用户烦恼："${userInput}"。请进行深度频率校准。` }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const resultText = result.response.text();
    
    if (!resultText) {
      throw new Error("量子镜面未能形成有效反射，请重试。");
    }

    return JSON.parse(resultText) as CalibrationResult;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    // 捕获 API Key 无效的情况
    if (error.message?.includes("API_KEY") || error.message?.includes("key")) {
      throw new Error("量子密钥无效，请检查 API Key 配置。");
    }
    throw new Error("量子干扰过强，无法完成校准。请检查网络。");
  }
};
