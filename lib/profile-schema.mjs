export const COMMUNICATION_STYLE_OPTIONS = [
  "直接给结论",
  "结构化展开",
  "叙事式",
  "数据驱动",
];

export const REPLY_LENGTH_OPTIONS = [
  "极简（3-5行）",
  "精炼（5-12行）",
  "适中（12-20行）",
  "详尽（按需展开）",
];

export const FORMAT_OPTIONS = [
  "要点列表",
  "精炼段落",
  "对比表格",
  "选项卡（A/B/C）",
];

export const ANNOYANCE_OPTIONS = [
  "正确但无用的废话",
  "没有行动建议的分析",
  "编造数据或进度",
  "过度热情/谄媚",
  "把噪音当情报",
  "冗长的背景铺垫",
  "模棱两可不敢给建议",
  "过度使用术语",
];

export const DECISION_FRAMEWORK_OPTIONS = [
  "MECE分析",
  "5-Why",
  "OKR",
  "SWOT",
  "第一性原理",
  "10x思维",
  "逆向工作法",
  "OODA循环",
  "博弈论思维",
  "贝叶斯更新",
  "Jobs-to-be-Done",
  "飞轮效应",
];

export const KNOWLEDGE_INTEREST_OPTIONS = [
  "AI/大模型",
  "商业战略",
  "组织管理",
  "产品设计",
  "技术架构",
  "宏观经济",
  "投资理财",
  "历史哲学",
  "心理学",
  "创新方法论",
  "行业研究",
  "领导力",
];

export const PUSH_MODE_OPTIONS = [
  "主动推送型",
  "按需搜索型",
  "混合型",
];

export const PUSH_FREQUENCY_OPTIONS = [
  "每天",
  "每两天",
  "每周",
];

export const PUSH_TIME_OPTIONS = [
  "早上（8:00-9:00）",
  "中午（12:00-13:00）",
  "晚上（20:00-21:00）",
];

export const PUSH_COUNT_OPTIONS = [
  "精简（3条）",
  "适中（5条）",
  "丰富（7条）",
];

export const CONTENT_LANGUAGE_OPTIONS = [
  "中文为主",
  "英文为主",
  "中英都要",
];

export function createEmptyProfile() {
  return {
    basic: {
      name: "",
      callName: "",
      title: "总经理",
      department: "",
      industryFocus: "",
    },
    communication: {
      style: "",
      replyLength: "",
      formats: [],
      annoyances: [],
      annoyancesOther: "",
      language: "中文为主，专业术语保留 English",
    },
    decision: {
      frameworks: [],
      habits: "",
    },
    stakeholders: [
      {
        name: "",
        role: "",
        note: "",
      },
    ],
    priorities: [],
    sensitivities: "",
    knowledge: {
      interests: [],
      interestsOther: "",
      pushMode: "",
      pushFrequency: "",
      pushTime: "",
      pushCount: "",
      contentLanguage: "",
      studyHabits: "",
    },
  };
}
