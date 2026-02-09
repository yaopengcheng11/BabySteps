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

  // 1. 计算宝宝月龄，为 AI 提供发育阶段背景
  const birth = new Date(profile.birthDate);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - birth.getTime());
  const ageInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const ageInMonths = Math.floor(ageInDays / 30);
  const ageRemainderDays = ageInDays % 30;
  const ageContext = `${ageInMonths}个月${ageRemainderDays}天 (共${ageInDays}天)`;

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
    custom: '阶段深度分析'
  }[reportType];

  // 3. 构建 Prompt
  const userPrompt = `
# 育儿咨询背景
宝宝姓名：${profile.name}
性别：${profile.gender === 'boy' ? '男宝宝' : '女宝宝'}
当前月龄：${ageContext}
报告类型：${typeName} (${rangeLabel})

# 最近记录数据汇总
${logSummary || "（该周期内暂无详细记录，请根据月龄提供一般性指导）"}

# 任务指令
请扮演一位拥有 20 年经验的“资深儿科专家”，基于以上数据撰写一份科学且贴心的分析报告。

**核心红线限制：**
- **严禁提及任何睡眠相关的建议、分析或指导。** 用户未记录睡眠信息，不需要此类内容。
- **重点聚焦：** 喂养规律、肠胃健康（排泄反映）、营养补充以及当前月龄的发育重点。

**具体撰写要求：**
1. **喂养与肠胃分析**：根据喂养量、频率及排泄状态，分析宝宝的吸收和消化情况。
2. **月龄发育锚点**：结合宝宝当前 ${ageInMonths} 个月的关键发育期（如大动作、精细动作、语言启蒙等）给出指导。
3. **结构化内容**：
   - 📊 **【深度发育分析】**：分析喂养与排泄数据的内在关联。
   - 🌟 **【本月龄核心技能】**：此时期宝宝应关注的发育目标。
   - 🛠 **【专家护理策略】**：给出 3 条极具实操性的喂养、锻炼或健康护理建议。
   - 💖 **【致家长的话】**：鼓励性文字，缓解育儿压力。
4. **格式**：字数约 400 字，Markdown 格式，语气专业且温暖。
`;

  // 4. 系统指令
  const systemInstruction = "你是一位精通儿科学、儿童心理学和婴幼儿营养学的顶级专家。你的回答应该基于世界卫生组织（WHO）和最新的育儿科学研究。严禁提供迷信或未经证实的偏方。";

  try {
    // 使用 fetch 直接调用 DeepSeek API，避免依赖 openai 库
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
        temperature: 1.3,
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
    return data.choices?.[0]?.message?.content || "AI 专家正在思考中，请稍后再试。";

  } catch (error: any) {
    console.error("DeepSeek Request Failed:", error);
    return "由于连接专家服务器超时或出错，请检查网络并重试。";
  }
};