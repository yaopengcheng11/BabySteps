import { BabyLog, BabyProfile, LogType } from "../types";

/**
 * 根据所选时间范围生成 AI 育儿简报
 * DeepSeek 版本：使用原生 fetch 调用，无需依赖 openai SDK
 * @param anchorDate 报告的基准日期（用于计算相对于该日期的宝宝月龄）
 */
export const getAIReport = async (
  profile: BabyProfile,
  logs: BabyLog[],
  reportType: 'day' | 'week' | 'month' | 'custom',
  rangeLabel: string,
  anchorDate: Date
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

  // 1. 计算宝宝月龄（基于 anchorDate 而非当前时间）
  const birth = new Date(profile.birthDate);
  const reportTime = new Date(anchorDate);

  const diffTime = reportTime.getTime() - birth.getTime();
  const ageInDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const ageInMonths = Math.floor(ageInDays / 30);
  const ageRemainderDays = ageInDays % 30;
  const ageContext = `${ageInMonths}个月${ageRemainderDays}天 (出生第${ageInDays}天)`;

  // 2. 格式化记录汇总
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
    custom: '跨度阶段深度分析'
  }[reportType];

  // 3. 构建 Prompt (严格对应提供的最新版逻辑)
  const userPrompt = `
# 育儿咨询背景
宝宝姓名：${profile.name}
性别：${profile.gender === 'boy' ? '男宝宝' : '女宝宝'}
分析区间：${rangeLabel}
宝宝在区间截止时的月龄：${ageContext}
报告类型：${typeName}

# 数据记录
${logSummary || "（该周期内暂无详细记录，请根据月龄提供一般性指导）"}

# 专家任务指令
你是一位拥有 20 年经验的“资深儿科专家”。请基于上述特定时间段（${rangeLabel}）的数据撰写分析报告。

**特别红线：**
1. **时空同步**：报告中提到的所有发育分析、护理建议，必须严格基于“区间截止时的月龄（${ageContext}）”。严禁以现实中的今天作为基准，严禁预测未来的发育。
2. **区间思维**：如果报告类型是“周/月/跨度分析”，请分析这段时间内数据的“趋势”或“变化”，而不仅仅是单日状态。
3. **严禁提及睡眠**：绝对不要出现“睡眠”一词。

**报告结构：**
- 📊 **【核心阶段分析】**：分析记录区间内宝宝的成长趋势（如奶量变化、排泄规律）。
- 🌟 **【月龄发育里程碑】**：指出宝宝在 ${ageInMonths} 个月大时应具备的核心能力。
- 🛠 **【针对性专家策略】**：给出 3 条符合当前月龄的科学实操建议。
- 💖 **【温暖鼓励】**：简短有力的家长寄语。

**要求：** 约 400 字，Markdown 格式。
`;

  // 4. 系统指令
  const systemInstruction = "你是一位顶级儿科医学专家。你的分析必须严格符合用户提供的时间语境。即使现在是2月，如果用户要求分析1月的报告，你也必须以1月宝宝的月龄为唯一参考。严禁提及睡眠建议。";

  try {
    // 使用 fetch 直接调用 DeepSeek API
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat", // DeepSeek-V3
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        temperature: 1.0, // 适度降低温度以确保严格遵守“红线”指令，同时保留自然语言能力
        max_tokens: 2000,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("DeepSeek API Error:", response.status, errorData);

      if (response.status === 401) return "API Key 无效，请检查环境变量配置。";
      if (response.status === 402) return "API 余额不足，请检查 DeepSeek 账户。";
      if (response.status === 503) return "DeepSeek 服务器繁忙，请稍后重试。";
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "AI 专家正在分析数据，请稍后再试。";

  } catch (error: any) {
    console.error("DeepSeek Request Failed:", error);
    return "由于连接专家服务器超时或出错，请检查网络并重试。";
  }
};