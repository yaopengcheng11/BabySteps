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
# 育儿咨询背景
宝宝姓名：${profile.name}
性别：${profile.gender === 'boy' ? '男宝宝' : '女宝宝'}
当前月龄：${ageContext}
报告类型：${typeName} (${rangeLabel})

# 最近记录数据
${logSummary || "（该周期内暂无详细记录，请根据月龄提供一般性指导）"}

# 任务指令
请扮演一位拥有 20 年经验的“资深儿科专家兼心理咨询师”，基于以上数据和月龄，撰写一份极具深度、科学且贴心的分析报告。

要求如下：
1. **深度洞察**：不要只复述数据，要分析规律。例如：喂养量是否达标？睡眠周期是否规律？排泄情况是否反映肠胃健康？
2. **月龄关联**：必须结合宝宝当前 ${ageInMonths} 个月的发育重点（如：抬头、翻身、追视、辅食添加、睡整觉训练等）给出专业评价。
3. **结构化呈现**：
   - 📊 **【深度成长分析】**：分析记录中的趋势与潜在问题。
   - 🌟 **【本月龄发育重点】**：提醒父母这个阶段宝宝该学习的新技能或注意的健康指标。
   - 🛠️ **【专家级护理建议】**：给出 3-4 条极具实操性的建议（包括喂养调整、睡眠环境、感官训练等）。
   - 💖 **【致亲爱的父母】**：一段深度共情的文字，缓解家长的育儿焦虑。
4. **语气与排版**：语气专业、温暖、权威。总字数建议在 400 字左右，使用 Markdown 格式，多用加粗和分段。
`;

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