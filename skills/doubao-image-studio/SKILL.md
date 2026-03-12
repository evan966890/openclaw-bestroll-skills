---
name: doubao-image-studio
description: 用户要免费生图、配图、海报、邀请卡或封面图时使用。优先复用用户自己的豆包登录 cookie，用 OpenClaw Browser 生成图片；必要时回退 Peekaboo。
---

# Doubao Image Studio

用免费的豆包生图能力出图，再把图片发回 Feishu。

## Quick Start

- 适用：海报、封面、邀请卡、概念图、配图、头像草图、简单视觉稿。
- 默认优先：`browser` 工具驱动 `doubao.com`。
- 回退：`browser` target 丢失、下载按钮异常、页面交互卡住时，改用 `peekaboo`。
- 第一次使用前，要先完成一次用户 cookie/profile 同步。

## 首次准备

1. 让用户在自己的 Chrome 里打开豆包并扫码登录。
2. 让用户彻底关闭 Chrome。
3. 运行 [scripts/sync_user_browser_profile.mjs](scripts/sync_user_browser_profile.mjs) 把用户 profile 同步到 OpenClaw Browser。
4. 之后统一用 OpenClaw Browser 里的默认 `openclaw` profile 访问豆包。

## Trigger Signals

- “做一张图”
- “给我出个海报”
- “做个封面图”
- “生成配图”
- “帮我画一个”
- “发张图给我”

## 工作流

1. 先把用户需求压成 1 段适合豆包的中文 prompt。
2. 如果比例 / 风格 / 参考图 / 文案元素不明确，只追问 1 次。
3. 用 `browser` 打开 `https://www.doubao.com/chat/`，进入“图像生成”模式。
4. 每次点击前都重新 `snapshot`，不要复用旧 ref。
5. 输入 prompt，按需设置比例 / 风格 / 模型。
6. 等结果出现后，优先下载原图；拿不到下载按钮时，对图片区域截图。
7. 保存到 `~/.openclaw/media/generated/`。
8. 用 `message` 工具把图片发出去。

## 必须遵守

- 不要第一次就让 agent 自己登录豆包；首次登录必须由用户扫码完成。
- 第二次开始必须复用用户 cookie，不要反复弹登录。
- 点击前必须重抓 `snapshot`，因为豆包页面 ref 变化很快。
- 如果页面跳到 `?from_login=1`，先确认登录态，再重新进入“图像生成”。
- 如果 `browser` 工具拿不到稳定 target，再回退到 `peekaboo`。
- 发送图片必须走 `message` 工具，不要只返回本地路径。

## 输出规则

- 默认只给 1 版图。
- 先发图，再补 1-2 句说明。
- 如果生成失败，明确说失败点：登录、页面、额度、下载、发送。

## Deepen When Needed

- 用户 cookie/profile 同步：读 [references/cookie-bootstrap.md](references/cookie-bootstrap.md)
- 豆包页面操作顺序：读 [references/browser-flow.md](references/browser-flow.md)
- prompt 压缩方式：读 [references/prompt-patterns.md](references/prompt-patterns.md)
