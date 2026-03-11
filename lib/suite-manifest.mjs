export const SUITE_ID = "executive-feishu-suite";
export const SUITE_ROOT_NAME = "executive-feishu-suite";
export const DEFAULT_FEISHU_ACCOUNTS_FILE = ".state/feishu-accounts.json";

export const AGENT_SPECS = [
  {
    id: "strategist",
    name: "商业参谋",
    englishName: "Strategist",
    botName: "商业参谋",
    appName: "商业参谋",
    legacyAppNames: ["OpenClaw 商业参谋"],
    appDescription: "负责市场研究、战略判断、业务分析与汇报材料的高管商业参谋。",
    templateDirName: "strategist",
    workspaceDirName: "strategist",
  },
  {
    id: "chief-of-staff",
    name: "效率管家",
    englishName: "Chief of Staff",
    botName: "效率管家",
    appName: "效率管家",
    legacyAppNames: ["OpenClaw 效率管家"],
    appDescription: "负责日程、会议、行动项、闭环跟进与跨部门协同的高管效率管家。",
    templateDirName: "chief-of-staff",
    workspaceDirName: "chief-of-staff",
  },
  {
    id: "life-concierge",
    name: "生活助理",
    englishName: "Life Concierge",
    botName: "生活助理",
    appName: "生活助理",
    legacyAppNames: ["OpenClaw 生活助理"],
    appDescription: "负责家庭安排、出行、健康、礼物与个人事务的私人生活助理。",
    templateDirName: "life-concierge",
    workspaceDirName: "life-concierge",
  },
  {
    id: "second-brain",
    name: "知识管家",
    englishName: "Second Brain",
    botName: "知识管家",
    appName: "知识管家",
    legacyAppNames: ["OpenClaw 知识管家"],
    appDescription: "负责知识推送、兴趣雷达、想法归档与知识检索的第二大脑。",
    templateDirName: "second-brain",
    workspaceDirName: "second-brain",
  },
];
