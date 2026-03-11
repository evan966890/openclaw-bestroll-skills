#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { renderDocuments } from "../lib/profile-renderer.mjs";
import { parseArgs, resolveHomePath, ensureDir, writeTextFile } from "../lib/node-helpers.mjs";

function usage() {
  console.log(`
Usage:
  node scripts/render-profile.mjs --input ./profile.json --output-dir /tmp/profile
  node scripts/render-profile.mjs --demo
`);
}

function demoProfile() {
  return {
    basic: {
      name: "张三",
      callName: "张总",
      title: "总经理",
      department: "国际业务部",
      industryFocus: "消费电子国际零售、IoT生态",
    },
    communication: {
      style: "结构化展开",
      replyLength: "精炼（5-12行）",
      formats: ["要点列表", "选项卡（A/B/C）"],
      annoyances: ["正确但无用的废话", "编造数据或进度"],
      language: "中文为主，专业术语保留 English",
    },
    decision: {
      frameworks: ["MECE分析", "第一性原理", "逆向工作法"],
      habits: "大事不过夜；先看最坏情况；能量化的不拍脑袋",
    },
    priorities: ["海外业务增长", "IoT生态协同", "关键管理干部梯队建设"],
    stakeholders: [
      { name: "雷总", role: "董事长", note: "重大方向最终拍板" },
      { name: "CFO", role: "财务负责人", note: "预算与回报口径一致" },
    ],
    sensitivities: "与核心伙伴的合作谈判细节；未公开组织调整信息",
    knowledge: {
      interests: ["AI/大模型", "商业战略", "行业研究"],
      pushMode: "混合型",
      pushFrequency: "每天",
      pushTime: "早上（8:00-9:00）",
      pushCount: "适中（5条）",
      contentLanguage: "中英都要",
      studyHabits: "通勤时听播客；飞机上集中读长文",
    },
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  let profile;
  if (args.demo) {
    profile = demoProfile();
  } else if (args.input) {
    const inputPath = path.resolve(resolveHomePath(args.input));
    profile = JSON.parse(await fs.readFile(inputPath, "utf8"));
  } else {
    usage();
    process.exitCode = 1;
    return;
  }

  const docs = renderDocuments(profile);

  if (args.outputDir) {
    const outputDir = path.resolve(resolveHomePath(args.outputDir));
    await ensureDir(outputDir);
    await writeTextFile(path.join(outputDir, "USER.md"), docs.user);
    await writeTextFile(path.join(outputDir, "MEMORY.md"), docs.memory);
    if (docs.radar) {
      await writeTextFile(path.join(outputDir, "radar", "INTERESTS.md"), docs.radar);
    }
    console.log(`Wrote profile docs to ${outputDir}`);
    return;
  }

  const blocks = [
    ["USER.md", docs.user],
    ["MEMORY.md", docs.memory],
    ...(docs.radar ? [["radar/INTERESTS.md", docs.radar]] : []),
  ];
  for (const [name, content] of blocks) {
    process.stdout.write(`===== ${name} =====\n${content}\n`);
  }
}

await main();
