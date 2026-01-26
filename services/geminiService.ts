import OpenAI from "openai";
import { BabyLog, BabyProfile, LogType } from "../types";

/**
 * 根据所选时间范围生成 AI 育儿简报
 * 已切换为 DeepSeek API (deepseek-chat)
 */
export const getAIReport = async (
  profile: BabyProfile, 
  logs: BabyLog[], 
  reportType: 'day' | 'week' | 'month' | 'custom',
  rangeLabel: string
) => {
  // 注意：在 Vite 项目中，必须使用 import.meta.env 且变量名需以 VITE_ 开头
  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    console.error("缺少 API Key");
    return "未检测到 VITE_DEEPSEEK_API_KEY，请在 .env 文件或 Vercel 环境变量中配置。";
  }

  // 初始化 OpenAI 客户端 (用于连接 DeepSeek)
  const client = new OpenAI({
    baseURL: 'https://api.deepseek.com',
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // 允许在浏览器端直接调用
  });

  // 格式化记录汇总 (逻辑保持不变)
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

  const systemInstruction = "你是一位顶级育儿专家，擅长分析育儿数据并给出精炼的日报、周报和月报。你的语气温和且极其专业。务必保持回答精简，不要啰嗦。";

  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500, // 限制回复长度，防止废话
    });

    return response.choices[0]?.message?.content || "AI 暂时无法生成简报。";

  } catch (error: any) {
    console.error("DeepSeek API Error Detail:", error);
    
    // 错误处理优化
    if (error.message?.includes('401')) {
      return "API Key 无效或过期，请检查配置。";
    }
    if (error.message?.includes('402')) {
      return "API 余额不足，请充值。";
    }
    if (error.message?.includes('Network Error') || error.message?.includes('fetch')) {
      return "网络连接失败，请检查网络通畅。";
    }
    
    return `获取简报失败：${error.message || "未知错误"}`;
  }
};
//1.0