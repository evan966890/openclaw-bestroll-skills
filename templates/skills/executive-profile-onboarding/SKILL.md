---
name: executive-profile-onboarding
description: 用 8 组以内的中文问卷，交互式收集高管画像，并生成共享 USER.md、MEMORY.md 和可选的 radar/INTERESTS.md。首次初始化、补录画像、更新偏好时使用。
---

# Executive Profile Onboarding

## Overview

当共享 `USER.md` 仍是 `pending`，或用户明确说“开始初始化画像 / 更新画像 / 补充偏好”时，使用这个 skill。

目标不是闲聊式认识用户，而是在 10 分钟内完成一套可落盘的高管画像，并把结果写回共享文件。

## Workflow

### 1. 先判断是否要进入 onboarding

满足任一条件就进入：

- `USER.md` 顶部包含 `executive-profile-status: pending`
- 用户说“开始初始化”“更新画像”“补充偏好”“重新生成 USER.md”
- 用户要一次性建立 4 个 agent 的共享画像底座

如果只是问某个单点信息，不要强行走整套问卷。

### 2. 严格按分组提问

先读 [references/questionnaire-groups.md](references/questionnaire-groups.md)。

执行要求：

- 最多 8 组，按组推进
- 每次只问 1 组，避免超长消息
- 选择优先，不要把单选题改成开放题
- 除“姓名”“称呼”外，全部允许跳过
- 用户明确说“跳过”时，不要二次追问

### 3. 维护中间答案

把当前收集到的答案整理成一个 JSON 文件，字段结构必须与下面一致：

```json
{
  "basic": {
    "name": "",
    "callName": "",
    "title": "总经理",
    "department": "",
    "industryFocus": ""
  },
  "communication": {
    "style": "",
    "replyLength": "",
    "formats": [],
    "annoyances": [],
    "annoyancesOther": "",
    "language": "中文为主，专业术语保留 English"
  },
  "decision": {
    "frameworks": [],
    "habits": ""
  },
  "stakeholders": [
    { "name": "", "role": "", "note": "" }
  ],
  "priorities": [],
  "sensitivities": "",
  "knowledge": {
    "interests": [],
    "interestsOther": "",
    "pushMode": "",
    "pushFrequency": "",
    "pushTime": "",
    "pushCount": "",
    "contentLanguage": "",
    "studyHabits": ""
  }
}
```

建议写到工作区临时文件，例如：

- `.state/executive-profile.answers.json`

### 4. 生成预览

先不要直接覆盖文件。先运行：

```bash
node scripts/render_profile.mjs --input .state/executive-profile.answers.json --workspace .
```

这个脚本会输出：

- `USER.md`
- `MEMORY.md`
- `radar/INTERESTS.md`（仅主动推送型 / 混合型）

把预览贴给用户确认。

### 5. 用户确认后写回共享文件

确认后运行：

```bash
node scripts/render_profile.mjs --input .state/executive-profile.answers.json --workspace . --write
```

说明：

- 工作区里的 `USER.md` / `MEMORY.md` 通常是共享文件的软链接
- 直接写当前工作区路径即可，系统会把内容写进共享底座
- `radar/INTERESTS.md` 只有在存在该路径时才会写入

### 6. 完成后的回复

完成后给用户一个简短收口：

- 已更新哪些文件
- 如果是按需搜索型，说明未启用主动雷达推送
- 如果是主动推送型 / 混合型，说明知识雷达已初始化

## Conversation Rules

- 全中文界面
- 选项题直接列可选项，不要改写成长段解释
- 如果用户一次性给出很多答案，直接归并到对应字段，不要机械重复所有题目
- 如果用户中途只想改某一组，只重问那一组
- 预览时保留 Markdown 原样，方便复制

## Resources

### scripts/

- `scripts/render_profile.mjs`
  - 从 JSON 生成并可选写入 `USER.md` / `MEMORY.md` / `radar/INTERESTS.md`

### references/

- `references/questionnaire-groups.md`
  - 8 组问卷的标准题面与条件显示规则
- `references/output-contract.md`
  - 输出文件的写入规则与约束
