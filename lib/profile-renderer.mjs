import { createEmptyProfile } from "./profile-schema.mjs";

const STYLE_LABELS = {
  "直接给结论": "先结论，后展开",
  "结构化展开": "结论+依据+选项的结构化输出",
  "叙事式": "用场景和故事帮助理解",
  "数据驱动": "数据驱动，用数字说话",
};

const MEMORY_STYLE_LINES = {
  "直接给结论": "- 用户偏好「先结论后分析」",
  "数据驱动": "- 用户偏好数据驱动的论证",
  "结构化展开": "- 用户偏好结构化的分析输出",
  "叙事式": "- 用户偏好场景化、叙事式的沟通",
};

const PUSH_TIME_SHORT = {
  "早上（8:00-9:00）": "早上8:00",
  "中午（12:00-13:00）": "中午12:00",
  "晚上（20:00-21:00）": "晚上20:00",
};

const PUSH_COUNT_LIMIT = {
  "精简（3条）": 3,
  "适中（5条）": 5,
  "丰富（7条）": 7,
};

const DEFAULT_PRIORITIES = [
  "业务结果",
  "风险控制",
  "关键项目推进",
];

const DEFAULT_LONG_TERM_PRIORITIES = [
  "[年度重点1]",
  "[年度重点2]",
  "[年度重点3]",
];

function placeholder(label = "") {
  return label ? `[待补充：${label}]` : "[待补充]";
}

function text(value) {
  return String(value ?? "").trim();
}

function normalizeParagraph(value) {
  return text(value).replace(/\n+/g, "；");
}

