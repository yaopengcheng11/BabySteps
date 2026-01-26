
import { GoogleGenAI } from "@google/genai";
import { BabyLog, BabyProfile, LogType } from "../types";

/**
 * 根据所选时间范围生成 AI 育儿简报
 * 采用最新的 ai.models.generateContent 调用方式
 */
export const getAIReport = async (
  profile: BabyProfile, 
  logs: BabyLog[], 
  reportType: 'day' | 'week' | 'month' | 'custom',
  rangeLabel: string
) => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return "未检测到 API_KEY，请在部署环境中配置环境变量。";
  }

  // 每次调用创建新实例，确保使用最新的环境配置
  const ai = new GoogleGenAI({ apiKey });

  // 格式化记录汇总
  const logSummary = logs.map(log => {
    const date = new Date(log.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    const time = new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const dateTime = reportType === 'day' ? time : `${date} ${time}`;
    
    switch (log.type) {
      case LogType.FEEDING: return `- [${dateTime}] 喂养: ${log.method} ${log.amount ? log.amount + 'ml' : log.duration + 'min'}`;
      case LogType.SLEEP: return `- [${dateTime}] 睡眠: ${log.duration}min`;
      case LogType.GROWTH: return `- [${date}] 成长: ${log.eventName} (${log.category})`;
      case LogType.DIAPER: return `- [${dateTime}] 排泄: ${log.status}`;
      default: return "";
    }
  }).filter(Boolean).join('\n');

  const typeName = {
    day: '日报',
    week: '周报',
    month: '月报',
    custom: '区间简报'
  }[reportType];

  const prompt = `
宝宝姓名：${profile.name}
当前报告类型：${typeName} (${rangeLabel})
在此期间的记录汇总：
${logSummary || "该时间段内暂无记录"}

请给出简短、直白、极具洞察力的建议。要求：
1. 严禁长篇大论，使用 Emoji 开头。
2. 模块一：【${typeName}总结】用一句话总结此阶段。
3. 模块二：【关键建议】提供 2-3 条极简动作指引（针对该周期特点，每条不超 15 字）。
4. 模块三：【温情鼓励】给予家长一份温暖的心理支持。
5. 总字数控制在 150 字以内，排版直观。
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: "你是一位顶级育儿专家，擅长分析育儿数据并给出精炼的日报、周报和月报。你的语气温和且极其专业。务必保持回答精简，不要啰嗦。",
        temperature: 0.7,
        topP: 0.95,
      },
    });

    return response.text || "AI 暂时无法生成简报。";
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    // 针对 RPC/XHR 错误的友好提示
    if (error.message?.includes('xhr') || error.message?.includes('Proxy')) {
      return "连接 AI 服务时出现网络波动，请确保网络通畅或稍后重试。";
    }
    return `获取简报失败：${error.message || "未知错误"}`;
  }
};
