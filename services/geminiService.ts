import { BabyLog, BabyProfile, LogType } from "../types";

/**
 * 根据所选时间范围生成 AI 育儿简报
 * DeepSeek 版本：使用原生 fetch 调用，无需依赖 openai SDK
 */
export const getAIReport = async (
  profile: BabyProfile,
  logs: BabyLog[],
  reportType: 'day' | 'week' | 'month' | 'custom',
  rangeLabel: string
) => {
  // --- API Key 配置 ---
  // 增加 import.meta.env 支持 (Vite 标准方式)，同时保留原有 process.env 兼容性
  const apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPSEEK_API_KEY) ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.VITE_DEEPSEEK_API_KEY ||
    process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error("❌ 未找到 DeepSeek API Key。请在 .env 文件中配置 VITE_DEEPSEEK_API_KEY (Vite) 或其他对应环境变量。");
    return "系统未配置 AI 密钥，请联系管理员或检查 .env 配置文件。";
  }

  // 使用报告基准日期计算宝宝当时对应的月龄，而不是使用当前的实时时间
  const birth = new Date(profile.birthDate);
  const reportTime = new Date(anchorDate);
  // 如果是全天模式，确保计算的是该天结束时的月龄或者该天中值
  // 这里我们使用 reportTime 的原始值，因为它通常代表用户在界面上选中的那个时刻或那天
  const diffTime = reportTime.getTime() - birth.getTime();
  const ageInDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const ageInMonths = Math.floor(ageInDays / 30);
  const ageRemainderDays = ageInDays % 30;
  const ageContext = `${ageInMonths}个月${ageRemainderDays}天 (出生第${ageInDays}天)`;

  // 格式化记录汇总
  const logSummary = logs.map(log => {
    const date = new Date(log.timestamp).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
    const time = new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const dateTime = reportType === 'day' ? time : `${date} ${time}`;

    switch (log.type) {
      case LogType.FEEDING: return `- [${dateTime}] 喂养: ${log.method} ${log.amount ? log.amount + 'ml' : log.duration + 'min'}`;
      case LogType.GROWTH: return `- [${date}] 成长: ${log.eventName} (类别: ${log.category}) ${log.weight ? '体重:' + log.weight + 'kg' : ''}`;
      case LogType.DIAPER: return `- [${dateTime}] 排泄: ${log.status}`;
      case LogType.SUPPLEMENT: return `- [${dateTime}] 补剂: ${log.name} ${log.dosage || ''}`;
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
报告日期：${rangeLabel}
宝宝在该日期的月龄：${ageContext}
报告类型：${typeName}

# 该时段记录数据汇总
${logSummary || "（该周期内暂无详细记录，请根据月龄提供一般性指导）"}

# 任务指令
请扮演一位拥有 20 年经验的“资深儿科专家”，基于以上数据撰写一份科学且贴心的分析报告。

**特别注意：**
- **计算基准**：请务必基于上面提供的“报告日期”和“宝宝在该日期的月龄”进行分析。即使当前真实世界的时间更晚，你的所有建议和分析也必须符合宝宝在那一刻的发育状态。
- **严禁提及睡眠**：用户未记录睡眠信息，严禁包含任何关于睡眠的建议、分析或指导。

**具体撰写要求：**
1. **喂养与肠胃分析**：根据喂养量、频率及排泄状态，分析宝宝当时的吸收和消化情况。
2. **发育指导**：结合宝宝在报告日期所处的 ${ageInMonths} 个月发育阶段，给出当时的运动、认知等发育建议。
3. **结构化内容**：
   - 📊 **【深度发育分析】**：分析记录数据背后的健康状态。
   - 🌟 **【当月龄核心技能】**：此时期宝宝应关注的发育目标。
   - 🛠 **【专家护理策略】**：给出 3 条符合当时月龄的实操建议。
   - 💖 **【致家长的话】**：温暖的鼓励。
4. **格式**：约 400 字，Markdown 格式。语气专业且温暖。
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "你是一位精通儿科学、儿童心理学和婴幼儿营养学的顶级专家。你的回答必须严格基于 WHO 规范和最新科学共识。绝对不要提到“睡眠”一词。必须严格遵守报告日期的月龄设定，不要提及未来的发育情况。",
        temperature: 0.7,
        topP: 0.9,
      },
    });

    return response.text || "AI 专家正在分析数据，请稍后再试。";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return "由于连接专家服务器超时，请重新尝试生成。";
  }
};