function splitMultiline(value) {
  return text(value)
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitLooseList(value) {
  return text(value)
    .split(/[\n;,，；]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function toBulletList(values) {
  return values.map((value) => `- ${value}`).join("\n");
}

function isActivePushMode(mode) {
  return mode === "主动推送型" || mode === "混合型";
}

function hasStakeholder(row) {
  return Boolean(text(row?.name) || text(row?.role) || text(row?.note));
}

function normalizeProfile(input = {}) {
  const base = createEmptyProfile();
  const profile = structuredClone(base);

  Object.assign(profile.basic, input.basic ?? {});
  Object.assign(profile.communication, input.communication ?? {});
  Object.assign(profile.decision, input.decision ?? {});
  Object.assign(profile.knowledge, input.knowledge ?? {});

  profile.communication.formats = unique(input.communication?.formats ?? []);
  profile.communication.annoyances = unique(input.communication?.annoyances ?? []);
  profile.decision.frameworks = unique(input.decision?.frameworks ?? []);
  profile.knowledge.interests = unique(input.knowledge?.interests ?? []);
  profile.priorities = unique(input.priorities ?? []);
  profile.stakeholders = Array.isArray(input.stakeholders) && input.stakeholders.length
    ? input.stakeholders.map((row) => ({
        name: text(row?.name),
        role: text(row?.role),
        note: text(row?.note),
      }))
    : base.stakeholders;

  profile.basic.name = text(profile.basic.name);
  profile.basic.callName = text(profile.basic.callName);
  profile.basic.title = text(profile.basic.title) || "总经理";
  profile.basic.department = text(profile.basic.department);
  profile.basic.industryFocus = text(profile.basic.industryFocus);

  profile.communication.style = text(profile.communication.style);
  profile.communication.replyLength = text(profile.communication.replyLength);
  profile.communication.annoyancesOther = text(profile.communication.annoyancesOther);
  profile.communication.language = text(profile.communication.language) || "中文为主，专业术语保留 English";

  profile.decision.habits = text(profile.decision.habits);
  profile.sensitivities = text(input.sensitivities ?? profile.sensitivities);

  profile.knowledge.interestsOther = text(profile.knowledge.interestsOther);
  profile.knowledge.pushMode = text(profile.knowledge.pushMode);
  profile.knowledge.pushFrequency = text(profile.knowledge.pushFrequency);
  profile.knowledge.pushTime = text(profile.knowledge.pushTime);
  profile.knowledge.pushCount = text(profile.knowledge.pushCount);
  profile.knowledge.contentLanguage = text(profile.knowledge.contentLanguage);
  profile.knowledge.studyHabits = text(profile.knowledge.studyHabits);

  return profile;
}

function renderUserMarkdown(profileInput) {
  const profile = normalizeProfile(profileInput);
  const ready = Boolean(profile.basic.name && profile.basic.callName);
  const priorities = profile.priorities.length ? profile.priorities : DEFAULT_PRIORITIES;
  const annoyances = [
    ...profile.communication.annoyances,
    ...splitMultiline(profile.communication.annoyancesOther),
  ];
  const stakeholders = profile.stakeholders.filter(hasStakeholder);
  const decisionLines = [
    ...profile.decision.frameworks,
    ...(profile.decision.habits ? [`决策习惯：${normalizeParagraph(profile.decision.habits)}`] : []),
  ];
  const sensitivityLines = splitMultiline(profile.sensitivities);

  const sections = [
    `<!-- executive-profile-status: ${ready ? "ready" : "pending"} -->`,
    "# USER.md",
    "",
    "## Basic",
    "",
    `- Name: ${profile.basic.name || placeholder("姓名")}`,
    `- What to call them: ${profile.basic.callName || placeholder("称呼")}`,
    "- Timezone: Asia/Shanghai",
    "- Notes:",
    `  - Role: 小米${profile.basic.department || placeholder("部门")}${profile.basic.title || placeholder("职位")}`,
  ];

  if (profile.basic.industryFocus) {
    sections.push(`  - Industry focus: ${profile.basic.industryFocus}`);
  }

  sections.push(
    "  - Surface: Feishu DM first, selected Feishu groups second",
    "  - Goal: high-signal support for judgment, communication, and execution follow-through",
    "",
    "## Context",
    "",
    "### What they care about",
    "",
    toBulletList(priorities),
    "",
    "### Communication preferences",
    "",
    `- 表达风格：${STYLE_LABELS[profile.communication.style] || placeholder("表达风格")}`,
    `- 默认长度：${profile.communication.replyLength || placeholder("默认回复长度")}`,
    `- 偏好格式：${profile.communication.formats.length ? profile.communication.formats.join("、") : placeholder("信息格式")}`,
    "- 不确定必须明确标注",
    `- 语言：${profile.communication.language || placeholder("语言偏好")}`,
    "",
    "### What annoys them",
    "",
    toBulletList(annoyances.length ? annoyances : [placeholder("反感行为")]),
  );

  if (decisionLines.length) {
    sections.push(
      "",
      "### Decision frameworks they use",
      "",
      toBulletList(decisionLines),
    );
  }

  if (stakeholders.length) {
    sections.push(
      "",
      "### Key stakeholders",
      "",
      toBulletList(
        stakeholders.map((row) => {
          const name = row.name || placeholder("人物");
          const role = row.role || placeholder("角色");
          return row.note ? `${name}（${role}） — ${row.note}` : `${name}（${role}）`;
        }),
      ),
    );
  }

  sections.push(
    "",
    "### Security and boundary",
    "",
    "- 未公开经营信息、组织信息、合作信息不得对外扩散",
    "- 不得代替用户公开表态",
    "- 外发内容默认需要确认",
    "- 对群聊要克制，不抢话，不替用户站台",
  );

  if (sensitivityLines.length) {
    sections.push(`- 敏感话题需谨慎处理：${sensitivityLines.join("；")}`);
  }

  return `${sections.join("\n")}\n`;
}

function renderMemoryMarkdown(profileInput) {
  const profile = normalizeProfile(profileInput);
  const ready = Boolean(profile.basic.name && profile.basic.callName);
  const priorityLines = profile.priorities.length ? profile.priorities : DEFAULT_LONG_TERM_PRIORITIES;
  const interestLines = unique([
    ...profile.knowledge.interests,
    ...splitLooseList(profile.knowledge.interestsOther),
  ]);
  const sensitivityLines = splitMultiline(profile.sensitivities);
  const sections = [
    `<!-- executive-profile-status: ${ready ? "ready" : "pending"} -->`,
    "# MEMORY.md",
    "",
    "## Stable preferences",
    "",
    MEMORY_STYLE_LINES[profile.communication.style] || `- 用户偏好${placeholder("表达风格")}`,
    "- 用户不接受编造数据与模糊归因",
    "- 对外表达必须稳健、克制、留余地",
    "- 需要把复杂问题压缩成可决策选项",
    "",
    "## Long-term priorities",
    "",
    toBulletList(priorityLines),
    "",
    "## Reusable judgment patterns",
    "",
    "- 先看影响面，再看时效，再看可逆性",
    "- 内部建议可以更直，对外口径必须更稳",
    "- 风险提示要给动作，不只给担忧",
  ];

  if (profile.decision.habits) {
    sections.push(`- ${normalizeParagraph(profile.decision.habits)}`);
  }

  if (interestLines.length) {
    sections.push(
      "",
      "## Knowledge interests (for Second Brain)",
      "",
      toBulletList(interestLines),
    );

    if (profile.knowledge.contentLanguage) {
      sections.push(`- 信息语言偏好：${profile.knowledge.contentLanguage}`);
    }

    if (profile.knowledge.studyHabits) {
      sections.push(`- 阅读习惯：${normalizeParagraph(profile.knowledge.studyHabits)}`);
    }
  }

  if (isActivePushMode(profile.knowledge.pushMode)) {
    sections.push(
      "",
      "## Knowledge radar preferences",
      "",
      `- 推送模式：${profile.knowledge.pushMode}`,
      `- 推送频率：${profile.knowledge.pushFrequency || "每天"}`,
      `- 推送时间：${profile.knowledge.pushTime || "早上（8:00-9:00）"}`,
      `- 每次条数：${profile.knowledge.pushCount || "适中（5条）"}`,
    );
  }

  sections.push(
    "",
    "## Known sensitivities",
    "",
    toBulletList(sensitivityLines.length ? sensitivityLines : ["[敏感业务/敏感合作/敏感话题]"]),
  );

  return `${sections.join("\n")}\n`;
}

function renderRadarMarkdown(profileInput) {
  const profile = normalizeProfile(profileInput);
  if (!isActivePushMode(profile.knowledge.pushMode)) {
    return null;
  }

  const themes = unique([
    ...profile.knowledge.interests,
    ...splitLooseList(profile.knowledge.interestsOther),
  ]);
  const activeThemes = themes.length ? themes : [placeholder("关注主题")];
  const pushFrequency = profile.knowledge.pushFrequency || "每天";
  const pushTime = profile.knowledge.pushTime || "早上（8:00-9:00）";
  const pushCount = profile.knowledge.pushCount || "适中（5条）";
  const sections = [
    "<!-- executive-radar-status: active -->",
    "# 知识雷达 · 兴趣画像",
    "",
    "## 活跃主题",
    "",
  ];

  for (const theme of activeThemes) {
    sections.push(
      `### ${theme}`,
      `- 关键词：${theme === placeholder("关注主题") ? "[待用户在首次对话中细化]" : "[待用户在首次对话中细化]"}`,
      "- 深度：泛泛了解",
      "- 维度：[待细化]",
      `- 语言：${profile.knowledge.contentLanguage || "中英都要"}`,
      "- 状态：活跃",
      "",
    );
  }

  sections.push(
    "## 推送偏好",
    "",
    `- 频率：${pushFrequency}`,
    `- 时间：${PUSH_TIME_SHORT[pushTime] || pushTime}`,
    `- 条数上限：${PUSH_COUNT_LIMIT[pushCount] ?? 5}`,
    `- 信息语言：${profile.knowledge.contentLanguage || "中英都要"}`,
    "",
    "## 排除项",
    "",
    "- [待补充——用户使用过程中通过“这类不用推了”动态添加]",
  );

  return `${sections.join("\n")}\n`;
}

export function renderDocuments(profileInput) {
  const profile = normalizeProfile(profileInput);
  return {
    profile,
    user: renderUserMarkdown(profile),
    memory: renderMemoryMarkdown(profile),
    radar: renderRadarMarkdown(profile),
  };
}

export { normalizeProfile, renderUserMarkdown, renderMemoryMarkdown, renderRadarMarkdown };
