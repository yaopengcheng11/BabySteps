
import { GoogleGenAI } from "@google/genai";
import { BabyLog, BabyProfile, LogType } from "../types";

/**
 * 根据所选时间范围生成 AI 育儿简报
 * 升级版：提供更有深度、月龄相关的专业洞察
 */
export const getAIReport = async (
  profile: BabyProfile, 
  logs: BabyLog[], 
  reportType: 'day' | 'week' | 'month' | 'custom',
  rangeLabel: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // 计算宝宝月龄，为 AI 提供发育阶段背景
  const birth = new Date(profile.birthDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - birth.getTime());
  const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(ageInDays / 30);
  const ageRemainderDays = ageInDays % 30;
  const ageContext = `${ageInMonths}个月${ageRemainderDays}天 (共${ageInDays}天)`;

  // 格式化记录汇总（增加数据密度）
  const logSummary = logs.map(log => {
    const date = new Date(log.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    const time = new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const dateTime = reportType === 'day' ? time : `${date} ${time}`;
    
    switch (log.type) {
      case LogType.FEEDING: return `- [${dateTime}] 喂养: ${log.method} ${log.amount ? log.amount + 'ml' : log.duration + 'min'}`;
      case LogType.SLEEP: return `- [${dateTime}] 睡眠: 持续 ${log.duration}分钟`;
      case LogType.GROWTH: return `- [${date}] 成长: ${log.eventName} (类别: ${log.category}) ${log.weight ? '体重:' + log.weight + 'kg' : ''}`;
      case LogType.DIAPER: return `- [${dateTime}] 排泄: ${log.status}`;
      default: return "";
    }
  }).filter(Boolean).join('\n');

  const typeName = {
    day: '每日成长看板',
    week: '周度发育简报',
    month: '月度成长总结',
    custom: '阶段深度分析'
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
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // 升级为 Pro 模型以获取更深度的逻辑推理
      contents: prompt,
      config: {
        systemInstruction: "你是一位精通儿科学、儿童心理学和婴幼儿营养学的顶级专家。你的回答应该基于世界卫生组织（WHO）和最新的育儿科学研究。严禁提供迷信或未经证实的偏方。",
        temperature: 0.75,
        topP: 0.9,
      },
    });

    return response.text || "AI 专家正在查阅文献，请稍后再试。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "由于连接专家服务器超时，请检查您的网络环境并重新尝试生成。";
  }
};
