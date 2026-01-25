import OpenAI from "openai";
import { BabyLog, BabyProfile, LogType } from "../types";

/**
 * 初始化 OpenAI 客户端 (配置为 DeepSeek)
 * 注意: 在前端直接使用 API Key 需要 dangerouslyAllowBrowser: true
 */
const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY, // 这里必须用 import.meta.env
  dangerouslyAllowBrowser: true
});

/**
 * 获取每日育儿建议
 */
export const getDailyAdvice = async (profile: BabyProfile, logs: BabyLog[]) => {
  // 1. 检查 API Key 是否存在
  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    console.error("缺少 API Key");
    return "配置错误：未检测到 VITE_DEEPSEEK_API_KEY，请检查 .env 文件或 Vercel 环境变量设置。";
  }

  // 2. 整理最近的记录
  const recentLogs = logs.slice(-25);
  const logSummary = recentLogs.map(log => {
    const time = new Date(log.timestamp).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const date = new Date(log.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    
    switch (log.type) {
      case LogType.FEEDING: 
        const detail = log.amount ? `${log.amount}ml` : `${log.duration}分钟`;
        return `[${date} ${time}] 喂养: ${log.method} ${detail}`;
      case LogType.SLEEP: return `[${date} ${time}] 睡眠: 持续 ${log.duration}分钟`;
      case LogType.DIAPER: return `[${date} ${time}] 换尿布: ${log.status}`;
      case LogType.VACCINE: return `[${date} ${time}] 接种疫苗: ${log.vaccineName}`;
      case LogType.GROWTH: 
        const body = (log.weight ? `体重${log.weight}kg ` : '') + (log.height ? `身高${log.height}cm` : '');
        return `[${date} ${time}] 成长事件: ${log.eventName} (${log.category}) ${body}`;
      default: return "";
    }
  }).filter(Boolean).join('\n');

  // 3. 准备提示词 (Prompt)
  const systemInstruction = "你是一位温柔、专业且富有经验的育儿专家。你的任务是分析家长的记录（特别是喂养频率和成长里程碑），给出简短、专业、鼓励性的建议。请使用温暖的语气。";
  
  const userPrompt = `
以下是宝宝的基本信息和最近记录：
- 宝宝姓名：${profile.name}
- 性别：${profile.gender === 'boy' ? '男孩' : '女孩'}
- 生日：${profile.birthDate}
- 最近记录摘要：
${logSummary || "暂无记录"}

请根据以上信息：
1. 给出今日总结，如果记录中有“成长事件”或里程碑，请务必给予高度肯定和赞美。
2. 提供针对性的育儿建议。例如，如果宝宝开始翻身或长牙，请给出相应的护理指导。
3. 语言要通俗易懂，字数控制在 250 字左右。
`;

  // 4. 调用 DeepSeek API
  try {
    const completion = await client.chat.completions.create({
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 600,
    });

    return completion.choices[0].message.content || "DeepSeek 暂时没有返回建议，请重试。";

  } catch (error) {
    console.error("DeepSeek API Error:", error);
    // 这里做一个简单的类型保护，防止 error 是 unknown 类型报错
    if (error instanceof Error) {
       return `获取建议失败：${error.message}`;
    }
    return "获取建议失败，请稍后重试。";
  }
};