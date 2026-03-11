#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

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

const DEFAULT_USER_PRIORITIES = ["业务结果", "风险控制", "关键项目推进"];
const DEFAULT_MEMORY_PRIORITIES = ["[年度重点1]", "[年度重点2]", "[年度重点3]"];

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      args._.push(token);
      continue;
    }
    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }
    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = nextToken;
    index += 1;
  }
  return args;
}

function text(value) {
  return String(value ?? "").trim();
}

function placeholder(label) {
  return `[待补充：${label}]`;
}

function splitMultiline(value) {
  return text(value)
    .split(/\n+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function splitLoose(value) {
  return text(value)
    .split(/[\n;,，；]+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function toBullets(values) {
  return values.map((value) => `- ${value}`).join("\n");
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function activePush(mode) {
  return mode === "主动推送型" || mode === "混合型";
}

function normalize(profile = {}) {
  return {
    basic: {
      name: text(profile.basic?.name),
      callName: text(profile.basic?.callName),
      title: text(profile.basic?.title) || "总经理",
      department: text(profile.basic?.department),
      industryFocus: text(profile.basic?.industryFocus),
    },
    communication: {
      style: text(profile.communication?.style),
      replyLength: text(profile.communication?.replyLength),
      formats: unique(profile.communication?.formats ?? []),
      annoyances: unique(profile.communication?.annoyances ?? []),
      annoyancesOther: text(profile.communication?.annoyancesOther),
      language: text(profile.communication?.language) || "中文为主，专业术语保留 English",
    },
    decision: {
      frameworks: unique(profile.decision?.frameworks ?? []),
      habits: text(profile.decision?.habits),
    },
    stakeholders: Array.isArray(profile.stakeholders) && profile.stakeholders.length
      ? profile.stakeholders.map((item) => ({
          name: text(item?.name),
          role: text(item?.role),
          note: text(item?.note),
        }))
      : [],
    priorities: unique(profile.priorities ?? []),
    sensitivities: text(profile.sensitivities),
    knowledge: {
      interests: unique(profile.knowledge?.interests ?? []),
      interestsOther: text(profile.knowledge?.interestsOther),
      pushMode: text(profile.knowledge?.pushMode),
      pushFrequency: text(profile.knowledge?.pushFrequency),
      pushTime: text(profile.knowledge?.pushTime),
      pushCount: text(profile.knowledge?.pushCount),
      contentLanguage: text(profile.knowledge?.contentLanguage),
      studyHabits: text(profile.knowledge?.studyHabits),
    },
  };
}

function renderUser(profile) {
  const ready = Boolean(profile.basic.name && profile.basic.callName);
  const annoyances = [...profile.communication.annoyances, ...splitMultiline(profile.communication.annoyancesOther)];
  const stakeholders = profile.stakeholders.filter((row) => row.name || row.role || row.note);
  const priorities = profile.priorities.length ? profile.priorities : DEFAULT_USER_PRIORITIES;
  const parts = [
    `<!-- executive-profile-status: ${ready ? "ready" : "pending"} -->`,
    "# USER.md",
    "",
    "## Basic",
    "",
    `- Name: ${profile.basic.name || placeholder("姓名")}`,
    `- What to call them: ${profile.basic.callName || placeholder("称呼")}`,
    "- Timezone: Asia/Shanghai",
    "- Notes:",
    `  - Role: 小米${profile.basic.department || placeholder("部门")}${profile.basic.title}`,
  ];

  if (profile.basic.industryFocus) {
    parts.push(`  - Industry focus: ${profile.basic.industryFocus}`);
  }

  parts.push(
    "  - Surface: Feishu DM first, selected Feishu groups second",
    "  - Goal: high-signal support for judgment, communication, and execution follow-through",
    "",
    "## Context",
    "",
    "### What they care about",
    "",
    toBullets(priorities),
    "",
    "### Communication preferences",
    "",
    `- 表达风格：${STYLE_LABELS[profile.communication.style] || placeholder("表达风格")}`,
    `- 默认长度：${profile.communication.replyLength || placeholder("默认回复长度")}`,
    `- 偏好格式：${profile.communication.formats.length ? profile.communication.formats.join("、") : placeholder("信息格式")}`,
    "- 不确定必须明确标注",
    `- 语言：${profile.communication.language}`,
    "",
    "### What annoys them",
    "",
    toBullets(annoyances.length ? annoyances : [placeholder("反感行为")]),
  );

  const decisionLines = [
    ...profile.decision.frameworks,
    ...(profile.decision.habits ? [`决策习惯：${profile.decision.habits.replace(/\n+/g, "；")}`] : []),
  ];
  if (decisionLines.length) {
    parts.push("", "### Decision frameworks they use", "", toBullets(decisionLines));
  }

  if (stakeholders.length) {
    parts.push(
      "",
      "### Key stakeholders",
      "",
      toBullets(
        stakeholders.map((row) => {
          const summary = `${row.name || placeholder("人物")}（${row.role || placeholder("角色")}）`;
          return row.note ? `${summary} — ${row.note}` : summary;
        }),
      ),
    );
  }

  parts.push(
    "",
    "### Security and boundary",
    "",
    "- 未公开经营信息、组织信息、合作信息不得对外扩散",
    "- 不得代替用户公开表态",
    "- 外发内容默认需要确认",
    "- 对群聊要克制，不抢话，不替用户站台",
  );

  const sensitivityLines = splitMultiline(profile.sensitivities);
  if (sensitivityLines.length) {
    parts.push(`- 敏感话题需谨慎处理：${sensitivityLines.join("；")}`);
  }
  return `${parts.join("\n")}\n`;
}

function renderMemory(profile) {
  const ready = Boolean(profile.basic.name && profile.basic.callName);
  const interests = unique([...profile.knowledge.interests, ...splitLoose(profile.knowledge.interestsOther)]);
  const parts = [
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
    toBullets(profile.priorities.length ? profile.priorities : DEFAULT_MEMORY_PRIORITIES),
    "",
    "## Reusable judgment patterns",
    "",
    "- 先看影响面，再看时效，再看可逆性",
    "- 内部建议可以更直，对外口径必须更稳",
    "- 风险提示要给动作，不只给担忧",
  ];

  if (profile.decision.habits) {
    parts.push(`- ${profile.decision.habits.replace(/\n+/g, "；")}`);
  }

  if (interests.length) {
    parts.push("", "## Knowledge interests (for Second Brain)", "", toBullets(interests));
    if (profile.knowledge.contentLanguage) {
      parts.push(`- 信息语言偏好：${profile.knowledge.contentLanguage}`);
    }
    if (profile.knowledge.studyHabits) {
      parts.push(`- 阅读习惯：${profile.knowledge.studyHabits.replace(/\n+/g, "；")}`);
    }
  }

  if (activePush(profile.knowledge.pushMode)) {
    parts.push(
      "",
      "## Knowledge radar preferences",
      "",
      `- 推送模式：${profile.knowledge.pushMode}`,
      `- 推送频率：${profile.knowledge.pushFrequency || "每天"}`,
      `- 推送时间：${profile.knowledge.pushTime || "早上（8:00-9:00）"}`,
      `- 每次条数：${profile.knowledge.pushCount || "适中（5条）"}`,
    );
  }

  const sensitivities = splitMultiline(profile.sensitivities);
  parts.push("", "## Known sensitivities", "", toBullets(sensitivities.length ? sensitivities : ["[敏感业务/敏感合作/敏感话题]"]));
  return `${parts.join("\n")}\n`;
}

function renderRadar(profile) {
  if (!activePush(profile.knowledge.pushMode)) {
    return null;
  }
  const themes = unique([...profile.knowledge.interests, ...splitLoose(profile.knowledge.interestsOther)]);
  const activeThemes = themes.length ? themes : [placeholder("关注主题")];
  const lines = [
    "<!-- executive-radar-status: active -->",
    "# 知识雷达 · 兴趣画像",
    "",
    "## 活跃主题",
    "",
  ];

  for (const theme of activeThemes) {
    lines.push(
      `### ${theme}`,
      "- 关键词：[待用户在首次对话中细化]",
      "- 深度：泛泛了解",
      "- 维度：[待细化]",
      `- 语言：${profile.knowledge.contentLanguage || "中英都要"}`,
      "- 状态：活跃",
      "",
    );
  }

  const pushTime = profile.knowledge.pushTime || "早上（8:00-9:00）";
  const pushCount = profile.knowledge.pushCount || "适中（5条）";
  lines.push(
    "## 推送偏好",
    "",
    `- 频率：${profile.knowledge.pushFrequency || "每天"}`,
    `- 时间：${PUSH_TIME_SHORT[pushTime] || pushTime}`,
    `- 条数上限：${PUSH_COUNT_LIMIT[pushCount] ?? 5}`,
    `- 信息语言：${profile.knowledge.contentLanguage || "中英都要"}`,
    "",
    "## 排除项",
    "",
    "- [待补充——用户使用过程中通过“这类不用推了”动态添加]",
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.input) {
    throw new Error("Expected --input <profile.json>");
  }

  const workspace = path.resolve(args.workspace || ".");
  const profile = normalize(JSON.parse(await fs.readFile(path.resolve(args.input), "utf8")));
  const docs = {
    user: renderUser(profile),
    memory: renderMemory(profile),
    radar: renderRadar(profile),
  };

  if (args.write) {
    await fs.writeFile(path.join(workspace, "USER.md"), docs.user, "utf8");
    await fs.writeFile(path.join(workspace, "MEMORY.md"), docs.memory, "utf8");
    const radarPath = path.join(workspace, "radar", "INTERESTS.md");
    try {
      await fs.access(path.dirname(radarPath));
      await fs.writeFile(
        radarPath,
        docs.radar ?? "<!-- executive-radar-status: disabled -->\n# 知识雷达 · 兴趣画像\n\n## 状态\n\n- 当前为按需搜索型，尚未启用主动推送。\n",
        "utf8",
      );
    } catch {
      // ignore missing radar dir
    }
  }

  const outputs = [
    ["USER.md", docs.user],
    ["MEMORY.md", docs.memory],
    ...(docs.radar ? [["radar/INTERESTS.md", docs.radar]] : []),
  ];
  for (const [name, content] of outputs) {
    process.stdout.write(`===== ${name} =====\n${content}\n`);
  }
}

await main();
