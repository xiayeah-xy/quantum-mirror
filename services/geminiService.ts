// 1. 修正导入库（确保使用的是正确的 SDK 命名）
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import { CalibrationResult } from "../types";

// ... (BOOKS_LIST, MUSIC_LIST, SYSTEM_INSTRUCTION 部分保持不变) ...

export const calibrateFrequency = async (userInput: string): Promise<CalibrationResult> => {
  // 2. 关键修正：Vite 环境下读取 Vercel 变量必须使用 import.meta.env
  // 并且变量名必须与你在 Vercel Settings 里填的一致
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("量子核心密钥缺失。请确保已在 Vercel 配置 VITE_GEMINI_API_KEY。");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // 3. 修正模型名称和配置结构（gemini-1.5-flash 是目前最稳的版本）
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: SYSTEM_INSTRUCTION,
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
    throw new Error("量子干扰过强，无法完成校准。请检查 API Key 是否有效。");
  }
};
