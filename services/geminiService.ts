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
  // 确保计算的是报告日期当时的月龄，以提供准确的历史建议
  const birth = new Date(profile.birthDate);
  const reportTime = new Date(anchorDate);
  const diffTime = reportTime.getTime() - birth.getTime();
  const ageInDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const ageInMonths = Math.floor(ageInDays / 30);
  const ageRemainderDays = ageInDays % 30;
  const ageContext = `${ageInMonths}个月${ageRemainderDays}天 (出生第${ageInDays}天)`;

  // 2. 格式化记录汇总
  // 注意：已根据要求移除睡眠(SLEEP)记录，新增补剂(SUPPLEMENT)记录
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

  // 3. 构建 Prompt
  const userPrompt = `
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

  // 4. 系统指令
  const systemInstruction = "你是一位精通儿科学、儿童心理学和婴幼儿营养学的顶级专家。你的回答必须严格基于 WHO 规范和最新科学共识。绝对不要提到“睡眠”一词。必须严格遵守报告日期的月龄设定，不要提及未来的发育情况。";

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
        temperature: 1.3, // 保持较高的温度以获得更自然的文本
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